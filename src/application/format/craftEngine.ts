/**
 * The WebAssembly format engine.
 *
 * The engine is the ArtCraft PPTX reader and writer (storytold/deckcraft,
 * Apache-2.0 or MIT) compiled to wasm32 and served beside the app. It is
 * optional on purpose: CI builds it as a separate, non-blocking job, and a
 * local checkout has no Rust toolchain, so every caller must be able to carry
 * on without it. `load()` therefore reports its absence as an ordinary
 * `Result` rather than throwing, and the built-in writer stays as the fallback.
 *
 * Nothing above this module knows it is WebAssembly, or that the document
 * model on the other side is DeckCraft's rather than ours.
 */

import type { EngineUnavailable, StudioError } from '../../domain/errors.js';
import { err, ok, type Result } from '../../domain/result.js';

/** The shape wasm-bindgen generates for the bridge crate. */
interface BridgeModule {
  readonly default: (input?: unknown) => Promise<unknown>;
  readonly bridge_version: () => string;
  readonly pptx_sniff: (bytes: Uint8Array) => boolean;
  readonly pptx_is_encrypted: (bytes: Uint8Array) => boolean;
  readonly pptx_import_json: (bytes: Uint8Array) => string;
  readonly pptx_export: (presentationJson: string) => Uint8Array;
}

export interface PptxImport {
  /** A DeckCraft `Presentation`, exactly as the engine serialised it. */
  readonly presentation: unknown;
  /** Parts the reader understood only partially; shown, never swallowed. */
  readonly warnings: readonly string[];
}

export interface CraftEngine {
  readonly version: string;
  /** Whether the bytes look like a PresentationML package at all. */
  readonly sniffPptx: (bytes: Uint8Array) => boolean;
  readonly isPptxEncrypted: (bytes: Uint8Array) => boolean;
  readonly importPptx: (bytes: Uint8Array) => Result<PptxImport, StudioError>;
  readonly exportPptx: (presentationJson: string) => Result<Uint8Array, StudioError>;
}

/** Served next to the page, so the path follows whatever base the site uses. */
const BRIDGE_URL = 'engine/craft_bridge.js';

const unavailable = (detail: string): EngineUnavailable => ({ kind: 'engine-unavailable', detail });

const messageOf = (cause: unknown): string =>
  cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : '알 수 없는 오류';

const parseEnvelope = (json: string): Result<PptxImport, StudioError> => {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch (cause) {
    return err({ kind: 'import-failed', format: 'PPTX', detail: messageOf(cause) });
  }
  if (typeof value !== 'object' || value === null) {
    return err({ kind: 'import-failed', format: 'PPTX', detail: '엔진이 예상과 다른 형식을 돌려주었습니다.' });
  }
  const record = value as Record<string, unknown>;
  const warnings = Array.isArray(record['warnings'])
    ? record['warnings'].filter((entry): entry is string => typeof entry === 'string')
    : [];
  return ok({ presentation: record['presentation'], warnings });
};

const wrap = (module: BridgeModule): CraftEngine => ({
  version: module.bridge_version(),

  sniffPptx: (bytes) => module.pptx_sniff(bytes),

  isPptxEncrypted: (bytes) => module.pptx_is_encrypted(bytes),

  importPptx: (bytes) => {
    // The bridge throws a JS error for an unreadable package; that is a normal
    // outcome for a file someone chose, so it becomes a Result here.
    try {
      return parseEnvelope(module.pptx_import_json(bytes));
    } catch (cause) {
      return err({ kind: 'import-failed', format: 'PPTX', detail: messageOf(cause) });
    }
  },

  exportPptx: (presentationJson) => {
    try {
      return ok(module.pptx_export(presentationJson));
    } catch (cause) {
      return err({ kind: 'export-failed', format: 'PPTX', detail: messageOf(cause) });
    }
  },
});

let pending: Promise<Result<CraftEngine, StudioError>> | null = null;

const start = async (): Promise<Result<CraftEngine, StudioError>> => {
  if (typeof WebAssembly === 'undefined') {
    return err(unavailable('이 브라우저는 WebAssembly를 지원하지 않습니다.'));
  }

  const url = new URL(BRIDGE_URL, document.baseURI).href;
  let module: BridgeModule;
  try {
    // The URL is resolved at runtime, so the bundler must leave it alone: the
    // engine is deployed beside the app, not built into it.
    module = (await import(/* @vite-ignore */ url)) as BridgeModule;
  } catch (cause) {
    return err(unavailable(messageOf(cause)));
  }

  try {
    // wasm-bindgen's web target fetches the .wasm next to its own module.
    await module.default();
  } catch (cause) {
    return err(unavailable(`초기화 실패: ${messageOf(cause)}`));
  }

  return ok(wrap(module));
};

/**
 * Load the engine once per page. The promise is cached including its failure,
 * so a build without an engine is not re-fetched on every export.
 */
export const loadCraftEngine = (): Promise<Result<CraftEngine, StudioError>> => {
  pending ??= start();
  return pending;
};

/** Forget the cached attempt. Exists for tests, not for callers. */
export const resetCraftEngine = (): void => {
  pending = null;
};
