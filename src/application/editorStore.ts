/**
 * Editor state and the commands that change it.
 *
 * The store owns three things and nothing else: the current document, the
 * view (selection, zoom, pan, text editing) and the undo stacks. All document
 * changes are delegated to `domain/mutations`, so the store never reinterprets
 * the model. Commands that a person perceives as one gesture — a drag, a
 * slider sweep — share a `coalesce` key so undo steps match the gesture rather
 * than the event stream.
 */

import {
  expandGroups,
  findPage,
  type Design,
  type DesignElement,
  type ElementId,
  type PageId,
  type Paint,
} from '../domain/document.js';
import { describeError, type StudioError } from '../domain/errors.js';
import type { Point } from '../domain/geometry.js';
import { clamp, round } from '../domain/geometry.js';
import { createId } from '../domain/ids.js';
import type { SnapGuide } from '../domain/snapping.js';
import {
  addElements,
  addPage,
  alignElements,
  distributeElements,
  duplicateElements,
  duplicatePage,
  groupElements,
  moveBy,
  movePage,
  removeElements,
  removePage,
  renameDesign,
  replaceElement,
  renamePage,
  reorder,
  resizeDesign,
  selectionBounds,
  setPageBackground,
  setPalette,
  ungroupElements,
  updateElements,
  type AlignEdge,
  type ReorderIntent,
} from '../domain/mutations.js';

export interface Notice {
  readonly id: string;
  readonly tone: 'info' | 'error';
  readonly message: string;
}

export interface EditorState {
  readonly design: Design;
  readonly activePageId: PageId;
  readonly selection: readonly ElementId[];
  readonly zoom: number;
  readonly pan: Point;
  /**
   * True only for view changes the person asked for as a single step — the
   * zoom buttons, 1:1, fit — which the canvas eases. A wheel zoom or a pan
   * drag must track the pointer exactly, so it stays false.
   */
  readonly viewAnimated: boolean;
  readonly editingTextId: ElementId | null;
  readonly guides: readonly SnapGuide[];
  readonly clipboard: readonly DesignElement[];
  readonly past: readonly Design[];
  readonly future: readonly Design[];
  readonly dirty: boolean;
  readonly savedAt: number | null;
  readonly notice: Notice | null;
}

const HISTORY_LIMIT = 80;
const COALESCE_WINDOW_MS = 900;

export interface CommitOptions {
  /** Gestures sharing a key within a short window collapse into one undo step. */
  readonly coalesce?: string;
  readonly selection?: readonly ElementId[];
}

export class EditorStore {
  #state: EditorState;
  readonly #listeners = new Set<() => void>();
  #lastCoalesce: { readonly key: string; readonly at: number } | null = null;

