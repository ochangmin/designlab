/**
 * The WebAssembly format engine.
 *
 * The engine is the ArtCraft PPTX reader and writer (storytold/deckcraft,
 * Apache-2.0 or MIT) compiled to wasm32 and served beside the app. It is
 * optional on purpose: CI builds it as a separate, non-blocking job, and a
 * local checkout has no Rust toolchain, so every caller must be able to carry
 * on without it. `loadCraftEngine` reports its absence as an ordinary `Result`
 * rather than throwing, and the built-in writer stays as the fallback.
 *
 * Nothing above this module knows it is WebAssembly, or that the document model
 * on the other side is DeckCraft's rather than ours.
 */

import type { EngineUnavailable, StudioError } from '../../domain/errors.js';
import { err, ok, type Result } from '../../domain/result.js';

/** The bridge contract this build of the app was written against. */
const REQUIRED_MAJOR = 0;
const REQUIRED_MINOR = 2;

/** An opened package, held on the Rust side so its media stays reachable. */
interface BridgeDocument {
  model_json: () => string;
  warnings_json: () => string;
  media_count: () => number;
  media_bytes: (index: number) => Uint8Array | undefined;
  free: () => void;
}

interface BridgeModule {
  readonly default: (input?: unknown) => Promise<unknown>;
  readonly bridge_version: () => string;
  readonly pptx_sniff: (bytes: Uint8Array) => boolean;
  readonly pptx_is_encrypted: (bytes: Uint8Array) => boolean;
  readonly PptxDocument: { open: (bytes: Uint8Array) => BridgeDocument };
  readonly pptx_export: (presentationJson: string) => Uint8Array;
}

/**
 * An opened `.pptx`. The caller must `release()` it: the package stays in
 * WebAssembly memory until it does.
 */
export interface PptxDocument {
  /** DeckCraft's `Presentation`, already parsed. */
  readonly model: unknown;
  /** Parts the reader understood only partially; shown, never swallowed. */
  readonly warnings: readonly string[];
  readonly mediaCount: number;
  /** Bytes of one media item by its index in the model's `media` array. */
  readonly mediaBytes: (index: number) => Uint8Array | null;
  readonly release: () => void;
}

export interface CraftEngine {
  readonly version: string;
  readonly sniffPptx: (bytes: Uint8Array) => boolean;
  readonly isPptxEncrypted: (bytes: Uint8Array) => boolean;
  readonly openPptx: (bytes: Uint8Array) => Result<PptxDocument, StudioError>;
  readonly exportPptx: (presentationJson: string) => Result<Uint8Array, StudioError>;
}

/** Served next to the page, so the path follows whatever base the site uses. */
const BRIDGE_URL = 'engine/craft_bridge.js';

const unavailable = (detail: string): EngineUnavailable => ({ kind: 'engine-unavailable', detail });

const messageOf = (cause: unknown): string =>
  cause instanceof Error ? cause.message : typeof cause === 'string' ? cause : '알 수 없는 오류';

const readWarnings = (document_: BridgeDocument): readonly string[] => {
  try {
    const parsed: unknown = JSON.parse(document_.warnings_json());
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    // Warnings are commentary; losing them must not fail the import itself.
    return [];
  }
};

const wrap = (module: BridgeModule): CraftEngine => ({
  version: module.bridge_version(),

  sniffPptx: (bytes) => module.pptx_sniff(bytes),

  isPptxEncrypted: (bytes) => module.pptx_is_encrypted(bytes),

  openPptx: (bytes) => {
    // An unreadable package is a normal outcome for a file someone chose, so
    // the bridge's thrown error becomes a Result here.
    let handle: BridgeDocument;
    try {
      handle = module.PptxDocument.open(bytes);
    } catch (cause) {
      return err({ kind: 'import-failed', format: 'PPTX', detail: messageOf(cause) });
    }

    let model: unknown;
    try {
      model = JSON.parse(handle.model_json());
    } catch (cause) {
      handle.free();
      return err({ kind: 'import-failed', format: 'PPTX', detail: messageOf(cause) });
    }

    return ok({
      model,
      warnings: readWarnings(handle),
      mediaCount: handle.media_count(),
      mediaBytes: (index) => handle.media_bytes(index) ?? null,
      release: () => handle.free(),
    });
  },

  exportPptx: (presentationJson) => {
    try {
      return ok(module.pptx_export(presentationJson));
    } catch (cause) {
      return err({ kind: 'export-failed', format: 'PPTX', detail: messageOf(cause) });
    }
  },
});

const supportsContract = (version: string): boolean => {
  const [major, minor] = version.split('.').map((part) => Number.parseInt(part, 10));
  if (major === undefined || minor === undefined || Number.isNaN(major) || Number.isNaN(minor)) {
    return false;
  }
  return major === REQUIRED_MAJOR && minor >= REQUIRED_MINOR;
};

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

  const version = module.bridge_version();
  if (!supportsContract(version)) {
    // Refuse a mismatch outright rather than failing later on a changed shape.
    return err(unavailable(`엔진 버전 ${version}은(는) 이 빌드와 맞지 않습니다.`));
  }

  return ok(wrap(module));
};

/**
 * Load the engine once per page. The promise is cached including its failure,
 * so a build without an engine is not re-fetched on every import.
 */
export const loadCraftEngine = (): Promise<Result<CraftEngine, StudioError>> => {
  pending ??= start();
  return pending;
};

/** Forget the cached attempt. Exists for tests, not for callers. */
export const resetCraftEngine = (): void => {
  pending = null;
};
