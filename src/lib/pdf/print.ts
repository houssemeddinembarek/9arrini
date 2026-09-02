// ─── Printable document assembly ─────────────────────────────────────────────
// Turns a rendered body (HTML already converted from the AI's markdown) plus a
// template into the complete printable page, and opens it in a print window.
// Both the generator and the content library go through here, so a document
// looks identical wherever it is printed from.

import { isRtl } from "@/lib/teaching-language";
import { buildDocHeader, DocHeaderInfo, docHeaderCSS } from "./document-header";
import { docStrings, headerLang, paperNumberOf, typeLabel } from "./i18n";
import { PdfTemplate, getTemplate, templateBodyCSS } from "./templates";

const KATEX_VERSION = "0.16.9";

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type PrintDocOptions = {
  /** Template object or its id */
  template: PdfTemplate | string;
  /** Everything the header band needs — theme and seal come from the template */
  header: Omit<DocHeaderInfo, "banner" | "showStudentRow" | "lang"> &
    Pick<Partial<DocHeaderInfo>, "showStudentRow">;
  /** Language the document is written in — header wording and text direction */
  lang?: string;
  /** Body of the document, as HTML */
  html: string;
  /** Overrides the direction implied by `lang` */
  rtl?: boolean;
  /** Left-hand footer line; the reference stamp is always printed on the right */
  footerNote?: string;
};

/** The full `<!DOCTYPE html>` document, ready to be written to a print window. */
export function buildPrintHTML(options: PrintDocOptions): string {
  const template = typeof options.template === "string" ? getTemplate(options.template) : options.template;
  const { header, html, lang } = options;
  // Arabic documents print right-to-left, header included.
  const rtl = options.rtl ?? isRtl(lang);
  const lg = headerLang(lang);
  const S = docStrings(lg);
  const footerNote = options.footerNote ?? S.footer;

  const headerHTML = buildDocHeader({
    ...header,
    lang,
    banner: template.banner,
    showStudentRow: header.showStudentRow ?? template.showStudentRow,
  });

  const docTitle = `${typeLabel(
    header.contentType ?? "", lg, header.typeLabel,
    paperNumberOf(header.contentType ?? "", header.devoirNumber, header.trimester),
  )} — ${header.title}`;

  return `<!DOCTYPE html>
<html lang="${rtl ? "ar" : "fr"}"${rtl ? ' dir="rtl"' : ""}>
<head>
  <meta charset="UTF-8">
  <title>${esc(docTitle)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css">
  <style>
${templateBodyCSS(template)}
${docHeaderCSS(template.theme)}
  </style>
</head>
<body>
  ${template.watermark ? `<div class="watermark">${esc(template.watermark)}</div>` : ""}
  ${headerHTML}
  <div id="content"${rtl ? ' dir="rtl"' : ""}>${html}</div>
  <div class="footer">
    <span>${footerNote}</span>
    ${header.stampId ? `<span class="stamp-id">${esc(S.reference)}: ${esc(header.stampId)}</span>` : ""}
  </div>
  <script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/contrib/auto-render.min.js"><\/script>
  <script>
    document.addEventListener("DOMContentLoaded",function(){
      if(window.renderMathInElement){
        window.renderMathInElement(document.getElementById("content"),{
          delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}],
          throwOnError:false
        });
      }
      setTimeout(function(){window.print();},900);
    });
  <\/script>
</body></html>`;
}

/**
 * Opens the built document in a new window and triggers the print dialog.
 * Returns false when the browser blocked the popup, so the caller can tell
 * the teacher why nothing happened.
 */
export function openPrintWindow(options: PrintDocOptions): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(buildPrintHTML(options));
  win.document.close();
  return true;
}