  constructor(design: Design) {
    const firstPage = design.pages[0];
    this.#state = {
      design,
      activePageId: firstPage?.id ?? '',
      selection: [],
      zoom: 1,
      pan: { x: 0, y: 0 },
      viewAnimated: false,
      editingTextId: null,
      guides: [],
      clipboard: [],
      past: [],
      future: [],
      dirty: false,
      savedAt: null,
      notice: null,
    };
  }

  getState = (): EditorState => this.#state;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  #emit = (): void => {
    for (const listener of this.#listeners) listener();
  };

  #set = (patch: Partial<EditorState>): void => {
    this.#state = { ...this.#state, ...patch };
    this.#emit();
  };

  /** Record a document change, maintaining undo history. */
  #commit = (design: Design, options: CommitOptions = {}): void => {
    if (design === this.#state.design) {
      if (options.selection) this.#set({ selection: options.selection });
      return;
    }
    const now = Date.now();
    const coalesce = options.coalesce;
    const continuing =
      coalesce !== undefined &&
      this.#lastCoalesce !== null &&
      this.#lastCoalesce.key === coalesce &&
      now - this.#lastCoalesce.at < COALESCE_WINDOW_MS;

    const past = continuing
      ? this.#state.past
      : [...this.#state.past, this.#state.design].slice(-HISTORY_LIMIT);

    this.#lastCoalesce = coalesce === undefined ? null : { key: coalesce, at: now };

    this.#set({
      design,
      past,
      future: [],
      dirty: true,
      ...(options.selection ? { selection: options.selection } : {}),
    });
  };

  // ---------------------------------------------------------------- document

  replaceDesign = (design: Design, options: { readonly resetHistory?: boolean } = {}): void => {
    const firstPage = design.pages[0];
    this.#lastCoalesce = null;
    this.#set({
      design,
      activePageId: firstPage?.id ?? '',
      selection: [],
      editingTextId: null,
      guides: [],
      ...(options.resetHistory === false
        ? {}
        : { past: [], future: [], dirty: false, savedAt: Date.now() }),
    });
  };

  rename = (name: string): void => this.#commit(renameDesign(this.#state.design, name), { coalesce: 'rename' });

  resize = (width: number, height: number): void =>
    this.#commit(resizeDesign(this.#state.design, width, height), { coalesce: 'resize-doc' });

  setPalette = (palette: readonly string[]): void => this.#commit(setPalette(this.#state.design, palette));

  markSaved = (): void => this.#set({ dirty: false, savedAt: Date.now() });

  // ------------------------------------------------------------------- pages

  activePage = () => findPage(this.#state.design, this.#state.activePageId) ?? this.#state.design.pages[0] ?? null;

  selectPage = (pageId: PageId): void =>
    this.#set({ activePageId: pageId, selection: [], editingTextId: null });

  addPage = (): void => {
    const design = addPage(this.#state.design, this.#state.activePageId);
    const added = design.pages[design.pages.findIndex((page) => page.id === this.#state.activePageId) + 1];
    this.#commit(design);
    if (added) this.#set({ activePageId: added.id, selection: [] });
  };

  duplicateActivePage = (): void => {
    const design = duplicatePage(this.#state.design, this.#state.activePageId);
    const index = design.pages.findIndex((page) => page.id === this.#state.activePageId);
    const copy = design.pages[index + 1];
    this.#commit(design);
    if (copy) this.#set({ activePageId: copy.id, selection: [] });
  };

  removeActivePage = (): void => {
    const { design, activePageId } = this.#state;
    if (design.pages.length <= 1) {
      this.notify('info', '마지막 페이지는 삭제할 수 없습니다.');
      return;
    }
    const index = design.pages.findIndex((page) => page.id === activePageId);
    const next = removePage(design, activePageId);
    const fallback = next.pages[Math.max(0, index - 1)];
    this.#commit(next);
    if (fallback) this.#set({ activePageId: fallback.id, selection: [] });
  };

  moveActivePage = (direction: -1 | 1): void =>
    this.#commit(movePage(this.#state.design, this.#state.activePageId, direction));

  renameActivePage = (name: string): void =>
    this.#commit(renamePage(this.#state.design, this.#state.activePageId, name), { coalesce: 'rename-page' });

  setBackground = (background: Paint): void =>
    this.#commit(setPageBackground(this.#state.design, this.#state.activePageId, background), {
      coalesce: 'background',
    });

  // --------------------------------------------------------------- selection

  select = (ids: readonly ElementId[], options: { readonly expand?: boolean } = {}): void => {
    const page = this.activePage();
    if (!page) return;
    const resolved = options.expand === false ? ids : expandGroups(page, ids);
    this.#set({ selection: resolved, editingTextId: null });
  };

  toggleSelect = (id: ElementId): void => {
    const page = this.activePage();
    if (!page) return;
    const current = new Set(this.#state.selection);
    const group = expandGroups(page, [id]);
    const alreadySelected = group.every((member) => current.has(member));
    for (const member of group) {
      if (alreadySelected) current.delete(member);
      else current.add(member);
    }
    this.#set({ selection: [...current] });
  };

  selectAll = (): void => {
    const page = this.activePage();
    if (!page) return;
    this.#set({
      selection: page.elements.filter((element) => !element.locked).map((element) => element.id),
    });
  };

  clearSelection = (): void => this.#set({ selection: [], editingTextId: null });

  selectedElements = (): readonly DesignElement[] => {
    const page = this.activePage();
    if (!page) return [];
    const ids = new Set(this.#state.selection);
    return page.elements.filter((element) => ids.has(element.id));
  };

  // ------------------------------------------------------------------- view

  setZoom = (zoom: number): void => this.#set({ zoom: clamp(zoom, 0.05, 8), viewAnimated: true });

  zoomBy = (factor: number): void => this.setZoom(this.#state.zoom * factor);

  setPan = (pan: Point): void => this.#set({ pan, viewAnimated: false });

  panBy = (dx: number, dy: number): void =>
    this.#set({ pan: { x: this.#state.pan.x + dx, y: this.#state.pan.y + dy }, viewAnimated: false });

  /** Zoom and pan in one update, so a wheel gesture renders a single frame. */
  setView = (zoom: number, pan: Point, options: { readonly animated: boolean }): void =>
    this.#set({ zoom: clamp(zoom, 0.05, 8), pan, viewAnimated: options.animated });

  resetView = (zoom: number): void =>
    this.#set({ zoom: clamp(zoom, 0.05, 8), pan: { x: 0, y: 0 }, viewAnimated: true });

  setGuides = (guides: readonly SnapGuide[]): void => this.#set({ guides });

  beginTextEdit = (id: ElementId): void => this.#set({ editingTextId: id, selection: [id] });

  endTextEdit = (): void => this.#set({ editingTextId: null });

  notify = (tone: Notice['tone'], message: string): void =>
    this.#set({ notice: { id: createId('ntc'), tone, message } });

  reportError = (error: StudioError): void => this.notify('error', describeError(error));

  dismissNotice = (): void => this.#set({ notice: null });

  // --------------------------------------------------------------- elements

  addElements = (elements: readonly DesignElement[]): void => {
    this.#commit(addElements(this.#state.design, this.#state.activePageId, elements), {
      selection: elements.map((element) => element.id),
    });
  };

  /** Swap one element for another in place, e.g. a photo dropped into a frame. */
  replaceElement = (id: ElementId, replacement: DesignElement): void => {
    const { design, activePageId } = this.#state;
    this.#commit(replaceElement(design, activePageId, id, replacement), { selection: [replacement.id] });
  };

  updateSelection = (
    patch: (element: DesignElement) => Partial<DesignElement>,
    options: CommitOptions = {},
  ): void => {
    const { design, activePageId, selection } = this.#state;
    this.#commit(updateElements(design, activePageId, selection, patch), options);
  };

  updateElement = (
    id: ElementId,
    patch: (element: DesignElement) => Partial<DesignElement>,
    options: CommitOptions = {},
  ): void => {
    const { design, activePageId } = this.#state;
    this.#commit(updateElements(design, activePageId, [id], patch), options);
  };

  setLocked = (ids: readonly ElementId[], locked: boolean): void => {
    const { design, activePageId } = this.#state;
    this.#commit(updateElements(design, activePageId, ids, () => ({ locked }), { includeLocked: true }));
  };

  setHidden = (ids: readonly ElementId[], hidden: boolean): void => {
    const { design, activePageId } = this.#state;
    this.#commit(updateElements(design, activePageId, ids, () => ({ hidden }), { includeLocked: true }));
  };

  moveSelectionBy = (dx: number, dy: number, options: CommitOptions = {}): void => {
    const { design, activePageId, selection } = this.#state;
    this.#commit(moveBy(design, activePageId, selection, dx, dy), options);
  };

  removeSelection = (): void => {
    const { design, activePageId, selection } = this.#state;
    if (selection.length === 0) return;
    this.#commit(removeElements(design, activePageId, selection), { selection: [] });
  };

  duplicateSelection = (): void => {
    const { design, activePageId, selection } = this.#state;
    if (selection.length === 0) return;
    const outcome = duplicateElements(design, activePageId, selection);
    this.#commit(outcome.design, { selection: outcome.ids });
  };

  copySelection = (): void => {
    const elements = this.selectedElements();
    if (elements.length === 0) return;
    this.#set({ clipboard: elements });
  };

  cutSelection = (): void => {
    this.copySelection();
    this.removeSelection();
  };

  paste = (): void => {
    const { clipboard, design, activePageId } = this.#state;
    if (clipboard.length === 0) return;
    const groupRemap = new Map<string, string>();
    const copies = clipboard.map((element) => {
      const groupId = element.groupId
        ? (groupRemap.get(element.groupId) ??
          (() => {
            const fresh = createId('grp');
            groupRemap.set(element.groupId as string, fresh);
            return fresh;
          })())
        : null;
      return {
        ...element,
        id: createId('el'),
        x: round(element.x + 32),
        y: round(element.y + 32),
        groupId,
      } as DesignElement;
    });
    this.#commit(addElements(design, activePageId, copies), {
      selection: copies.map((element) => element.id),
    });
  };

  reorderSelection = (intent: ReorderIntent): void => {
    const { design, activePageId, selection } = this.#state;
    this.#commit(reorder(design, activePageId, selection, intent));
  };

  align = (edge: AlignEdge): void => {
    const { design, activePageId, selection } = this.#state;
    this.#commit(alignElements(design, activePageId, selection, edge));
  };

  distribute = (axis: 'x' | 'y'): void => {
    const { design, activePageId, selection } = this.#state;
    this.#commit(distributeElements(design, activePageId, selection, axis));
  };

  group = (): void => {
    const { design, activePageId, selection } = this.#state;
    if (selection.length < 2) return;
    this.#commit(groupElements(design, activePageId, selection));
  };

  ungroup = (): void => {
    const { design, activePageId, selection } = this.#state;
    this.#commit(ungroupElements(design, activePageId, selection));
  };

  /** Centre the current selection on the page, both axes. */
  centreSelection = (): void => {
    const page = this.activePage();
    const { selection, design, activePageId } = this.#state;
    if (!page || selection.length === 0) return;
    const bounds = selectionBounds(page, selection);
    if (!bounds) return;
    const dx = (design.width - bounds.width) / 2 - bounds.x;
    const dy = (design.height - bounds.height) / 2 - bounds.y;
    this.#commit(moveBy(design, activePageId, selection, round(dx), round(dy)));
  };

  // ---------------------------------------------------------------- history

  undo = (): void => {
    const { past, design, future } = this.#state;
    const previous = past[past.length - 1];
    if (!previous) return;
    this.#lastCoalesce = null;
    const activePageId = previous.pages.some((page) => page.id === this.#state.activePageId)
      ? this.#state.activePageId
      : (previous.pages[0]?.id ?? '');
    this.#set({
      design: previous,
      past: past.slice(0, -1),
      future: [design, ...future].slice(0, HISTORY_LIMIT),
      activePageId,
      selection: [],
      editingTextId: null,
      dirty: true,
    });
  };

  redo = (): void => {
    const { future, design, past } = this.#state;
    const next = future[0];
    if (!next) return;
    this.#lastCoalesce = null;
    const activePageId = next.pages.some((page) => page.id === this.#state.activePageId)
      ? this.#state.activePageId
      : (next.pages[0]?.id ?? '');
    this.#set({
      design: next,
      future: future.slice(1),
      past: [...past, design].slice(-HISTORY_LIMIT),
      activePageId,
      selection: [],
      editingTextId: null,
      dirty: true,
    });
  };

  canUndo = (): boolean => this.#state.past.length > 0;

  canRedo = (): boolean => this.#state.future.length > 0;
}
