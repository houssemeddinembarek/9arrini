// ─── Paper themes ────────────────────────────────────────────────────────────
// A theme is the ink and paper of a printed document: colours, fonts, page
// geometry. Templates (see ./templates.ts) pick a theme and layer their own
// body rules on top. Everything is expressed in print units (pt / cm) so the
// on-screen A4 preview and the sheet coming out of the printer agree.

export type DocTheme = {
  /** Brand colour: rules, seal, section titles */
  accent: string;
  /** Darker variant, used for the title band text */
  accentDark: string;
  /** Very light fill behind the seal and the title band */
  accentSoft: string;
  /** Body text colour */
  ink: string;
  /** Secondary text: field labels, footer */
  muted: string;
  /** Frame and table borders */
  border: string;
  bodyFont: string;
  /** Font of the title band, seal and section headings */
  displayFont: string;
  /** Body size, e.g. "12pt" */
  baseSize: string;
  lineHeight: string;
  /** Padding of the sheet in the on-screen A4 preview, e.g. "2cm 2cm 2.5cm" */
  pagePadding: string;
  /** @page margin — the printer's own hard margin */
  printMargin: string;
  /**
   * Body padding when printing. The printer adds `printMargin` on top of it,
   * so this is `pagePadding` minus that margin — the sheet then has the same
   * geometry on paper as in the preview.
   */
  printPadding: string;
};

const TIMES = "'Times New Roman', Times, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF_DISPLAY = "Georgia, 'Times New Roman', serif";

/** Telmidhi purple on cream — the house style. */
export const THEME_OFFICIEL: DocTheme = {
  accent: "#7c3aed",
  accentDark: "#4c1d95",
  accentSoft: "#faf5ff",
  ink: "#0f172a",
  muted: "#475569",
  border: "#0f172a",
  bodyFont: TIMES,
  displayFont: SERIF_DISPLAY,
  baseSize: "12pt",
  lineHeight: "1.7",
  pagePadding: "2cm 2cm 2.5cm",
  printMargin: "1cm",
  printPadding: "1cm 1cm 1.5cm",
};

/** Pure black on white: no fills, no tints — survives a school photocopier. */
export const THEME_SOBRE: DocTheme = {
  accent: "#000000",
  accentDark: "#000000",
  accentSoft: "#ffffff",
  ink: "#000000",
  muted: "#333333",
  border: "#000000",
  bodyFont: TIMES,
  displayFont: TIMES,
  baseSize: "12pt",
  lineHeight: "1.65",
  pagePadding: "2cm",
  printMargin: "1.2cm",
  printPadding: "0.8cm",
};

/** Sans-serif, indigo, airy — for course notes read on a screen. */
export const THEME_MODERNE: DocTheme = {
  accent: "#4f46e5",
  accentDark: "#312e81",
  accentSoft: "#eef2ff",
  ink: "#111827",
  muted: "#4b5563",
  border: "#1f2937",
  bodyFont: SANS,
  displayFont: SANS,
  baseSize: "11.5pt",
  lineHeight: "1.75",
  pagePadding: "2cm 2.2cm 2.5cm",
  printMargin: "1cm",
  printPadding: "1cm 1.2cm 1.5cm",
};

/** Dense two-column revision sheet: small type, tight leading. */
export const THEME_FICHE: DocTheme = {
  accent: "#0d9488",
  accentDark: "#134e4a",
  accentSoft: "#f0fdfa",
  ink: "#0f172a",
  muted: "#475569",
  border: "#0f172a",
  bodyFont: SANS,
  displayFont: SANS,
  baseSize: "10pt",
  lineHeight: "1.5",
  pagePadding: "1.4cm 1.4cm 1.8cm",
  printMargin: "0.8cm",
  printPadding: "0.6cm 0.6cm 1cm",
};

/** Red-marked answer key — never handed to a pupil by accident. */
export const THEME_CORRIGE: DocTheme = {
  accent: "#b91c1c",
  accentDark: "#7f1d1d",
  accentSoft: "#fef2f2",
  ink: "#0f172a",
  muted: "#57534e",
  border: "#0f172a",
  bodyFont: TIMES,
  displayFont: SERIF_DISPLAY,
  baseSize: "12pt",
  lineHeight: "1.7",
  pagePadding: "2cm 2cm 2.5cm",
  printMargin: "1cm",
  printPadding: "1cm 1cm 1.5cm",
};
