import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { getSyllabusGrounding, getChapterOutline } from "@/lib/curriculum";
import { Lang, resolveLanguage } from "@/lib/teaching-language";
import { buildBlueprint, describeBlueprint } from "@/lib/pedagogy/blueprint";
import { Difficulty as Register } from "@/lib/pedagogy/distribution";
import { blueprintBlock, paperSchema, repairPrompt } from "@/lib/pedagogy/prompt";
import { alignPoints, pointsLabel, renderCorrection, renderStatement } from "@/lib/pedagogy/render";
import { Blueprint, GeneratedExercise, GeneratedQuestion, TASK_TYPES, TaskType } from "@/lib/pedagogy/types";
import { computeStats, hasBlockingDefect, summarizeDefects, validatePaper } from "@/lib/pedagogy/validate";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  resume: "Résumé de cours",
  exercices: "Série d'exercices",
  devoir_controle: "Devoir de contrôle",
  devoir_synthese: "Devoir de synthèse",
  fiche_revision: "Fiche de révision",
};

const STRUCTURED_TYPES = new Set(["exercices", "devoir_controle", "devoir_synthese"]);

// Teaching language and the subject families that follow it live in
// @/lib/teaching-language — the PDF header reads the same rule.

// The "write in language X" directive injected into every prompt.
function langDirective(lang: Lang): string {
  if (lang === "arabe") {
    return `Rédige TOUT le contenu textuel en **arabe** (arabe standard moderne), avec la terminologie scientifique scolaire tunisienne.
**L'écriture mathématique reste latine, jamais arabisée**: variables et points en lettres latines (x, y, f, ABC), fonctions en notation internationale (sin, cos, tan, log, lim), chiffres 0-9 — n'utilise JAMAIS س، ص، جا، جتا، ظا ni les chiffres indo-arabes (٠١٢٣).
Toute expression mathématique, même un simple nombre suivi d'une unité ou une longueur (AB = 4), s'écrit entre $...$ (ou $$...$$ pour une formule centrée) — jamais en texte brut, sinon elle s'affiche à l'envers dans un paragraphe arabe.`;
  }
  const name = lang === "anglais" ? "anglais" : lang === "allemand" ? "allemand" : "français";
  return `Langue: ${name}. Terminologie conforme aux manuels scolaires tunisiens officiels.`;
}

// ── Discipline families ─────────────────────────────────────────────────────
// The Ministry's exam conventions differ by family: a maths DS is built from
// calculation and proof, a Français DS from a support text, a Histoire-Géo DS
// from a document to analyse. Each family injects its own block of rules on
// top of the shared "tronc commun".

type Discipline = "scientifique" | "litteraire" | "sciences_humaines";

const SUBJECT_DISCIPLINE: Record<string, Discipline> = {
  "Mathématiques": "scientifique",
  "Physique-Chimie": "scientifique",
  "Physique": "scientifique",
  "Chimie": "scientifique",
  "Sciences de la vie et de la terre (SVT)": "scientifique",
  "Informatique": "scientifique",
  "Technologie": "scientifique",
  "Français": "litteraire",
  "Arabe": "litteraire",
  "Anglais": "litteraire",
  "Allemand": "litteraire",
  "Histoire-Géographie": "sciences_humaines",
  "Philosophie": "sciences_humaines",
  "Education Physique et Sportive": "sciences_humaines",
};

function resolveDiscipline(subject: string): Discipline {
  return SUBJECT_DISCIPLINE[subject] ?? "scientifique";
}

// Literary and human-sciences papers hand the pupil a support document (text,
// extract, data, map) before the questions; scientific ones do not.
function needsDocument(discipline: Discipline): boolean {
  return discipline !== "scientifique";
}

function disciplineBlock(discipline: Discipline): string {
  switch (discipline) {
    case "scientifique":
      return `**Consignes propres aux matières scientifiques:**
- Toutes les formules en LaTeX ($...$ en ligne, $$...$$ en bloc).
- Corrigé détaillé montrant chaque étape de calcul, mathématiquement exact.
- Varier les registres: calcul, démonstration, application à une situation concrète.`;
    case "litteraire":
      return `**Consignes propres aux matières littéraires:**
- Fournis un texte support (ou un extrait) dans le champ "document" dès que le sujet s'y prête.
- Enchaîne les questions dans l'ordre officiel: compréhension, puis langue, puis production écrite.
- Le corrigé donne les **éléments de réponse attendus** (idées, arguments, critères d'évaluation), jamais une réponse unique figée.`;
    case "sciences_humaines":
      return `**Consignes propres aux sciences humaines:**
- Fournis un document d'appui dans le champ "document": texte, série de données chiffrées, ou description précise d'une carte ou d'un graphique.
- Les questions portent sur l'analyse du document et le raisonnement, pas sur la restitution de cours seule.
- Le corrigé donne les **idées-clés attendues** et le plan de réponse.`;
  }
}

// The shared core, present in every generated paper.
/**
 * The Ministry's own programme for this class, quoted into the prompt.
 *
 * Without it the model writes from recollection of "the Tunisian syllabus";
 * with it, the chapter boundaries, vocabulary and required competencies come
 * from the document that actually governs the class.
 */
