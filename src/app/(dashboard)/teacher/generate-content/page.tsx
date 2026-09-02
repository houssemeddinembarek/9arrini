"use client";

import { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, Upload, FileText, BookOpen,
  ClipboardList, GraduationCap, RotateCcw, Download, Copy, Check,
  Save, Library, Brain, Wand2, Plus, X, Trash2, Code2, LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { buildDocHeader, docHeaderCSS } from "@/lib/pdf/document-header";
import { openPrintWindow } from "@/lib/pdf/print";
import {
  PdfTemplate, defaultTemplateFor, getTemplate, templatePreviewCSS, templatesFor,
} from "@/lib/pdf/templates";
import {
  docStrings, exerciseHeading, headerLang, paperNumberOf, trimesterLabel, typeLabel,
} from "@/lib/pdf/i18n";
import { exerciseToHtml, mdToHtml } from "@/lib/pdf/markdown";
import { PaperStats, TASK_LABELS, TASK_TYPES } from "@/lib/pedagogy/types";
import { chaptersFor, notionsFromSelection, titleFromSelection } from "@/lib/curriculum/chapters";
import { Checkbox } from "@/components/ui/checkbox";
import { resolveLanguage } from "@/lib/teaching-language";

// ─── Tunisia Education Data ─────────────────────────────────────────────────

const SUBJECTS = [
  "Mathématiques", "Physique-Chimie", "Physique", "Chimie",
  "Sciences de la vie et de la terre (SVT)", "Informatique",
  "Français", "Arabe", "Anglais", "Allemand",
  "Histoire-Géographie", "Philosophie", "Technologie",
  "Education Physique et Sportive",
];

const LEVELS = [
  { group: "École Primaire", items: ["1ère année primaire","2ème année primaire","3ème année primaire","4ème année primaire","5ème année primaire","6ème année primaire"] },
  { group: "Collège (Base)", items: ["7ème année de base","8ème année de base","9ème année de base"] },
  { group: "Lycée – 1ère année", items: ["1ère année secondaire (tronc commun)"] },
  { group: "Lycée – 2ème année", items: ["2ème année - Sciences","2ème année - Lettres","2ème année - Economie-Gestion","2ème année - Informatique","2ème année - Technique"] },
  { group: "Lycée – 3ème année", items: ["3ème année - Mathématiques","3ème année - Sciences Expérimentales","3ème année - Lettres","3ème année - Economie-Gestion","3ème année - Informatique","3ème année - Technique"] },
  { group: "Baccalauréat (4ème année)", items: ["Bac - Mathématiques","Bac - Sciences Expérimentales","Bac - Lettres","Bac - Economie-Gestion","Bac - Informatique","Bac - Technique","Bac - Sport"] },
];

const CONTENT_TYPES = [
  { id: "resume", label: "Résumé de cours", icon: BookOpen, description: "Cours complet avec définitions, théorèmes et exemples" },
  { id: "exercices", label: "Exercices", icon: ClipboardList, description: "Série progressive avec correction détaillée" },
  { id: "devoir_controle", label: "Devoir de contrôle", icon: FileText, description: "DC officiel sur 20 pts — 1 heure" },
  { id: "devoir_synthese", label: "Devoir de synthèse", icon: GraduationCap, description: "DS officiel sur 20 pts — 2 heures" },
  { id: "fiche_revision", label: "Fiche de révision", icon: Sparkles, description: "Synthèse avec formules, astuces et QCM" },
];

const STRUCTURED_TYPES = new Set(["exercices", "devoir_controle", "devoir_synthese"]);
const DIFFICULTIES = [
  { id: "facile", label: "Facile", description: "Applications directes du cours, une notion par question." },
  { id: "moyen", label: "Moyen", description: "Le registre habituel d'un devoir officiel." },
  { id: "difficile", label: "Difficile", description: "Classe pilote: raisonnements à construire, questions en plusieurs étapes." },
];

// Devoirs are numbered within the school year; a série or a résumé is not.
const NUMBERED_TYPES = new Set(["devoir_controle", "devoir_synthese"]);

type Exercise = { statement: string; correction: string; points: string };
// `document` is the support text / données / carte handed to the pupil — only
// literary and human-sciences papers carry one.
// A devoir carries no course summary — only the énoncés (and the corrigé).
type StructuredDoc = { document?: string; summary?: string; exercises: Exercise[] };

type RefineTarget =
  | { kind: "document" }
  | { kind: "summary" }
  | { kind: "exercise"; index: number }
  | { kind: "correction"; index: number }
  | { kind: "add" }
  | { kind: "markdown" };

// ─── KaTeX loader ─────────────────────────────────────────────────────────────

function useKaTeX() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).renderMathInElement) { setReady(true); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
    document.head.appendChild(css);
    const katexScript = document.createElement("script");
    katexScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
    katexScript.onload = () => {
      const autoScript = document.createElement("script");
      autoScript.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";
      autoScript.onload = () => setReady(true);
      document.head.appendChild(autoScript);
    };
    document.head.appendChild(katexScript);
  }, []);
  return ready;
}

function renderKaTeX(el: HTMLElement) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).renderMathInElement) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).renderMathInElement(el, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    throwOnError: false,
  });
}

// ─── Markdown → HTML (light) ─────────────────────────────────────────────────



// ─── Remembered header identity ──────────────────────────────────────────────
// Read through useSyncExternalStore so the server renders an empty field and
// the browser fills it in on hydration, with no state update in an effect.

const subscribeToNothing = () => () => {};

function useStored(key: string): string {
  return useSyncExternalStore(
    subscribeToNothing,
    () => localStorage.getItem(key) ?? "",
    () => "",
  );
}

// ─── Structured ↔ Markdown ───────────────────────────────────────────────────

