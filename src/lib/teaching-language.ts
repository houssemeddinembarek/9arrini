// ─── Langue d'enseignement (programme tunisien) ──────────────────────────────
// Scientific subjects are taught in Arabic through primary and collège, then in
// French from lycée onward. Language subjects keep their own language.
// Shared by the AI generator (what it writes) and the PDF layer (what the
// document header says), so a paper and its header never disagree.

export type Lang = "arabe" | "francais" | "anglais" | "allemand";

export const SCIENTIFIC_SUBJECTS = new Set([
  "Mathématiques", "Physique-Chimie", "Physique", "Chimie",
  "Sciences de la vie et de la terre (SVT)", "Technologie",
]);

const SUBJECT_LANGUAGE: Record<string, Lang> = {
  "Français": "francais",
  "Anglais": "anglais",
  "Allemand": "allemand",
  "Arabe": "arabe",
};

/** Primary + collège ("années de base") are taught in Arabic for sciences. */
export function isBaseLevel(level: string): boolean {
  return /primaire|base/i.test(level);
}

export function resolveLanguage(subject: string, level: string): Lang {
  if (SUBJECT_LANGUAGE[subject]) return SUBJECT_LANGUAGE[subject];
  if (SCIENTIFIC_SUBJECTS.has(subject)) return isBaseLevel(level) ? "arabe" : "francais";
  return "francais";
}

/** Arabic documents are written and printed right-to-left. */
export function isRtl(lang: Lang | string | undefined): boolean {
  return lang === "arabe";
}
