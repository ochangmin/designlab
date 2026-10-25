/**
 * PowerPoint (.pptx) packaging.
 *
 * A slide is built from the same document the editor draws, split by z-order
 * into runs: everything that is not text is rasterised into a layer picture,
 * and each text element is emitted as a real PowerPoint text box between those
 * layers. So a deck opens with its headlines still editable, while gradients,
 * custom shape paths, image filters and shadows keep their exact appearance,
 * and a shape sitting above text stays above it.
 *
 * The author's own line breaks survive because each laid-out line becomes its
 * own paragraph; PowerPoint is never asked to re-wrap the text. What it will
 * do, unavoidably, is substitute any font the viewer's machine does not have.
 */

import { parseColor, toHex } from '../../domain/color.js';
import type { Design, DesignElement, Page, TextElement } from '../../domain/document.js';
import type { StudioError } from '../../domain/errors.js';
import { err, ok, type Result } from '../../domain/result.js';
import { layoutText, type MeasureText } from '../../domain/textLayout.js';
import { renderPageToCanvas } from './rasterRenderer.js';
import { createZip, type ZipEntry } from './zip.js';

/** English Metric Units per CSS pixel at 96 DPI. */
const EMU_PER_PX = 9525;
/** PowerPoint measures type in points; the document measures it in pixels. */
const PT_PER_PX = 0.75;

const emu = (px: number): number => Math.round(px * EMU_PER_PX);

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** DrawingML wants a bare six-digit hex; an unparseable colour falls back to ink. */
const hex = (color: string): string => {
  const parsed = parseColor(color);
  return (parsed === null ? '111827' : toHex(parsed).slice(1)).toUpperCase();
};

const alphaOf = (color: string, elementOpacity: number): number => {
  const parsed = parseColor(color);
  return Math.max(0, Math.min(1, (parsed?.a ?? 1) * elementOpacity));
};

const DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';

const encoder = new TextEncoder();
const textEntry = (path: string, xml: string): ZipEntry => ({ path, data: encoder.encode(xml) });

// ------------------------------------------------------------ fixed parts

const THEME = `${DECLARATION}
<a:theme xmlns:a="${NS_A}" name="DesignLab">
<a:themeElements>
<a:clrScheme name="DesignLab">
<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
<a:dk2><a:srgbClr val="0B1021"/></a:dk2>
<a:lt2><a:srgbClr val="F4F5FF"/></a:lt2>
<a:accent1><a:srgbClr val="6D5EFC"/></a:accent1>
<a:accent2><a:srgbClr val="F472B6"/></a:accent2>
<a:accent3><a:srgbClr val="FACC15"/></a:accent3>
<a:accent4><a:srgbClr val="13A3B5"/></a:accent4>
<a:accent5><a:srgbClr val="3F9A6A"/></a:accent5>
<a:accent6><a:srgbClr val="FF9F68"/></a:accent6>
<a:hlink><a:srgbClr val="6D5EFC"/></a:hlink>
<a:folHlink><a:srgbClr val="8A8A93"/></a:folHlink>
</a:clrScheme>
<a:fontScheme name="DesignLab">
<a:majorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
<a:minorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
</a:fontScheme>
<a:fmtScheme name="DesignLab">
<a:fillStyleLst>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
</a:fillStyleLst>
<a:lnStyleLst>
<a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
<a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
<a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
</a:lnStyleLst>
<a:effectStyleLst>
<a:effectStyle><a:effectLst/></a:effectStyle>
<a:effectStyle><a:effectLst/></a:effectStyle>
<a:effectStyle><a:effectLst/></a:effectStyle>
</a:effectStyleLst>
<a:bgFillStyleLst>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
</a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements>
<a:objectDefaults/>
<a:extraClrSchemeLst/>
</a:theme>`;

const EMPTY_TREE =
  '<p:spTree>' +
  '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
  '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
  '</p:spTree>';

const SLIDE_MASTER = `${DECLARATION}
<p:sldMaster xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}">
<p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="lt1"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>${EMPTY_TREE}</p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;

const SLIDE_MASTER_RELS = `${DECLARATION}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="${NS_R}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="${NS_R}/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

const SLIDE_LAYOUT = `${DECLARATION}
<p:sldLayout xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}" type="blank" preserve="1">
<p:cSld name="Blank">${EMPTY_TREE}</p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;

const SLIDE_LAYOUT_RELS = `${DECLARATION}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="${NS_R}/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

const ROOT_RELS = `${DECLARATION}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="${NS_R}/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`;

// ------------------------------------------------------------ slide shapes

interface SlideMedia {
  readonly path: string;
  readonly data: Uint8Array;
}