/**
 * Le périmètre du devoir, tel que l'enseignant l'a coché dans le sommaire du
 * manuel. C'est plus précis qu'un titre de chapitre: on nomme les paragraphes
 * du programme, et rien d'autre n'a le droit d'entrer dans le sujet.
 */
function scopeBlock(notions: string[]): string {
  if (!notions.length) return "";
  return `
**Périmètre exact du devoir** — paragraphes du programme retenus par l'enseignant:
${notions.map((n) => `- ${n}`).join("\n")}
Le devoir n'évalue QUE ces paragraphes. N'introduis aucune autre notion, même connexe,
même déjà étudiée. Chaque question doit se rattacher à l'un d'eux, et le champ "notions"
de chaque question reprend celui ou ceux qu'elle mobilise.
`;
}

function syllabusBlock(subject: string, level: string, title: string): string {
  const g = getSyllabusGrounding(subject, level, title);

  // The textbook's chapter list, where one could be extracted. It keeps the
  // model inside the year's actual topics and makes it name them the way the
  // pupil's own book does. Coverage is thin today, so this is additive only.
  const outline = getChapterOutline(subject, level);
  const outlineBlock = outline.length
    ? `\n**Chapitres du manuel scolaire pour ce niveau:**\n${outline.map((c) => `- ${c}`).join("\n")}\n` +
      `N'introduis aucun chapitre absent de cette liste.\n`
    : "";

  if (!g.found) return outlineBlock;

  return `${outlineBlock}
**Programme officiel applicable** (extrait de ${g.source?.file}, Ministère de l'Éducation):
"""
${g.excerpt}
"""
Traite le chapitre en respectant STRICTEMENT le périmètre, le vocabulaire et les
compétences décrits ci-dessus. Si le programme ne mentionne pas une notion, ne
l'introduis pas.
`;
}

function troncCommun(withCorrection: boolean): string {
  return `Tu es un professeur tunisien chevronné qui rédige des devoirs conformes au programme officiel du Ministère de l'Éducation tunisien.
- Tu couvres UNIQUEMENT les chapitres et notions fournis dans le contexte ci-dessous.
- Tu respectes le type de devoir demandé (devoir de contrôle court / devoir de synthèse long).
- Le barème total des exercices est exact.
${withCorrection
  ? "- Tu fournis un corrigé ou des éléments de réponse pour chaque partie."
  : "- Tu produis le sujet SEUL, sans aucun corrigé ni élément de réponse."}
- Tu écris comme un sujet officiel, sans phrase méta ni consigne artificielle. Sont INTERDITES:
  • les annonces de description ("فيما يلي وصف لشكل هندسي", "voici la description d'une figure", "on considère la figure suivante décrite ci-dessous");
  • les mesures à la règle ou au rapporteur ("بالقياس المباشر بالمسطرة", "par mesure directe à la règle") — tout se calcule ou se démontre;
  • les longueurs de réponse imposées ("بجملة واحدة", "en une seule phrase", "en une ligne", "en deux mots").
- Tu réponds UNIQUEMENT en JSON valide.`;
}

// La forme du devoir (nombre d'exercices, barème) et sa répartition cognitive
// vivent dans @/lib/pedagogy/distribution — un seul endroit à modifier pour
// faire évoluer les règles par niveau et par type de devoir.

// ── Style d'énoncé ──────────────────────────────────────────────────────────
// Verbes relevés dans les 1093 sujets de maths lisibles du corpus
// (src/curriculum): un énoncé tunisien s'écrit avec ce vocabulaire-là, et
// enchaîne ses questions par "بيّن أن … استنتج أن …" / "montrer que … en déduire que …".

const STYLE_AR = `**Style d'énoncé (conforme aux sujets tunisiens):**
- Utilise les verbes de consigne du corpus officiel: احسب، بيّن أنّ، استنتج، أثبت، عيّن، ابن، ارسم، حدّد، علّل، اكتب، قارن، انشر، فكّك.
- Enchaîne les questions: une question établit un résultat (بيّن أنّ...) et la suivante l'exploite (استنتج أنّ...).
- Questions courtes et directes, à l'impératif, sans phrase d'introduction ni commentaire pédagogique.`;

const STYLE_FR = `**Style d'énoncé (conforme aux sujets tunisiens):**
- Utilise les verbes de consigne du corpus officiel: calculer, montrer que, en déduire que, déterminer, vérifier, justifier, résoudre, étudier, construire, tracer, développer, factoriser.
- Enchaîne les questions: une question établit un résultat ("Montrer que...") et la suivante l'exploite ("En déduire que...").
- Questions courtes et directes, à l'impératif, sans phrase d'introduction ni commentaire pédagogique.`;

function styleBlock(lang: Lang): string {
  return lang === "arabe" ? STYLE_AR : STYLE_FR;
}

// ── Exercices de géométrie ──────────────────────────────────────────────────
// A geometry exercise in a Tunisian paper is ONE configuration — a figure set up
// once — followed by parts that build on each other: part 2 uses what part 1
// established, part 3 uses part 2. The model's natural output is the opposite:
// a list of independent questions that happen to share a chapter, each restating
// its own figure. That reads nothing like the real papers in src/curriculum, so
// geometry gets an explicit structural rule rather than a style hint.

