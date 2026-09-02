// ─── Shared "en-tête" for generated PDF documents ────────────────────────────
// Used by the AI content generator (preview + print) and the content viewer,
// so the paper on screen is byte-for-byte the paper that comes out of the printer.
// Colours and fonts come from the active template's theme (see ./theme.ts).

import { Lang } from "@/lib/teaching-language";
import { DocTheme, THEME_OFFICIEL } from "./theme";
import {
  HeaderLang, durationLabel, formatDate, headerLabels, headerLang,
  levelLabel, paperNumberOf, schoolYear, subjectLabel, trimesterLabel, typeLabel,
} from "./i18n";

/** CSS for the header. Class names are `dh-*` prefixed so they never clash. */
export function docHeaderCSS(theme: DocTheme = THEME_OFFICIEL): string {
  return `
.dh-frame{border:1.2px solid ${theme.border};margin-bottom:12px;background:#fff;position:relative;z-index:1;
  page-break-inside:avoid;break-inside:avoid;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.dh-accent{height:3px;background:${theme.accent}}
.dh-grid{width:100%;border-collapse:collapse;table-layout:fixed}
.dh-grid td{border:1px solid ${theme.border};padding:5px 8px;vertical-align:middle;font-size:8.5pt;
  font-family:${theme.bodyFont};color:${theme.ink}}
.dh-grid tr:first-child td{border-top:none}
.dh-grid td:first-child{border-left:none}
.dh-grid td:last-child{border-right:none}
.dh-grid tr:last-child td{border-bottom:none}
.dh-side{width:27%}
.dh-field{display:flex;align-items:baseline;gap:5px;margin:2px 0;line-height:1.25}
.dh-field:first-child{margin-top:0}
.dh-field:last-child{margin-bottom:0}
.dh-label{font-size:7pt;letter-spacing:.4px;text-transform:uppercase;color:${theme.muted};white-space:nowrap}
.dh-value{flex:1;min-width:0;font-weight:700;font-size:8.5pt}
.dh-fill{flex:1;min-width:36px;border-bottom:1px dotted ${theme.muted};transform:translateY(-2px)}
.dh-title-cell{background:${theme.accentSoft};text-align:center;padding:6px 10px !important}
.dh-type{font-size:11.5pt;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${theme.accentDark};
  line-height:1.15;font-family:${theme.displayFont}}
.dh-banner{display:inline-block;margin-bottom:3px;padding:1px 8px;border-radius:2px;background:${theme.accent};
  color:#fff;font-size:7.5pt;font-weight:800;letter-spacing:2px;text-transform:uppercase;
  font-family:${theme.displayFont};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.dh-meta{font-size:8.5pt;color:${theme.muted};margin-top:1px}
.dh-exam-cell{text-align:left}
.dh-note-cell{width:27%;text-align:center;background:${theme.accentSoft};font-weight:700;font-size:9pt}
.dh-note-cell .dh-note-box{display:inline-block;min-width:52px;border-bottom:1.2px solid ${theme.ink};margin:0 4px}
/* Arabic papers: the whole frame flows right-to-left, letters keep their size */
.dh-frame[dir="rtl"] .dh-label{text-transform:none;letter-spacing:0;font-size:7.5pt}
.dh-frame[dir="rtl"] .dh-type{letter-spacing:0;font-size:13pt}
.dh-frame[dir="rtl"] .dh-exam-cell{text-align:right}
`;
}

/** Default-theme header CSS, kept as a constant for existing callers. */
export const DOC_HEADER_CSS = docHeaderCSS(THEME_OFFICIEL);

const GRADED = new Set(["devoir_controle", "devoir_synthese", "exercices"]);

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type DocHeaderInfo = {
  /** Raw content type id — drives the printed type label, durée and note row */
  contentType?: string;
  /** Overrides the type label (rarely needed; the label is derived from the type) */
  typeLabel?: string;
  subject: string;
  level: string;
  /** Chapter covered. Names the print window (and so the saved file), but is
   *  deliberately NOT printed on the paper: the pupil shouldn't be told which
   *  chapter the devoir covers. */
  title: string;
  /** Reference stamp, printed in the footer — kept here for callers that pass it */
  stampId?: string;
  establishment?: string;
  teacher?: string;
  date?: Date;
  /** Language the document is written in — the header follows it */
  lang?: Lang | string;
  /** Which devoir de contrôle of the trimestre: 1 or 2 */
  devoirNumber?: number;
  /** Trimestre the paper belongs to: 1, 2 or 3 */
  trimester?: number;
  /** Word stamped above the title, e.g. "Corrigé" */
  banner?: string;
  /** Force the pupil identity + note row on or off (defaults to the type) */
  showStudentRow?: boolean;
};

/**
 * The header, on two rows and nothing more:
 *   row 1 — establishment / teacher / subject | title band | year / date / durée
 *   row 2 — pupil name | note box   (graded papers only)
 * An Arabic document gets an Arabic, right-to-left header: same grid, same
 * information, the wording of a real Tunisian paper.
 */
export function buildDocHeader(info: DocHeaderInfo): string {
  const lg: HeaderLang = headerLang(info.lang);
  const L = headerLabels(lg);
  const rtl = lg === "ar";
  const now = info.date ?? new Date();
  const duration = durationLabel(info.contentType, lg);
  const paperNo = paperNumberOf(info.contentType ?? "", info.devoirNumber, info.trimester);
  const trimester = trimesterLabel(info.trimester, lg);
  const graded = info.showStudentRow ?? (info.contentType ? GRADED.has(info.contentType) : false);

  const field = (label: string, value?: string) =>
    `<span class="dh-field"><span class="dh-label">${esc(label)}</span>` +
    (value
      ? `<span class="dh-value">${esc(value)}</span>`
      : `<span class="dh-fill"></span>`) +
    `</span>`;

  const identity = `<td class="dh-side">
          ${field(L.establishment, info.establishment)}
          ${field(L.teacher, info.teacher)}
          ${field(L.subject, subjectLabel(info.subject, lg))}
        </td>`;

  const schedule = `<td class="dh-side">
          ${field(L.schoolYear, schoolYear(now))}
          ${field(L.date, formatDate(now, lg))}
          ${duration ? field(L.duration, duration) : ""}
        </td>`;

  const titleCell = `<td class="dh-title-cell">
          ${info.banner ? `<div class="dh-banner">${esc(info.banner)}</div>` : ""}
          <div class="dh-type">${esc(typeLabel(info.contentType ?? "", lg, info.typeLabel, paperNo))}</div>
          <div class="dh-meta">${esc(levelLabel(info.level, lg))}${trimester ? ` • ${esc(trimester)}` : ""}</div>
        </td>`;

  return `<div class="dh-frame"${rtl ? ' dir="rtl"' : ""}>
  <div class="dh-accent"></div>
  <table class="dh-grid">
    <tbody>
      <tr>
        ${identity}
        ${titleCell}
        ${schedule}
      </tr>
      ${graded ? `<tr>
        <td class="dh-exam-cell" colspan="2">
          ${field(L.student)}
        </td>
        <td class="dh-note-cell">${esc(L.note)} :<span class="dh-note-box">&nbsp;</span>${esc(L.outOf)}</td>
      </tr>` : ""}
    </tbody>
  </table>
</div>`;
}
