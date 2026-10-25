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

// ----------------------------------------------------------------- PDF out

/// Collects page images and writes them as a real PDF.
///
/// DesignLab renders each page itself, so the pages arrive as PNG and the PDF
/// is assembled around them. `dpi` sizes the pages: PdfCraft never resamples,
/// it divides pixels by the resolution, so `scale * 96` turns one design pixel
/// into the 0.75 pt it represents at 96 dpi.
#[wasm_bindgen]
pub struct PdfBuilder {
    images: Vec<(String, Vec<u8>)>,
}

impl Default for PdfBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl PdfBuilder {
    #[wasm_bindgen(constructor)]
    pub fn new() -> PdfBuilder {
        PdfBuilder { images: Vec::new() }
    }

    pub fn add_page_png(&mut self, bytes: &[u8]) {
        let name = format!("page{}.png", self.images.len() + 1);
        self.images.push((name, bytes.to_vec()));
    }

    pub fn page_count(&self) -> usize {
        self.images.len()
    }

    pub fn finish(&self, dpi: f64) -> Result<Vec<u8>, JsError> {
        if self.images.is_empty() {
            return Err(JsError::new("pdf export: 페이지가 없습니다."));
        }
        let document = pdfcraft_create::from_images_with_resolution(
            &self.images,
            pdfcraft_create::ImageResolution::Dpi(dpi),
        )
        .map_err(|error| JsError::new(&format!("pdf create: {error}")))?;

        pdfcraft_cos::write_full(&document, &pdfcraft_cos::SaveOptions::default())
            .map_err(|error| JsError::new(&format!("pdf save: {error}")))
    }
}

// ------------------------------------------------------------------ PDF in

/// An opened PDF, kept here so pages can be rasterised one at a time.
#[wasm_bindgen]
pub struct PdfDocument {
    renderer: pdfcraft_render::PageRenderer,
}

#[wasm_bindgen]
impl PdfDocument {
    pub fn open(bytes: &[u8], password: Option<String>) -> Result<PdfDocument, JsError> {
        let config = pdfcraft_render::RenderConfig {
            password: password.map(std::sync::Arc::from),
            ..Default::default()
        };
        Ok(PdfDocument {
            renderer: pdfcraft_render::PageRenderer::new(
                std::sync::Arc::new(bytes.to_vec()),
                config,
            ),
        })
    }

    pub fn page_count(&self) -> usize {
        self.renderer.page_count()
    }

    /// One page as PNG, at `scale` device pixels per PDF point.
    pub fn render_page_png(&mut self, page: usize, scale: f32) -> Result<Vec<u8>, JsError> {
        // Every other field of the request is left at its default: a whole-page
        // raster, no tile, not a preview. A preview render skips small images
        // and must never be used for something the person keeps.
        let rendered = self.renderer.render(pdfcraft_render::RenderRequest {
            page,
            scale,
            ..Default::default()
        });

        if let Some(error) = rendered.error {
            return Err(JsError::new(&format!("pdf render: {error}")));
        }

        let words = rendered.rgba.into_words();
        let mut rgba = Vec::with_capacity(words.len() * 4);
        for word in words {
            // Little-endian words hold the bytes in memory order, which is RGBA.
            let [r, g, b, a] = word.to_le_bytes();
            match a {
                0 => rgba.extend_from_slice(&[0, 0, 0, 0]),
                255 => rgba.extend_from_slice(&[r, g, b, a]),
                // The renderer premultiplies; PNG and canvas do not.
                _ => {
                    let undo = |c: u8| ((u32::from(c) * 255) / u32::from(a)).min(255) as u8;
                    rgba.extend_from_slice(&[undo(r), undo(g), undo(b), a]);
                }
            }
        }

        let mut out = Vec::new();
        {
            let mut encoder = png::Encoder::new(&mut out, rendered.width, rendered.height);
            encoder.set_color(png::ColorType::Rgba);
            encoder.set_depth(png::BitDepth::Eight);
            let mut writer = encoder
                .write_header()
                .map_err(|error| JsError::new(&format!("png header: {error}")))?;
            writer
                .write_image_data(&rgba)
                .map_err(|error| JsError::new(&format!("png data: {error}")))?;
        }
        Ok(out)
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