const GEOMETRY_KEYWORDS =
  /g[ée]om[ée]tri|triangle|cercle|droite|angle|vecteur|thal[èe]s|pythagore|sym[ée]tri|translation|rotation|homoth[ée]ti|parall[ée]logramme|quadrilat[èe]re|losange|rectangle|carr[ée]|espace|pyramide|cube|sph[èe]re|c[ôo]ne|cylindre|rep[èe]re|coordonn[ée]es|m[ée]diatrice|bissectrice|hauteur|m[ée]diane|isom[ée]tri|similitude|configuration|trigonom[ée]tri|هندس|مثلث|دائرة|مستقيم|زاوية|متجهة|طالس|فيثاغور|تناظر|انسحاب|دوران|تحاك|متوازي الأضلاع|رباعي|فضاء|هرم|مكعب|كرة|مخروط|أسطوانة|معلم|إحداثيات|واسط|منصف|ارتفاع|متوسط|مثلثية/i;

function isGeometryTopic(title: string, notes: string): boolean {
  return GEOMETRY_KEYWORDS.test(`${title} ${notes}`);
}

const GEOMETRY_FR = `**Structure OBLIGATOIRE d'un exercice de géométrie:**
- L'exercice s'ouvre sur UNE SEULE configuration posée une fois pour toutes: la figure,
  les points, les données (longueurs, angles, parallélismes, appartenances). Tout
  l'exercice se déroule sur cette même figure.
- Viennent ensuite des questions NUMÉROTÉES 1), 2), 3)... (sous-questions a), b), c)
  quand c'est utile) qui **s'enchaînent**: la question 2 exploite le résultat établi
  en 1, la 3 exploite la 2. Emploie explicitement "En déduire que...", "D'après la
  question 1...", "Montrer alors que...".
- INTERDIT: une suite de questions indépendantes qui redéfinissent chacune leur
  propre figure, ou qui pourraient être traitées dans n'importe quel ordre. Si une
  question peut être supprimée sans gêner les suivantes, l'exercice est mal construit.
- La progression va du constat vers la démonstration: on calcule ou on observe
  d'abord, on démontre ensuite, on généralise ou on conclut en dernier.`;

const GEOMETRY_AR = `**البنية الإجبارية لتمرين في الهندسة:**
- يبدأ التمرين بوضعية هندسية واحدة تُعطى مرّة واحدة: الشكل، النقط، المعطيات
  (الأطوال، الزوايا، التوازي، الانتماء). كلّ التمرين يجري على نفس الشكل.
- ثمّ أسئلة مرقّمة 1) و2) و3)... (وأسئلة فرعية أ) ب) ج) عند الحاجة) **يتبع بعضها بعضا**:
  السؤال 2 يستثمر ما أثبته السؤال 1، والسؤال 3 يستثمر السؤال 2. استعمل صراحة
  "استنتج أنّ..."، "بالاعتماد على السؤال 1..."، "بيّن حينئذ أنّ...".
- ممنوع: سلسلة أسئلة مستقلّة يعيد كلّ واحد منها تعريف شكله الخاصّ، أو يمكن حلّها
  بأيّ ترتيب. إذا أمكن حذف سؤال دون أن يتأثّر ما بعده فالتمرين سيّئ البناء.
- التدرّج من الملاحظة إلى البرهان: نحسب أو نلاحظ أوّلا، ثمّ نبرهن، ثمّ نستنتج أو نعمّم.`;

function geometryBlock(lang: Lang): string {
  return lang === "arabe" ? GEOMETRY_AR : GEOMETRY_FR;
}

// ── Niveau de difficulté ────────────────────────────────────────────────────
// The same chapter is not asked the same way in a collège de quartier and in a
// collège pilote; the teacher picks the register.

type Difficulty = "facile" | "moyen" | "difficile";

const DIFFICULTY_BLOCKS: Record<Difficulty, string> = {
  facile: `**Niveau de difficulté: FACILE.** Applications directes du cours, une seule notion par question, valeurs numériques simples (entiers, fractions usuelles). Chaque question rappelle implicitement la méthode à appliquer. Aucune question à plusieurs étapes.`,
  moyen: `**Niveau de difficulté: MOYEN.** Le registre habituel d'un devoir officiel: deux notions à combiner par exercice, quelques questions en deux étapes, valeurs numériques réalistes.`,
  difficile: `**Niveau de difficulté: DIFFICILE.** Devoir exigeant (classe pilote): raisonnements à construire, questions en plusieurs étapes qui s'enchaînent, cas particuliers et discussions, démonstrations demandées. Reste STRICTEMENT dans le programme du chapitre — plus exigeant ne veut pas dire hors-programme.`,
};

function resolveDifficulty(value: unknown): Difficulty {
  return value === "facile" || value === "difficile" ? value : "moyen";
}

// ── Espace de réponse sur le sujet ──────────────────────────────────────────
// Mesuré sur le corpus (src/curriculum, 1093 sujets de maths lisibles): l'élève
// répond sur la feuille en 7ème (90 %), en 8ème (73 %) et encore en 9ème (50 %),
// tandis qu'au lycée on répond sur une copie séparée (18 %). C'est donc le
// défaut au primaire et au collège, que l'enseignant reste libre de changer.