// Section titles and exercise headings are written in the document's own
// language — an Arabic paper is Arabic down to its headings.
function structuredToMarkdown(doc: StructuredDoc, withCorrection = true, lang = "francais"): string {
  const lg = headerLang(lang);
  const S = docStrings(lg);
  let md = doc.document?.trim()
    ? `## ${S.supportDocument}\n\n` + doc.document.trim() + "\n\n---\n\n"
    : "";
  if (doc.summary?.trim()) {
    md += `## ${S.summary}\n\n` + doc.summary.trim() + `\n\n---\n\n## ${S.statements}\n\n`;
  }
  doc.exercises.forEach((ex, i) => {
    md += `### ${exerciseHeading(i, lg)}${ex.points ? ` — ${ex.points}` : ""}\n\n${ex.statement.trim()}\n\n`;
  });
  if (withCorrection) {
    md += `\n---\n\n## ${S.corrections}\n\n`;
    doc.exercises.forEach((ex, i) => {
      md += `### ${S.correction} — ${exerciseHeading(i, lg)}\n\n${ex.correction.trim()}\n\n`;
    });
  }
  return md;
}

// ─── PDF print helper ─────────────────────────────────────────────────────────

function printAsPDF(
  subject: string, level: string, contentType: string, title: string,
  htmlContent: string, stampId: string, template: PdfTemplate, lang: string,
  paper: { devoirNumber?: number; trimester?: number; establishment?: string; teacher?: string },
) {
  const opened = openPrintWindow({
    template,
    header: { contentType, subject, level, title, stampId, ...paper },
    html: htmlContent,
    lang,
  });
  if (!opened) toast.error("Autorisez les popups pour télécharger le PDF");
}

// ─── Refinable block: PDF-faithful section with hover-revealed AI action ─────

