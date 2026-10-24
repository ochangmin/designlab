/**
 * The canvas workspace: viewport, hit testing and direct manipulation.
 *
 * All pointer gestures are resolved here into store commands. A gesture owns
 * its own origin snapshot, so a drag or resize is computed from where it
 * started rather than accumulating per-event rounding, and one gesture
 * produces one undo step.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type WheelEvent as ReactWheelEvent,
} from 'react';

import { paintToCss, type DesignElement, type ElementId } from '../../domain/document.js';
import {
  boundsOf,
  centreOf,
  clamp,
  normaliseAngle,
  resizeRect,
  rectsIntersect,
  round,
  type Point,
  type Rect,
  type ResizeHandle,
} from '../../domain/geometry.js';
import { computeSnap } from '../../domain/snapping.js';
import { elementBounds, selectionBounds } from '../../domain/mutations.js';
import { layoutText } from '../../domain/textLayout.js';
import { importImageFile, fitInside } from '../../application/assets.js';
import { createImage } from '../../domain/elements.js';
import { ElementRenderer } from '../ElementRenderer.js';
import { useEditorState, useMeasure, useStore } from '../storeContext.js';

const HANDLES: readonly ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const SNAP_PIXELS = 7;
const MIN_SIZE = 8;

interface ElementSnapshot {
  readonly id: ElementId;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly fontSize: number | null;
}

type Gesture =
  | { readonly kind: 'none' }
  | { readonly kind: 'drag'; readonly start: Point; readonly snapshots: readonly ElementSnapshot[]; moved: boolean }
  | {
      readonly kind: 'resize';
      readonly handle: ResizeHandle;
      readonly start: Point;
      readonly snapshots: readonly ElementSnapshot[];
      readonly frame: Rect;
    }
  | { readonly kind: 'rotate'; readonly centre: Point; readonly startAngle: number; readonly snapshots: readonly ElementSnapshot[] }
  | { readonly kind: 'marquee'; readonly start: Point; readonly additive: boolean }
  | { readonly kind: 'pan'; readonly startClient: Point; readonly startPan: Point };

const snapshotOf = (element: DesignElement): ElementSnapshot => ({
  id: element.id,
  x: element.x,
  y: element.y,
  width: element.width,
  height: element.height,
  rotation: element.rotation,
  fontSize: element.type === 'text' ? element.fontSize : null,
});

export const Workspace = (): ReactElement => {
  const store = useStore();
  const measure = useMeasure();
  const state = useEditorState();
  const { design, selection, zoom, pan, editingTextId } = state;

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const gestureRef = useRef<Gesture>({ kind: 'none' });
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  const page = design.pages.find((candidate) => candidate.id === state.activePageId) ?? design.pages[0] ?? null;

  // Fit the document when a different design is opened or its size changes.
  const fitKey = `${design.id}:${design.width}×${design.height}`;
  const lastFitRef = useRef<string>('');
  useLayoutEffect(() => {
    if (lastFitRef.current === fitKey) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    lastFitRef.current = fitKey;
    const padding = 96;
    const scale = Math.min(
      (viewport.clientWidth - padding) / design.width,
      (viewport.clientHeight - padding) / design.height,
    );
    store.resetView(clamp(Number.isFinite(scale) && scale > 0 ? scale : 1, 0.05, 2));
  }, [fitKey, design.width, design.height, store]);

  const toPage = useCallback((clientX: number, clientY: number): Point => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.getBoundingClientRect();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }, [zoom]);

  // -------------------------------------------------------------- gestures

  const beginDrag = (event: ReactPointerEvent, id: ElementId): void => {
    if (!page) return;
    const element = page.elements.find((candidate) => candidate.id === id);
    if (!element || element.locked) return;

    if (event.shiftKey) {
      store.toggleSelect(id);
      return;
    }
    const alreadySelected = selection.includes(id);
    if (!alreadySelected) store.select([id]);

    const ids = alreadySelected ? selection : [id];
    const snapshots = page.elements
      .filter((candidate) => ids.includes(candidate.id) && !candidate.locked)
      .map(snapshotOf);
    gestureRef.current = {
      kind: 'drag',
      start: toPage(event.clientX, event.clientY),
      snapshots,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const beginResize = (event: ReactPointerEvent, handle: ResizeHandle): void => {
    if (!page) return;
    const frame = selectionBounds(page, selection);
    if (!frame) return;
    const snapshots = page.elements
      .filter((candidate) => selection.includes(candidate.id) && !candidate.locked)
      .map(snapshotOf);
    gestureRef.current = {
      kind: 'resize',
      handle,
      start: toPage(event.clientX, event.clientY),
      snapshots,
      frame: selection.length === 1 && snapshots[0]
        ? { x: snapshots[0].x, y: snapshots[0].y, width: snapshots[0].width, height: snapshots[0].height }
        : frame,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };

  const beginRotate = (event: ReactPointerEvent): void => {
    if (!page) return;
    const snapshots = page.elements
      .filter((candidate) => selection.includes(candidate.id) && !candidate.locked)
      .map(snapshotOf);
    const first = snapshots[0];
    if (!first) return;
    const centre = centreOf({ x: first.x, y: first.y, width: first.width, height: first.height });
    const pointer = toPage(event.clientX, event.clientY);
    const startAngle = Math.atan2(pointer.y - centre.y, pointer.x - centre.x) * (180 / Math.PI);
    gestureRef.current = { kind: 'rotate', centre, startAngle, snapshots };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };

  const onSurfacePointerDown = (event: ReactPointerEvent): void => {
    if (event.button === 1 || spaceHeld) {
      gestureRef.current = {
        kind: 'pan',
        startClient: { x: event.clientX, y: event.clientY },
        startPan: pan,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (event.button !== 0) return;
    gestureRef.current = {
      kind: 'marquee',
      start: toPage(event.clientX, event.clientY),
      additive: event.shiftKey,
    };
    if (!event.shiftKey) store.clearSelection();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const applyDrag = (gesture: Extract<Gesture, { kind: 'drag' }>, pointer: Point, withSnap: boolean): void => {
    if (!page) return;
    const rawDx = pointer.x - gesture.start.x;
    const rawDy = pointer.y - gesture.start.y;

    const movingIds = new Set(gesture.snapshots.map((snapshot) => snapshot.id));
    const movingBounds = gesture.snapshots
      .map((snapshot) =>
        boundsOf({ x: snapshot.x + rawDx, y: snapshot.y + rawDy, width: snapshot.width, height: snapshot.height }, snapshot.rotation),
      )
      .reduce<Rect | null>((union, rect) => {
        if (!union) return rect;
        const minX = Math.min(union.x, rect.x);
        const minY = Math.min(union.y, rect.y);
        return {
          x: minX,
          y: minY,
          width: Math.max(union.x + union.width, rect.x + rect.width) - minX,
          height: Math.max(union.y + union.height, rect.y + rect.height) - minY,
        };
      }, null);

    let dx = rawDx;
    let dy = rawDy;
    if (withSnap && movingBounds) {
      const others = page.elements
        .filter((element) => !movingIds.has(element.id) && !element.hidden)
        .map(elementBounds);
      const snap = computeSnap({
        moving: movingBounds,
        others,
        page: { width: design.width, height: design.height },
        threshold: SNAP_PIXELS / zoom,
      });
      dx += snap.dx;
      dy += snap.dy;
      store.setGuides(snap.guides);
    } else {
      store.setGuides([]);
    }

    const offsets = new Map(gesture.snapshots.map((snapshot) => [snapshot.id, snapshot]));
    store.updateSelection(
      (element) => {
        const snapshot = offsets.get(element.id);
        if (!snapshot) return {};
        return { x: round(snapshot.x + dx), y: round(snapshot.y + dy) };
      },
      { coalesce: `drag:${gesture.snapshots.map((snapshot) => snapshot.id).join(',')}` },
    );
  };

  const applyResize = (gesture: Extract<Gesture, { kind: 'resize' }>, pointer: Point, keepAspect: boolean): void => {
    const single = gesture.snapshots.length === 1 ? gesture.snapshots[0] : null;
    const delta: Point = { x: pointer.x - gesture.start.x, y: pointer.y - gesture.start.y };

    if (single) {
      const next = resizeRect({
        rect: { x: single.x, y: single.y, width: single.width, height: single.height },
        rotation: single.rotation,
        handle: gesture.handle,
        delta,
        keepAspect,
        minSize: MIN_SIZE,
      });
      const scale = single.height > 0 ? next.height / single.height : 1;
      store.updateElement(
        single.id,
        (element) => ({
          ...next,
          // Corner handles scale type with the box; edge handles reflow it.
          ...(element.type === 'text' && single.fontSize !== null && gesture.handle.length === 2
            ? { fontSize: Math.max(4, round(single.fontSize * scale, 1)) }
            : {}),
        }),
        { coalesce: `resize:${single.id}` },
      );
      return;
    }

    const frame = gesture.frame;
    const next = resizeRect({
      rect: frame,
      rotation: 0,
      handle: gesture.handle,
      delta,
      keepAspect,
      minSize: MIN_SIZE,
    });
    const scaleX = frame.width > 0 ? next.width / frame.width : 1;
    const scaleY = frame.height > 0 ? next.height / frame.height : 1;
    const snapshots = new Map(gesture.snapshots.map((snapshot) => [snapshot.id, snapshot]));
    store.updateSelection(
      (element) => {
        const snapshot = snapshots.get(element.id);
        if (!snapshot) return {};
        const width = Math.max(MIN_SIZE, snapshot.width * scaleX);
        const height = Math.max(MIN_SIZE, snapshot.height * scaleY);
        return {
          x: round(next.x + (snapshot.x - frame.x) * scaleX),
          y: round(next.y + (snapshot.y - frame.y) * scaleY),
          width: round(width),
          height: round(height),
          ...(element.type === 'text' && snapshot.fontSize !== null
            ? { fontSize: Math.max(4, round(snapshot.fontSize * Math.min(scaleX, scaleY), 1)) }
            : {}),
        };
      },
      { coalesce: 'resize:group' },
    );
  };

  useEffect(() => {
    const onPointerMove = (event: globalThis.PointerEvent): void => {
      const gesture = gestureRef.current;
      if (gesture.kind === 'none') return;

      if (gesture.kind === 'pan') {
        store.setPan({
          x: gesture.startPan.x + (event.clientX - gesture.startClient.x),
          y: gesture.startPan.y + (event.clientY - gesture.startClient.y),
        });
        return;
      }

      const pointer = toPage(event.clientX, event.clientY);

      if (gesture.kind === 'drag') {
        gesture.moved = true;
        applyDrag(gesture, pointer, !event.altKey);
        return;
      }

      if (gesture.kind === 'resize') {
        applyResize(gesture, pointer, event.shiftKey);
        return;
      }

      if (gesture.kind === 'rotate') {
        const angle = Math.atan2(pointer.y - gesture.centre.y, pointer.x - gesture.centre.x) * (180 / Math.PI);
        const first = gesture.snapshots[0];
        if (!first) return;
        const raw = first.rotation + (angle - gesture.startAngle);
        const stepped = event.shiftKey ? Math.round(raw / 15) * 15 : raw;
        store.updateElement(first.id, () => ({ rotation: normaliseAngle(stepped) }), {
          coalesce: `rotate:${first.id}`,
        });
        return;
      }

      if (gesture.kind === 'marquee') {
        const x = Math.min(gesture.start.x, pointer.x);
        const y = Math.min(gesture.start.y, pointer.y);
        setMarquee({
          x,
          y,
          width: Math.abs(pointer.x - gesture.start.x),
          height: Math.abs(pointer.y - gesture.start.y),
        });
      }
    };

    const onPointerUp = (): void => {
      const gesture = gestureRef.current;
      if (gesture.kind === 'marquee' && marquee && page) {
        const hits = page.elements
          .filter((element) => !element.locked && !element.hidden && rectsIntersect(elementBounds(element), marquee))
          .map((element) => element.id);
        if (hits.length > 0) store.select(gesture.additive ? [...new Set([...selection, ...hits])] : hits);
      }
      gestureRef.current = { kind: 'none' };
      setMarquee(null);
      store.setGuides([]);
    };

    globalThis.addEventListener('pointermove', onPointerMove);
    globalThis.addEventListener('pointerup', onPointerUp);
    return () => {
      globalThis.removeEventListener('pointermove', onPointerMove);
      globalThis.removeEventListener('pointerup', onPointerUp);
    };
  });

  // Space temporarily turns the pointer into a pan tool, as in every editor.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'Space' && !(event.target instanceof HTMLTextAreaElement)) setSpaceHeld(true);
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      if (event.code === 'Space') setSpaceHeld(false);
    };
    globalThis.addEventListener('keydown', onKeyDown);
    globalThis.addEventListener('keyup', onKeyUp);
    return () => {
      globalThis.removeEventListener('keydown', onKeyDown);
      globalThis.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>): void => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const viewport = viewportRef.current;
      const stage = stageRef.current;
      if (!viewport || !stage) return;
      const factor = Math.exp(-event.deltaY / 400);
      const nextZoom = clamp(zoom * factor, 0.05, 8);
      // Keep the point under the cursor fixed. The stage is centred by its own
      // transform, so the correction carries both the cursor offset and the
      // change in half-width that recentring introduces.
      const stageRect = stage.getBoundingClientRect();
      const offsetX = event.clientX - stageRect.left;
      const offsetY = event.clientY - stageRect.top;
      const ratio = nextZoom / zoom;
      store.setZoom(nextZoom);
      store.setPan({
        x: pan.x + offsetX * (1 - ratio) + (design.width * (nextZoom - zoom)) / 2,
        y: pan.y + offsetY * (1 - ratio) + (design.height * (nextZoom - zoom)) / 2,
      });
      return;
    }
    store.panBy(-event.deltaX, -event.deltaY);
  };

  const dropImages = async (files: FileList): Promise<void> => {
    for (const file of Array.from(files)) {
      const imported = await importImageFile(file);
      if (!imported.ok) {
        store.reportError(imported.error);
        continue;
      }
      const size = fitInside(imported.value, { width: design.width * 0.6, height: design.height * 0.6 });
      store.addElements([
        createImage(
          imported.value.src,
          {
            x: round((design.width - size.width) / 2),
            y: round((design.height - size.height) / 2),
            width: size.width,
            height: size.height,
          },
          { name: imported.value.name },
        ),
      ]);
    }
  };

  if (!page) return <div className="workspace" />;

  const frame = selectionBounds(page, selection);
  const editing = editingTextId === null ? null : page.elements.find((element) => element.id === editingTextId) ?? null;
  const handleSize = 10 / zoom;
  const singleSelected = selection.length === 1 ? page.elements.find((element) => element.id === selection[0]) ?? null : null;

  return (
    <div
      className={`workspace${spaceHeld ? ' workspace--panning' : ''}${dropActive ? ' workspace--drop' : ''}`}
      ref={viewportRef}
      onWheel={onWheel}
      // Bound on the viewport, not the page: clicking the grey area around a
      // zoomed-out page must also clear the selection and start a marquee.
      onPointerDown={onSurfacePointerDown}
      onDragOver={(event) => {
        event.preventDefault();
        setDropActive(true);
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDropActive(false);
        if (event.dataTransfer.files.length > 0) void dropImages(event.dataTransfer.files);
      }}
    >
      <div
        className="workspace__stage"
        ref={stageRef}
        style={{
          width: `${design.width}px`,
          height: `${design.height}px`,
          // The trailing -50% runs first, in local units, so scaling keeps the
          // page centred on the viewport at every zoom level.
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) translate(-50%, -50%)`,
        }}
      >
        <div className="page-surface" style={{ background: paintToCss(page.background) }} />

        <div className="layer layer--content">
          {page.elements.map((element) => (
            <ElementRenderer
              key={element.id}
              element={element}
              measure={measure}
              suppressText={element.id === editingTextId}
            />
          ))}
        </div>

        <div className="layer layer--hit">
          {page.elements.map((element) =>
            element.hidden ? null : (
              <div
                key={element.id}
                className={`hit${element.locked ? ' hit--locked' : ''}${selection.includes(element.id) ? ' hit--selected' : ''}`}
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  width: `${element.width}px`,
                  height: `${element.height}px`,
                  transform: element.rotation === 0 ? undefined : `rotate(${element.rotation}deg)`,
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  beginDrag(event, element.id);
                }}
                onDoubleClick={() => {
                  if (element.type === 'text' && !element.locked) store.beginTextEdit(element.id);
                }}
              />
            ),
          )}
        </div>

        {state.guides.map((guide) => (
          <div
            key={`${guide.axis}-${guide.at}-${guide.from}`}
            className={`guide guide--${guide.axis}`}
            style={
              guide.axis === 'x'
                ? {
                    left: `${guide.at}px`,
                    top: `${guide.from}px`,
                    height: `${guide.to - guide.from}px`,
                    borderLeftWidth: `${1 / zoom}px`,
                  }
                : {
                    top: `${guide.at}px`,
                    left: `${guide.from}px`,
                    width: `${guide.to - guide.from}px`,
                    borderTopWidth: `${1 / zoom}px`,
                  }
            }
          />
        ))}

        {marquee && (
          <div
            className="marquee"
            style={{
              left: `${marquee.x}px`,
              top: `${marquee.y}px`,
              width: `${marquee.width}px`,
              height: `${marquee.height}px`,
              borderWidth: `${1 / zoom}px`,
            }}
          />
        )}

        {frame && editing === null && (
          <div
            className="selection"
            style={{
              left: `${singleSelected ? singleSelected.x : frame.x}px`,
              top: `${singleSelected ? singleSelected.y : frame.y}px`,
              width: `${singleSelected ? singleSelected.width : frame.width}px`,
              height: `${singleSelected ? singleSelected.height : frame.height}px`,
              transform:
                singleSelected && singleSelected.rotation !== 0 ? `rotate(${singleSelected.rotation}deg)` : undefined,
              outlineWidth: `${1.5 / zoom}px`,
            }}
          >
            {HANDLES.map((handle) => (
              <span
                key={handle}
                className={`handle handle--${handle}`}
                style={{
                  width: `${handleSize}px`,
                  height: `${handleSize}px`,
                  borderWidth: `${1 / zoom}px`,
                }}
                onPointerDown={(event) => beginResize(event, handle)}
              />
            ))}
            {singleSelected && (
              <span
                className="handle handle--rotate"
                style={{
                  width: `${handleSize}px`,
                  height: `${handleSize}px`,
                  top: `${-28 / zoom}px`,
                  borderWidth: `${1 / zoom}px`,
                }}
                onPointerDown={beginRotate}
              />
            )}
          </div>
        )}

        {editing !== null && editing.type === 'text' && (
          <textarea
            className="text-editor"
            autoFocus
            value={editing.text}
            onPointerDown={(event) => event.stopPropagation()}
            style={{
              left: `${editing.x}px`,
              top: `${editing.y}px`,
              width: `${editing.width}px`,
              height: `${editing.height}px`,
              transform: editing.rotation === 0 ? undefined : `rotate(${editing.rotation}deg)`,
              fontFamily: `"${editing.fontFamily}", system-ui, sans-serif`,
              fontSize: `${editing.fontSize}px`,
              fontWeight: editing.fontWeight,
              fontStyle: editing.italic ? 'italic' : 'normal',
              letterSpacing: `${editing.letterSpacing}px`,
              lineHeight: `${editing.fontSize * editing.lineHeight}px`,
              color: editing.color,
              textAlign: editing.align,
              textTransform: editing.uppercase ? 'uppercase' : 'none',
            }}
            onChange={(event) => {
              const text = event.target.value;
              const font = {
                fontFamily: editing.fontFamily,
                fontSize: editing.fontSize,
                fontWeight: editing.fontWeight,
                italic: editing.italic,
                letterSpacing: editing.letterSpacing,
                lineHeight: editing.lineHeight,
              };
              const layout = layoutText(
                editing.uppercase ? text.toLocaleUpperCase() : text,
                editing.width,
                font,
                measure,
              );
              store.updateElement(
                editing.id,
                () => ({ text, height: round(Math.max(layout.totalHeight, editing.fontSize)) }),
                { coalesce: `text:${editing.id}` },
              );
            }}
            onBlur={() => store.endTextEdit()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                store.endTextEdit();
              }
              event.stopPropagation();
            }}
          />
        )}
      </div>

      <div className="workspace__hint">
        {spaceHeld ? '스페이스를 누른 채 드래그하면 이동' : 'Ctrl + 스크롤로 확대 · 더블클릭으로 텍스트 편집'}
      </div>
    </div>
  );
};
