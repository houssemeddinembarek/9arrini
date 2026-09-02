// ─── Du blueprint au prompt ──────────────────────────────────────────────────
// Le modèle ne reçoit plus « fais un devoir sur 20 »: il reçoit la liste exacte
// des questions à écrire, chacune avec sa nature et son barème, et les
// définitions didactiques qui distinguent ces natures. Il lui reste le travail
// qui lui revient — écrire des mathématiques justes et conformes au programme.

import { Blueprint, ExerciseRole, TASK_LABELS, TaskType } from "./types";
import { Defect, defectList } from "./validate";

const TASK_DEFINITIONS = `**Nature des questions — définitions à respecter à la lettre:**
- **application** (application directe): l'élève connaît directement la règle, la formule, la propriété ou la technique à utiliser. Calcul direct, application immédiate d'une formule, résolution par une méthode déjà étudiée, construction demandée explicitement. L'élève n'a pratiquement pas à chercher la méthode.
- **raisonnement** (application avec raisonnement): la méthode n'est PAS donnée. L'élève doit identifier ce qu'il faut faire et enchaîner plusieurs connaissances — par exemple calculer une première grandeur, puis réutiliser ce résultat dans une seconde relation. Une suite de calculs mécaniques n'est PAS un raisonnement: il faut une véritable décision mathématique.
- **situation** (petite situation-problème): l'élève doit comprendre une situation et CONSTRUIRE une démarche que l'énoncé ne suggère pas. Plusieurs étapes, une donnée à identifier, une méthode à choisir, un résultat à interpréter.

**Piège à éviter absolument:** habiller une application directe d'une histoire n'en fait pas une situation-problème. « Ahmed possède un terrain rectangulaire de 10 m sur 5 m, calculer son périmètre » reste une application directe: la formule et la méthode sont évidentes. Une vraie situation-problème oblige l'élève à décider de sa démarche.`;

const BAREME_RULES = `**Barème:**
- Les points d'une question dépendent de sa complexité mathématique et des compétences mobilisées, JAMAIS du nombre de lignes ni du nombre d'opérations. Une situation-problème à 2 points peut demander plusieurs étapes.
- Le barème imposé ci-dessous n'est pas négociable: chaque question porte exactement les points indiqués.
- Pour chaque question, détaille à quoi servent ses points dans le champ "bareme": identification des données, choix de la démarche, étapes essentielles, résultat et conclusion. Ce détail sert à accorder des points partiels quand la démarche est correcte malgré une erreur de calcul.`;

const ROLE_LABELS: Record<ExerciseRole, string> = {
  qcm: "QCM — questions à choix multiples, 3 propositions chacune, une seule correcte",
  algebre: "Algèbre — calcul, expressions, équations, inéquations, fonctions numériques",
  geometrie: "Géométrie — distances, angles, triangles, cercles, propriétés du chapitre",
  mixte: "Exercice classique",
  final: "Dernier exercice, le plus exigeant: ses questions s'enchaînent, chacune réutilisant le résultat de la précédente",
};

/** Règles d'écriture par rôle, ajoutées seulement si le rôle est présent. */
const ROLE_RULES: Partial<Record<ExerciseRole, string>> = {
  qcm: `**Écriture du QCM:**
- Ouvre par une phrase de consigne SANS étiquette (n'écris jamais « Consigne: », « تعليمة: » ni équivalent).
- Le champ "text" d'une question de QCM contient DEUX lignes: la question seule sur la première (sans numéro), puis TOUTES les propositions sur la seconde, chacune précédée du carré ☐ et séparée par deux espaces:
  ... ?
  ☐ a) ...  ☐ b) ...  ☐ c) ...
- Exactement 3 propositions, une seule correcte. Chaque question porte sur une notion différente du chapitre.`,
  geometrie: `**Écriture de l'exercice de géométrie:** pose les données de la figure directement dans l'énoncé, à la manière d'un sujet officiel (« ABC est un triangle rectangle en A tel que AB = 4 et AC = 3 »). N'annonce jamais que tu décris une figure, et ne demande aucune mesure à la règle: tout se calcule ou se démontre.`,
};

