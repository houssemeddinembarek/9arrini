import fs from "node:fs";
import path from "node:path";

/**
 * Access to the official Tunisian programmes for grounding AI generation.
 *
 * The corpus itself (≈4.7 GB of PDFs) never enters a prompt. What does is a
 * targeted extract of the Ministry's own programme for the exact
 * (matière, niveau) being generated for — so the model works from the syllabus
 * that governs the class rather than from recollection.
 */

export interface SyllabusEntry {
  cycle: string;
  level: string;
  subject: string;
  file: string;
  pageCount: number;
  needsOcr: boolean;
  text: string;
}

interface Syllabus {
  generatedAt: string;
  counts: { total: number; withText: number; needsOcr: number };
  entries: SyllabusEntry[];
}

// 2 MB of JSON — read once per server process, not per request.
let cache: Syllabus | null = null;

function load(): Syllabus | null {
  if (cache) return cache;
  try {
    const file = path.join(process.cwd(), "src/curriculum/tunisia/syllabus.json");
    cache = JSON.parse(fs.readFileSync(file, "utf8")) as Syllabus;
    return cache;
  } catch {
    return null; // corpus not built in this environment — generation still works
  }
}

/** App subject label (`SUBJECTS` in tunisia-education.ts) → corpus folder slug. */
const SUBJECT_SLUG: Record<string, string> = {
  "Mathématiques": "mathematiques",
  "Physique-Chimie": "physique-chimie",
  "Physique": "physique-chimie",
  "Chimie": "physique-chimie",
  "Sciences de la vie et de la terre (SVT)": "svt",
  "Informatique": "informatique",
  "Français": "francais",
  "Arabe": "arabe",
  "Anglais": "anglais",
  "Allemand": "allemand",
  "Histoire-Géographie": "histoire-geographie",
  "Philosophie": "philosophie",
  "Technologie": "technologie",
  "Education Physique et Sportive": "education-physique",
};

/**
 * App level label → the cycle it belongs to. Programmes are written per cycle
 * (or per degré in primary), so an exact year rarely has its own document; the
 * cycle-wide one is the correct match.
 */
function resolveCycle(level: string): string | null {
  if (/primaire/i.test(level)) return "primaire";
  if (/base|7|8|9[èe]?m?e?/i.test(level) && !/secondaire|bac/i.test(level)) return "college";
  if (/secondaire|bac|lyc[ée]e|1[èe]re|2[èe]me|3[èe]me/i.test(level)) return "lycee";
  return null;
}

/**
 * Pull the passages of the programme that bear on `topic`.
 *
 * A programme runs to tens of thousands of characters; only the parts naming
 * the chapter are worth spending prompt budget on. Paragraphs are scored by how
 * many of the topic's words they contain, and the best ones returned in
 * document order so the syllabus still reads coherently.
 */
/** Casse, accents, tatweel et variantes d'alef ramenés à une forme commune. */
function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0640\u064b-\u065f\u0670]/g, "")
    .replace(/[\u0623\u0625\u0622]/g, "\u0627")
    .replace(/\u0649/g, "\u064a");
}

function relevantExcerpt(text: string, topic: string, budget: number): string {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40);
  if (!paragraphs.length) return "";

  // Le découpage est Unicode: un chapitre du programme collège arrive en arabe
  // (« مبرهنة طالس وتطبيقاتها »), et un découpage ASCII n'en tirerait aucun mot,
  // donc aucun ancrage. Les variantes d'alef et le tatweel sont normalisés pour
  // que « الأعداد » et « االعداد » se rencontrent.
  const words = normalizeForSearch(topic)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 3);

  if (!words.length) return text.slice(0, budget);

  const scored = paragraphs.map((p, i) => {
    const hay = normalizeForSearch(p);
    return { i, p, score: words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0) };
  });

  const hits = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  // Nothing matched: the opening of a programme states its objectives, which is
  // still better grounding than nothing.
  if (!hits.length) return text.slice(0, budget);

  const chosen: typeof hits = [];
  let used = 0;
  for (const h of hits) {
    if (used + h.p.length > budget) continue;
    chosen.push(h);
    used += h.p.length;
    if (used > budget * 0.9) break;
  }
  return chosen.sort((a, b) => a.i - b.i).map((c) => c.p).join("\n\n");
}

