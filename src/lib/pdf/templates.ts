// ─── PDF templates ───────────────────────────────────────────────────────────
// A template is the paper an AI-generated document gets printed on: theme,
// seal, watermark, page geometry and body typography. The generator writes the
// content once; the teacher picks the template that suits how the sheet will be
// used — handed out as an exam, photocopied, revised from, or kept as a key.

import {
  DocTheme,
  THEME_CORRIGE, THEME_FICHE, THEME_MODERNE, THEME_OFFICIEL, THEME_SOBRE,
} from "./theme";

export type TemplateId = "officiel" | "sobre" | "moderne" | "fiche" | "corrige";

export type PdfTemplate = {
  id: TemplateId;
  label: string;
  /** One line shown in the template picker */
  description: string;
  theme: DocTheme;
  /** Word stamped above the title in the header band */
  banner?: string;
  /** Diagonal page watermark; null = none (and no wasted toner) */
  watermark: string | null;
  /** Body columns — 2 turns the sheet into a dense revision card */
  columns: 1 | 2;
  /** Force the pupil identity + note row regardless of content type */
  showStudentRow?: boolean;
  /** Content types this template was designed for */
  bestFor: string[];
  /** Extra rules appended after the shared body CSS */
  extraCSS: string;
};

/**
 * Typography shared by every template, parameterised by the theme.
 * Covers the markup the generator emits: headings, lists, blockquotes,
 * LaTeX blocks, tables and the `doc-*` blocks of a structured paper.
 */
function baseBodyCSS(t: DocTheme): string {
  return `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:${t.bodyFont};font-size:${t.baseSize};color:${t.ink};
  padding:${t.pagePadding};line-height:${t.lineHeight};position:relative;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
#content{position:relative;z-index:1}
h1{font-family:${t.displayFont};font-size:15pt;margin:16px 0 8px;color:${t.accentDark}}
h2{font-family:${t.displayFont};font-size:13pt;margin:14px 0 7px;color:${t.accentDark};
  border-bottom:1px solid ${t.border};padding-bottom:3px;break-after:avoid;page-break-after:avoid}
h3{font-family:${t.displayFont};font-size:12pt;margin:10px 0 5px;color:${t.ink};
  break-after:avoid;page-break-after:avoid}
h4{font-size:11pt;margin:8px 0 4px}
p,li{margin:5px 0}
ul,ol{margin:5px 0 5px 20px}
ul{list-style:disc}ol{list-style:decimal}
blockquote{border-left:3px solid ${t.accent};margin:8px 0;padding:6px 10px;color:${t.muted};
  font-style:italic;background:${t.accentSoft};border-radius:0 4px 4px 0;
  break-inside:avoid;page-break-inside:avoid}
code{font-family:'Courier New',monospace;background:#f5f5f5;padding:1px 3px;font-size:10pt}
strong{font-weight:bold}
hr{border:none;border-top:1px solid ${t.muted};margin:12px 0}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:10.5pt;
  break-inside:avoid;page-break-inside:avoid}
th,td{border:1px solid ${t.border};padding:5px 7px;text-align:left}
th{background:${t.accentSoft};font-weight:700}
img{max-width:100%}
/* Maths are written in Latin notation and read left-to-right, even inside an
   Arabic paragraph: without this isolation the bidi algorithm lays KaTeX's
   spans right-to-left and the formula comes out mirrored. */
.katex,.katex-display{direction:ltr;unicode-bidi:isolate}
/* A line that is only a formula sits on the left, as on a French paper */
.math-line{direction:ltr;unicode-bidi:isolate;text-align:left}
[dir="rtl"] ol.math-list,[dir="rtl"] ul.math-list{direction:ltr;text-align:left;margin:5px 0 5px 20px}
.katex-display{margin:8px 0;overflow-x:hidden;text-align:center}
[dir="rtl"] .katex-display>.katex{text-align:center}

/* QCM: the choices of one question, aligned on a single row under it */
.qcm-choices{display:flex;flex-wrap:wrap;gap:6px 18px;margin:2px 0 7px;
  break-inside:avoid;page-break-inside:avoid}
.qcm-choice{display:flex;align-items:center;gap:6px;min-width:26%}
.qcm-box{display:inline-block;width:13px;height:13px;flex:0 0 13px;
  border:1.2px solid ${t.ink};background:#fff;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
ol + .qcm-choices{margin-top:0}
.qcm-choices + ol{margin-top:4px}

/* Ruled space for the pupil's answer, on papers filled in on the sheet */
.answer-lines{margin:4px 0 8px;break-inside:avoid;page-break-inside:avoid}
.answer-line{height:0.85cm;border-bottom:1px dotted ${t.muted}}

/* Structured papers: one exercise (or one correction) per block */
.doc-exercise{margin:14px 0;break-inside:avoid;page-break-inside:avoid}
.doc-points{font-weight:normal;color:${t.muted};font-size:10.5pt}
.doc-correction{margin:14px 0;break-inside:avoid;page-break-inside:avoid}
.doc-break{break-before:page;page-break-before:always;border:none;margin:0}

.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);
  font-family:${t.displayFont};font-size:80pt;font-weight:900;letter-spacing:6px;
  color:${t.accent};opacity:.06;pointer-events:none;z-index:0;white-space:nowrap}
.footer{margin-top:28px;font-size:9pt;color:${t.muted};text-align:center;
  border-top:1px solid ${t.border};padding-top:6px;
  display:flex;justify-content:space-between;align-items:center;gap:10px}
.footer .stamp-id{font-family:'Courier New',monospace;font-size:8pt;color:${t.accent};font-weight:600}

html[dir="rtl"] body,html[dir="rtl"] .dh-grid td{font-family:'Geeza Pro','Traditional Arabic','Sakkal Majalla','Segoe UI',${t.bodyFont}}
[dir="rtl"] #content{text-align:right}
[dir="rtl"] ul,[dir="rtl"] ol{margin:5px 20px 5px 0}
[dir="rtl"] blockquote{border-left:none;border-right:3px solid ${t.accent};border-radius:4px 0 0 4px}
[dir="rtl"] th,[dir="rtl"] td{text-align:right}

@media print{
  body{padding:${t.printPadding}}
  .watermark{position:fixed}
  @page{margin:${t.printMargin}}
}
`;
}

