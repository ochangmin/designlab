/**
 * Where a person's designs live.
 *
 * One asynchronous port with two implementations: the browser's own storage,
 * and the signed-in member's rows on the server. The three places that open,
 * save and delete designs talk only to this port, so adding the remote store
 * did not scatter a second code path through the UI.
 *
 * `projectRepository.ts` still owns the local storage key format; this module
 * only adapts it to the port's shape.
 */

import type { Design, DesignId } from '../domain/document.js';
import type { StudioError } from '../domain/errors.js';
import type { Result } from '../domain/result.js';
import {
  deleteProject,
  listProjects,
  loadProject,
  saveProject,
  type ProjectSummary,
} from './projectRepository.js';
import { supabaseProjects } from './supabase/designAdapter.js';

export type { ProjectSummary };

export interface ProjectStore {
  /** Which store answered, so the UI can say where the work is kept. */
  readonly kind: 'local' | 'remote';
  list(): Promise<Result<readonly ProjectSummary[], StudioError>>;
  load(id: DesignId): Promise<Result<Design, StudioError>>;
  save(design: Design): Promise<Result<void, StudioError>>;
  remove(id: DesignId): Promise<Result<void, StudioError>>;
}

/** The browser's own storage, which needs no account and works offline. */
export const localProjects: ProjectStore = {
  kind: 'local',
  list: (): Promise<Result<readonly ProjectSummary[], StudioError>> => Promise.resolve(listProjects()),
  load: (id): Promise<Result<Design, StudioError>> => Promise.resolve(loadProject(id)),
  save: (design): Promise<Result<void, StudioError>> => Promise.resolve(saveProject(design)),
  remove: (id): Promise<Result<void, StudioError>> => Promise.resolve(deleteProject(id)),
};

/**
 * One owner of the choice. A signed-in member whose account is in good
 * standing works against the server; everybody else — signed out, suspended,
 * or running a build with no account server — works locally.
 */
export const chooseProjectStore = (usesRemoteStorage: boolean): ProjectStore =>
  usesRemoteStorage ? supabaseProjects : localProjects;
