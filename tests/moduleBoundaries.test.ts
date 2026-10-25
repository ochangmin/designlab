import { describe, expect, it } from 'vitest';

/**
 * The layering is a claim the architecture makes, so it is checked rather than
 * only described. These are source-level facts — what imports what — which is
 * exactly what a reader of ARCHITECTURE.md is being told.
 *
 * The sources are read through Vite's own glob rather than the filesystem, so
 * the suite needs no Node typings and sees the same files the bundler does.
 */

const MODULES = import.meta.glob('../src/**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const FILES = Object.entries(MODULES).map(([path, text]) => ({
  /** Normalised to a path relative to `src/`, e.g. `application/auth/authPort.ts`. */
  path: path.replace(/^\.\.\/src\//, ''),
  text,
}));

const importsOf = (text: string): readonly string[] =>
  [...text.matchAll(/^\s*import\s[^;]*?from\s+'([^']+)'/gm)].map((match) => match[1] ?? '');

describe('module boundaries', () => {
  it('finds the source tree', () => {
    expect(FILES.length).toBeGreaterThan(20);
    expect(FILES.some((file) => file.path === 'domain/document.ts')).toBe(true);
  });

  it('keeps the Supabase SDK inside application/supabase', () => {
    const offenders = FILES.filter(
      (file) =>
        !file.path.startsWith('application/supabase/') &&
        importsOf(file.text).some((specifier) => specifier.startsWith('@supabase/')),
    ).map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it('keeps the domain free of the application and UI layers', () => {
    const offenders = FILES.filter((file) => file.path.startsWith('domain/')).flatMap((file) =>
      importsOf(file.text)
        .filter((specifier) => specifier.includes('/application/') || specifier.includes('/ui/'))
        .map((specifier) => `${file.path} -> ${specifier}`),
    );
    expect(offenders).toEqual([]);
  });

  it('keeps the application layer free of React', () => {
    const offenders = FILES.filter(
      (file) =>
        file.path.startsWith('application/') &&
        importsOf(file.text).some((specifier) => specifier === 'react' || specifier === 'react-dom'),
    ).map((file) => file.path);
    expect(offenders).toEqual([]);
  });

  it('reaches storage through the project store, not the repository', () => {
    // `projectStore.ts` adapts the local repository; every screen must go
    // through the port so the remote store is never bypassed. `App.tsx` may
    // still use the repository's "last opened" note, which is local by nature.
    const offenders = FILES.filter(
      (file) =>
        file.path.startsWith('ui/') &&
        file.path !== 'ui/App.tsx' &&
        importsOf(file.text).some((specifier) => specifier.includes('projectRepository')),
    ).map((file) => file.path);
    expect(offenders).toEqual([]);
  });
});
