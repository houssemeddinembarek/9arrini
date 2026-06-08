"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Sparkles, Upload, FileText, BookOpen,
  ClipboardList, GraduationCap, RotateCcw, Download, Copy, Check,
  Save, Library, Brain, Wand2, Plus, X, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

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

type Exercise = { statement: string; correction: string; points: string };
type StructuredDoc = { summary: string; exercises: Exercise[] };

type RefineTarget =
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

function mdToHtml(text: string): string {
  return text
    .replace(/&(?![a-z#0-9]+;)/gi, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^---$/gm, "<hr>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/gm, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n+/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

// ─── Structured ↔ Markdown ───────────────────────────────────────────────────

function structuredToMarkdown(doc: StructuredDoc): string {
  let md = "## Résumé du cours\n\n" + doc.summary.trim() + "\n\n---\n\n## Énoncés\n\n";
  doc.exercises.forEach((ex, i) => {
    md += `### Exercice ${i + 1}${ex.points ? ` — ${ex.points}` : ""}\n\n${ex.statement.trim()}\n\n`;
  });
  md += "\n---\n\n## Corrections\n\n";
  doc.exercises.forEach((ex, i) => {
    md += `### Correction — Exercice ${i + 1}\n\n${ex.correction.trim()}\n\n`;
  });
  return md;
}

// ─── 9arrini Academy CSS round seal (inline SVG, for PDF) ────────────────────

const SEAL_SVG = `
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="110" height="110">
  <defs>
    <path id="circle-top" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0" />
    <path id="circle-bot" d="M 100,100 m -78,0 a 78,78 0 1,0 156,0" />
  </defs>
  <circle cx="100" cy="100" r="92" fill="none" stroke="#7c3aed" stroke-width="3"/>
  <circle cx="100" cy="100" r="84" fill="none" stroke="#7c3aed" stroke-width="1"/>
  <circle cx="100" cy="100" r="50" fill="none" stroke="#7c3aed" stroke-width="0.8" stroke-dasharray="2 3"/>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="14" font-weight="700" fill="#7c3aed" letter-spacing="2">
    <textPath href="#circle-top" startOffset="50%" text-anchor="middle">★ 9ARRINI ACADEMY ★</textPath>
  </text>
  <text font-family="Georgia, 'Times New Roman', serif" font-size="11" font-weight="600" fill="#7c3aed" letter-spacing="3">
    <textPath href="#circle-bot" startOffset="50%" text-anchor="middle">DOCUMENT OFFICIEL</textPath>
  </text>
  <text x="100" y="92" text-anchor="middle" font-family="Georgia, serif" font-size="32" font-weight="800" fill="#7c3aed">9</text>
  <text x="100" y="110" text-anchor="middle" font-family="Georgia, serif" font-size="9" font-weight="700" fill="#7c3aed" letter-spacing="2">ACADEMY</text>
  <text x="100" y="124" text-anchor="middle" font-family="Georgia, serif" font-size="7" fill="#7c3aed" letter-spacing="1.5">✦ AI CERTIFIÉ ✦</text>
</svg>
`;

// ─── PDF print helper ─────────────────────────────────────────────────────────

function printAsPDF(
  subject: string, level: string, contentType: string, title: string,
  htmlContent: string, stampId: string,
) {
  const typeLabel = CONTENT_TYPES.find((t) => t.id === contentType)?.label || contentType;
  const year = new Date().getFullYear();

  const win = window.open("", "_blank");
  if (!win) { toast.error("Autorisez les popups pour télécharger le PDF"); return; }

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${typeLabel} — ${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Times New Roman',Times,serif;font-size:12pt;color:#000;padding:2cm 2cm 2.5cm;line-height:1.7;position:relative}
    .doc-header{border:2px solid #000;padding:10px 14px;margin-bottom:20px;position:relative;min-height:130px}
    .doc-header table{width:100%;border-collapse:collapse;max-width:calc(100% - 130px)}
    .doc-header td{padding:3px 5px;font-size:10pt}
    .doc-title{text-align:center;font-size:14pt;font-weight:bold;border-top:1px solid #000;margin-top:8px;padding-top:6px;max-width:calc(100% - 130px)}
    .seal{position:absolute;top:8px;right:8px;width:110px;height:110px}
    .seal svg{display:block}
    h1{font-size:15pt;margin:16px 0 8px;text-decoration:underline}
    h2{font-size:13pt;margin:14px 0 7px;border-bottom:1px solid #ccc;padding-bottom:3px;color:#5b21b6}
    h3{font-size:12pt;margin:10px 0 5px;color:#1e293b}
    h4{font-size:11pt;margin:8px 0 4px}
    p,li{margin:5px 0}ul,ol{margin:5px 0 5px 20px}
    blockquote{border-left:3px solid #7c3aed;padding-left:10px;margin:8px 0;color:#444;font-style:italic;background:#faf5ff;padding:6px 10px;border-radius:0 4px 4px 0}
    code{font-family:'Courier New',monospace;background:#f5f5f5;padding:1px 3px;font-size:10pt}
    strong{font-weight:bold}hr{border:none;border-top:1px solid #999;margin:12px 0}
    .watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80pt;font-weight:900;color:rgba(124,58,237,0.06);letter-spacing:6px;pointer-events:none;z-index:0;white-space:nowrap;font-family:Georgia,serif}
    .footer{margin-top:28px;font-size:9pt;color:#666;text-align:center;border-top:1px solid #ddd;padding-top:6px;display:flex;justify-content:space-between;align-items:center}
    .footer .stamp-id{font-family:'Courier New',monospace;font-size:8pt;color:#7c3aed;font-weight:600}
    #content{position:relative;z-index:1}
    @media print{
      body{padding:1.5cm 1.5cm 2cm}
      .watermark{position:fixed}
      @page{margin:1cm}
    }
  </style>
</head>
<body>
  <div class="watermark">9ARRINI ACADEMY</div>
  <div class="doc-header">
    <div class="seal">${SEAL_SVG}</div>
    <table>
      <tr><td>Établissement: _______________________</td><td style="text-align:right">Année: ${year}–${year + 1}</td></tr>
      <tr><td>Classe: <strong>${level}</strong></td><td style="text-align:right">Date: ${new Date().toLocaleDateString("fr-TN")}</td></tr>
    </table>
    <div class="doc-title">${typeLabel} — ${subject}<br><span style="font-size:12pt">${title}</span></div>
  </div>
  <div id="content">${htmlContent}</div>
  <div class="footer">
    <span>Document généré par <strong>9arrini Academy</strong> • Programme officiel tunisien</span>
    <span class="stamp-id">Ref: ${stampId}</span>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
  <script>
    document.addEventListener("DOMContentLoaded",function(){
      if(window.renderMathInElement){
        window.renderMathInElement(document.getElementById("content"),{
          delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false}],
          throwOnError:false
        });
      }
      setTimeout(()=>window.print(),900);
    });
  <\/script>
</body></html>`);
  win.document.close();
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
}: {
  heading?: string;
  badge?: string;
  value: string;
  onAIRefine: () => void;
  onDelete?: () => void;
  refining: boolean;
  katexReady: boolean;
  emptyLabel?: string;
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
        dangerouslySetInnerHTML={{ __html: mdToHtml(value || emptyLabel) }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Mode = "choose" | "ai" | "upload" | "adapt";

export default function GenerateContentPage() {
  const router = useRouter();
  const katexReady = useKaTeX();
  const previewRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>("choose");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [contentType, setContentType] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState("");
  const [structured, setStructured] = useState<StructuredDoc | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [stampId, setStampId] = useState("");

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

  const canGenerate = subject && level && contentType && title.trim().length >= 3;
  const isStructured = !!structured;

  const fullMarkdown = useMemo(
    () => (structured ? structuredToMarkdown(structured) : generated),
    [structured, generated]
  );

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setGenerated("");
    setStructured(null);
    setSavedId("");
    setStampId(`9A-${Date.now().toString(36).toUpperCase()}`);
    try {
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, level, contentType, title, notes }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Erreur de génération"); return; }
      if (json.data.format === "structured") {
        setStructured(json.data.structured);
      } else {
        setGenerated(json.data.content);
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
    if (target.kind === "summary") {
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
          title, subject, level, contentType,
          source: "ai_generated",
          contentBody: fullMarkdown,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Erreur de sauvegarde"); return; }
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
      setTitle(`Adaptation — ${adaptFile.name.replace(".pdf", "")}`);
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

  const handlePrintPDF = () => {
    const id = stampId || `9A-${Date.now().toString(36).toUpperCase()}`;
    if (structured) {
      printAsPDF(subject, level, contentType, title, renderStructuredToHTML(structured), id);
    } else {
      printAsPDF(subject, level, contentType, title, mdToHtml(generated), id);
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
          <Button variant="ghost" size="icon" onClick={() => setMode("choose")}><ArrowLeft className="h-4 w-4" /></Button>
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
          <div className="grid grid-cols-2 gap-3">
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
          <Button variant="ghost" size="icon" onClick={() => setMode("choose")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">Adapter un PDF existant</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">L&apos;IA génère un document original inspiré du vôtre</p>
          </div>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
          <div className="rounded-xl bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20 p-3 text-xs text-[hsl(var(--muted-foreground))]">
            <strong className="text-[hsl(var(--primary))]">Comment ça marche :</strong> Gemini AI analyse votre PDF et crée un nouveau document avec la même structure mais des exercices et formulations entièrement différents.
          </div>

          <label className="block">
            <div className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${adaptFile ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50"}`}>
              <Brain className={`h-7 w-7 mx-auto mb-2 ${adaptFile ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"}`} />
              <p className="font-medium text-sm">{adaptFile ? adaptFile.name : "Sélectionner le PDF à adapter"}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">PDF · Max 20 MB</p>
              <input type="file" accept=".pdf" className="hidden" onChange={(e) => setAdaptFile(e.target.files?.[0] || null)} />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
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
        <Button variant="ghost" size="icon" onClick={() => { setMode("choose"); setGenerated(""); setStructured(null); setSavedId(""); }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Générateur de contenu IA</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">Programme officiel tunisien • Formules LaTeX • Tampon 9arrini Academy</p>
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

          <div className="space-y-1.5">
            <Label>Titre / Chapitre *</Label>
            <Input placeholder="ex: Les suites numériques" value={title} onChange={(e) => setTitle(e.target.value)} />
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

              {/* "Desk" with the A4 paper */}
              <div className="flex-1 overflow-auto bg-[#eef0f4] p-4 sm:p-6">
                <div className="paper-page mx-auto bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-sm relative overflow-hidden"
                  style={{ maxWidth: "210mm", minHeight: "297mm", padding: "2cm 2cm 2.5cm", fontFamily: "'Times New Roman', Times, serif" }}>

                  {/* Faded watermark — matches print */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none" aria-hidden="true">
                    <span className="text-[80pt] font-black tracking-[6px] text-[#7c3aed] opacity-[0.05] -rotate-[30deg] whitespace-nowrap" style={{ fontFamily: "Georgia, serif" }}>
                      9ARRINI ACADEMY
                    </span>
                  </div>

                  {/* Document header */}
                  <div className="relative border-2 border-black p-3 mb-5 min-h-[130px]">
                    <div className="absolute top-2 right-2 w-[110px] h-[110px]" dangerouslySetInnerHTML={{ __html: SEAL_SVG }} />
                    <table className="w-full text-[10pt]" style={{ maxWidth: "calc(100% - 130px)" }}>
                      <tbody>
                        <tr>
                          <td className="py-0.5 px-1">Établissement: _______________________</td>
                          <td className="py-0.5 px-1 text-right">Année: {new Date().getFullYear()}–{new Date().getFullYear() + 1}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5 px-1">Classe: <strong>{level}</strong></td>
                          <td className="py-0.5 px-1 text-right">Date: {new Date().toLocaleDateString("fr-TN")}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="text-center font-bold border-t border-black mt-2 pt-1.5" style={{ maxWidth: "calc(100% - 130px)" }}>
                      <div className="text-[14pt]">{CONTENT_TYPES.find((t) => t.id === contentType)?.label} — {subject}</div>
                      <div className="text-[12pt] font-normal">{title}</div>
                    </div>
                  </div>

                  {/* Document body */}
                  <div className="relative z-[1]">
                    {isStructured ? (
                      <>
                        <RefinableBlock
                          heading="Résumé du cours"
                          value={structured!.summary}
                          onAIRefine={() => openRefine({ kind: "summary" })}
                          refining={refining && refiningKey === "summary"}
                          katexReady={katexReady}
                        />

                        <hr className="my-4 border-gray-400" />

                        <h2 className="paper-section-title">Énoncés</h2>
                        {structured!.exercises.map((ex, i) => (
                          <RefinableBlock
                            key={`ex-${i}`}
                            heading={`Exercice ${i + 1}`}
                            badge={ex.points || undefined}
                            value={ex.statement}
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

                        <div className="my-6 border-t-2 border-dashed border-[hsl(var(--primary))]/30 relative">
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2 text-[10pt] text-[hsl(var(--primary))]/60 italic">— saut de page —</span>
                        </div>

                        <h2 className="paper-section-title">Corrections</h2>
                        {structured!.exercises.map((ex, i) => (
                          <RefinableBlock
                            key={`co-${i}`}
                            heading={`Correction — Exercice ${i + 1}`}
                            value={ex.correction}
                            onAIRefine={() => openRefine({ kind: "correction", index: i })}
                            refining={refining && refiningKey === `co-${i}`}
                            katexReady={katexReady}
                          />
                        ))}
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
                    <span>Document généré par <strong>9arrini Academy</strong> • Programme officiel tunisien</span>
                    <span className="font-mono text-[8pt] text-[#7c3aed] font-semibold">Ref: {stampId}</span>
                  </div>
                </div>

                <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-4">
                  Survolez une section pour l&apos;améliorer avec l&apos;IA. Sauvegardez ou téléchargez le PDF quand tout vous convient.
                </p>
              </div>
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

function renderStructuredToHTML(doc: StructuredDoc): string {
  const summary = `<h2>Résumé du cours</h2>${mdToHtml(doc.summary)}`;
  const statements = doc.exercises.map((ex, i) =>
    `<div style="margin:14px 0;page-break-inside:avoid">
       <h3>Exercice ${i + 1}${ex.points ? ` <span style="font-weight:normal;color:#666">— ${ex.points}</span>` : ""}</h3>
       ${mdToHtml(ex.statement)}
     </div>`
  ).join("");
  const corrections = doc.exercises.map((ex, i) =>
    `<div style="margin:14px 0;page-break-inside:avoid">
       <h3>Correction — Exercice ${i + 1}</h3>
       ${mdToHtml(ex.correction)}
     </div>`
  ).join("");

  return `
    ${summary}
    <hr>
    <h2>Énoncés</h2>
    ${statements}
    <hr style="page-break-before:always">
    <h2>Corrections</h2>
    ${corrections}
  `;
}
