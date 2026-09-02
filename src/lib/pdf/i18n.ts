// ─── Vocabulaire de l'en-tête ────────────────────────────────────────────────
// A paper written in Arabic carries an Arabic header, right-to-left, with the
// wording used on real Tunisian school papers; a paper in French carries the
// French one. Only these two scripts exist on a Tunisian header — an English
// or German paper is still framed in French.

import { Lang } from "@/lib/teaching-language";

export type HeaderLang = "fr" | "ar";

export function headerLang(lang?: Lang | string): HeaderLang {
  return lang === "arabe" ? "ar" : "fr";
}

type Labels = {
  establishment: string;
  teacher: string;
  subject: string;
  schoolYear: string;
  date: string;
  duration: string;
  student: string;
  note: string;
  outOf: string;
};

const LABELS: Record<HeaderLang, Labels> = {
  fr: {
    establishment: "Établissement",
    teacher: "Enseignant",
    subject: "Matière",
    schoolYear: "Année scolaire",
    date: "Date",
    duration: "Durée",
    student: "Nom et prénom",
    note: "Note",
    outOf: "/ 20",
  },
  ar: {
    establishment: "المؤسسة",
    teacher: "الأستاذ",
    subject: "المادة",
    schoolYear: "السنة الدراسية",
    date: "التاريخ",
    duration: "المدة",
    student: "الاسم واللقب",
    note: "العدد",
    outOf: "/ 20",
  },
};

export function headerLabels(lang: HeaderLang): Labels {
  return LABELS[lang];
}

/** Document type, as printed at the top of the paper. */
const TYPE_LABELS: Record<HeaderLang, Record<string, string>> = {
  fr: {
    resume: "Résumé de cours",
    exercices: "Série d'exercices",
    devoir_controle: "Devoir de contrôle",
    devoir_synthese: "Devoir de synthèse",
    fiche_revision: "Fiche de révision",
  },
  ar: {
    resume: "ملخّص الدرس",
    exercices: "سلسلة تمارين",
    devoir_controle: "فرض مراقبة",
    devoir_synthese: "فرض تأليفي",
    fiche_revision: "بطاقة مراجعة",
  },
};

/** Devoirs carry a number: عدد 1, N° 2 … */
const NUMBERED_TYPES = new Set(["devoir_controle", "devoir_synthese"]);

/**
 * A maths year runs over three trimestres, each holding two devoirs de
 * contrôle and one devoir de synthèse. So a DC is numbered 1 or 2 within its
 * trimestre, while the single DS of a trimestre takes the trimestre's own
 * number — "فرض تأليفي عدد 2" is the synthèse of the second trimestre.
 */
export function paperNumberOf(
  contentType: string,
  devoirNumber?: number,
  trimester?: number,
): number | undefined {
  if (contentType === "devoir_synthese") return trimester;
  if (contentType === "devoir_controle") return devoirNumber;
  return undefined;
}

const TRIMESTERS: Record<HeaderLang, string[]> = {
  fr: ["1er trimestre", "2ème trimestre", "3ème trimestre"],
  ar: ["الثلاثي الأول", "الثلاثي الثاني", "الثلاثي الثالث"],
};

export function trimesterLabel(trimester: number | undefined, lang: HeaderLang): string {
  if (!trimester || trimester < 1 || trimester > 3) return "";
  return TRIMESTERS[lang][trimester - 1];
}

export function typeLabel(
  contentType: string,
  lang: HeaderLang,
  fallback?: string,
  devoirNumber?: number,
): string {
  const base = TYPE_LABELS[lang][contentType] ?? fallback ?? contentType;
  if (!devoirNumber || !NUMBERED_TYPES.has(contentType)) return base;
  return lang === "ar" ? `${base} عدد ${devoirNumber}` : `${base} N° ${devoirNumber}`;
}

const DURATIONS: Record<HeaderLang, Record<string, string>> = {
  fr: { devoir_controle: "1 heure", devoir_synthese: "2 heures" },
  ar: { devoir_controle: "ساعة واحدة", devoir_synthese: "ساعتان" },
};

export function durationLabel(contentType: string | undefined, lang: HeaderLang): string | undefined {
  return contentType ? DURATIONS[lang][contentType] : undefined;
}