function answerLinesByDefault(level: string): boolean {
  return /primaire|base/i.test(level);
}

const ANSWER_LINES_BLOCK = `
**Espace de réponse sur le sujet** (à ce niveau l'élève écrit directement sur la feuille):
Après CHAQUE question des exercices — le QCM excepté — insère seul sur sa ligne le marqueur
[[lignes:1]] ou [[lignes:2]]: 1 pour une réponse courte (un calcul, un résultat, une valeur),
2 pour une réponse rédigée (une justification, une démonstration, une construction).
Aucun marqueur dans le QCM (l'élève y coche), aucun dans le champ "correction".
`;

/** Where the paper sits in the year: which trimestre, and which DC of it. */
type PaperIdentity = { devoirNumber?: number; trimester?: number };

function paperIdentityLabel(contentType: string, paper: PaperIdentity): string {
  const parts: string[] = [];
  if (contentType === "devoir_controle" && paper.devoirNumber) parts.push(`n°${paper.devoirNumber}`);
  if (paper.trimester) parts.push(`du ${paper.trimester === 1 ? "1er" : `${paper.trimester}ème`} trimestre`);
  return parts.length ? ` ${parts.join(" ")}` : "";
}

// Un devoir remis à l'élève ne contient pas de résumé de cours: seuls les
// énoncés (et, pour le professeur, le corrigé) sont imprimés.
function needsSummary(contentType: string): boolean {
  return contentType === "exercices";
}

// ── Prompt builders ─────────────────────────────────────────────────────────

function buildMarkdownPrompt(subject: string, level: string, contentType: string, title: string, notes: string, lang: Lang, difficulty: Difficulty = "moyen"): string {
  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType;

  let typeInstructions = "";
  if (contentType === "resume") {
    typeInstructions = `Rédige un résumé de cours complet incluant:
- Les objectifs du cours
- Les définitions clés (numérotées)
- Les théorèmes et propriétés importants (avec démonstrations si approprié)
- Les formules et règles essentielles
- Des exemples résolus pas à pas (au moins 2-3)
- Un résumé synthétique en fin de document`;
  } else {
    typeInstructions = `Crée une fiche de révision synthétique incluant:
- Les points clés à retenir (format bullet points)
- Les formules et théorèmes essentiels dans des encadrés
- Un tableau récapitulatif si pertinent
- Des astuces et méthodes pour les examens
- Les erreurs courantes à éviter
- Des QCM de vérification (10 questions avec réponses)`;
  }

  return `Tu es un professeur expert du système éducatif tunisien (Ministère de l'Éducation Nationale).
Crée un document pédagogique de haute qualité, conforme aux programmes officiels tunisiens.

**Document:**
- Matière: ${subject}
- Niveau: ${level}
- Type: ${typeLabel}
- Titre/Chapitre: ${title}
${notes ? `- Instructions: ${notes}` : ""}
${syllabusBlock(subject, level, title)}
**Contenu requis:**
${typeInstructions}

${DIFFICULTY_BLOCKS[difficulty]}

**Format OBLIGATOIRE:**
- ${langDirective(lang)}
- Structure claire avec ## pour les parties, ### pour les sous-parties
- **Formules: notation LaTeX entre $...$ inline et $$...$$ display**
- Commence directement par le titre, sans introduction méta

Génère maintenant le document complet:`;
}

