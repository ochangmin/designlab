/**
 * Browser-local project storage.
 *
 * The repository owns the storage layout and is the only place that knows the
 * key format. Every call returns a `Result`: a browser with storage disabled
 * is a normal condition the editor keeps working through, not a crash.
 */

import { parseDesign } from '../domain/parse.js';
import { err, ok, type Result } from '../domain/result.js';
import type { Design, DesignId } from '../domain/document.js';
import type { StudioError } from '../domain/errors.js';

const INDEX_KEY = 'designlab:index:v1';
const DESIGN_KEY = (id: DesignId): string => `designlab:design:v1:${id}`;

export interface ProjectSummary {
  readonly id: DesignId;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly pageCount: number;
  readonly updatedAt: number;
}

const storage = (): Result<Storage, StudioError> => {
  try {
    const candidate = globalThis.localStorage;
    if (!candidate) {
      return err({ kind: 'storage-unavailable', detail: 'localStorage 없음' });
    }
    const probe = 'designlab:probe';
    candidate.setItem(probe, '1');
    candidate.removeItem(probe);
    return ok(candidate);
  } catch (cause) {
    return err({
      kind: 'storage-unavailable',
      detail: cause instanceof Error ? cause.message : '접근 거부',
    });
  }
};

const summarise = (design: Design): ProjectSummary => ({
  id: design.id,
  name: design.name,
  width: design.width,
  height: design.height,
  pageCount: design.pages.length,
  updatedAt: design.updatedAt,
});

const readIndex = (store: Storage): readonly ProjectSummary[] => {
  const raw = store.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is ProjectSummary => {
      if (typeof entry !== 'object' || entry === null) return false;
      const record = entry as Record<string, unknown>;
      return typeof record['id'] === 'string' && typeof record['name'] === 'string';
    });
  } catch {
    // A corrupted index is recoverable: the designs themselves are separate
    // keys, so we report an empty list rather than failing the whole app.
    return [];
  }
};

const writeIndex = (store: Storage, entries: readonly ProjectSummary[]): Result<void, StudioError> => {
  try {
    store.setItem(INDEX_KEY, JSON.stringify(entries));
    return ok(undefined);
  } catch (cause) {
    return err({
      kind: 'storage-quota-exceeded',
      detail: cause instanceof Error ? cause.name : '쓰기 실패',
    });
  }
};

export const listProjects = (): Result<readonly ProjectSummary[], StudioError> => {
  const store = storage();
  if (!store.ok) return store;
  const entries = [...readIndex(store.value)].sort((left, right) => right.updatedAt - left.updatedAt);
  return ok(entries);
};

export const loadProject = (id: DesignId): Result<Design, StudioError> => {
  const store = storage();
  if (!store.ok) return store;
  const raw = store.value.getItem(DESIGN_KEY(id));
  if (raw === null) return err({ kind: 'document-not-found', designId: id });
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (cause) {
    return err({
      kind: 'document-malformed',
      at: '$',
      detail: cause instanceof Error ? cause.message : 'JSON 구문 오류',
    });
  }
  return parseDesign(value);
};

export const saveProject = (design: Design): Result<void, StudioError> => {
  const store = storage();
  if (!store.ok) return store;
  try {
    store.value.setItem(DESIGN_KEY(design.id), JSON.stringify(design));
  } catch (cause) {
    return err({
      kind: 'storage-quota-exceeded',
      detail: cause instanceof Error ? cause.name : '쓰기 실패',
    });
  }
  const entries = readIndex(store.value).filter((entry) => entry.id !== design.id);
  return writeIndex(store.value, [summarise(design), ...entries]);
};

export const deleteProject = (id: DesignId): Result<void, StudioError> => {
  const store = storage();
  if (!store.ok) return store;
  store.value.removeItem(DESIGN_KEY(id));
  return writeIndex(
    store.value,
    readIndex(store.value).filter((entry) => entry.id !== id),
  );
};

/** The project last opened, so a reload lands back in the same document. */
const LAST_OPENED_KEY = 'designlab:last-opened:v1';

export const rememberLastOpened = (id: DesignId): void => {
  const store = storage();
  if (!store.ok) return;
  try {
    store.value.setItem(LAST_OPENED_KEY, id);
  } catch {
    // Remembering the last document is a convenience; losing it changes nothing.
  }
};

export const lastOpenedId = (): DesignId | null => {
  const store = storage();
  if (!store.ok) return null;
  return store.value.getItem(LAST_OPENED_KEY);
};