export const PDF_TEMPLATES: PdfTemplate[] = [
  {
    id: "officiel",
    label: "Officiel",
    description: "Cachet, filigrane et bandeau violet — le devoir tel qu'il est remis à l'élève.",
    theme: THEME_OFFICIEL,
    watermark: "TELMIDHI",
    columns: 1,
    bestFor: ["devoir_controle", "devoir_synthese", "exercices"],
    extraCSS: `
h1{text-decoration:underline}
`,
  },
  {
    id: "sobre",
    label: "Sobre (photocopie)",
    description: "Noir et blanc, sans aplat ni filigrane — lisible après photocopie, économe en encre.",
    theme: THEME_SOBRE,
    watermark: null,
    columns: 1,
    bestFor: ["devoir_controle", "devoir_synthese", "exercices"],
    extraCSS: `
h1{text-decoration:underline}
h2{border-bottom-width:1.5px}
blockquote{background:none;border-left-width:2px}
th{background:none;text-decoration:underline}
.dh-accent{background:${THEME_SOBRE.ink} !important}
.dh-banner{background:none !important;color:${THEME_SOBRE.ink} !important}
`,
  },
  {
    id: "moderne",
    label: "Moderne",
    description: "Sans-serif indigo, titres colorés et interligne aéré — pour les cours et résumés.",
    theme: THEME_MODERNE,
    watermark: null,
    columns: 1,
    bestFor: ["resume", "fiche_revision"],
    extraCSS: `
h2{border-bottom:none;background:${THEME_MODERNE.accentSoft};color:${THEME_MODERNE.accentDark};
  padding:6px 10px;border-radius:5px;border-left:4px solid ${THEME_MODERNE.accent}}
[dir="rtl"] h2{border-left:none;border-right:4px solid ${THEME_MODERNE.accent}}
h3{color:${THEME_MODERNE.accent};letter-spacing:.2px}
blockquote{border-radius:6px;border-left-width:4px}
.doc-exercise{border:1px solid #e5e7eb;border-radius:7px;padding:10px 12px;background:#fcfcff}
.footer{border-top-color:#e5e7eb}
`,
  },
  {
    id: "fiche",
    label: "Fiche de révision",
    description: "Deux colonnes compactes, sans cachet — tient sur une page à réviser avant le devoir.",
    theme: THEME_FICHE,
    watermark: null,
    columns: 2,
    showStudentRow: false,
    bestFor: ["fiche_revision", "resume"],
    extraCSS: `
#content{column-count:2;column-gap:0.9cm;column-rule:1px solid #cbd5e1}
#content > h2:first-child{margin-top:0}
h1,h2,h3,h4{break-after:avoid;page-break-after:avoid}
h2{font-size:11.5pt;background:${THEME_FICHE.accentSoft};border-bottom:none;
  border-left:3px solid ${THEME_FICHE.accent};padding:4px 7px;border-radius:4px}
[dir="rtl"] h2{border-left:none;border-right:3px solid ${THEME_FICHE.accent}}
h3{font-size:10.5pt;color:${THEME_FICHE.accentDark}}
blockquote{font-size:9.5pt;padding:5px 8px}
table{font-size:9pt}
.doc-exercise,.doc-correction,blockquote,table{break-inside:avoid;page-break-inside:avoid}
/* A forced page break would break the column flow — keep the sheet continuous. */
.doc-break{break-before:auto;page-break-before:auto;border-top:1px solid ${THEME_FICHE.muted};margin:10px 0}
.dh-frame,.footer{column-span:all}
`,
  },
  {
    id: "corrige",
    label: "Corrigé",
    description: "Bandeau et filigrane « CORRIGÉ » en rouge — la copie du professeur, impossible à confondre.",
    theme: THEME_CORRIGE,
    banner: "Corrigé",
    watermark: "CORRIGÉ",
    columns: 1,
    showStudentRow: false,
    bestFor: ["devoir_controle", "devoir_synthese", "exercices"],
    extraCSS: `
h1{text-decoration:underline}
.doc-correction{border-left:3px solid ${THEME_CORRIGE.accent};padding:2px 0 2px 10px;background:${THEME_CORRIGE.accentSoft}}
.doc-correction > h3{color:${THEME_CORRIGE.accentDark}}
[dir="rtl"] .doc-correction{border-left:none;border-right:3px solid ${THEME_CORRIGE.accent};padding:2px 10px 2px 0}
.watermark{opacity:.07}
`,
  },
];

