/**
 * Designs kept on the server, for signed-in members.
 *
 * The document itself travels as the same JSON the local store writes and
 * comes back through `parseDesign`, so there is still exactly one boundary
 * that turns stored JSON into a `Design`. The summary columns are denormalised
 * copies kept only so the project list does not have to download every
 * document to show a name and a size.
 */

import { parseDesign } from '../../domain/parse.js';
import { err, ok, type Result } from '../../domain/result.js';
import type { Design, DesignId } from '../../domain/document.js';
import type { StudioError } from '../../domain/errors.js';
import type { ProjectStore } from '../projectStore.js';
import type { ProjectSummary } from '../projectRepository.js';
import { supabase } from './client.js';

const NOT_AUTHENTICATED: StudioError = { kind: 'not-authenticated' };

const unavailable = (detail: string): StudioError => ({ kind: 'remote-unavailable', detail });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseSummary = (row: unknown): Result<ProjectSummary, StudioError> => {
  if (!isRecord(row)) return err(unavailable('디자인 목록 행이 객체가 아닙니다.'));
  const id = row['id'];
  if (typeof id !== 'string' || id === '') return err(unavailable('디자인 id가 없습니다.'));
  const updatedAt = typeof row['updated_at'] === 'string' ? Date.parse(row['updated_at']) : Number.NaN;
  return ok({
    id,
    name: typeof row['name'] === 'string' ? row['name'] : '제목 없는 디자인',
    width: typeof row['width'] === 'number' ? row['width'] : 1080,
    height: typeof row['height'] === 'number' ? row['height'] : 1080,
    pageCount: typeof row['page_count'] === 'number' ? row['page_count'] : 1,
    updatedAt: Number.isNaN(updatedAt) ? Date.now() : updatedAt,
  });
};

export const supabaseProjects: ProjectStore = {
  kind: 'remote',

  list: async (): Promise<Result<readonly ProjectSummary[], StudioError>> => {
    const client = supabase();
    if (!client) return err({ kind: 'auth-not-configured' });
    const { data, error } = await client
      .from('designs')
      .select('id, name, width, height, page_count, updated_at')
      .order('updated_at', { ascending: false });
    if (error) return err(unavailable(error.message));

    const summaries: ProjectSummary[] = [];
    for (const row of data ?? []) {
      const parsed = parseSummary(row);
      // A row we cannot read is reported rather than quietly dropped: a design
      // missing from the list would look like one that was deleted.
      if (!parsed.ok) return parsed;
      summaries.push(parsed.value);
    }
    return ok(summaries);
  },

  load: async (id: DesignId): Promise<Result<Design, StudioError>> => {
    const client = supabase();
    if (!client) return err({ kind: 'auth-not-configured' });
    const { data, error } = await client.from('designs').select('document').eq('id', id).maybeSingle();
    if (error) return err(unavailable(error.message));
    if (data === null) return err({ kind: 'document-not-found', designId: id });
    return parseDesign((data as { document: unknown }).document);
  },

  save: async (design: Design): Promise<Result<void, StudioError>> => {
    const client = supabase();
    if (!client) return err({ kind: 'auth-not-configured' });
    const { data: auth } = await client.auth.getUser();
    const owner = auth.user?.id;
    if (owner === undefined) return err(NOT_AUTHENTICATED);

    const { error } = await client.from('designs').upsert(
      {
        id: design.id,
        owner,
        name: design.name,
        width: design.width,
        height: design.height,
        page_count: design.pages.length,
        document: design,
        updated_at: new Date(design.updatedAt).toISOString(),
      },
      { onConflict: 'id' },
    );
    // Row-level security answers a write by somebody else's account with a
    // policy violation, which is a permission failure, not an outage.
    if (error) {
      return err(
        error.code === '42501'
          ? { kind: 'permission-denied', action: '이 디자인 저장' }
          : unavailable(error.message),
      );
    }
    return ok(undefined);
  },

  remove: async (id: DesignId): Promise<Result<void, StudioError>> => {
    const client = supabase();
    if (!client) return err({ kind: 'auth-not-configured' });
    const { error } = await client.from('designs').delete().eq('id', id);
    if (error) {
      return err(
        error.code === '42501'
          ? { kind: 'permission-denied', action: '이 디자인 삭제' }
          : unavailable(error.message),
      );
    }
    return ok(undefined);
  },
};