function buildStructuredPrompt(subject: string, level: string, contentType: string, title: string, notes: string, withCorrection: boolean, lang: Lang, discipline: Discipline, paper: PaperIdentity = {}, difficulty: Difficulty = "moyen", withAnswerLines = false): string {
  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType;
  const isDevoir = contentType === "devoir_controle" || contentType === "devoir_synthese";
  const duration =
    contentType === "devoir_controle" ? "devoir de contrôle COURT — 1 heure, noté sur 20" :
    contentType === "devoir_synthese" ? "devoir de synthèse LONG — 2 heures, noté sur 20" :
    "série d'exercices d'application";
  const exerciseCount = contentType === "exercices" ? 10 : contentType === "devoir_controle" ? 3 : 4;
  const withSummary = needsSummary(contentType);

  // Scientific corrections are step-by-step solutions; literary and human-
  // sciences ones are the expected answer elements, not a single fixed answer.
  const correctionLabel = discipline === "scientifique"
    ? "Correction détaillée et rédigée pas-à-pas pour l'exercice 1, en markdown avec LaTeX."
    : "Éléments de réponse attendus pour l'exercice 1 (idées-clés, arguments, critères d'évaluation), en markdown.";

  // The exercise object and the correction rule change when the teacher wants
  // the énoncés only (no solutions) — e.g. a blank exam paper to hand out.
  const exerciseShape = withCorrection
    ? `{
      "statement": "Énoncé complet de l'exercice 1 en markdown: la situation posée une fois, puis des questions numérotées 1), 2), 3)… qui s'enchaînent (chacune exploite la précédente), avec sous-questions a), b), c) au besoin. LaTeX entre $...$ ou $$...$$.",
      "correction": "${correctionLabel}",
      "points": "${pointsLabel(4, lang)}"
    }`
    : `{
      "statement": "Énoncé complet de l'exercice 1 en markdown: la situation posée une fois, puis des questions numérotées 1), 2), 3)… qui s'enchaînent (chacune exploite la précédente), avec sous-questions a), b), c) au besoin. LaTeX entre $...$ ou $$...$$.",
      "points": "${pointsLabel(4, lang)}"
    }`;
  const correctionRule = withCorrection
    ? (discipline === "scientifique"
        ? `- Chaque exercice doit avoir une correction COMPLÈTE et rédigée, pas juste la réponse finale.`
        : `- Chaque exercice doit avoir ses éléments de réponse attendus, formulés comme une grille pour le correcteur.`)
    : `- NE génère AUCUNE correction ni solution. Fournis UNIQUEMENT les énoncés — n'inclus pas de champ "correction".`;

  // The support document only exists for literary / human-sciences papers.
  const documentField = needsDocument(discipline)
    ? `  "document": "${discipline === "litteraire"
        ? "Texte support ou extrait à remettre à l'élève, en markdown (titre, auteur, source si connus). Chaîne vide si le sujet n'en requiert pas."
        : "Document d'appui à analyser: texte, données chiffrées en tableau markdown, ou description précise d'une carte / d'un graphique. Chaîne vide si le sujet n'en requiert pas."}",\n`
    : "";

  // A devoir is the paper the pupil receives — it carries no course summary.
  const summaryField = withSummary
    ? `  "summary": "Markdown du résumé de cours préparatoire: objectifs, définitions clés, notions et méthodes mobilisées. Utilise ##, ###, **, et des listes${discipline === "scientifique" ? ", avec LaTeX entre $...$ ou $$...$$" : ""}.",\n`
    : "";

  const baremeRule = isDevoir
      ? `- Barème EXACT: la somme des "points" des ${exerciseCount} exercices doit valoir exactement 20. Refais l'addition avant de répondre.`
      : `- Indique un barème indicatif par exercice dans le champ "points".`;

  const structureRule = `- Génère exactement ${exerciseCount} exercices progressifs (du plus simple au plus complexe).`;

  const summaryRule = withSummary
    ? `\n- Le champ "summary" est un cours condensé conforme au programme tunisien sur "${title}".`
    : `\n- N'inclus AUCUN résumé de cours: un devoir ne contient que les énoncés${withCorrection ? " et le corrigé" : ""}. Pas de champ "summary".`;

  return `${troncCommun(withCorrection)}

**Devoir à produire:**
- Matière: ${subject}
- Niveau: ${level}
- Type: ${typeLabel}${paperIdentityLabel(contentType, paper)} (${duration})
- Chapitre / notions à couvrir: ${title}${notes ? `\n- Contraintes supplémentaires: ${notes}` : ""}
${syllabusBlock(subject, level, title)}
${disciplineBlock(discipline)}
${styleBlock(lang)}
${discipline === "scientifique" && isGeometryTopic(title, notes) ? geometryBlock(lang) : ""}
${DIFFICULTY_BLOCKS[difficulty]}
${withAnswerLines ? ANSWER_LINES_BLOCK : ""}
**Réponds UNIQUEMENT avec un objet JSON valide** (pas de texte avant/après, pas de \`\`\`json fence), au format exact:

{
${documentField}${summaryField}  "exercises": [
    ${exerciseShape}
  ]
}

**Règles strictes:**
${structureRule}
${baremeRule}
${correctionRule}
- Ne traite QUE le chapitre "${title}" — n'introduis aucune notion hors de ce chapitre.${summaryRule}
- ${langDirective(lang)}${discipline === "scientifique" ? "\n- LaTeX OBLIGATOIRE pour toute formule mathématique." : ""}
- Échappe correctement les caractères dans les chaînes JSON (\\n pour les sauts de ligne, \\" pour les guillemets, \\\\ pour les backslash LaTeX → écris $\\\\frac{a}{b}$ dans le JSON).
- AUCUN texte hors JSON. La réponse DOIT être parsable par JSON.parse().`;
}

/**
 * Prompt de génération d'un devoir scientifique, piloté par le blueprint.
 *
 * Il partage tout le contexte de l'ancien prompt (programme officiel, langue,
 * discipline, style d'énoncé, difficulté) mais remplace la consigne « fais un
 * devoir sur 20 » par la liste exacte des questions à écrire, chacune avec sa
 * nature didactique et son barème.
 */
