export const SUBJECTS = [
  "Mathématiques",
  "Physique-Chimie",
  "Physique",
  "Chimie",
  "Sciences de la vie et de la terre (SVT)",
  "Informatique",
  "Français",
  "Arabe",
  "Anglais",
  "Allemand",
  "Histoire-Géographie",
  "Philosophie",
  "Technologie",
  "Education Physique et Sportive",
];

export const LEVELS = [
  { group: "École Primaire", items: ["1ère année primaire", "2ème année primaire", "3ème année primaire", "4ème année primaire", "5ème année primaire", "6ème année primaire"] },
  { group: "Collège (Base)", items: ["7ème année de base", "8ème année de base", "9ème année de base"] },
  { group: "Lycée – 1ère année", items: ["1ère année secondaire (tronc commun)"] },
  { group: "Lycée – 2ème année", items: ["2ème année - Sciences", "2ème année - Lettres", "2ème année - Economie-Gestion", "2ème année - Informatique", "2ème année - Technique"] },
  { group: "Lycée – 3ème année", items: ["3ème année - Mathématiques", "3ème année - Sciences Expérimentales", "3ème année - Lettres", "3ème année - Economie-Gestion", "3ème année - Informatique", "3ème année - Technique"] },
  { group: "Baccalauréat (4ème année)", items: ["Bac - Mathématiques", "Bac - Sciences Expérimentales", "Bac - Lettres", "Bac - Economie-Gestion", "Bac - Informatique", "Bac - Technique", "Bac - Sport"] },
];

// Education stages with their precise classes — used for the cascading
// "niveaux à enseigner" picker (choose a stage, then specific classes).
export const CLASS_LEVELS: { stage: string; classes: string[] }[] = [
  {
    stage: "École Primaire",
    classes: ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année"],
  },
  {
    stage: "Collège",
    classes: ["7ème année", "8ème année", "9ème année"],
  },
  {
    stage: "Lycée",
    classes: [
      "1ère secondaire",
      "2ème Sciences",
      "2ème Lettres",
      "2ème Éco-Gestion",
      "2ème Informatique",
      "2ème Technique",
      "3ème Mathématiques",
      "3ème Sciences exp.",
      "3ème Lettres",
      "3ème Éco-Gestion",
      "3ème Informatique",
      "3ème Technique",
    ],
  },
  {
    stage: "Baccalauréat",
    classes: [
      "Bac Mathématiques",
      "Bac Sciences exp.",
      "Bac Lettres",
      "Bac Éco-Gestion",
      "Bac Informatique",
      "Bac Technique",
      "Bac Sport",
    ],
  },
];

// ── Student profile data (used at signup) ───────────────────────────────
// Cycle → années. A student picks a cycle, then a precise school year.
export const STAGES: { key: string; label: string; years: string[] }[] = [
  { key: "primaire", label: "École primaire", years: ["1ère année", "2ème année", "3ème année", "4ème année", "5ème année", "6ème année"] },
  { key: "college", label: "Collège", years: ["7ème année", "8ème année", "9ème année"] },
  { key: "secondaire", label: "Lycée (secondaire)", years: ["1ère année secondaire", "2ème année secondaire", "3ème année secondaire"] },
  { key: "bac", label: "Baccalauréat", years: ["Baccalauréat (4ème année)"] },
];

// Branche (secondaire 2ème/3ème) / option (Bac).
export const SECTIONS = [
  "Sciences expérimentales",
  "Mathématiques",
  "Lettres",
  "Économie & Gestion",
  "Sciences informatiques",
  "Sciences techniques",
  "Sport",
];

// 24 gouvernorats de Tunisie.
export const GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Béja", "Jendouba", "Le Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Médenine",
  "Tataouine", "Gafsa", "Tozeur", "Kébili",
];

// A branch/option is required only in Bac, or 2ème/3ème année secondaire
// (1ère année secondaire is a "tronc commun" with no specialisation).
export function sectionApplies(stageKey: string, year: string): boolean {
  if (stageKey === "bac") return true;
  if (stageKey === "secondaire") return !year.startsWith("1ère");
  return false;
}

// School terms — courses are scoped to a trimester so students can filter
// the syllabus by the term they're currently in.
export const TRIMESTERS = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];

// Map a student's signup profile (stage/year/section) to the matching course
// "classe" value from CLASS_LEVELS, so the courses list can be pre-filtered to
// the level they registered with. Returns "" when it can't be resolved.
export function studentClasse(profile?: { stage?: string; year?: string; section?: string }): string {
  if (!profile) return "";
  const { stage, year, section } = profile;
  if (!stage || !year) return "";

  // Primaire & Collège: the school year is itself the classe.
  if (stage === "primaire" || stage === "college") return year;

  // Signup section labels → the short suffix used in CLASS_LEVELS.
  const suffixBySection: Record<string, string> = {
    "Mathématiques": "Mathématiques",
    "Sciences expérimentales": "Sciences exp.",
    "Lettres": "Lettres",
    "Économie & Gestion": "Éco-Gestion",
    "Sciences informatiques": "Informatique",
    "Sciences techniques": "Technique",
    "Sport": "Sport",
  };

  if (stage === "secondaire") {
    if (year.startsWith("1ère")) return "1ère secondaire";
    const prefix = year.startsWith("2ème") ? "2ème" : "3ème";
    let suffix = suffixBySection[section || ""] || "";
    // In 2ème année the Maths/Sciences-exp split hasn't happened yet — both
    // belong to the common "Sciences" track.
    if (prefix === "2ème" && (section === "Mathématiques" || section === "Sciences expérimentales")) {
      suffix = "Sciences";
    }
    return suffix ? `${prefix} ${suffix}` : "";
  }

  if (stage === "bac") {
    const suffix = suffixBySection[section || ""] || "";
    return suffix ? `Bac ${suffix}` : "";
  }

  return "";
}

// Days of the week for teacher availability (disponibilité).
export const WEEKDAYS = [
  { key: "Lun", label: "Lundi" },
  { key: "Mar", label: "Mardi" },
  { key: "Mer", label: "Mercredi" },
  { key: "Jeu", label: "Jeudi" },
  { key: "Ven", label: "Vendredi" },
  { key: "Sam", label: "Samedi" },
  { key: "Dim", label: "Dimanche" },
];

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