export const DEFAULT_TEMPLATE_ID: TemplateId = "officiel";

export function getTemplate(id?: string | null): PdfTemplate {
  return PDF_TEMPLATES.find((t) => t.id === id) ?? PDF_TEMPLATES[0];
}

/** The template a given document type opens with. */
export function defaultTemplateFor(contentType?: string | null): PdfTemplate {
  switch (contentType) {
    case "resume":
      return getTemplate("moderne");
    case "fiche_revision":
      return getTemplate("fiche");
    default:
      return getTemplate(DEFAULT_TEMPLATE_ID);
  }
}

/** Templates offered first for a document type, the rest keeping their order. */
export function templatesFor(contentType?: string | null): PdfTemplate[] {
  if (!contentType) return PDF_TEMPLATES;
  const suited = PDF_TEMPLATES.filter((t) => t.bestFor.includes(contentType));
  return [...suited, ...PDF_TEMPLATES.filter((t) => !suited.includes(t))];
}

/** Full body stylesheet for a template: shared rules then its own. */
export function templateBodyCSS(template: PdfTemplate): string {
  return baseBodyCSS(template.theme) + template.extraCSS;
}

/**
 * Overrides that carry a template's identity into the on-screen A4 preview.
 * The preview markup is React (hover-refine blocks), so it keeps its own
 * `paper-*` classes and only the theme-dependent rules are re-declared here,
 * scoped to the sheet so nothing leaks into the dashboard around it.
 */
export function templatePreviewCSS(template: PdfTemplate, scope = ".paper-page"): string {
  const t = template.theme;
  return `
${scope}{font-family:${t.bodyFont};font-size:${t.baseSize};line-height:${t.lineHeight};color:${t.ink}}
${scope} .paper-section-title{font-family:${t.displayFont};color:${t.accentDark};border-bottom-color:${t.border}}
${scope} .paper-heading{font-family:${t.displayFont};color:${t.ink}}
${scope} .paper-prose h1{font-family:${t.displayFont};color:${t.accentDark}}
${scope} .paper-prose h2{font-family:${t.displayFont};color:${t.accentDark};border-bottom-color:${t.border}}
${scope} .paper-prose h3{font-family:${t.displayFont};color:${t.ink}}
${scope} .paper-prose blockquote{border-left-color:${t.accent};background:${t.accentSoft};color:${t.muted}}
${scope} .paper-prose th{background:${t.accentSoft}}
${scope} .paper-watermark{font-family:${t.displayFont};color:${t.accent}}
${scope} .katex,${scope} .katex-display{direction:ltr;unicode-bidi:isolate}
${scope} .math-line{direction:ltr;unicode-bidi:isolate;text-align:left}
${scope} [dir="rtl"] ol.math-list,${scope} [dir="rtl"] ul.math-list{direction:ltr;text-align:left;margin:5px 0 5px 20px}
${scope} .qcm-choices{display:flex;flex-wrap:wrap;gap:6px 18px;margin:2px 0 7px}
${scope} .qcm-choice{display:flex;align-items:center;gap:6px;min-width:26%}
${scope} .answer-lines{margin:4px 0 8px}
${scope} .answer-line{height:0.85cm;border-bottom:1px dotted ${t.muted}}
${scope} .qcm-box{display:inline-block;width:13px;height:13px;flex:0 0 13px;border:1.2px solid ${t.ink};background:#fff}
${template.columns === 2 ? `${scope} .paper-body{column-count:2;column-gap:0.9cm;column-rule:1px solid #cbd5e1}
${scope} .paper-body > *{break-inside:avoid}` : ""}
`;
}