function buildBlueprintPrompt(
  subject: string, level: string, contentType: string, title: string, notes: string,
  withCorrection: boolean, lang: Lang, discipline: Discipline, bp: Blueprint,
  paper: PaperIdentity, difficulty: Register, withAnswerLines: boolean, notions: string[] = [],
): string {
  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType;
  const duration = contentType === "devoir_controle" ? "1 heure" : "2 heures";

  return `${troncCommun(withCorrection)}

**Devoir à produire:**
- Matière: ${subject}
- Niveau: ${level}
- Type: ${typeLabel}${paperIdentityLabel(contentType, paper)} — ${duration}, noté sur ${bp.total}
- Chapitre / notions à couvrir: ${title}${notes ? `\n- Contraintes supplémentaires: ${notes}` : ""}
${syllabusBlock(subject, level, [title, ...notions].join(" "))}
${scopeBlock(notions)}
${disciplineBlock(discipline)}
${styleBlock(lang)}
${discipline === "scientifique" && isGeometryTopic(title, notes) ? geometryBlock(lang) : ""}
${DIFFICULTY_BLOCKS[difficulty]}

${blueprintBlock(bp, withAnswerLines)}

**Réponds UNIQUEMENT avec un objet JSON valide** (pas de texte avant/après, pas de \`\`\`json fence), au format exact — un objet par exercice, dans l'ordre du plan, et pour chacun autant de questions que le plan en prévoit:

${paperSchema(bp, withCorrection)}

**Règles strictes:**
- Respecte le plan question par question: même nombre d'exercices, même nombre de questions, mêmes natures, mêmes points.
- ${notions.length ? "Reste STRICTEMENT dans le périmètre listé ci-dessus" : `Ne traite QUE le chapitre "${title}"`} et n'introduis aucune notion qui n'a pas encore été étudiée à ce niveau.
- Vérifie tes calculs avant de répondre: chaque solution doit être mathématiquement exacte, unités comprises.${
  withCorrection ? "" : "\n- N'inclus NI \"solution\" NI \"bareme\": le sujet est distribué sans corrigé."}
- ${langDirective(lang)}
- LaTeX OBLIGATOIRE pour toute formule mathématique.
- Échappe correctement les caractères dans les chaînes JSON (\\n pour les sauts de ligne, \\" pour les guillemets, \\\\ pour les backslash LaTeX → écris $\\\\frac{a}{b}$ dans le JSON).
- AUCUN texte hors JSON. La réponse DOIT être parsable par JSON.parse().`;
}

// ── Lecture du JSON produit ─────────────────────────────────────────────────

function asTaskType(value: unknown, fallback: TaskType): TaskType {
  return TASK_TYPES.includes(value as TaskType) ? (value as TaskType) : fallback;
}

/** Normalise la réponse du modèle en exercices typés, alignés sur le plan. */
function readGeneratedPaper(parsed: unknown, bp: Blueprint): GeneratedExercise[] {
  const raw = (parsed as { exercises?: unknown[] })?.exercises;
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, bp.exercises.length).map((item, i) => {
    const plan = bp.exercises[i];
    const questions = Array.isArray((item as { questions?: unknown[] })?.questions)
      ? ((item as { questions: unknown[] }).questions)
      : [];

    const parsedQuestions: GeneratedQuestion[] = questions.map((q, j) => {
      const o = (q ?? {}) as Record<string, unknown>;
      const slot = plan?.slots[j];
      const bareme = Array.isArray(o.bareme)
        ? (o.bareme as unknown[]).map((b) => {
            const bo = (b ?? {}) as Record<string, unknown>;
            return {
              points: typeof bo.points === "number" ? bo.points : 0,
              critere: typeof bo.critere === "string" ? bo.critere : "",
            };
          }).filter((b) => b.critere)
        : [];
      return {
        text: typeof o.text === "string" ? o.text : "",
        taskType: asTaskType(o.taskType, slot?.taskType ?? "application"),
        points: typeof o.points === "number" ? o.points : slot?.points ?? 0,
        solution: typeof o.solution === "string" ? o.solution : "",
        bareme,
        notions: Array.isArray(o.notions) ? (o.notions as unknown[]).filter((n): n is string => typeof n === "string") : [],
      };
    }).filter((q) => q.text.trim());

    return {
      index: plan?.index ?? i + 1,
      role: plan?.role ?? "mixte",
      points: plan?.points ?? 0,
      questions: plan ? alignPoints(parsedQuestions, plan.slots) : parsedQuestions,
    };
  });
}

// ── Mock fallback ───────────────────────────────────────────────────────────

function buildMockMarkdown(subject: string, level: string, contentType: string, title: string): string {
  const typeLabel = CONTENT_TYPE_LABELS[contentType] || contentType;
  return `## ${typeLabel} — ${subject}

**Niveau:** ${level} | **Chapitre:** ${title}

---

> ⚠️ Mode démonstration — Configurez \`ANTHROPIC_API_KEY\` ou \`GEMINI_API_KEY\` dans \`.env.local\`.

## I. Points clés

- Concept fondamental de **${title}**
- Formule générale: $f(x) = ax^2 + bx + c$, $\\Delta = b^2 - 4ac$

## II. Astuces

- Mémoriser les identités remarquables
- Vérifier le signe du discriminant
`;
}

function mockPoints(idx: number) {
  return Math.max(2, Math.min(6, 2 + (idx % 4)));
}