const pictureShape = (
  id: number,
  name: string,
  relationshipId: string,
  width: number,
  height: number,
): string =>
  '<p:pic>' +
  `<p:nvPicPr><p:cNvPr id="${id}" name="${escapeXml(name)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>` +
  `<p:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>` +
  `<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu(width)}" cy="${emu(height)}"/></a:xfrm>` +
  '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>' +
  '</p:pic>';

const textShape = (id: number, element: TextElement, measure: MeasureText): string => {
  const font = {
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    italic: element.italic,
    letterSpacing: element.letterSpacing,
    lineHeight: element.lineHeight,
  };
  const content = element.uppercase ? element.text.toLocaleUpperCase() : element.text;
  const lines = layoutText(content, element.width, font, measure).lines;

  const alpha = alphaOf(element.color, element.opacity);
  const fill =
    `<a:solidFill><a:srgbClr val="${hex(element.color)}">` +
    (alpha >= 1 ? '' : `<a:alpha val="${Math.round(alpha * 100000)}"/>`) +
    '</a:srgbClr></a:solidFill>';

  const runProperties =
    `lang="ko-KR" sz="${Math.max(100, Math.round(element.fontSize * PT_PER_PX * 100))}" ` +
    `b="${element.fontWeight >= 600 ? 1 : 0}" i="${element.italic ? 1 : 0}" ` +
    `u="${element.underline ? 'sng' : 'none'}" ` +
    `spc="${Math.round(element.letterSpacing * PT_PER_PX * 100)}" dirty="0"`;
  const typeface =
    `<a:latin typeface="${escapeXml(element.fontFamily)}"/>` +
    `<a:ea typeface="${escapeXml(element.fontFamily)}"/>` +
    `<a:cs typeface="${escapeXml(element.fontFamily)}"/>`;

  const align = element.align === 'center' ? 'ctr' : element.align === 'right' ? 'r' : 'l';
  const paragraphProperties =
    `<a:pPr algn="${align}"><a:lnSpc><a:spcPct val="${Math.round(element.lineHeight * 100000)}"/></a:lnSpc></a:pPr>`;

  // One paragraph per laid-out line keeps the breaks the author saw.
  const paragraphs = lines
    .map((line) =>
      line === ''
        ? `<a:p>${paragraphProperties}<a:endParaRPr ${runProperties}>${fill}${typeface}</a:endParaRPr></a:p>`
        : `<a:p>${paragraphProperties}<a:r><a:rPr ${runProperties}>${fill}${typeface}</a:rPr><a:t>${escapeXml(line)}</a:t></a:r></a:p>`,
    )
    .join('');

  const rotation = element.rotation === 0 ? '' : ` rot="${Math.round(element.rotation * 60000)}"`;

  return (
    '<p:sp>' +
    `<p:nvSpPr><p:cNvPr id="${id}" name="${escapeXml(element.name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>` +
    `<p:spPr><a:xfrm${rotation}><a:off x="${emu(element.x)}" y="${emu(element.y)}"/>` +
    `<a:ext cx="${emu(element.width)}" cy="${emu(element.height)}"/></a:xfrm>` +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>' +
    '<p:txBody>' +
    '<a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"><a:noAutofit/></a:bodyPr>' +
    '<a:lstStyle/>' +
    (paragraphs === '' ? '<a:p/>' : paragraphs) +
    '</p:txBody>' +
    '</p:sp>'
  );
};

