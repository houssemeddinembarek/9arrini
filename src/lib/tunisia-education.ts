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

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