function buildMockStructured(
  subject: string, level: string, contentType: string, title: string,
  withCorrection: boolean, discipline: Discipline, lang: Lang, difficulty: Register,
) {
  const bp = discipline === "scientifique" ? buildBlueprint(contentType, difficulty) : null;

  // Sans plan (matières littéraires, série d'exercices), on garde la maquette
  // simple d'autrefois: 10 exercices d'illustration.
  if (!bp) {
    return {
      document: needsDocument(discipline)
        ? `## Document support\n\n> ⚠️ Mode démonstration — configurez une clé API.\n\nExtrait / document d'appui sur **${title}**.`
        : "",
      summary: needsSummary(contentType)
        ? `## Résumé — ${title}\n\n**Matière:** ${subject} • **Niveau:** ${level}\n\n> ⚠️ Mode démonstration — configurez une clé API.`
        : "",
      exercises: Array.from({ length: 10 }, (_, i) => ({
        statement: `Résoudre l'équation $x^2 - ${i + 2}x + ${i + 1} = 0$.`,
        correction: withCorrection ? `$\\Delta = ${(i + 2) ** 2 - 4 * (i + 1)}$` : "",
        points: pointsLabel(mockPoints(i), lang),
      })),
    };
  }

  // Avec plan: on remplit chaque créneau, pour que la maquette montre la vraie
  // structure du devoir (natures de tâches et barème compris).
  const exercises = bp.exercises.map((plan) => {
    const questions: GeneratedQuestion[] = plan.slots.map((slot) => ({
      text: plan.role === "qcm"
        ? `L'équation $x^2-4=0$ admet:\n☐ a) une solution  ☐ b) deux solutions  ☐ c) aucune solution`
        : `[${slot.taskType}] Question de démonstration sur **${title}** ($x^2-5x+6=0$).`,
      taskType: slot.taskType,
      points: slot.points,
      solution: withCorrection ? `Mode démonstration — configurez \`ANTHROPIC_API_KEY\`.` : "",
      bareme: withCorrection ? [{ points: slot.points, critere: "Démarche et résultat" }] : [],
      notions: [title],
    }));
    const exercise: GeneratedExercise = { index: plan.index, role: plan.role, points: plan.points, questions };
    return {
      statement: renderStatement(exercise),
      correction: withCorrection ? renderCorrection(exercise, lang) : "",
      points: pointsLabel(plan.points, lang),
      questions,
    };
  });

  return { document: "", summary: "", exercises };
}

// ── AI callers ──────────────────────────────────────────────────────────────

async function callAnthropic(prompt: string, json: boolean): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: json ? 8192 : 4096,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    console.warn("Anthropic failed:", await response.text());
    return null;
  }
  const data = await response.json();
  return data?.content?.[0]?.text || null;
}

