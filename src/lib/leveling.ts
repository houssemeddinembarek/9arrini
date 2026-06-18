// Student gamification: XP → level mapping and the XP a quiz is worth.
// Level math is intentionally simple and matches the profile UI which shows
// progress out of 1000 XP per level.

export const XP_PER_LEVEL = 1000;

export function levelFromXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

// XP remaining-in-level helpers, handy for progress bars.
export function xpIntoLevel(xp: number): number {
  return Math.max(0, xp) % XP_PER_LEVEL;
}

export type QuizDifficulty = "facile" | "moyen" | "difficile";

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ["facile", "moyen", "difficile"];

// Base XP a quiz awards on first pass, by difficulty.
export const XP_BY_DIFFICULTY: Record<QuizDifficulty, number> = {
  facile: 50,
  moyen: 100,
  difficile: 200,
};

export function xpForDifficulty(difficulty: string): number {
  return XP_BY_DIFFICULTY[(difficulty as QuizDifficulty)] ?? XP_BY_DIFFICULTY.moyen;
}
