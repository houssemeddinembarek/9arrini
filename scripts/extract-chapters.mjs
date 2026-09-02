#!/usr/bin/env node
/**
 * Extracts the chapter structure of each manuel scolaire into chapters.json.
 *
 *   node scripts/extract-chapters.mjs [--verbose]
 *
 * What the generator actually needs from a textbook is its *outline*: which
 * chapters exist for a given year and subject, and in what order. That is a few
 * hundred bytes per book, it is factual, and it is the thing the model most
 * reliably gets wrong on its own — inventing chapters that belong to a
 * different year, or naming them in terms the pupil has never seen.
 *
 * Only books whose text extracts cleanly are used. Tunisian textbooks embed
 * fonts inconsistently: some yield real Arabic, some yield raw glyph codes that
 * merely look like text, and two are pure scans. A book that cannot be read
 * honestly is recorded with a reason rather than filled with garbage.
 */

import { readFile, writeFile } from "node:fs/promises";
import { globSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TREE = path.join(ROOT, "src/curriculum/tunisia");
const VERBOSE = process.argv.includes("--verbose");

const ARABIC = /[؀-ۿ]/g;
const LATIN = /[A-Za-z]/g;
// pdfjs emits raw glyph codes when a font has a custom encoding and no
// ToUnicode map. They land here and read as gibberish, not text.
const MOJIBAKE = /[ -˿ -⯿]/g;

const TOC_MARK = /sommaire|table\s+des\s+mati|فهرس|المحتويات|المحتوى/i;

/** "Chapitre 3 : Généralités sur les fonctions" and Arabic equivalents. */
const CHAPTER_PATTERNS = [
  /chapitre\s+(\d{1,2})\s*[:.\-–]\s*([^\n]{3,80}?)(?=\s*(?:chapitre\s+\d|$))/gi,
  /(?:unité|unite)\s+(\d{1,2})\s*[:.\-–]\s*([^\n]{3,80}?)(?=\s*(?:unité|unite)\s+\d|$)/gi,
  /الفصل\s*(?:ال)?(\d{1,2}|[^\s:]{2,10})\s*[:.\-–]?\s*([^\n]{3,80})/g,
  /الوحدة\s*(?:ال)?(\d{1,2}|[^\s:]{2,10})\s*[:.\-–]?\s*([^\n]{3,80})/g,
];

function classify(text) {
  const arabic = (text.match(ARABIC) || []).length;
  const latin = (text.match(LATIN) || []).length;
  const weird = (text.match(MOJIBAKE) || []).length;
  if (arabic > 200) return { quality: "arabic", arabic, latin, weird };
  if (latin > 800 && weird < latin / 4) return { quality: "latin", arabic, latin, weird };
  if (weird > 300) return { quality: "mojibake", arabic, latin, weird };
  return { quality: "insufficient", arabic, latin, weird };
}

async function pageText(doc, i) {
  const tc = await (await doc.getPage(i)).getTextContent();
  return tc.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim();
}

/** Clean a captured title: drop dot leaders, page numbers, stray punctuation. */
function tidy(title) {
  return title
    .replace(/\.{2,}/g, " ")
    // A sommaire's page-number column often trails the last entry as a run of
    // numbers ("Statistiques 7 21 32 48…"), so strip them all, not just one.
    .replace(/(?:\s+\d{1,3})+\s*$/, "")
    .replace(/\s+/g, " ")
    .replace(/^[:.\-–\s]+|[:.\-–\s]+$/g, "")
    .trim();
}

function parseChapters(text) {
  const found = new Map();
  for (const re of CHAPTER_PATTERNS) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const num = String(m[1]).trim();
      const title = tidy(m[2] ?? "");
      if (title.length < 3 || title.length > 80) continue;
      if (!found.has(num)) found.set(num, title);
    }
  }
  return [...found].map(([number, title]) => ({ number, title }));
}

