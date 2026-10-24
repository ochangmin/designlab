import { useSyncExternalStore, type ReactElement } from 'react';

import { assetLibrary, type LibraryEntry } from '../../../application/assetLibrary.js';
import { fitInside, importImageFile } from '../../../application/assets.js';
import { createImage } from '../../../domain/elements.js';
import { PanelSection } from '../../controls.js';
import { useEditorState, useStore } from '../../storeContext.js';

export const UploadsPanel = (): ReactElement => {
  const store = useStore();
  const { design, selection } = useEditorState();
  const entries = useSyncExternalStore(assetLibrary.subscribe, assetLibrary.list, assetLibrary.list);

  const intake = async (files: FileList): Promise<void> => {
    for (const file of Array.from(files)) {
      const imported = await importImageFile(file);
      if (!imported.ok) {
        store.reportError(imported.error);
        continue;
      }
      assetLibrary.add(imported.value);
    }
  };

  const place = (entry: LibraryEntry): void => {
    const selected = store.selectedElements();
    const target = selection.length === 1 ? selected[0] : undefined;

    // Dropping onto a selected shape or image replaces its content in place,
    // which is how people expect a photo frame to behave.
    if (target && (target.type === 'shape' || target.type === 'image')) {
      store.replaceElement(
        target.id,
        createImage(
          entry.src,
          { x: target.x, y: target.y, width: target.width, height: target.height },
          { name: entry.name, radius: target.radius, rotation: target.rotation },
        ),
      );
      return;
    }

    const size = fitInside(entry, { width: design.width * 0.7, height: design.height * 0.7 });
    store.addElements([
      createImage(
        entry.src,
        {
          x: Math.round((design.width - size.width) / 2),
          y: Math.round((design.height - size.height) / 2),
          width: size.width,
          height: size.height,
        },
        { name: entry.name },
      ),
    ]);
  };

  return (
    <div className="panel">
      <PanelSection title="이미지 업로드">
        <label className="upload-drop">
          <strong>파일 선택</strong>
          <span>PNG · JPEG · WebP · GIF · SVG · 최대 8MB</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            multiple
            hidden
            onChange={(event) => {
              const files = event.target.files;
              if (files && files.length > 0) void intake(files);
              event.target.value = '';
            }}
          />
        </label>
        <p className="panel-note">캔버스에 파일을 직접 끌어다 놓아도 추가됩니다.</p>
      </PanelSection>

      {entries.length > 0 && (
        <PanelSection title={`업로드한 이미지 (${entries.length})`}>
          <div className="panel-grid panel-grid--uploads">
            {entries.map((entry) => (
              <div key={entry.id} className="upload-tile">
                <button type="button" onClick={() => place(entry)} title={`${entry.name} 추가`}>
                  <img src={entry.src} alt={entry.name} />
                </button>
                <button
                  type="button"
                  className="upload-tile__remove"
                  onClick={() => assetLibrary.remove(entry.id)}
                  aria-label={`${entry.name} 목록에서 제거`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </PanelSection>
      )}
    </div>
  );
};
