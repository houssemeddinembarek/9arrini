// ─── Blueprint: le plan du devoir, calculé sans IA ───────────────────────────
// Le modèle ne décide plus de la structure: il remplit un gabarit. On concilie
// ici deux contraintes qui viennent de sources différentes — le barème par
// exercice (corpus des sujets officiels) et la répartition cognitive
// (référence didactique) — puis on découpe chaque bloc en questions.
//
// L'ordre d'allocation porte la progression exigée au §4: la situation-problème
// va en fin de sujet, le raisonnement dans les exercices du milieu et de fin,
// l'application directe ouvre le devoir. Un élève rencontre donc les tâches de
// la plus familière à la plus ouverte.

import { Difficulty, QUESTION_GRAIN, shapeFor } from "./distribution";
import {
  Blueprint, Distribution, ExerciseBlueprint, ExerciseRole, QuestionSlot, TaskType,
} from "./types";

/** Natures de tâches admises dans un exercice, selon son rôle. */
function allowedTypes(role: ExerciseRole, isLast: boolean): TaskType[] {
  switch (role) {
    // Un QCM ne mesure que la reconnaissance directe d'une propriété.
    case "qcm":
      return ["application"];
    case "algebre":
      return ["application", "raisonnement"];
    case "geometrie":
      return isLast
        ? ["application", "raisonnement", "situation"]
        : ["application", "raisonnement"];
    case "final":
      return ["raisonnement", "situation"];
    default:
      return ["application", "raisonnement", "situation"];
  }
}

/**
 * Découpe un budget de points en questions d'une même nature.
 * Une situation-problème n'est jamais découpée: c'est une tâche unique.
 * Un QCM se compte question par question, un point chacune.
 */
function splitIntoQuestions(taskType: TaskType, points: number, role: ExerciseRole): number[] {
  if (role === "qcm") {
    const whole = Math.floor(points);
    const rest = points - whole;
    const out = Array.from({ length: whole }, () => 1);
    if (rest > 0) out[out.length - 1] += rest;
    return out;
  }
  if (taskType === "situation") return [points];
  const { min, max } = QUESTION_GRAIN[taskType];
  const out: number[] = [];
  let left = points;
  while (left > 0) {
    // La dernière question absorbe le reste tant qu'il reste raisonnable.
    if (left <= max) { out.push(left); break; }
    const take = left - max >= min ? max : Math.max(min, left - min);
    out.push(take);
    left = Math.round((left - take) * 2) / 2;
  }
  return out;
}

/** Construit le plan complet du devoir. */
export function buildBlueprint(
  contentType: string,
  difficulty: Difficulty = "moyen",
): Blueprint | null {
  const shape = shapeFor(contentType, difficulty);
  if (!shape) return null;

  // allocate() renvoie, pour chaque exercice, ses blocs {nature, points}.
  const blocks = allocateBlocks(shape.exercises, shape.distribution);

  const exercises: ExerciseBlueprint[] = shape.exercises.map((e, i) => {
    const slots: QuestionSlot[] = [];
    for (const block of blocks[i]) {
      for (const pts of splitIntoQuestions(block.taskType, block.points, e.role)) {
        slots.push({ index: slots.length + 1, taskType: block.taskType, points: pts });
      }
    }
    return { index: i + 1, role: e.role, points: e.points, slots };
  });

  return {
    contentType,
    total: shape.exercises.reduce((s, e) => s + e.points, 0),
    target: shape.distribution,
    tolerance: shape.tolerance,
    exercises,
  };
}

/**
 * Répartit la distribution cible dans les exercices.
 *
 * On sert d'abord les natures les plus exigeantes, en partant de la fin du
 * sujet: la situation-problème trouve ainsi sa place dans le dernier exercice,
 * le raisonnement remonte vers le milieu, et l'application directe remplit ce
 * qui reste — c'est-à-dire le début. C'est la progression exigée au §4.
 */
