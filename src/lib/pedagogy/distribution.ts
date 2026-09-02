// ─── Tables de référence, configurables ──────────────────────────────────────
// Tout ce qui est « décidé » pédagogiquement est ici, et nulle part ailleurs:
// changer un nombre dans ce fichier change les devoirs produits, sans toucher
// au prompt ni à la route.
//
// Deux familles de nombres, d'origines différentes:
//
//  • la FORME du sujet (nombre d'exercices et barème de chacun) vient du corpus
//    de sujets officiels analysé dans src/curriculum — 1093 sujets de maths
//    lisibles: un devoir de contrôle tient en 3 exercices (5+7+8), un devoir de
//    synthèse en 4 (4+4+5+7, le barème complet le plus fréquent du corpus);
//
//  • la RÉPARTITION COGNITIVE (application / raisonnement / situation-problème)
//    vient de la référence didactique: 60 / 30 / 10 pour un devoir de contrôle,
//    qui vérifie surtout la maîtrise de techniques récentes. Le devoir de
//    synthèse, lui, doit mesurer la capacité à mobiliser plusieurs
//    apprentissages du trimestre: il déplace du poids vers le raisonnement et
//    la situation-problème.

import { Distribution, ExerciseRole, TaskType } from "./types";

export type Difficulty = "facile" | "moyen" | "difficile";

export type PaperShape = {
  /** Barème par exercice, dans l'ordre du sujet (relevé sur le corpus) */
  exercises: { points: number; role: ExerciseRole }[];
  /** Répartition cognitive de référence, en points */
  distribution: Distribution;
  /** Écart toléré par catégorie à la validation, en points */
  tolerance: number;
};

/**
 * Forme de référence par type de devoir.
 *
 * Le total des `exercises` et celui de la `distribution` doivent être égaux —
 * `assertShape` le vérifie au chargement du module.
 */
export const PAPER_SHAPES: Record<string, PaperShape> = {
  // 1 heure. Vérifie la maîtrise des notions et techniques récentes.
  devoir_controle: {
    exercises: [
      { points: 5, role: "qcm" },
      { points: 7, role: "algebre" },
      { points: 8, role: "geometrie" },
    ],
    distribution: { application: 12, raisonnement: 6, situation: 2 },
    tolerance: 1,
  },
  // 2 heures. Vérifie la mobilisation de plusieurs apprentissages du trimestre:
  // moins d'application directe, davantage de raisonnement et de situations.
  devoir_synthese: {
    exercises: [
      { points: 4, role: "qcm" },
      { points: 4, role: "algebre" },
      { points: 5, role: "geometrie" },
      { points: 7, role: "final" },
    ],
    distribution: { application: 8, raisonnement: 8, situation: 4 },
    tolerance: 1,
  },
};

/**
 * Ajustement par difficulté, en points déplacés depuis l'application.
 *
 * Un devoir « facile » ne supprime pas le raisonnement: il en réduit la part.
 * Un devoir « difficile » ne sort pas du programme (voir la règle §7): il
 * demande davantage de décisions mathématiques à l'élève.
 */
const DIFFICULTY_SHIFT: Record<Difficulty, { raisonnement: number; situation: number }> = {
  facile: { raisonnement: -2, situation: -1 },
  moyen: { raisonnement: 0, situation: 0 },
  difficile: { raisonnement: +2, situation: +1 },
};

/** Répartition minimale conservée quelle que soit la difficulté. */
const FLOOR: Distribution = { application: 4, raisonnement: 2, situation: 0 };

function applyDifficulty(base: Distribution, difficulty: Difficulty): Distribution {
  const shift = DIFFICULTY_SHIFT[difficulty];
  const raisonnement = Math.max(FLOOR.raisonnement, base.raisonnement + shift.raisonnement);
  const situation = Math.max(FLOOR.situation, base.situation + shift.situation);
  const total = base.application + base.raisonnement + base.situation;
  const application = Math.max(FLOOR.application, total - raisonnement - situation);
  // Le total prime: ce qui a été rogné par les planchers revient à l'application.
  const drift = total - (application + raisonnement + situation);
  return { application: application + drift, raisonnement, situation };
}

/** La forme applicable, difficulté comprise, ou null si le type n'en a pas. */
export function shapeFor(contentType: string, difficulty: Difficulty = "moyen"): PaperShape | null {
  const base = PAPER_SHAPES[contentType];
  if (!base) return null;
  return { ...base, distribution: applyDifficulty(base.distribution, difficulty) };
}

/** Découpage d'un budget de points en questions, par nature de tâche. */
export const QUESTION_GRAIN: Record<TaskType, { min: number; max: number }> = {
  // Une application directe se paie 1 à 2 points: une formule, un calcul.
  application: { min: 1, max: 2 },
  // Un raisonnement vaut plus cher: plusieurs étapes et une décision.
  raisonnement: { min: 1.5, max: 3 },
  // Une situation-problème est UNE tâche, quel que soit le nombre d'étapes que
  // sa résolution demande — c'est la règle §3.
  situation: { min: 2, max: 4 },
};

/** Le total des exercices et celui de la répartition doivent coïncider. */
function assertShape(name: string, shape: PaperShape) {
  const byExercise = shape.exercises.reduce((s, e) => s + e.points, 0);
  const byType = shape.distribution.application + shape.distribution.raisonnement + shape.distribution.situation;
  if (byExercise !== byType) {
    throw new Error(
      `PAPER_SHAPES.${name}: ${byExercise} points d'exercices contre ${byType} points répartis`,
    );
  }
}
for (const [name, shape] of Object.entries(PAPER_SHAPES)) assertShape(name, shape);
