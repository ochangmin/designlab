import { useMemo, useState, type ReactElement } from 'react';

import { TEMPLATES, type TemplateDefinition } from '../../../domain/templates.js';
import { PagePreview } from '../../PagePreview.js';
import { useEditorState, useMeasure, useStore } from '../../storeContext.js';

const CATEGORIES = ['전체', '소셜', '프레젠테이션', '인쇄', '마케팅'] as const;

export const TemplatesPanel = (): ReactElement => {
  const store = useStore();
  const measure = useMeasure();
  const { design } = useEditorState();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('전체');

  const built = useMemo(
    () => TEMPLATES.map((template) => ({ template, preview: template.build() })),
    [],
  );

  const visible = built.filter(
    ({ template }) => category === '전체' || template.category === category,
  );

  const apply = (template: TemplateDefinition): void => {
    const fresh = template.build();
    // The project keeps its own identity and name; only the content is replaced,
    // so autosave continues writing to the same stored project.
    store.replaceDesign(
      { ...fresh, id: design.id, name: design.name, createdAt: design.createdAt },
      { resetHistory: false },
    );
    store.notify('info', `"${template.label}" 템플릿을 적용했습니다. Ctrl+Z로 되돌릴 수 있습니다.`);
  };

  return (
    <div className="panel">
      <div className="chips">
        {CATEGORIES.map((name) => (
          <button
            key={name}
            type="button"
            className={`chip${category === name ? ' is-active' : ''}`}
            onClick={() => setCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="panel-grid panel-grid--templates">
        {visible.map(({ template, preview }) => {
          const firstPage = preview.pages[0];
          return (
            <button key={template.id} type="button" className="template-tile" onClick={() => apply(template)}>
              {firstPage && <PagePreview design={preview} page={firstPage} measure={measure} width={128} />}
              <span>{template.label}</span>
            </button>
          );
        })}
      </div>
      <p className="panel-note">
        템플릿을 적용하면 현재 페이지 구성이 교체됩니다. 문서 크기도 템플릿 크기로 바뀝니다.
      </p>
    </div>
  );
};
