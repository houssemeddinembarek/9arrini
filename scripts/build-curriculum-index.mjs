#!/usr/bin/env node
/**
 * Turns the downloaded corpus into something the app and the AI generator can
 * actually use.
 *
 *   node scripts/build-curriculum-index.mjs
 *
 * Produces two committed artefacts (the 4.7 GB of PDFs stays out of git):
 *
 *   index.json     every document's metadata — cycle, niveau, matière, bucket,
 *                  year, size. Drives browsing, retrieval and the public view.
 *   syllabus.json  the official programmes with their text extracted, keyed by
 *                  (cycle, niveau, matière). This is what grounds generation:
 *                  small enough to commit, authoritative enough to quote.
 *
 * Scanned documents are recorded with `needsOcr: true` rather than dropped, so
 * the gap is visible instead of silently absent.
 */

import { readFile, writeFile, stat } from "node:fs/promises";
import { globSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TREE = path.join(ROOT, "src/curriculum/tunisia");

/** Path shape: <cycle>/<niveau>/<matière>/<bucket>/<file> */
function parsePath(rel) {
  const [cycle, level, subject, bucket, ...rest] = rel.split("/");
  if (!bucket) return null;
  const name = rest.join("/");
  const year = name.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
  const session = /principale/i.test(name) ? "principale"
    : /controle|contrôle/i.test(name) ? "controle" : null;
  return { cycle, level, subject, bucket, file: rel, name, year, session };
}

async function extractText(abs) {
  const doc = await getDocument({
    data: new Uint8Array(await readFile(abs)),
    useSystemFonts: true,
  }).promise;

  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    // pdfjs emits positioned fragments; join them and let whitespace collapse.
    const txt = tc.items.map((it) => it.str).join(" ").replace(/[ \t]+/g, " ").trim();
    if (txt) pages.push(txt);
  }
  return { pageCount: doc.numPages, text: pages.join("\n\n") };
}

async function main() {
  const files = globSync("**/*.{pdf,jpg}", { cwd: TREE });
  const documents = [];

  for (const rel of files) {
    const meta = parsePath(rel);
    if (!meta) continue;
    const { size } = await stat(path.join(TREE, rel));
    documents.push({ ...meta, bytes: size });
  }

  // ── Facets, so the app can build pickers without scanning the tree ──────
  const facet = (key) =>
    [...documents.reduce((m, d) => m.set(d[key], (m.get(d[key]) ?? 0) + 1), new Map())]
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }));

  const index = {
    generatedAt: new Date().toISOString(),
    total: documents.length,
    facets: {
      cycles: facet("cycle"), levels: facet("level"),
      subjects: facet("subject"), buckets: facet("bucket"),
    },
    documents,
  };
  await writeFile(path.join(TREE, "index.json"), JSON.stringify(index, null, 2) + "\n");
  console.log(`index.json — ${documents.length} documents`);

  // ── Syllabus: the programmes, with text where a text layer exists ───────
  const programmes = documents.filter((d) => d.bucket === "programme");
  const entries = [];
  let withText = 0, needsOcr = 0;

  for (const p of programmes) {
    let pageCount = 0, text = "";
    try {
      ({ pageCount, text } = await extractText(path.join(TREE, p.file)));
    } catch (e) {
      console.warn(`  ! ${p.file}: ${e.message}`);
    }
    const usable = text.replace(/\s/g, "").length > 400;
    if (usable) withText++; else needsOcr++;

    entries.push({
      cycle: p.cycle, level: p.level, subject: p.subject,
      file: p.file, pageCount,
      needsOcr: !usable,
      // Scanned files contribute no text; keep the record so the gap is visible.
      text: usable ? text : "",
    });
  }

  const syllabus = {
    generatedAt: new Date().toISOString(),
    note:
      "Official Ministry programmes (education.gov.tn / edunet.tn). `text` is " +
      "extracted verbatim and used to ground AI generation. Entries with " +
      "needsOcr:true are scanned images with no text layer.",
    counts: { total: entries.length, withText, needsOcr },
    entries,
  };
  await writeFile(path.join(TREE, "syllabus.json"), JSON.stringify(syllabus, null, 2) + "\n");
  const mb = ((await stat(path.join(TREE, "syllabus.json"))).size / 1e6).toFixed(1);
  console.log(`syllabus.json — ${withText} with text, ${needsOcr} need OCR (${mb} MB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