const SUBJECTS_AR: Record<string, string> = {
  "Mathématiques": "الرياضيات",
  "Physique-Chimie": "الفيزياء والكيمياء",
  "Physique": "الفيزياء",
  "Chimie": "الكيمياء",
  "Sciences de la vie et de la terre (SVT)": "علوم الحياة والأرض",
  "Informatique": "الإعلامية",
  "Technologie": "التكنولوجيا",
  "Français": "الفرنسية",
  "Arabe": "العربية",
  "Anglais": "الإنجليزية",
  "Allemand": "الألمانية",
  "Histoire-Géographie": "التاريخ والجغرافيا",
  "Philosophie": "الفلسفة",
  "Education Physique et Sportive": "التربية البدنية",
};

export function subjectLabel(subject: string, lang: HeaderLang): string {
  return lang === "ar" ? SUBJECTS_AR[subject] ?? subject : subject;
}

// Only the levels that can produce an Arabic paper need a translation
// (sciences switch to French at lycée), but the lycée years are listed too so
// an Arabic-language subject at lycée prints correctly.
const LEVELS_AR: Record<string, string> = {
  "1ère année primaire": "السنة الأولى ابتدائي",
  "2ème année primaire": "السنة الثانية ابتدائي",
  "3ème année primaire": "السنة الثالثة ابتدائي",
  "4ème année primaire": "السنة الرابعة ابتدائي",
  "5ème année primaire": "السنة الخامسة ابتدائي",
  "6ème année primaire": "السنة السادسة ابتدائي",
  "7ème année de base": "السابعة أساسي",
  "8ème année de base": "الثامنة أساسي",
  "9ème année de base": "التاسعة أساسي",
  "1ère année secondaire (tronc commun)": "السنة الأولى ثانوي",
};

const LEVEL_PATTERNS_AR: [RegExp, string][] = [
  [/^2ème année/i, "السنة الثانية ثانوي"],
  [/^3ème année/i, "السنة الثالثة ثانوي"],
  [/^Bac/i, "الرابعة ثانوي (بكالوريا)"],
];

export function levelLabel(level: string, lang: HeaderLang): string {
  if (lang !== "ar") return level;
  if (LEVELS_AR[level]) return LEVELS_AR[level];
  for (const [re, ar] of LEVEL_PATTERNS_AR) if (re.test(level)) return ar;
  return level;
}

/** Tunisian papers use Latin digits in both scripts: 12/03/2026. */
export function formatDate(date: Date, lang: HeaderLang): string {
  return date.toLocaleDateString(lang === "ar" ? "ar-TN-u-nu-latn" : "fr-TN");
}

/** School year, e.g. "2025–2026" — same shape in both scripts. */
export function schoolYear(date: Date): string {
  const y = date.getFullYear();
  return date.getMonth() >= 7 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}

// ─── Intitulés à l'intérieur du document ─────────────────────────────────────
// An Arabic paper is Arabic all the way down: its section titles and exercise
// headings are written in Arabic too, not just its header.

type DocStrings = {
  footer: string;
  reference: string;
  exercise: string;
  problem: string;
  correction: string;
  statements: string;
  corrections: string;
  summary: string;
  supportDocument: string;
};

const DOC_STRINGS: Record<HeaderLang, DocStrings> = {
  fr: {
    footer: "Document généré par <strong>Telmidhi</strong> • Programme officiel tunisien",
    reference: "Réf",
    exercise: "Exercice",
    problem: "Problème",
    correction: "Correction",
    statements: "Énoncés",
    corrections: "Corrections",
    summary: "Résumé du cours",
    supportDocument: "Document support",
  },
  ar: {
    footer: "وثيقة مُنشأة بواسطة <strong>Telmidhi</strong> • البرنامج الرسمي التونسي",
    reference: "المرجع",
    exercise: "التمرين",
    problem: "المسألة",
    correction: "إصلاح",
    statements: "نصّ الفرض",
    corrections: "الإصلاح",
    summary: "ملخّص الدرس",
    supportDocument: "الوثيقة المرفقة",
  },
};

export function docStrings(lang: HeaderLang): DocStrings {
  return DOC_STRINGS[lang];
}

/**
 * Heading of one exercise: "Exercice 2" — or "التمرين 2". Real Tunisian papers
 * never name the exercise's type in its heading; the consigne inside the
 * exercise says what it is.
 */
export function exerciseHeading(index: number, lang: HeaderLang): string {
  return `${docStrings(lang).exercise} ${index + 1}`;
}