const slideDocument = (shapes: string): string =>
  `${DECLARATION}
<p:sld xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}">
<p:cSld><p:spTree>` +
  '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>' +
  '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>' +
  `${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;

// ------------------------------------------------------------------ build

const canvasToPng = async (canvas: HTMLCanvasElement): Promise<Uint8Array | null> => {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/png', 1);
  });
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
};

/** Consecutive non-text elements form one rasterised layer. */
type Run = { readonly kind: 'art'; readonly elements: readonly DesignElement[] } | { readonly kind: 'text'; readonly element: TextElement };

const runsOf = (page: Page): readonly Run[] => {
  const runs: Run[] = [];
  let art: DesignElement[] = [];
  const flush = (): void => {
    if (art.length > 0) {
      runs.push({ kind: 'art', elements: art });
      art = [];
    }
  };
  for (const element of page.elements) {
    if (element.hidden) continue;
    if (element.type === 'text') {
      flush();
      runs.push({ kind: 'text', element });
      continue;
    }
    art.push(element);
  }
  flush();
  return runs;
};

export interface PptxRequest {
  readonly design: Design;
  readonly measure: MeasureText;
  /** Multiplier for the rasterised layers. 2 keeps the artwork crisp on screen. */
  readonly scale: number;
}

export const buildPptx = async (request: PptxRequest): Promise<Result<Uint8Array, StudioError>> => {
  const { design, measure, scale } = request;
  const parts: ZipEntry[] = [];
  const slideOverrides: string[] = [];
  const presentationRelationships: string[] = [
    `<Relationship Id="rId1" Type="${NS_R}/slideMaster" Target="slideMasters/slideMaster1.xml"/>`,
  ];
  const slideIds: string[] = [];

  for (const [index, page] of design.pages.entries()) {
    const slideNumber = index + 1;
    const media: SlideMedia[] = [];
    const shapes: string[] = [];
    const relationships: string[] = [
      `<Relationship Id="rId1" Type="${NS_R}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>`,
    ];
    let shapeId = 2;

    const addLayer = async (
      elements: readonly DesignElement[],
      paintBackground: boolean,
      name: string,
    ): Promise<StudioError | null> => {
      const rendered = await renderPageToCanvas(design, page, measure, {
        scale,
        elements,
        paintBackground,
      });
      if (!rendered.ok) return rendered.error;
      const png = await canvasToPng(rendered.value);
      if (png === null) {
        return { kind: 'export-failed', format: 'PPTX', detail: `${name} 레이어를 인코딩하지 못했습니다.` };
      }
      const mediaNumber = media.length + 1;
      const fileName = `image${slideNumber}_${mediaNumber}.png`;
      media.push({ path: `ppt/media/${fileName}`, data: png });
      const relationshipId = `rId${relationships.length + 1}`;
      relationships.push(
        `<Relationship Id="${relationshipId}" Type="${NS_R}/image" Target="../media/${fileName}"/>`,
      );
      shapes.push(pictureShape(shapeId, name, relationshipId, design.width, design.height));
      shapeId += 1;
      return null;
    };

    // The page background is always its own layer, so the slide has an opaque
    // base even when every element above it is transparent.
    const backgroundFailure = await addLayer([], true, '배경');
    if (backgroundFailure) return err(backgroundFailure);

    for (const run of runsOf(page)) {
      if (run.kind === 'art') {
        const failure = await addLayer(run.elements, false, '그래픽 레이어');
        if (failure) return err(failure);
        continue;
      }
      shapes.push(textShape(shapeId, run.element, measure));
      shapeId += 1;
    }

    for (const item of media) parts.push({ path: item.path, data: item.data });
    parts.push(textEntry(`ppt/slides/slide${slideNumber}.xml`, slideDocument(shapes.join(''))));
    parts.push(
      textEntry(
        `ppt/slides/_rels/slide${slideNumber}.xml.rels`,
        `${DECLARATION}\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join('')}</Relationships>`,
      ),
    );

    slideOverrides.push(
      `<Override PartName="/ppt/slides/slide${slideNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
    );
    const presentationRelationshipId = `rId${slideNumber + 1}`;
    presentationRelationships.push(
      `<Relationship Id="${presentationRelationshipId}" Type="${NS_R}/slide" Target="slides/slide${slideNumber}.xml"/>`,
    );
    slideIds.push(`<p:sldId id="${255 + slideNumber}" r:id="${presentationRelationshipId}"/>`);
  }

  const presentation =
    `${DECLARATION}
<p:presentation xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}" saveSubsetFonts="1">` +
    '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' +
    `<p:sldIdLst>${slideIds.join('')}</p:sldIdLst>` +
    `<p:sldSz cx="${emu(design.width)}" cy="${emu(design.height)}"/>` +
    `<p:notesSz cx="${emu(design.width)}" cy="${emu(design.height)}"/>` +
    '</p:presentation>';

  const contentTypes =
    `${DECLARATION}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Default Extension="png" ContentType="image/png"/>' +
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' +
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>' +
    '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' +
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>' +
    `${slideOverrides.join('')}</Types>`;

  const archive: ZipEntry[] = [
    textEntry('[Content_Types].xml', contentTypes),
    textEntry('_rels/.rels', ROOT_RELS),
    textEntry('ppt/presentation.xml', presentation),
    textEntry(
      'ppt/_rels/presentation.xml.rels',
      `${DECLARATION}\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${presentationRelationships.join('')}</Relationships>`,
    ),
    textEntry('ppt/slideMasters/slideMaster1.xml', SLIDE_MASTER),
    textEntry('ppt/slideMasters/_rels/slideMaster1.xml.rels', SLIDE_MASTER_RELS),
    textEntry('ppt/slideLayouts/slideLayout1.xml', SLIDE_LAYOUT),
    textEntry('ppt/slideLayouts/_rels/slideLayout1.xml.rels', SLIDE_LAYOUT_RELS),
    textEntry('ppt/theme/theme1.xml', THEME),
    ...parts,
  ];

  return ok(createZip(archive));
};
