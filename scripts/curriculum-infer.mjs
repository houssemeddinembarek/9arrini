/**
 * Reading a teacher site's own naming to decide where a file belongs.
 *
 * These sites have no metadata — the only signals are the URL path and the link
 * text ("/sciences-svt/devoirs-sciences/8-ème/", "Devoir de contrôle N°2 Math
 * 7ème"). Each table is ordered so the more specific pattern wins, and every
 * function returns null rather than guessing, so the caller can file an
 * unrecognised document under `_non-classe` instead of a wrong year or subject.
 */

export const SUBJECT_PATTERNS = [
  // Specific first: `sciences-svt` must beat `sciences`, `education-civique`
  // must beat a bare `civique`, and `sciences physiques` must not match `svt`.
  [/svt|sciences?[\s_-]*svt|sciences?[\s_-]*nat|vie[\s_-]*et[\s_-]*terre|biolog/i, "svt"],
  [/education[\s_-]*civique|instruction[\s_-]*civique|\bcivique\b/i, "education-civique"],
  [/education[\s_-]*islamique|islamique|tarbia[\s_-]*islamia/i, "education-islamique"],
  [/education[\s_-]*musicale|musique/i, "education-musicale"],
  [/education[\s_-]*artistique|arts?[\s_-]*plastique|dessin|theatre/i, "education-artistique"],
  [/physique|chimie|sciences?[\s_-]*physiques?/i, "physique-chimie"],
  [/math|riadhi|riyadhi/i, "mathematiques"],
  [/informatique|\binfo\b|\btic\b|algorithm/i, "informatique"],
  [/technolog|\btechnique\b/i, "technologie"],
  [/anglais|english/i, "anglais"],
  [/fran(c|ç)ais|french/i, "francais"],
  [/\barabe\b|arabic|\barab\b/i, "arabe"],
  [/allemand|deutsch|german/i, "allemand"],
  [/espagnol|spanish/i, "espagnol"],
  [/italien|italian/i, "italien"],
  [/histoire|g(e|é)ographie|hist[\s_-]*g(e|é)o/i, "histoire-geographie"],
  [/philosoph|\bphilo\b/i, "philosophie"],
  [/(e|é)conomie|\beco\b/i, "economie"],
  [/gestion/i, "gestion"],
  [/sport|\beps\b/i, "education-physique"],
];

export const LEVEL_PATTERNS = [
  [/\b(7|sept)[\s_-]*(e|è|é)?(me|re)?[\s_-]*(annee|année|de[\s_-]*base|b)?\b|7annee|7e-de-base/i, "college", "7eme"],
  [/\b(8|huit)[\s_-]*(e|è|é)?(me)?[\s_-]*(annee|année|de[\s_-]*base|b)?\b|8annee|8e-de-base/i, "college", "8eme"],
  [/\b(9|neuf)[\s_-]*(e|è|é)?(me)?[\s_-]*(annee|année|de[\s_-]*base|b)?\b|9annee|9e-de-base/i, "college", "9eme"],
  [/\bbac\b|\b4[\s_-]*(e|è|é)?(me)?\b|4annee/i, "lycee", "bac"],
  [/\b1[\s_-]*(re|ère|ere)\b|premiere|1annee/i, "lycee", "1ere"],
  [/\b2[\s_-]*(e|è|é)?(me)?\b|deuxieme|2annee/i, "lycee", "2eme"],
  [/\b3[\s_-]*(e|è|é)?(me)?\b|troisieme|3annee/i, "lycee", "3eme"],
];

export const BUCKET_PATTERNS = [
  [/corrig|correction|solution/i, "corrections"],
  [/devoir|controle|contrôle|synthese|synthèse|examen|concours/i, "devoirs"],
  [/exercice|serie|série|\bexo\b|\btd\b|\btp\b/i, "exercices"],
  [/cours|le(c|ç)on|resume|résumé|fiche|rappel/i, "cours"],
];

export function inferSubject(haystack) {
  for (const [re, subject] of SUBJECT_PATTERNS) if (re.test(haystack)) return subject;
  return null;
}

export function inferLevel(haystack) {
  for (const [re, cycle, level] of LEVEL_PATTERNS) {
    if (re.test(haystack)) return { cycle, level };
  }
  return null;
}

export function inferBucket(haystack, fallback) {
  for (const [re, bucket] of BUCKET_PATTERNS) if (re.test(haystack)) return bucket;
  return fallback;
}