function RefinableBlock({
  heading,
  badge,
  value,
  onAIRefine,
  onDelete,
  refining,
  katexReady,
  emptyLabel = "(vide)",
  render = mdToHtml,
}: {
  heading?: string;
  badge?: string;
  value: string;
  onAIRefine: () => void;
  onDelete?: () => void;
  refining: boolean;
  katexReady: boolean;
  emptyLabel?: string;
  /** Exercise bodies render through `exerciseToHtml`; prose through `mdToHtml` */
  render?: (md: string) => string;
}) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (katexReady && previewRef.current) renderKaTeX(previewRef.current);
  }, [value, katexReady]);

  return (
    <div className="group relative -mx-3 px-3 py-2 my-3 rounded-md transition-colors hover:bg-[hsl(var(--primary))]/[0.04] hover:outline hover:outline-1 hover:outline-dashed hover:outline-[hsl(var(--primary))]/40">
      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity bg-white shadow-md rounded-md border border-[hsl(var(--border))] p-0.5 z-10">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-[hsl(var(--primary))]" onClick={onAIRefine} loading={refining} title="Améliorer avec l'IA">
          <Wand2 className="h-3.5 w-3.5" />
          <span className="text-xs hidden sm:inline">Améliorer</span>
        </Button>
        {onDelete && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600" onClick={onDelete} title="Supprimer">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {heading && (
        <h3 className="paper-heading flex items-baseline gap-2 pr-28">
          <span>{heading}</span>
          {badge && <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">— {badge}</span>}
        </h3>
      )}
      <div
        ref={previewRef}
        className="paper-prose"
        dangerouslySetInnerHTML={{ __html: render(value || emptyLabel) }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Mode = "choose" | "ai" | "upload" | "adapt";

export default function GenerateContentPage() {
  const router = useRouter();
  const katexReady = useKaTeX();
  const currentUser = useAuthStore((state) => state.user);
  const previewRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("choose");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [contentType, setContentType] = useState("");
  // A maths year runs over three trimestres, each with two devoirs de contrôle
  // and one devoir de synthèse.
  const [trimester, setTrimester] = useState(1);
  const [devoirNumber, setDevoirNumber] = useState(1);
  // How demanding the paper should be — the same chapter is not asked the same
  // way in a collège de quartier and in a collège pilote.
  const [difficulty, setDifficulty] = useState("moyen");
  // Ruled space for the pupil to answer on the sheet. Default from the level
  // (the norm through collège, not at lycée), overridable per paper.
  const [answerLinesEdit, setAnswerLinesEdit] = useState<boolean | null>(null);
  // Printed in the header. Typed once, then remembered for the next document:
  // the stored value is the default until the teacher edits the field.
  const [establishmentEdit, setEstablishmentEdit] = useState<string | null>(null);
  const [teacherNameEdit, setTeacherNameEdit] = useState<string | null>(null);
  const storedEstablishment = useStored("telmidhi.establishment");
  const storedTeacher = useStored("telmidhi.teacherName");
  const establishment = establishmentEdit ?? storedEstablishment;
  const teacherName = teacherNameEdit ?? storedTeacher ?? currentUser?.name ?? "";
  // Paragraphes du manuel cochés pour ce devoir.
  const [picked, setPicked] = useState<Set<string>>(new Set());
  // Repli: niveau sans sommaire, ou enseignant qui préfère décrire lui-même.
  const [freeTitle, setFreeTitle] = useState("");
  const [freeMode, setFreeMode] = useState(false);
  const [notes, setNotes] = useState("");
  // Whether to also generate corrections (off = énoncés only, e.g. a blank exam).
  const [withCorrection, setWithCorrection] = useState(true);
  // Reflects what the currently-shown document actually contains.
  const [correctionsIncluded, setCorrectionsIncluded] = useState(true);
  // Output language of the generated document (Arabic for sciences up to collège).
  // La langue du document découle de la matière et du niveau — la même règle
  // que celle appliquée côté serveur. On la connaît donc avant de générer, ce
  // qui permet d'afficher le chapitre et l'en-tête dans la bonne langue.
  // `adaptedLanguage` ne sert qu'aux documents importés, dont la langue est
  // celle du PDF d'origine.
  const [adaptedLanguage, setAdaptedLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState("");
  const [structured, setStructured] = useState<StructuredDoc | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  // Raw source (Markdown + LaTeX) editor: edit the code and re-render the document.
  const [showCode, setShowCode] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");
  const [savedId, setSavedId] = useState("");
  const [stampId, setStampId] = useState("");
  // Équilibre pédagogique calculé par le serveur sur le devoir produit, et ce
  // qui reste imparfait après la passe de réparation.
  const [stats, setStats] = useState<PaperStats | null>(null);
  const [warnings, setWarnings] = useState<{ code: string; severity: string; message: string }[]>([]);
  // Paper the document is printed on. Follows the content type until the
  // teacher picks one explicitly, then stays put.
  const [templateId, setTemplateId] = useState("");
  const [templateTouched, setTemplateTouched] = useState(false);

  // Refine modal state
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineTarget, setRefineTarget] = useState<RefineTarget | null>(null);
  const [refineInstructions, setRefineInstructions] = useState("");
  const [refining, setRefining] = useState(false);
  const [refiningKey, setRefiningKey] = useState<string | null>(null); // "summary" | "ex-N" | "co-N" | "add"

  // Adapt-from-PDF state
  const [adaptFile, setAdaptFile] = useState<File | null>(null);
  const [adaptSubject, setAdaptSubject] = useState("");
  const [adaptLevel, setAdaptLevel] = useState("");
  const [adaptType, setAdaptType] = useState("exercices");
  const [adaptNotes, setAdaptNotes] = useState("");
  const [adapting, setAdapting] = useState(false);

  // Upload PDF state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState("");
  const [uploadLevel, setUploadLevel] = useState("");
  const [uploadType, setUploadType] = useState("resume");
  const [uploading, setUploading] = useState(false);

  // Re-render KaTeX whenever simple generated content changes
  useEffect(() => {
    if (generated && katexReady && previewRef.current) renderKaTeX(previewRef.current);
  }, [generated, katexReady]);

  // Open directly in the mode requested from the Content hub (?mode=ai|adapt|upload).
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    if (m === "ai" || m === "adapt" || m === "upload") setMode(m as Mode);
  }, []);

  // Corpus: l'élève répond sur le sujet en 7ème (90 %), 8ème (73 %), 9ème (50 %);
  // au lycée il répond sur une copie séparée (18 %).
  const answerLinesDefault = /primaire|base/i.test(level);
  const answerLines = answerLinesEdit ?? answerLinesDefault;

  // Sommaire officiel du manuel pour ce niveau — null tant que la matière ou le
  // niveau n'a pas de programme transcrit: on garde alors la saisie libre.
  const chapterDomains = useMemo(() => chaptersFor(subject, level), [subject, level]);

  const language = adaptedLanguage || (subject && level ? resolveLanguage(subject, level) : "francais");

  // Le contenu du devoir: ce qui est coché dans le sommaire, sinon la saisie
  // libre. Les identifiants étant propres à un niveau, changer de niveau vide
  // naturellement la sélection.
  const useCatalogue = !!chapterDomains && !freeMode;
  const title = useCatalogue ? titleFromSelection(chapterDomains!, picked, language) : freeTitle;
  const notions = useCatalogue ? notionsFromSelection(chapterDomains!, picked, language) : [];

  const canGenerate = subject && level && contentType && title.trim().length >= 3;
  const isStructured = !!structured;
  const rtl = language === "arabe";

  const fullMarkdown = useMemo(
    () => (structured ? structuredToMarkdown(structured, correctionsIncluded, language) : generated),
    [structured, generated, correctionsIncluded, language]
  );

  const template = useMemo(
    () => (templateId ? getTemplate(templateId) : defaultTemplateFor(contentType)),
    [templateId, contentType]
  );
  const templateChoices = useMemo(() => templatesFor(contentType), [contentType]);

  // Trimestre and devoir number travel together, and only for a devoir.
  const paperIdentity = useMemo(
    () => (NUMBERED_TYPES.has(contentType) ? { devoirNumber, trimester } : {}),
    [contentType, devoirNumber, trimester]
  );

  const previewHeader = useMemo(
    () => buildDocHeader({
      typeLabel: CONTENT_TYPES.find((t) => t.id === contentType)?.label || contentType,
      contentType, subject, level, title, stampId, lang: language,
      establishment: establishment.trim() || undefined,
      teacher: teacherName.trim() || undefined,
      ...paperIdentity,
      banner: template.banner,
      showStudentRow: template.showStudentRow,
    }),
    [contentType, subject, level, title, stampId, template, language, paperIdentity, establishment, teacherName]
  );

  // Header + sheet styling of the active template, scoped to the preview page.
  // What the header will print, shown live under the pickers.
  const paperHeading = useMemo(() => {
    const lg = headerLang(language);
    const n = paperNumberOf(contentType, devoirNumber, trimester);
    const t = trimesterLabel(trimester, lg);
    return `${typeLabel(contentType, lg, CONTENT_TYPES.find((c) => c.id === contentType)?.label, n)}${t ? ` — ${t}` : ""}`;
  }, [contentType, devoirNumber, trimester, language]);

  const previewCSS = useMemo(
    () => docHeaderCSS(template.theme) + templatePreviewCSS(template),
    [template]
  );

  const togglePicked = (ids: string[], select: boolean) => {
    setPicked((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const rememberIdentity = () => {
    localStorage.setItem("telmidhi.establishment", establishment);
    localStorage.setItem("telmidhi.teacherName", teacherName);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    if (!templateTouched) setTemplateId("");
    rememberIdentity();
    setLoading(true);
    setGenerated("");
    setStructured(null);
    setStats(null);
    setWarnings([]);
    setSavedId("");
    setStampId(`9A-${Date.now().toString(36).toUpperCase()}`);
    try {
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject, level, contentType, title, notions, notes, withCorrection, difficulty, answerLines, ...paperIdentity,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Erreur de génération"); return; }
      setAdaptedLanguage("");
      setStats(json.data.stats ?? null);
      setWarnings(Array.isArray(json.data.warnings) ? json.data.warnings : []);
      if (json.data.format === "structured") {
        setStructured(json.data.structured);
        setCorrectionsIncluded(json.data.withCorrection !== false);
      } else {
        setGenerated(json.data.content);
        setCorrectionsIncluded(true);
      }
      toast.success("Contenu généré avec succès !");
    } catch {
      toast.error("Service IA indisponible");
    } finally {
      setLoading(false);
    }
  };

  const openRefine = (target: RefineTarget) => {
    setRefineTarget(target);
    setRefineInstructions("");
    setRefineOpen(true);
  };

  const refineKey = (t: RefineTarget) =>
    t.kind === "document" ? "document" :
    t.kind === "summary" ? "summary" :
    t.kind === "exercise" ? `ex-${t.index}` :
    t.kind === "correction" ? `co-${t.index}` :
    t.kind === "markdown" ? "markdown" :
    "add";

  const handleRefineSubmit = async () => {
    if (!refineTarget || !refineInstructions.trim()) return;
    const target = refineTarget;
    if (target.kind !== "markdown" && !structured) return;
    const key = refineKey(target);
    setRefining(true);
    setRefiningKey(key);

    const baseBody: Record<string, unknown> = {
      instructions: refineInstructions.trim(),
      subject, level, title,
    };

    let body: Record<string, unknown> = { ...baseBody };
    if (target.kind === "document") {
      body = { ...body, action: "refine_document", document: structured!.document || "" };
    } else if (target.kind === "summary") {
      body = { ...body, action: "refine_summary", summary: structured!.summary };
    } else if (target.kind === "exercise") {
      const ex = structured!.exercises[target.index];
      body = { ...body, action: "refine_exercise", statement: ex.statement, correction: ex.correction };
    } else if (target.kind === "correction") {
      const ex = structured!.exercises[target.index];
      body = { ...body, action: "refine_correction", statement: ex.statement, correction: ex.correction };
    } else if (target.kind === "markdown") {
      body = { ...body, action: "refine_markdown", markdown: generated };
    } else {
      body = {
        ...body, action: "add_exercise",
        existingStatements: structured!.exercises.map((e) => e.statement),
      };
    }

    try {
      const res = await fetch("/api/ai/refine-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Erreur IA"); return; }

      if (target.kind === "markdown") {
        setGenerated(json.data.text);
      } else {
        setStructured((prev) => {
          if (!prev) return prev;
          if (target.kind === "document") {
            return { ...prev, document: json.data.text };
          }
          if (target.kind === "summary") {
            return { ...prev, summary: json.data.text };
          }
          if (target.kind === "exercise") {
            const next = [...prev.exercises];
            next[target.index] = json.data.exercise;
            return { ...prev, exercises: next };
          }
          if (target.kind === "correction") {
            const next = [...prev.exercises];
            next[target.index] = { ...next[target.index], correction: json.data.text };
            return { ...prev, exercises: next };
          }
          // add
          return { ...prev, exercises: [...prev.exercises, json.data.exercise] };
        });
      }

      toast.success(target.kind === "add" ? "Exercice ajouté" : "Mis à jour");
      setRefineOpen(false);
      setSavedId(""); // mark as dirty so user can re-save
    } catch {
      toast.error("Service IA indisponible");
    } finally {
      setRefining(false);
      setRefiningKey(null);
    }
  };

  const handleSaveToLibrary = async () => {
    if ((!generated && !structured) || !title) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, subject, level, contentType, ...paperIdentity,
          establishment: establishment.trim() || undefined,
          teacher: teacherName.trim() || undefined,
          source: "ai_generated",
          contentBody: fullMarkdown,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Erreur de sauvegarde"); return; }
      rememberIdentity();
      setSavedId(json.data.item._id);
      toast.success("Sauvegardé dans la bibliothèque !");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleAdaptSubmit = async () => {
    if (!adaptFile) return;
    setAdapting(true);
    setGenerated("");
    setStructured(null);
    setStats(null);
    setWarnings([]);
    setSavedId("");
    try {
      const form = new FormData();
      form.append("file", adaptFile);
      form.append("subject", adaptSubject);
      form.append("level", adaptLevel);
      form.append("contentType", adaptType);
      form.append("notes", adaptNotes);

      const res = await fetch("/api/content/adapt-pdf", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Erreur d'adaptation"); return; }

      setSubject(adaptSubject || "");
      setLevel(adaptLevel || "");
      setContentType(adaptType);
      setFreeMode(true);
      setFreeTitle(`Adaptation — ${adaptFile.name.replace(".pdf", "")}`);
      setAdaptedLanguage("francais");
      setGenerated(json.data.content);
      setMode("ai");
      toast.success("Contenu adapté avec succès !");
    } catch {
      toast.error("Service IA indisponible");
    } finally {
      setAdapting(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle || !uploadSubject || !uploadLevel) {
      toast.error("Remplissez tous les champs");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", uploadFile);
      form.append("title", uploadTitle);
      form.append("subject", uploadSubject);
      form.append("level", uploadLevel);
      form.append("contentType", uploadType);

      const res = await fetch("/api/content/upload-pdf", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Erreur d'importation"); return; }
      toast.success("PDF importé et sauvegardé !");
      router.push("/teacher/content");
    } catch {
      toast.error("Erreur d'importation");
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copié !");
  };

  // Open/close the source editor, seeding it with the current document's code.
  const toggleCode = () => {
    setShowCode((v) => {
      if (!v) setCodeDraft(fullMarkdown);
      return !v;
    });
  };

  // Apply the edited code: the document becomes a single editable markdown body
  // rendered from exactly what the teacher typed (preview + PDF follow).
  const applyCode = () => {
    setStructured(null);
    setGenerated(codeDraft);
    setCorrectionsIncluded(true);
    setSavedId("");
    setShowCode(false);
    toast.success("Document mis à jour depuis le code");
  };

  const handlePrintPDF = () => {
    const id = stampId || `9A-${Date.now().toString(36).toUpperCase()}`;
    const headerIdentity = {
      ...paperIdentity,
      establishment: establishment.trim() || undefined,
      teacher: teacherName.trim() || undefined,
    };

    if (structured) {
      printAsPDF(subject, level, contentType, title, renderStructuredToHTML(structured, correctionsIncluded, language), id, template, language, headerIdentity);
    } else {
      printAsPDF(subject, level, contentType, title, mdToHtml(generated), id, template, language, headerIdentity);
    }
  };

  // ── Mode selection ─────────────────────────────────────────────────────────
  if (mode === "choose") {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Ajouter du contenu</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">Choisissez comment créer votre contenu pédagogique</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { m: "ai" as Mode, icon: Sparkles, title: "Générer avec l'IA", desc: "Résumés, exercices, devoirs alignés sur le programme tunisien", badge: "Recommandé", gradient: true },
            { m: "adapt" as Mode, icon: Brain, title: "Adapter un PDF", desc: "Importez un document existant — l'IA crée une version originale similaire", badge: "Nouveau" },
            { m: "upload" as Mode, icon: Upload, title: "Importer un PDF", desc: "Téléversez directement un de vos documents PDF", badge: "" },
          ].map(({ m, icon: Icon, title, desc, badge, gradient }) => (
            <button key={m} onClick={() => setMode(m)}
              className="group rounded-2xl border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] bg-[hsl(var(--card))] p-5 text-left transition-all hover:shadow-lg"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow ${gradient ? "gradient-bg" : "bg-[hsl(var(--muted))]"}`}>
                <Icon className={`h-5 w-5 ${gradient ? "text-white" : "text-[hsl(var(--muted-foreground))]"}`} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{desc}</p>
              {badge && <Badge variant={badge === "Recommandé" ? "purple" : "blue"} className="mt-2 text-[10px]">{badge}</Badge>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Upload PDF mode ────────────────────────────────────────────────────────
  if (mode === "upload") {
    return (
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/teacher/content")}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">Importer un PDF</h1>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
          <label className="block">
            <div className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${uploadFile ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50"}`}>
              <Upload className={`h-8 w-8 mx-auto mb-2 ${uploadFile ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`} />
              <p className="font-medium text-sm">{uploadFile ? uploadFile.name : "Cliquez pour sélectionner un PDF"}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">PDF uniquement · Max 50 MB</p>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
          </label>

          <div className="space-y-1.5">
            <Label>Titre du document *</Label>
            <Input placeholder="ex: Cours de Mathématiques — Chapitre 3" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Matière *</Label>
              <Select onValueChange={setUploadSubject}>
                <SelectTrigger><SelectValue placeholder="Matière" /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={uploadType} onValueChange={setUploadType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Niveau scolaire *</Label>
            <Select onValueChange={setUploadLevel}>
              <SelectTrigger><SelectValue placeholder="Niveau" /></SelectTrigger>
              <SelectContent>
                {LEVELS.map((g) => (
                  <div key={g.group}>
                    <div className="px-2 py-1 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase">{g.group}</div>
                    {g.items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" variant="gradient" onClick={handleUploadSubmit} loading={uploading}
            disabled={!uploadFile || !uploadTitle || !uploadSubject || !uploadLevel || uploading}>
            <Upload className="h-4 w-4" /> {uploading ? "Importation..." : "Importer et sauvegarder"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Adapt from PDF mode ────────────────────────────────────────────────────
  if (mode === "adapt") {
    return (
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/teacher/content")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Adapter un PDF existant</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">L&apos;IA génère un document original inspiré du vôtre</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
          <div className="rounded-xl bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20 p-3 text-xs text-[hsl(var(--muted-foreground))]">
            <strong className="text-[hsl(var(--primary))]">Comment ça marche :</strong> l&apos;IA (Claude) analyse votre PDF et crée une version très proche de l&apos;original, avec la même structure et les mêmes exercices — seules de petites modifications sont apportées (valeurs numériques, formulations).
          </div>

          <label className="block">
            <div className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${adaptFile ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50"}`}>
              <Brain className={`h-7 w-7 mx-auto mb-2 ${adaptFile ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`} />
              <p className="font-medium text-sm">{adaptFile ? adaptFile.name : "Sélectionner le PDF à adapter"}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">PDF · Max 20 MB</p>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setAdaptFile(e.target.files?.[0] || null)} />
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Matière (optionnel)</Label>
              <Select onValueChange={setAdaptSubject}>
                <SelectTrigger><SelectValue placeholder="Auto-détecté" /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type de sortie</Label>
              <Select value={adaptType} onValueChange={setAdaptType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Niveau scolaire (optionnel)</Label>
            <Select onValueChange={setAdaptLevel}>
              <SelectTrigger><SelectValue placeholder="Auto-détecté depuis le PDF" /></SelectTrigger>
              <SelectContent>
                {LEVELS.map((g) => (
                  <div key={g.group}>
                    <div className="px-2 py-1 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase">{g.group}</div>
                    {g.items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Instructions supplémentaires</Label>
            <Textarea placeholder="ex: Augmenter la difficulté, ajouter des problèmes contextualisés..." className="min-h-[70px] text-sm" value={adaptNotes} onChange={(e) => setAdaptNotes(e.target.value)} />
          </div>

          <Button className="w-full" variant="gradient" onClick={handleAdaptSubmit} loading={adapting} disabled={!adaptFile || adapting}>
            <Brain className="h-4 w-4" /> {adapting ? "Analyse et génération en cours..." : "Générer la version adaptée"}
          </Button>
        </div>
      </div>
    );
  }

  // ── AI Generate mode (main view) ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/teacher/content")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Générateur de contenu IA</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">Programme officiel tunisien • Formules LaTeX • Tampon Telmidhi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">

        {/* Config panel */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5 lg:sticky lg:top-20">
          <h2 className="font-semibold">Configuration</h2>

          <div className="space-y-1.5">
            <Label>Matière *</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder="Choisir la matière" /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Niveau scolaire *</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger><SelectValue placeholder="Choisir le niveau" /></SelectTrigger>
              <SelectContent>
                {LEVELS.map((g) => (
                  <div key={g.group}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{g.group}</div>
                    {g.items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type de contenu *</Label>
            {CONTENT_TYPES.map((ct) => {
              const Icon = ct.icon;
              const active = contentType === ct.id;
              const split = STRUCTURED_TYPES.has(ct.id);
              return (
                <button key={ct.id} onClick={() => setContentType(ct.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${active ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40"}`}>
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${active ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${active ? "text-[hsl(var(--primary))]" : ""}`}>{ct.label}</p>
                      {split && <Badge variant="purple" className="text-[9px] px-1.5 py-0">Énoncé + correction</Badge>}
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{ct.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {NUMBERED_TYPES.has(contentType) && (
            <div className="space-y-3 p-3 rounded-xl border-2 border-[hsl(var(--border))]">
              <div className="space-y-1.5">
                <Label>Trimestre *</Label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button key={n} type="button" onClick={() => setTrimester(n)}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        trimester === n
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40"
                      }`}
                    >
                      {n === 1 ? "1er" : `${n}ème`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two devoirs de contrôle per trimestre; the synthèse is the
                  single one of its trimestre, so it takes its number. */}
              {contentType === "devoir_controle" && (
                <div className="space-y-1.5">
                  <Label>Devoir de contrôle *</Label>
                  <div className="flex gap-2">
                    {[1, 2].map((n) => (
                      <button key={n} type="button" onClick={() => setDevoirNumber(n)}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          devoirNumber === n
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                            : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40"
                        }`}
                      >
                        DC {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                En-tête : <span className="font-medium text-[hsl(var(--foreground))]">{paperHeading}</span>
              </p>
            </div>
          )}

          {STRUCTURED_TYPES.has(contentType) && level && (
            <button
              type="button"
              onClick={() => setAnswerLinesEdit(!answerLines)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40 transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">Espace de réponse sur le sujet</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {answerLines
                    ? "Lignes pointillées après chaque question — l'élève écrit sur la feuille"
                    : "Pas de lignes — l'élève répond sur une copie séparée"}
                </p>
              </div>
              <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${answerLines ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))]"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${answerLines ? "translate-x-5" : "translate-x-0.5"}`} />
              </span>
            </button>
          )}

          {STRUCTURED_TYPES.has(contentType) && (
            <button
              type="button"
              onClick={() => setWithCorrection((v) => !v)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40 transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">Inclure la correction</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {withCorrection ? "Énoncés + corrections détaillées" : "Énoncés uniquement (sujet à distribuer)"}
                </p>
              </div>
              <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${withCorrection ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))]"}`}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${withCorrection ? "translate-x-5" : "translate-x-0.5"}`} />
              </span>
            </button>
          )}

          <div className="space-y-1.5">
            <Label>Difficulté *</Label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button key={d.id} type="button" onClick={() => setDifficulty(d.id)}
                  className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    difficulty === d.id
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {DIFFICULTIES.find((d) => d.id === difficulty)?.description}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>Contenu du devoir *</Label>
              {chapterDomains && (
                <button
                  type="button"
                  onClick={() => setFreeMode((v) => !v)}
                  className="text-xs text-[hsl(var(--primary))] hover:underline"
                >
                  {freeMode ? "Choisir dans le manuel" : "Saisir moi-même"}
                </button>
              )}
            </div>

            {useCatalogue ? (
              <>
                {/* Sommaire du manuel: chapitres et paragraphes à cocher */}
                <div className="max-h-72 overflow-auto rounded-xl border-2 border-[hsl(var(--border))] divide-y divide-[hsl(var(--border))]">
                  {chapterDomains!.map((domain) => (
                    <div key={domain.fr} className="px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--primary))] mb-1.5">
                        {domain.fr}
                      </p>
                      {domain.chapters.map((chapter) => {
                        const ids = chapter.paragraphs.map((par) => par.id);
                        const checkedCount = ids.filter((id) => picked.has(id)).length;
                        const state = checkedCount === 0 ? false : checkedCount === ids.length ? true : "indeterminate";
                        return (
                          <div key={chapter.id} className="mb-2 last:mb-0">
                            <label className="flex items-start gap-2 cursor-pointer group">
                              <Checkbox
                                className="mt-0.5"
                                checked={state}
                                onCheckedChange={() => togglePicked(ids, checkedCount < ids.length)}
                              />
                              <span className="text-sm font-medium leading-tight group-hover:text-[hsl(var(--primary))]">
                                {chapter.fr}
                                <span className="text-[hsl(var(--muted-foreground))] font-normal" dir="rtl"> — {chapter.ar}</span>
                              </span>
                            </label>
                            <div className="ml-6 mt-1 space-y-1">
                              {chapter.paragraphs.map((par) => (
                                <label key={par.id} className="flex items-start gap-2 cursor-pointer group">
                                  <Checkbox
                                    className="mt-0.5"
                                    checked={picked.has(par.id)}
                                    onCheckedChange={() => togglePicked([par.id], !picked.has(par.id))}
                                  />
                                  <span className="text-xs leading-tight text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]">
                                    {par.fr}
                                    <span dir="rtl"> — {par.ar}</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {picked.size === 0
                    ? "Cochez les paragraphes du programme officiel que le devoir doit évaluer."
                    : `${picked.size} paragraphe(s) — le devoir ne portera que sur eux.`}
                </p>
                {picked.size > 0 && rtl && (
                  <p className="text-xs text-[hsl(var(--foreground))]" dir="rtl">{title}</p>
                )}
              </>
            ) : (
              <>
                <Input
                  placeholder="ex: Le théorème de Thalès"
                  value={freeTitle}
                  onChange={(e) => setFreeTitle(e.target.value)}
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Le chapitre exact traité par le devoir.</p>
              </>
            )}
          </div>

          {/* Printed in the header; remembered for the next document */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Établissement</Label>
              <Input placeholder="ex: Collège Ibn Khaldoun" value={establishment} onChange={(e) => setEstablishmentEdit(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Enseignant</Label>
              <Input placeholder="ex: M. Ben Salah" value={teacherName} onChange={(e) => setTeacherNameEdit(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Instructions <span className="text-[hsl(var(--muted-foreground))] text-xs">(optionnel)</span></Label>
            <Textarea placeholder="ex: Insister sur les limites, inclure des problèmes contextualisés..." className="min-h-[70px] text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <Button className="w-full" variant="gradient" onClick={handleGenerate} loading={loading} disabled={!canGenerate || loading}>
            <Sparkles className="h-4 w-4" /> {loading ? "Génération..." : "Générer le contenu"}
          </Button>
        </div>

        {/* Preview panel */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] min-h-[600px] flex flex-col overflow-hidden">
          {!generated && !structured && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[hsl(var(--primary))]/30 flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-[hsl(var(--primary))]/30" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Prêt à générer</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm">
                Vous verrez le <strong>document PDF complet</strong> exactement tel qu&apos;il sera imprimé. Survolez chaque section pour l&apos;améliorer avec l&apos;IA.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center animate-pulse shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <p className="font-semibold text-lg">Génération en cours...</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Programme officiel tunisien • LaTeX</p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full gradient-bg animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {(generated || structured) && !loading && (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(var(--border))] flex-wrap gap-2 sticky top-0 bg-[hsl(var(--card))] z-20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">Aperçu PDF</span>
                  {subject && <Badge variant="blue" className="text-xs hidden md:inline-flex">{subject}</Badge>}
                  {isStructured && <Badge variant="purple" className="text-xs hidden md:inline-flex">{structured!.exercises.length} exercices</Badge>}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span className="hidden sm:inline text-xs">{copied ? "Copié" : "Copier"}</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerate} loading={loading}>
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Régénérer</span>
                  </Button>
                  <Button variant={showCode ? "gradient" : "outline"} size="sm" onClick={toggleCode}>
                    <Code2 className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Code LaTeX</span>
                  </Button>
                  {/* Paper the document prints on — preview follows the choice */}
                  <Select
                    value={template.id}
                    onValueChange={(v) => { setTemplateId(v); setTemplateTouched(true); }}
                  >
                    <SelectTrigger className="h-8 w-[140px] sm:w-[168px] text-xs px-2.5" title={template.description}>
                      <span className="flex items-center gap-1.5 truncate">
                        <LayoutTemplate className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" />
                        <SelectValue placeholder="Modèle" />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="max-w-[320px]">
                      {templateChoices.map((t) => (
                        <SelectItem key={t.id} value={t.id} textValue={t.label}>
                          <span className="flex flex-col gap-0.5 py-0.5">
                            <span className="text-xs font-medium">{t.label}</span>
                            <span className="text-[10px] leading-snug text-[hsl(var(--muted-foreground))]">{t.description}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handlePrintPDF}>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">PDF</span>
                  </Button>
                  {savedId ? (
                    <Button variant="outline" size="sm" className="text-green-600 border-green-300" asChild>
                      <a href="/teacher/content"><Library className="h-4 w-4" /><span className="hidden sm:inline text-xs">Voir la bibliothèque</span></a>
                    </Button>
                  ) : (
                    <Button variant="gradient" size="sm" onClick={handleSaveToLibrary} loading={saving}>
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">{saving ? "Sauvegarde..." : "Sauvegarder"}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Équilibre pédagogique du devoir tel qu'il a été généré */}
              {stats && (
                <div className="flex items-center gap-3 flex-wrap px-4 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 text-xs">
                  <span className="text-[hsl(var(--muted-foreground))]">Équilibre pédagogique</span>
                  {TASK_TYPES.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1">
                      <span className="font-semibold">{stats.byType[t].points} pts</span>
                      <span className="text-[hsl(var(--muted-foreground))]">
                        {TASK_LABELS[t].fr.toLowerCase()} ({stats.byType[t].questions} q.)
                      </span>
                    </span>
                  ))}
                  <span className="text-[hsl(var(--muted-foreground))]">• {stats.notionCount} notions</span>
                  {warnings.length > 0 && (
                    <span
                      className="text-amber-600 cursor-help"
                      title={warnings.map((w) => w.message).join("\n")}
                    >
                      • {warnings.length} point(s) à vérifier
                    </span>
                  )}
                </div>
              )}

              {/* Source code editor — edit the Markdown/LaTeX and re-render */}
              {showCode ? (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Code source (Markdown + LaTeX). Formules entre <code className="text-[hsl(var(--primary))]">$...$</code> ou <code className="text-[hsl(var(--primary))]">$$...$$</code>.
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setShowCode(false)}>
                        <X className="h-4 w-4" /> Annuler
                      </Button>
                      <Button variant="gradient" size="sm" onClick={applyCode}>
                        <Check className="h-4 w-4" /> Appliquer
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={codeDraft}
                    onChange={(e) => setCodeDraft(e.target.value)}
                    spellCheck={false}
                    dir={rtl ? "rtl" : "ltr"}
                    className="flex-1 w-full resize-none outline-none p-4 font-mono text-xs leading-relaxed bg-[#0b1020] text-emerald-100"
                  />
                </div>
              ) : (
              /* "Desk" with the A4 paper */
              <div className="flex-1 overflow-auto bg-[#eef0f4] p-4 sm:p-6">
                <div className="paper-page mx-auto bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-sm relative overflow-hidden"
                  style={{ maxWidth: "210mm", minHeight: "297mm", padding: template.theme.pagePadding }}>

                  {/* Faded watermark — matches print (templates without one skip it) */}
                  {template.watermark && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none" aria-hidden="true">
                      <span className="paper-watermark text-[80pt] font-black tracking-[6px] opacity-[0.06] -rotate-[30deg] whitespace-nowrap">
                        {template.watermark}
                      </span>
                    </div>
                  )}

                  {/* Header + sheet styling of the active template */}
                  <style dangerouslySetInnerHTML={{ __html: previewCSS }} />
                  <div dangerouslySetInnerHTML={{ __html: previewHeader }} />

                  {/* Document body */}
                  <div className="paper-body relative z-[1]" dir={rtl ? "rtl" : "ltr"}>
                    {isStructured ? (
                      <>
                        {!!structured!.document?.trim() && (
                          <>
                            <RefinableBlock
                              heading={docStrings(headerLang(language)).supportDocument}
                              value={structured!.document || ""}
                              onAIRefine={() => openRefine({ kind: "document" })}
                              refining={refining && refiningKey === "document"}
                              katexReady={katexReady}
                            />
                            <hr className="my-4 border-gray-400" />
                          </>
                        )}

                        {/* A devoir goes straight to the exercises — no course summary */}
                        {!!structured!.summary?.trim() && (
                          <>
                            <RefinableBlock
                              heading={docStrings(headerLang(language)).summary}
                              value={structured!.summary || ""}
                              onAIRefine={() => openRefine({ kind: "summary" })}
                              refining={refining && refiningKey === "summary"}
                              katexReady={katexReady}
                            />

                            <hr className="my-4 border-gray-400" />

                            <h2 className="paper-section-title">{docStrings(headerLang(language)).statements}</h2>
                          </>
                        )}

                        {structured!.exercises.map((ex, i) => (
                          <RefinableBlock
                            key={`ex-${i}`}
                            heading={exerciseHeading(i, headerLang(language))}
                            badge={ex.points || undefined}
                            value={ex.statement}
                            render={exerciseToHtml}
                            onAIRefine={() => openRefine({ kind: "exercise", index: i })}
                            onDelete={() => setStructured((p) => p && ({ ...p, exercises: p.exercises.filter((_, idx) => idx !== i) }))}
                            refining={refining && refiningKey === `ex-${i}`}
                            katexReady={katexReady}
                          />
                        ))}

                        <div className="flex justify-center my-4">
                          <Button variant="outline" size="sm" onClick={() => openRefine({ kind: "add" })} loading={refining && refiningKey === "add"} className="border-dashed">
                            <Plus className="h-3.5 w-3.5" /> Ajouter un exercice
                          </Button>
                        </div>

                        {correctionsIncluded && (
                          <>
                            <div className="my-6 border-t-2 border-dashed border-[hsl(var(--primary))]/30 relative">
                              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2 text-[10pt] text-[hsl(var(--primary))]/60 italic">— saut de page —</span>
                            </div>

                            <h2 className="paper-section-title">{docStrings(headerLang(language)).corrections}</h2>
                            {structured!.exercises.map((ex, i) => (
                              <RefinableBlock
                                key={`co-${i}`}
                                heading={`${docStrings(headerLang(language)).correction} — ${exerciseHeading(i, headerLang(language))}`}
                                value={ex.correction}
                                render={exerciseToHtml}
                                onAIRefine={() => openRefine({ kind: "correction", index: i })}
                                refining={refining && refiningKey === `co-${i}`}
                                katexReady={katexReady}
                              />
                            ))}
                          </>
                        )}
                      </>
                    ) : (
                      <RefinableBlock
                        value={generated}
                        onAIRefine={() => openRefine({ kind: "markdown" })}
                        refining={refining && refiningKey === "markdown"}
                        katexReady={katexReady}
                      />
                    )}
                  </div>

                  {/* Footer */}
                  <div className="relative z-[1] mt-7 pt-2 border-t border-gray-300 flex justify-between items-center text-[9pt] text-gray-600">
                    <span>Document généré par <strong>Telmidhi</strong> • Programme officiel tunisien</span>
                    <span className="font-mono text-[8pt] text-[#7c3aed] font-semibold">Ref: {stampId}</span>
                  </div>
                </div>

                <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-4">
                  Survolez une section pour l&apos;améliorer avec l&apos;IA. Sauvegardez ou téléchargez le PDF quand tout vous convient.
                </p>
              </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Refine dialog */}
      <Dialog open={refineOpen} onOpenChange={setRefineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[hsl(var(--primary))]" />
              {refineTarget?.kind === "document" && "Améliorer le document support"}
              {refineTarget?.kind === "summary" && "Améliorer le résumé"}
              {refineTarget?.kind === "exercise" && `Modifier l'exercice ${(refineTarget.index ?? 0) + 1}`}
              {refineTarget?.kind === "correction" && `Modifier la correction ${(refineTarget.index ?? 0) + 1}`}
              {refineTarget?.kind === "add" && "Ajouter un nouvel exercice"}
              {refineTarget?.kind === "markdown" && "Améliorer le document"}
            </DialogTitle>
            <DialogDescription>
              Décrivez ce que l&apos;IA doit faire. Soyez précis pour un meilleur résultat.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            autoFocus
            placeholder={
              refineTarget?.kind === "summary" ? "ex: Ajouter la définition formelle d'une suite arithmétique et un exemple résolu"
              : refineTarget?.kind === "exercise" ? "ex: Rendre l'énoncé plus difficile et changer les valeurs numériques"
              : refineTarget?.kind === "correction" ? "ex: Détailler chaque étape avec justification"
              : refineTarget?.kind === "markdown" ? "ex: Ajouter une section avec 3 exemples résolus supplémentaires"
              : "ex: Ajouter un exercice de niveau Bac sur les limites en l'infini"
            }
            value={refineInstructions}
            onChange={(e) => setRefineInstructions(e.target.value)}
            className="min-h-[110px] text-sm"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefineOpen(false)} disabled={refining}>
              <X className="h-4 w-4" /> Annuler
            </Button>
            <Button variant="gradient" onClick={handleRefineSubmit} loading={refining} disabled={!refineInstructions.trim()}>
              <Wand2 className="h-4 w-4" /> Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helper: render structured doc directly to print-ready HTML ───────────────

function renderStructuredToHTML(doc: StructuredDoc, withCorrection = true, lang = "francais"): string {
  const lg = headerLang(lang);
  const S = docStrings(lg);
  const support = doc.document?.trim() ? `<h2>${S.supportDocument}</h2>${mdToHtml(doc.document.trim())}<hr>` : "";
  // A devoir has no course summary, and then no "Énoncés" divider either:
  // the exercises follow the header directly, as on a real exam paper.
  const summary = doc.summary?.trim()
    ? `<h2>${S.summary}</h2>${mdToHtml(doc.summary)}<hr><h2>${S.statements}</h2>`
    : "";
  // Blocks carry `doc-*` classes so each template styles them its own way.
  const statements = doc.exercises.map((ex, i) =>
    `<div class="doc-exercise">
       <h3>${exerciseHeading(i, lg)}${ex.points ? ` <span class="doc-points">— ${ex.points}</span>` : ""}</h3>
       ${exerciseToHtml(ex.statement)}
     </div>`
  ).join("");

  const correctionsBlock = withCorrection
    ? `<hr class="doc-break">
    <h2>${S.corrections}</h2>
    ${doc.exercises.map((ex, i) =>
      `<div class="doc-correction">
       <h3>${S.correction} — ${exerciseHeading(i, lg)}</h3>
       ${exerciseToHtml(ex.correction)}
     </div>`
    ).join("")}`
    : "";

  return `
    ${support}
    ${summary}
    ${statements}
    ${correctionsBlock}
  `;
}