function roleRules(bp: Blueprint): string {
  const roles = [...new Set(bp.exercises.map((e) => e.role))];
  return roles.map((r) => ROLE_RULES[r]).filter(Boolean).join("\n\n");
}

/** Le plan, tel qu'il est imposé au modèle: une ligne par question à écrire. */
export function blueprintBlock(bp: Blueprint, answerLines: boolean): string {
  const exercises = bp.exercises.map((e) => {
    const questions = e.slots
      .map((s) => `    - question ${s.index}: **${s.taskType}** (${TASK_LABELS[s.taskType].fr}) — ${s.points} point(s)`)
      .join("\n");
    return `  **Exercice ${e.index}** — ${ROLE_LABELS[e.role]} — ${e.points} points au total:\n${questions}`;
  }).join("\n");

  return `**PLAN DU DEVOIR — à respecter question par question, sans en ajouter ni en retirer:**
${exercises}

Répartition d'ensemble visée: ${bp.target.application} points d'application directe, ${bp.target.raisonnement} points de raisonnement, ${bp.target.situation} points de situation-problème. Total: ${bp.total} points.

${TASK_DEFINITIONS}

${BAREME_RULES}

${roleRules(bp)}

**Progression:** à l'intérieur d'un exercice comme d'un exercice à l'autre, les questions vont de la plus directe à la plus ouverte. La difficulté doit venir du nombre d'étapes, du choix de la méthode, du nombre de notions mobilisées ou de la familiarité du contexte — jamais de calculs artificiellement longs.

**Écriture des énoncés:** le champ "text" commence directement par la question, sans numéro, sans « Exercice n », sans nommer le type de la question.${
    answerLines
      ? `\n\n**Espace de réponse:** termine chaque question hors QCM par le marqueur [[lignes:1]] ou [[lignes:2]] seul en fin de ligne — 1 pour une réponse courte, 2 pour une réponse rédigée. Aucun marqueur dans le QCM ni dans les solutions.`
      : ""
  }`;
}

/** Schéma JSON attendu, dérivé du blueprint. */
export function paperSchema(bp: Blueprint, withCorrection: boolean): string {
  const first = bp.exercises[0];
  const slot = first.slots[0];
  const solution = withCorrection
    ? `,
          "solution": "Solution rédigée pas à pas, en markdown avec LaTeX. Les calculs doivent être exacts: vérifie-les avant de répondre.",
          "bareme": [{ "points": 0.5, "critere": "Ce que l'élève doit avoir écrit pour gagner ces points" }]`
    : "";

  return `{
  "exercises": [
    {
      "index": ${first.index},
      "questions": [
        {
          "text": "Énoncé de la question, en markdown avec LaTeX. Sans numéro: la numérotation est ajoutée à l'impression.",
          "taskType": "${slot.taskType}",
          "points": ${slot.points},
          "notions": ["notion du programme mobilisée"]${solution}
        }
      ]
    }
  ]
}`;
}

/** Prompt de réparation: le devoir produit, ses défauts, et rien d'autre. */
export function repairPrompt(paperJson: string, defects: Defect[], bp: Blueprint): string {
  return `Le devoir ci-dessous a été produit à partir d'un plan imposé, mais il ne le respecte pas.

--- DEVOIR ACTUEL (JSON) ---
${paperJson}
--- FIN ---

**Défauts à corriger:**
${defectList(defects)}

**Contraintes inchangées:** ${bp.exercises.length} exercices, ${bp.total} points au total, répartition ${bp.target.application}/${bp.target.raisonnement}/${bp.target.situation} (application/raisonnement/situation).

Corrige UNIQUEMENT ce qui est signalé, en gardant tout le reste à l'identique.
Réponds avec le JSON complet du devoir corrigé, au même format, et RIEN d'autre.`;
}

/** Ce que le devoir mobilise, pour la réponse de l'API (exigence §5). */
export function taskTypeLabel(taskType: TaskType, lang: string): string {
  return lang === "arabe" ? TASK_LABELS[taskType].ar : TASK_LABELS[taskType].fr;
}
