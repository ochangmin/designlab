/** Small form controls shared by the inspector and the side panels. */

import type { ReactElement, ReactNode } from 'react';

import { SWATCHES } from '../domain/presets.js';

export const Field = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <label className="field">
    <span className="field__label">{label}</span>
    {children}
  </label>
);

export const Row = ({ children }: { children: ReactNode }): ReactElement => <div className="row">{children}</div>;

export interface NumberFieldProps {
  readonly label: string;
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly suffix?: string;
  readonly onChange: (value: number) => void;
}

export const NumberField = ({ label, value, min, max, step, suffix, onChange }: NumberFieldProps): ReactElement => (
  <Field label={label}>
    <span className="number-field">
      <input
        type="number"
        value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
      />
      {suffix !== undefined && <em>{suffix}</em>}
    </span>
  </Field>
);

export interface SliderProps {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly onChange: (value: number) => void;
  readonly format?: (value: number) => string;
}

export const Slider = ({ label, value, min, max, step, onChange, format }: SliderProps): ReactElement => (
  <div className="slider">
    <div className="slider__head">
      <span>{label}</span>
      <em>{format ? format(value) : String(Math.round(value))}</em>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step ?? 1}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </div>
);

export interface SegmentedOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly title?: string;
}

export interface SegmentedProps<T extends string> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly ariaLabel: string;
}

export const Segmented = <T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>): ReactElement => (
  <div className="segmented" role="group" aria-label={ariaLabel}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        className={option.value === value ? 'is-active' : ''}
        title={option.title ?? option.label}
        aria-pressed={option.value === value}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export interface ColorFieldProps {
  readonly label: string;
  readonly value: string;
  readonly palette?: readonly string[];
  readonly onChange: (value: string) => void;
}

export const ColorField = ({ label, value, palette, onChange }: ColorFieldProps): ReactElement => {
  const swatches = [...new Set([...(palette ?? []), ...SWATCHES])].slice(0, 20);
  return (
    <div className="color-field">
      <div className="color-field__head">
        <span>{label}</span>
        <span className="color-field__value">
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(event) => onChange(event.target.value)} />
          <input
            type="text"
            value={value}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${label} 값`}
          />
        </span>
      </div>
      <div className="swatches">
        {swatches.map((swatch) => (
          <button
            key={swatch}
            type="button"
            className={`swatch${swatch.toLowerCase() === value.toLowerCase() ? ' is-active' : ''}`}
            style={{ background: swatch }}
            title={swatch}
            aria-label={swatch}
            onClick={() => onChange(swatch)}
          />
        ))}
      </div>
    </div>
  );
};

export const PanelSection = ({ title, children }: { title: string; children: ReactNode }): ReactElement => (
  <section className="panel-section">
    <h3>{title}</h3>
    {children}
  </section>
);
