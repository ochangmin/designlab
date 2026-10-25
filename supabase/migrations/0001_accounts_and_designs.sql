-- DesignLab — accounts, membership and server-stored designs.
--
-- Apply with the Supabase CLI (`supabase db push`) or by pasting into the
-- project's SQL editor. The file is idempotent: running it twice is safe.
--
-- The security position this file takes: the client holds only the anon key,
-- so every rule that matters is enforced here. Row-level security decides who
-- may read and write each row, and the triggers below decide which columns a
-- member may change about themselves. The UI hiding a button is a courtesy,
-- never the control.

-- ─────────────────────────────────────────────────────────── profiles ──

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text        not null default '',
  role         text        not null default 'member' check (role in ('member', 'admin')),
  provider     text        not null default 'password' check (provider in ('password', 'google', 'kakao')),
  disabled     boolean     not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  'One row per account. Created by a trigger on auth.users, never by the client.';

-- These two helpers are `security definer` so that a policy *on* profiles can
-- ask about profiles without re-entering its own policy, which would recurse.
-- They are the only reason an ordinary member can be asked "are you an admin?"
-- without being able to read the answer for anyone else.

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid and p.role = 'admin' and p.disabled = false
  );
$$;

create or replace function public.is_disabled(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.disabled from public.profiles p where p.id = uid), false);
$$;

revoke all on function public.is_admin(uuid) from public;
revoke all on function public.is_disabled(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_disabled(uuid) to authenticated;

-- A new account gets its profile from the identity the provider supplied. The
-- display name is taken from whichever field that provider filled in; the
-- client sends `display_name` for password sign-ups.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, provider)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '이름 없는 사용자'
    ),
    case coalesce(new.raw_app_meta_data ->> 'provider', 'email')
      when 'google' then 'google'
      when 'kakao'  then 'kakao'
      else 'password'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep the member list from showing an address the person has since changed.
create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- Which columns a member may change about themselves.
--
-- The update policy below already restricts *which rows* each caller may
-- touch; this decides which *columns*. Without it, a member could promote
-- themselves to admin through their own row.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No JWT means the statement is running directly against the database — the
  -- SQL editor, a migration, or the service role — which already holds more
  -- authority than this trigger could add. The bootstrap below depends on it.
  if auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'profile identity is immutable' using errcode = '42501';
  end if;

  if public.is_admin() then
    -- An admin may change anyone except themselves in these two columns, so a
    -- single administrator cannot lock the project out of its own management.
    if new.id = auth.uid()
       and (new.role is distinct from old.role or new.disabled is distinct from old.disabled) then
      raise exception 'an admin cannot change their own role or status'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role or new.disabled is distinct from old.disabled then
    raise exception 'only an admin may change a role or account status'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select using (public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- No insert or delete policy: rows arrive from the trigger above and leave
-- when the auth user is deleted.

-- ──────────────────────────────────────────────────────────── designs ──

create table if not exists public.designs (
  id         text primary key,
  owner      uuid        not null references auth.users (id) on delete cascade,
  name       text        not null default '제목 없는 디자인',
  width      integer     not null,
  height     integer     not null,
  page_count integer     not null default 1,
  -- The same JSON the local store writes, read back through parseDesign.
  document   jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.designs.name is
  'Denormalised from the document so the project list does not have to download every design.';

create index if not exists designs_owner_updated_idx
  on public.designs (owner, updated_at desc);

alter table public.designs enable row level security;

-- A suspended member keeps their designs and loses access to them.
drop policy if exists designs_owner_all on public.designs;
create policy designs_owner_all on public.designs
  for all
  using (owner = auth.uid() and not public.is_disabled())
  with check (owner = auth.uid() and not public.is_disabled());

-- Admins may read designs for support, and may not write them.
drop policy if exists designs_select_admin on public.designs;
create policy designs_select_admin on public.designs
  for select using (public.is_admin());

-- ───────────────────────────────────────────────────────────── grants ──

grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.designs to authenticated;

-- ────────────────────────────────────────────────── first administrator ──
--
-- Every account starts as `member`, including the first one. Promote yourself
-- once, from the SQL editor, after signing up:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- The guard above refuses this from the client, which is the point: an admin
-- can only be made by somebody who already holds the database.