export interface Grounding {
  found: boolean;
  /** Text to inject into the prompt; empty when nothing usable exists. */
  excerpt: string;
  /** Where it came from, for attribution in logs and in the UI. */
  source?: { file: string; pageCount: number };
  /** True when the programme exists but is a scan with no text layer. */
  scannedOnly?: boolean;
}

/**
 * The official programme extract for a generation request, or a clear "nothing
 * usable" answer. Never throws — generation must still work without the corpus.
 */
export function getSyllabusGrounding(
  subject: string,
  level: string,
  topic: string,
  budget = 6000,
): Grounding {
  const data = load();
  if (!data) return { found: false, excerpt: "" };

  const slug = SUBJECT_SLUG[subject];
  const cycle = resolveCycle(level);
  if (!slug || !cycle) return { found: false, excerpt: "" };

  const candidates = data.entries.filter((e) => e.subject === slug && e.cycle === cycle);
  if (!candidates.length) return { found: false, excerpt: "" };

  const usable = candidates.filter((e) => !e.needsOcr && e.text);
  if (!usable.length) {
    return { found: false, excerpt: "", scannedOnly: true };
  }

  // Prefer the cycle-wide programme; it is the one that governs the class.
  const entry = usable.find((e) => e.level === "_cycle") ?? usable[0];
  const excerpt = relevantExcerpt(entry.text, topic, budget);
  if (!excerpt) return { found: false, excerpt: "" };

  return {
    found: true,
    excerpt,
    source: { file: entry.file, pageCount: entry.pageCount },
  };
}

interface ChapterBook {
  cycle: string;
  level: string;
  subject: string;
  chapters: { number: string; title: string }[];
}

let chapterCache: { books: ChapterBook[] } | null = null;

function loadChapters(): { books: ChapterBook[] } | null {
  if (chapterCache) return chapterCache;
  try {
    const file = path.join(process.cwd(), "src/curriculum/tunisia/chapters.json");
    chapterCache = JSON.parse(fs.readFileSync(file, "utf8"));
    return chapterCache;
  } catch {
    return null;
  }
}

/**
 * The chapter list of the textbook for this class, when one could be extracted.
 *
 * This is the cheapest correction available to generation: it stops the model
 * inventing a chapter that belongs to another year, and makes it name topics
 * the way the pupil's own book names them. Coverage is currently thin — most
 * manuels are encoded such that their text cannot be read — so callers must
 * treat an empty list as normal.
 */
export function getChapterOutline(subject: string, level: string): string[] {
  const data = loadChapters();
  if (!data) return [];

  const slug = SUBJECT_SLUG[subject];
  const cycle = resolveCycle(level);
  if (!slug || !cycle) return [];

  const book = data.books.find(
    (b) => b.subject === slug && b.cycle === cycle && b.chapters.length >= 2,
  );
  return book ? book.chapters.map((c) => `${c.number}. ${c.title}`) : [];
}

/** Coverage summary — used by the admin view and for reporting gaps. */
export function getCurriculumCoverage() {
  const data = load();
  if (!data) return null;
  return {
    generatedAt: data.generatedAt,
    ...data.counts,
    bySubject: data.entries.reduce<Record<string, { withText: number; needsOcr: number }>>(
      (acc, e) => {
        acc[e.subject] ??= { withText: 0, needsOcr: 0 };
        if (e.needsOcr) acc[e.subject].needsOcr++;
        else acc[e.subject].withText++;
        return acc;
      },
      {},
    ),
  };
}
