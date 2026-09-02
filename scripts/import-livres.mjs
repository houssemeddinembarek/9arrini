#!/usr/bin/env node
/**
 * Imports the manuels scolaires and parascolaire books from a local folder into
 * src/curriculum/tunisia, using the same
 * <cycle>/<niveau>/<matière>/<bucket>/ layout as the rest of the corpus.
 *
 *   node scripts/import-livres.mjs ~/Downloads/livres [--dry-run]
 *
 * The CNP files are named by catalogue code (102306P00.pdf). The code reads
 * <cycle><matière><classe><édition> — confirmed by reading the cover of all 23,
 * e.g. 102306 = base / maths / 3ème année. Titles below come from those covers.
 *
 * Anything whose level cannot be established from the filename is placed under
 * `_non-classe` rather than guessed into the wrong year.
 */

import { copyFile, mkdir, stat, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TREE = path.join(ROOT, "src/curriculum/tunisia");
const SRC = process.argv[2];
const DRY = process.argv.includes("--dry-run");

if (!SRC) {
  console.error("usage: node scripts/import-livres.mjs <folder> [--dry-run]");
  process.exit(1);
}

/** CNP manuels — identified from each book's own cover page. */
const MANUELS = {
  "102306P00.pdf": ["primaire", "3eme", "mathematiques", "manuel-mathematiques-3eme-primaire"],
  "102407P00.pdf": ["primaire", "4eme", "mathematiques", "manuel-mathematiques-4eme-primaire"],
  "102511P00.pdf": ["primaire", "5eme", "mathematiques", "manuel-mathematiques-5eme-primaire"],
  "103404P00.pdf": ["primaire", "4eme", "sciences-naturelles", "manuel-eveil-scientifique-4eme-primaire"],
  "503404P00.pdf": ["primaire", "4eme", "sciences-naturelles", "manuel-eveil-scientifique-4eme-primaire-ed2"],
  "102707P00.pdf": ["college", "7eme", "mathematiques", "manuel-mathematiques-7eme"],
  "102805P00.pdf": ["college", "8eme", "mathematiques", "manuel-mathematiques-8eme"],
  "102905P00.pdf": ["college", "9eme", "mathematiques", "manuel-mathematiques-9eme"],
  "105704P00.pdf": ["college", "7eme", "svt", "manuel-svt-7eme"],
  "105804P01.pdf": ["college", "8eme", "svt", "manuel-svt-8eme"],
  "103902P00.pdf": ["college", "9eme", "physique-chimie", "manuel-sciences-physiques-9eme"],
  "123901P00.pdf": ["college", "9eme", "physique-chimie", "manuel-sciences-physiques-9eme-pilote-fr"],
  "128702P00.pdf": ["college", "7eme", "technologie", "manuel-technologie-7eme-cahier-activites"],
  "222104P01.pdf": ["lycee", "1ere", "mathematiques", "manuel-mathematiques-1ere-cahier1"],
  "222104P02.pdf": ["lycee", "1ere", "mathematiques", "manuel-mathematiques-1ere-cahier2"],
  "222105P00.pdf": ["lycee", "1ere", "mathematiques", "manuel-mathematiques-1ere-section-sport"],
  "222232P00.pdf": ["lycee", "2eme", "mathematiques", "manuel-mathematiques-2eme"],
  "222261P00.pdf": ["lycee", "2eme", "mathematiques", "manuel-mathematiques-2eme-ed2"],
  "224231P00.pdf": ["lycee", "2eme", "physique-chimie", "manuel-chimie-2eme-sciences"],
  "222351P00.pdf": ["lycee", "3eme", "mathematiques", "manuel-mathematiques-3eme-sciences-techniques"],
  "222433P00.pdf": ["lycee", "bac", "mathematiques", "manuel-mathematiques-bac-1"],
  "222434P00.pdf": ["lycee", "bac", "mathematiques", "manuel-mathematiques-bac-2"],
  "222463P00.pdf": ["lycee", "bac", "mathematiques", "manuel-mathematiques-bac-3"],
};

/**
 * Parascolaire — commercial revision series (Collection Pilote, Kounouz
 * Ennajeh, التيسير, الرياضيات بالتدرج, المفيد…). Level comes from the title;
 * `null` means the title does not state one.
 */
const PARASCOLAIRE = {
  "COLLECTION PILOTE 4MATH tome 1.pdf": ["lycee", "bac", "mathematiques", "collection-pilote-bac-math-tome1"],
  "COLLECTION PILOTE 4MATH tome 2.pdf": ["lycee", "bac", "mathematiques", "collection-pilote-bac-math-tome2"],
  "COLLECTION PILOTE 4MATH (tome1)correction.pdf": ["lycee", "bac", "mathematiques", "collection-pilote-bac-math-tome1-correction"],
  "COLLECTION PILOTE 4MATH (Tome2) correction.pdf": ["lycee", "bac", "mathematiques", "collection-pilote-bac-math-tome2-correction"],
  "collection pilote Bac MATH(Tome1).pdf": ["lycee", "bac", "mathematiques", "collection-pilote-bac-math-alt-tome1"],
  "collection pilote Bac MATH(Tome1) correction.pdf": ["lycee", "bac", "mathematiques", "collection-pilote-bac-math-alt-tome1-correction"],
  "Kounouz Ennajeh 4math Partie1.pdf": ["lycee", "bac", "mathematiques", "kounouz-ennajeh-bac-math-partie1"],
  "Kounouz Ennajeh 4math Partie2.pdf": ["lycee", "bac", "mathematiques", "kounouz-ennajeh-bac-math-partie2"],
  "Kounouz Ennajeh 4math Partie4.pdf": ["lycee", "bac", "mathematiques", "kounouz-ennajeh-bac-math-partie4"],
  "Kounouz Ennajeh 4math Partie5.pdf": ["lycee", "bac", "mathematiques", "kounouz-ennajeh-bac-math-partie5"],
  "Kounouz Najeh 4eme.pdf": ["lycee", "bac", "mathematiques", "kounouz-najeh-bac"],
  "para 4eme chokri.pdf": ["lycee", "bac", "mathematiques", "parascolaire-bac-chokri"],
  "collection pilote 7eme.pdf": ["college", "7eme", "mathematiques", "collection-pilote-7eme"],
  "collection7pilote.pdf": ["college", "7eme", "mathematiques", "collection-pilote-7eme-ed2"],
  "livre math 7 emme.pdf": ["college", "7eme", "mathematiques", "livre-math-7eme"],
  "التيسير في الرياضيات 7 أساسي.pdf": ["college", "7eme", "mathematiques", "attaysir-mathematiques-7eme"],
  "التسير س7.pdf": ["college", "7eme", "mathematiques", "attaysir-mathematiques-7eme-ed2"],
  "collection pilote 8eme.pdf": ["college", "8eme", "mathematiques", "collection-pilote-8eme"],
  "التيسير في الرياضيات 8 أساسي.pdf": ["college", "8eme", "mathematiques", "attaysir-mathematiques-8eme"],
  "collection pilote 9ème.pdf": ["college", "9eme", "mathematiques", "collection-pilote-9eme"],
  "math 9.pdf": ["college", "9eme", "mathematiques", "math-9eme"],
  "awal 9eme.pdf": ["college", "9eme", "mathematiques", "awal-9eme"],
  "الرياضيات بالتدرج 9أساسي.pdf": ["college", "9eme", "mathematiques", "arriyadhiyat-bittadarruj-9eme"],
  "Correction 9eme الرياضيات بالتدرج.pdf": ["college", "9eme", "mathematiques", "arriyadhiyat-bittadarruj-9eme-correction"],
  "math1 tome 1.pdf": ["lycee", "1ere", "mathematiques", "math-1ere-tome1"],
  "math1 tome 2.pdf": ["lycee", "1ere", "mathematiques", "math-1ere-tome2"],
  "math 2 emme.pdf": ["lycee", "2eme", "mathematiques", "math-2eme"],
  "math 2 tome 1.pdf": ["lycee", "2eme", "mathematiques", "math-2eme-tome1"],
  "math 3 math.pdf": ["lycee", "3eme", "mathematiques", "math-3eme-math"],
  "math 3math tom.pdf": ["lycee", "3eme", "mathematiques", "math-3eme-math-tome"],
  "math 3 eme science.pdf": ["lycee", "3eme", "mathematiques", "math-3eme-sciences"],
  "math 3 sciences tome 1.pdf": ["lycee", "3eme", "mathematiques", "math-3eme-sciences-tome1"],
  "السنة الثالثة رياضيات.pdf": ["lycee", "3eme", "mathematiques", "mathematiques-3eme-secondaire"],
  "ايقاظ3.pdf": ["primaire", "3eme", "sciences-naturelles", "eveil-scientifique-3eme"],
  "ايقاظ4.pdf": ["primaire", "4eme", "sciences-naturelles", "eveil-scientifique-4eme"],
  "إيقاظ سنة رابعة.pdf": ["primaire", "4eme", "sciences-naturelles", "eveil-scientifique-4eme-ed2"],
  "ملخص الايقاظ س 5.pdf": ["primaire", "5eme", "sciences-naturelles", "eveil-scientifique-5eme-resume"],
  "المفيد في الإيقاظ العلمي.pdf": ["primaire", "_non-classe", "sciences-naturelles", "almufid-eveil-scientifique"],
  // Titles that name no level — parked rather than guessed.
  "math science part1.pdf": ["lycee", "_non-classe", "mathematiques", "math-sciences-part1"],
  "math science part 2.pdf": ["lycee", "_non-classe", "mathematiques", "math-sciences-part2"],
  "mathkoonooz.pdf": ["lycee", "_non-classe", "mathematiques", "math-kounouz"],
  "math1819doctora.pdf": ["lycee", "_non-classe", "mathematiques", "math-2018-2019-doctora"],
  "المختصر في الرياضيات.pdf": ["lycee", "_non-classe", "mathematiques", "almukhtasar-mathematiques"],
};

async function main() {
  let copied = 0, skipped = 0, missing = 0;
  const plan = [
    ...Object.entries(MANUELS).map(([f, v]) => [f, v, "manuel"]),
    ...Object.entries(PARASCOLAIRE).map(([f, v]) => [f, v, "parascolaire"]),
  ];

  // macOS stores filenames decomposed (NFD): "التيسير" and "ème" are byte-different
  // from the composed (NFC) forms written in this file even though they display
  // identically. Resolve every name through an NFC-keyed index of what is on disk.
  const onDisk = new Map(
    (await readdir(SRC)).map((name) => [name.normalize("NFC"), name]),
  );

  for (const [srcName, [cycle, level, subject, stem], bucket] of plan) {
    const actual = onDisk.get(srcName.normalize("NFC"));
    if (!actual) { console.warn(`  ? missing: ${srcName}`); missing++; continue; }
    const from = path.join(SRC, actual);

    const rel = path.posix.join(cycle, level, subject, bucket, `${stem}.pdf`);
    const to = path.join(TREE, rel);

    if (existsSync(to)) { skipped++; continue; }
    if (DRY) { console.log(`  would copy ${srcName}\n           → ${rel}`); copied++; continue; }

    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(from, to);
    const { size } = await stat(to);
    console.log(`  ✓ ${rel} (${Math.round(size / 1e6)} MB)`);
    copied++;
  }
  console.log(`\n${DRY ? "would copy" : "copied"} ${copied} · already present ${skipped} · missing ${missing}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