async function extractBook(file) {
  const abs = path.join(TREE, file);
  const doc = await getDocument({
    data: new Uint8Array(await readFile(abs)),
    useSystemFonts: true,
  }).promise;
  const n = doc.numPages;

  // Sample the middle of the book to judge extraction quality; front matter is
  // often an image even when the body is text.
  let sample = "";
  for (const i of [3, 8, Math.floor(n / 2), Math.floor(n * 0.7)].filter((p) => p >= 1 && p <= n)) {
    sample += (await pageText(doc, i)) + " ";
  }
  // Diagnostic only. It must NOT gate extraction: a book's body can be full of
  // maths glyphs with no ToUnicode map while its sommaire — set in an ordinary
  // text font — reads perfectly. Gating on the body threw away every book.
  const { quality, arabic, latin, weird } = classify(sample);

  // Textbooks put the sommaire at the very front or the very back.
  const candidates = [...Array(12).keys()].map((i) => i + 1)
    .concat([...Array(12).keys()].map((i) => n - i))
    .filter((p) => p >= 1 && p <= n);

  let tocText = "", tocPage = null;
  for (const p of [...new Set(candidates)]) {
    const t = await pageText(doc, p);
    if (TOC_MARK.test(t)) { tocText = t; tocPage = p; break; }
  }

  let chapters = tocText ? parseChapters(tocText) : [];

  // No sommaire, or an unparseable one: fall back to chapter headings printed
  // through the body of the book.
  if (chapters.length < 2) {
    let body = "";
    const step = Math.max(1, Math.floor(n / 60));
    for (let i = 1; i <= n; i += step) body += (await pageText(doc, i)) + "\n";
    const fromBody = parseChapters(body);
    if (fromBody.length > chapters.length) {
      chapters = fromBody;
      tocPage = null;
    }
  }

  chapters.sort((a, b) => (Number(a.number) || 999) - (Number(b.number) || 999));

  const reason = chapters.length
    ? undefined
    : quality === "mojibake"
      ? "font has no ToUnicode map — extracted text is glyph codes, needs OCR"
      : quality === "insufficient"
        ? "no usable text layer — scanned, needs OCR"
        : "text readable but no chapter pattern matched";

  return {
    file, pageCount: n, quality, tocPage, chapters,
    ...(reason ? { reason } : {}),
    stats: { arabic, latin, weird },
  };
}

async function main() {
  const files = globSync("**/manuel/*.pdf", { cwd: TREE });
  const books = [];

  for (const file of files) {
    const [cycle, level, subject] = file.split("/");
    try {
      const r = await extractBook(file);
      books.push({ cycle, level, subject, ...r });
      const label = `${cycle}/${level}/${subject}`;
      console.log(
        `${String(r.chapters.length).padStart(2)} chapters | ${r.quality.padEnd(8)} | ${label}` +
        (r.reason ? `  — ${r.reason}` : ""),
      );
      if (VERBOSE) r.chapters.forEach((c) => console.log(`      ${c.number}. ${c.title}`));
    } catch (e) {
      console.warn(`  ! ${file}: ${e.message}`);
      books.push({ cycle, level, subject, file, quality: "error", chapters: [], reason: e.message });
    }
  }

  const withChapters = books.filter((b) => b.chapters.length >= 2);
  const out = {
    generatedAt: new Date().toISOString(),
    note:
      "Chapter outlines extracted from the manuels scolaires. Titles only — the " +
      "structure of a year's syllabus, used to keep AI generation inside the " +
      "chapters a class actually studies. Books with an empty `chapters` array " +
      "carry a `reason`.",
    counts: { books: books.length, withChapters: withChapters.length },
    books,
  };
  await writeFile(path.join(TREE, "chapters.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`\nchapters.json — ${withChapters.length}/${books.length} books yielded an outline`);
}

main().catch((e) => { console.error(e); process.exit(1); });
