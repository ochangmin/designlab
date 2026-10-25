//! A narrow bridge between DesignLab and the ArtCraft format crates.
//!
//! The bridge deliberately does no translation. `deckcraft-model` derives serde
//! on its whole document model, so a presentation crosses the boundary as JSON
//! and the mapping between that model and DesignLab's own document lives in
//! TypeScript, where it can be unit-tested without a Rust toolchain and changed
//! without waiting for a WebAssembly build.
//!
//! What stays here is only what cannot be done in the browser: reading and
//! writing the Office Open XML package itself.

use wasm_bindgen::prelude::*;

/// Semantic version of this bridge's own contract, so the caller can refuse a
/// build it does not understand rather than failing on a shape mismatch.
#[wasm_bindgen]
pub fn bridge_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Whether the bytes look like a PresentationML package at all.
#[wasm_bindgen]
pub fn pptx_sniff(bytes: &[u8]) -> bool {
    deckcraft_pptx::sniff(bytes)
}

/// Whether the package is encrypted, which import cannot see through.
#[wasm_bindgen]
pub fn pptx_is_encrypted(bytes: &[u8]) -> bool {
    deckcraft_pptx::is_encrypted(bytes)
}

/// Read a `.pptx` into the DeckCraft model, as JSON.
///
/// Returns an envelope: `{ "presentation": …, "warnings": [...] }`. The
/// warnings are the parts the reader understood only partially; they are
/// reported rather than dropped, so the caller can tell the person what did not
/// survive instead of silently losing it.
#[wasm_bindgen]
pub fn pptx_import_json(bytes: &[u8]) -> Result<String, JsError> {
    let (presentation, warnings) = deckcraft_pptx::import_checked(bytes)
        .map_err(|error| JsError::new(&format!("pptx import: {error}")))?;

    let envelope = serde_json::json!({
        "presentation": presentation,
        "warnings": warnings,
    });

    serde_json::to_string(&envelope)
        .map_err(|error| JsError::new(&format!("pptx import encode: {error}")))
}

/// Write a DeckCraft presentation, given as JSON, back out as a `.pptx`.
#[wasm_bindgen]
pub fn pptx_export(presentation_json: &str) -> Result<Vec<u8>, JsError> {
    let presentation: deckcraft_model::Presentation = serde_json::from_str(presentation_json)
        .map_err(|error| JsError::new(&format!("pptx export decode: {error}")))?;

    deckcraft_pptx::export(&presentation)
        .map_err(|error| JsError::new(&format!("pptx export: {error}")))
}
