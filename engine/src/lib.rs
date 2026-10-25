//! A narrow bridge between DesignLab and the ArtCraft format crates.
//!
//! The bridge deliberately does almost no translation. `deckcraft-model`
//! derives serde across its whole document model, so a presentation crosses the
//! language boundary as JSON and the mapping between that model and DesignLab's
//! own document lives in TypeScript, where it can be unit-tested without a Rust
//! toolchain and changed without waiting for a WebAssembly build.
//!
//! The one thing JSON cannot carry is media. `MediaItem::data` is
//! `#[serde(skip)]` — the manifest names each image but not its bytes — so an
//! opened package is held here as a handle and the caller pulls the bytes it
//! needs. That also means a package is parsed once, not once per image.

use wasm_bindgen::prelude::*;

/// The bridge's own contract version, so the caller can refuse a build it does
/// not understand instead of failing on a shape mismatch.
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

/// An opened `.pptx`, kept on this side so its media can be read after the
/// model has crossed over as JSON.
#[wasm_bindgen]
pub struct PptxDocument {
    presentation: deckcraft_model::Presentation,
    warnings: Vec<String>,
}

#[wasm_bindgen]
impl PptxDocument {
    /// Read a package. Returns an error only when nothing could be read at all;
    /// partial understanding is reported through `warnings_json`.
    pub fn open(bytes: &[u8]) -> Result<PptxDocument, JsError> {
        let (presentation, warnings) = deckcraft_pptx::import_checked(bytes)
            .map_err(|error| JsError::new(&format!("pptx import: {error}")))?;
        Ok(PptxDocument {
            presentation,
            warnings,
        })
    }

    /// The document model as JSON. Field names are camelCase and enum variants
    /// are internally tagged with `type`.
    pub fn model_json(&self) -> Result<String, JsError> {
        serde_json::to_string(&self.presentation)
            .map_err(|error| JsError::new(&format!("pptx encode: {error}")))
    }

    /// Parts the reader understood only partially, as a JSON array of strings.
    /// Reported rather than dropped, so the caller can say what did not survive.
    pub fn warnings_json(&self) -> Result<String, JsError> {
        serde_json::to_string(&self.warnings)
            .map_err(|error| JsError::new(&format!("pptx warnings encode: {error}")))
    }

    /// How many media items the package carried.
    pub fn media_count(&self) -> usize {
        self.presentation.media.len()
    }

    /// The bytes of one media item, addressed by its position in the model's
    /// own `media` array, so the caller needs no knowledge of the id type.
    /// `None` for an out-of-range index or an item that is only a link.
    pub fn media_bytes(&self, index: usize) -> Option<Vec<u8>> {
        let item = self.presentation.media.get(index)?;
        if item.data.is_empty() {
            return None;
        }
        Some(item.data.as_ref().clone())
    }
}

/// Write a DeckCraft presentation, given as JSON, back out as a `.pptx`.
///
/// Media cannot travel in that JSON, so a presentation rebuilt from it carries
/// no images. Export is exposed for documents whose pictures the caller has not
/// changed; DesignLab's own writer remains the path for a design it rendered.
#[wasm_bindgen]
pub fn pptx_export(presentation_json: &str) -> Result<Vec<u8>, JsError> {
    let presentation: deckcraft_model::Presentation = serde_json::from_str(presentation_json)
        .map_err(|error| JsError::new(&format!("pptx export decode: {error}")))?;

    deckcraft_pptx::export(&presentation)
        .map_err(|error| JsError::new(&format!("pptx export: {error}")))
}