function allocateBlocks(
  exercises: { points: number; role: ExerciseRole }[],
  target: Distribution,
): { taskType: TaskType; points: number }[][] {
  const capacity = exercises.map((e) => e.points);
  const filled = exercises.map(() => ({ application: 0, raisonnement: 0, situation: 0 }));
  const left: Distribution = { ...target };

  const place = (taskType: TaskType, order: number[], relaxRole = false) => {
    for (const i of order) {
      if (left[taskType] <= 0) return;
      const isLast = i === exercises.length - 1;
      // Le rôle du QCM ne se relâche jamais: une question à choix multiples
      // ne peut pas demander un raisonnement construit.
      if (exercises[i].role === "qcm") continue;
      if (!relaxRole && !allowedTypes(exercises[i].role, isLast).includes(taskType)) continue;
      const used = filled[i].application + filled[i].raisonnement + filled[i].situation;
      const room = capacity[i] - used;
      if (room <= 0) continue;
      const take = Math.min(room, left[taskType]);
      filled[i][taskType] += take;
      left[taskType] -= take;
    }
  };

  const fromEnd = exercises.map((_, i) => i).reverse();
  const fromStart = exercises.map((_, i) => i);

  // Un QCM est de l'application directe par construction: ses points en sont,
  // quels qu'ils soient. Si la cible prévoit moins d'application que le QCM
  // n'en pèse, c'est la cible qui cède — on emprunte au raisonnement, puis à
  // la situation-problème. Sans cette règle, un devoir « difficile » finirait
  // par demander un raisonnement construit dans un QCM.
  for (const i of fromStart) {
    if (exercises[i].role !== "qcm") continue;
    filled[i].application += capacity[i];
    left.application -= capacity[i];
  }
  if (left.application < 0) {
    let debt = -left.application;
    left.application = 0;
    for (const from of ["raisonnement", "situation"] as const) {
      const take = Math.min(debt, left[from]);
      left[from] -= take;
      debt -= take;
      if (debt <= 0) break;
    }
  }

  // Amorce: hors QCM, un exercice s'ouvre toujours sur une ou deux questions
  // d'application. L'élève entre dans l'exercice par une tâche familière avant
  // qu'on lui demande de choisir une méthode — c'est la progression du §4, et
  // elle vaut À L'INTÉRIEUR d'un exercice autant qu'entre les exercices.
  const OPENER = 2;
  for (const i of fromStart) {
    if (exercises[i].role === "qcm" || exercises[i].role === "final") continue;
    if (left.application <= 0) break;
    const take = Math.min(OPENER, left.application, capacity[i]);
    filled[i].application += take;
    left.application -= take;
  }

  place("situation", fromEnd);
  place("raisonnement", fromEnd);
  place("application", fromStart);
  // Filet: si un rôle trop restrictif a laissé des points sur la table, on
  // relâche la contrainte de rôle plutôt que de rendre un devoir incomplet.
  place("situation", fromEnd, true);
  place("raisonnement", fromEnd, true);
  place("application", fromStart, true);

  const order: TaskType[] = ["application", "raisonnement", "situation"];
  return filled.map((f) => order.filter((t) => f[t] > 0).map((t) => ({ taskType: t, points: f[t] })));
}

/** Résumé lisible du plan, pour l'enseignant et pour les traces serveur. */
export function describeBlueprint(bp: Blueprint): string {
  const lines = bp.exercises.map((e) => {
    const detail = e.slots.map((s) => `${s.points}pt ${s.taskType[0].toUpperCase()}`).join(" + ");
    return `  Ex.${e.index} (${e.role}, ${e.points} pts): ${detail}`;
  });
  return [
    `${bp.contentType} — ${bp.total} points`,
    `  cible: ${bp.target.application} application / ${bp.target.raisonnement} raisonnement / ${bp.target.situation} situation`,
    ...lines,
  ].join("\n");
}