async function callGemini(prompt: string, json: boolean): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: json ? 8192 : 4096,
          temperature: 0.7,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );
  if (!response.ok) {
    console.error("Gemini error:", await response.text());
    return null;
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function extractJson(text: string): unknown | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ── Route ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "teacher" && !isAdmin(session.role)) {
      return NextResponse.json({ success: false, error: "Teachers only" }, { status: 403 });
    }

    const { subject, level, contentType, title, notes, withCorrection, devoirNumber, trimester, difficulty, answerLines, notions } = await request.json();
    if (!subject || !level || !contentType || !title?.trim()) {
      return NextResponse.json({ success: false, error: "Champs requis manquants" }, { status: 400 });
    }
    // Énoncés + corrections by default; the teacher can ask for énoncés only.
    const includeCorrection = withCorrection !== false;
    // Tunisian curriculum: Arabic for sciences up to collège, French from lycée.
    const lang = resolveLanguage(subject, level);
    // Literary / human-sciences papers are built around a support document.
    const discipline = resolveDiscipline(subject);
    const withAnswerLines = typeof answerLines === "boolean" ? answerLines : answerLinesByDefault(level);
    const register = resolveDifficulty(difficulty) as Register;
    // Paragraphes du manuel cochés par l'enseignant — le périmètre du devoir.
    const scope: string[] = Array.isArray(notions)
      ? (notions as unknown[]).filter((n): n is string => typeof n === "string" && n.trim().length > 0).slice(0, 40)
      : [];
    // Étape 2 — le plan pédagogique du devoir, calculé sans IA. Il n'existe
    // que pour les devoirs scientifiques; tout le reste garde son chemin.
    const blueprint = discipline === "scientifique" ? buildBlueprint(contentType, register) : null;
    const paper: PaperIdentity = {
      devoirNumber: Number.isInteger(devoirNumber) ? (devoirNumber as number) : undefined,
      trimester: Number.isInteger(trimester) ? (trimester as number) : undefined,
    };

    const useStructured = STRUCTURED_TYPES.has(contentType);
    const hasKey = !!(process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY);

    // No keys → mock
    if (!hasKey) {
      return NextResponse.json({
        success: true,
        data: useStructured
          ? { format: "structured", structured: buildMockStructured(subject, level, contentType, title, includeCorrection, discipline, lang, register), withCorrection: includeCorrection, language: lang, discipline }
          : { format: "markdown", content: buildMockMarkdown(subject, level, contentType, title), language: lang, discipline },
      });
    }

    // ── Devoir scientifique: génération pilotée par le plan ────────────────
    // Étapes 3 à 5 — générer les questions, valider, réparer si nécessaire.
    if (useStructured && blueprint) {
      const prompt = buildBlueprintPrompt(
        subject, level, contentType, title, notes || "", includeCorrection,
        lang, discipline, blueprint, paper, register, withAnswerLines, scope,
      );
      const first = (await callAnthropic(prompt, true)) || (await callGemini(prompt, true));
      if (!first) {
        return NextResponse.json({ success: false, error: "Service IA indisponible" }, { status: 502 });
      }

      let exercises = readGeneratedPaper(extractJson(first), blueprint);
      if (exercises.length === 0 || exercises.every((e) => e.questions.length === 0)) {
        console.error("Blueprint generation returned nothing usable:", first.slice(0, 400));
        return NextResponse.json({ success: false, error: "L'IA n'a pas renvoyé un devoir exploitable" }, { status: 502 });
      }

      // Ce contre quoi les notions déclarées par le modèle sont vérifiées: les
      // paragraphes cochés quand il y en a — c'est le périmètre exact — sinon
      // l'extrait du programme officiel, plus flou.
      const grounding = getSyllabusGrounding(subject, level, [title, ...scope].join(" "));
      const validateOptions = {
        answerLines: withAnswerLines,
        withCorrection: includeCorrection,
        allowedNotions: scope.length
          ? scope
          : grounding.found && grounding.excerpt ? [grounding.excerpt] : [],
      };

      let defects = validatePaper(exercises, blueprint, validateOptions);

      // Une seule passe de réparation: on renvoie au modèle son propre devoir
      // accompagné de la liste de ses défauts. Au-delà, le rapport
      // coût/bénéfice s'inverse et le repli déterministe suffit.
      if (hasBlockingDefect(defects)) {
        console.warn("Devoir non conforme au plan —", summarizeDefects(defects));
        const repair = repairPrompt(JSON.stringify({ exercises }, null, 1), defects, blueprint);
        const second = (await callAnthropic(repair, true)) || (await callGemini(repair, true));
        if (second) {
          const repaired = readGeneratedPaper(extractJson(second), blueprint);
          const repairedDefects = repaired.length ? validatePaper(repaired, blueprint, validateOptions) : defects;
          // On ne garde la réparation que si elle améliore réellement le devoir.
          if (repaired.length && repairedDefects.filter((d) => d.severity === "error").length
              < defects.filter((d) => d.severity === "error").length) {
            exercises = repaired;
            defects = repairedDefects;
          }
        }
      }

      // Repli déterministe: le barème du plan prime toujours à l'affichage, de
      // sorte que le devoir imprimé totalise exactement ses points.
      const structured = {
        document: "",
        summary: "",
        exercises: exercises.map((exercise, i) => ({
          statement: renderStatement(exercise),
          correction: includeCorrection ? renderCorrection(exercise, lang) : "",
          points: pointsLabel(blueprint.exercises[i]?.points ?? exercise.points, lang),
          questions: exercise.questions,
        })),
      };

      return NextResponse.json({
        success: true,
        data: {
          format: "structured",
          structured,
          withCorrection: includeCorrection,
          language: lang,
          discipline,
          difficulty: register,
          answerLines: withAnswerLines,
          // Étape 5 — ce que le devoir contient réellement, et ce qui reste
          // imparfait après réparation (exigence §5).
          blueprint: {
            total: blueprint.total,
            target: blueprint.target,
            plan: describeBlueprint(blueprint),
          },
          stats: computeStats(exercises),
          warnings: defects.map((d) => ({ code: d.code, severity: d.severity, message: d.message })),
        },
      });
    }

    // ── Chemin historique: matières littéraires, série d'exercices, résumés ──
    const prompt = useStructured
      ? buildStructuredPrompt(subject, level, contentType, title, notes || "", includeCorrection, lang, discipline, paper, register, withAnswerLines)
      : buildMarkdownPrompt(subject, level, contentType, title, notes || "", lang, register);

    const raw = (await callAnthropic(prompt, useStructured)) || (await callGemini(prompt, useStructured));
    if (!raw) {
      return NextResponse.json({ success: false, error: "Service IA indisponible" }, { status: 502 });
    }

    if (useStructured) {
      const parsed = extractJson(raw) as { document?: string; summary?: string; exercises?: unknown[] } | null;
      // A devoir legitimately comes back without a summary — only the
      // exercises are mandatory.
      if (!parsed || !Array.isArray(parsed.exercises)) {
        console.error("Invalid JSON shape from AI:", raw.slice(0, 500));
        return NextResponse.json({ success: false, error: "L'IA n'a pas renvoyé un JSON valide" }, { status: 502 });
      }
      const exercises = parsed.exercises
        .filter((e): e is { statement?: unknown; correction?: unknown; points?: unknown } => !!e && typeof e === "object")
        .map((e) => ({
          statement: typeof e.statement === "string" ? e.statement : "",
          correction: typeof e.correction === "string" ? e.correction : "",
          points: typeof e.points === "string" ? e.points : "",
        }))
        // Without correction we only require a statement.
        .filter((e) => e.statement && (includeCorrection ? e.correction : true));

      if (exercises.length === 0) {
        return NextResponse.json({ success: false, error: "Aucun exercice généré" }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        data: {
          format: "structured",
          structured: {
            document: typeof parsed.document === "string" ? parsed.document : "",
            summary: needsSummary(contentType) && typeof parsed.summary === "string" ? parsed.summary : "",
            exercises,
          },
          withCorrection: includeCorrection,
          language: lang,
          discipline,
          difficulty: register,
          answerLines: withAnswerLines,
        },
      });
    }

    return NextResponse.json({ success: true, data: { format: "markdown", content: raw, language: lang, discipline } });
  } catch (error) {
    console.error("Generate content error:", error);
    return NextResponse.json({ success: false, error: "Service IA indisponible" }, { status: 500 });
  }
}
