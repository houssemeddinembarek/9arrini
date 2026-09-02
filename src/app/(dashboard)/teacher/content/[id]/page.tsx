"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Copy, Check, BookOpen, ClipboardList,
  FileText, GraduationCap, Sparkles, ExternalLink, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveLanguage } from "@/lib/teaching-language";
import { openPrintWindow } from "@/lib/pdf/print";
import { mdToHtml } from "@/lib/pdf/markdown";
import { PdfTemplate, defaultTemplateFor, getTemplate, templatesFor } from "@/lib/pdf/templates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── KaTeX loader ─────────────────────────────────────────────────────────────

function useKaTeX() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ((window as any).renderMathInElement) { setReady(true); return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
    document.head.appendChild(css);
    const s1 = document.createElement("script");
    s1.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
    s1.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js";
      s2.onload = () => setReady(true);
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }, []);
  return ready;
}

function renderKaTeX(el: HTMLElement) {
  if (!(window as any).renderMathInElement) return;
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

// ─── Markdown → HTML ──────────────────────────────────────────────────────────



// ─── PDF print ────────────────────────────────────────────────────────────────

function printAsPDF(item: ContentItem, htmlContent: string, template: PdfTemplate) {
  const opened = openPrintWindow({
    template,
    header: {
      contentType: item.contentType,
      subject: item.subject,
      level: item.level,
      title: item.title,
      devoirNumber: item.devoirNumber,
      trimester: item.trimester,
      establishment: item.establishment || undefined,
      teacher: item.teacherName || undefined,
      stampId: `9A-${item._id.slice(-8).toUpperCase()}`,
      date: item.createdAt ? new Date(item.createdAt) : undefined,
    },
    html: htmlContent,
    // The library stores no language: it follows from the subject and level,
    // by the same rule the generator used when it wrote the document.
    lang: resolveLanguage(item.subject, item.level),
  });
  if (!opened) toast.error("Autorisez les popups pour télécharger le PDF");
}

// ─── Types ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  resume: { label: "Résumé de cours", icon: BookOpen, color: "text-blue-500" },
  exercices: { label: "Série d'exercices", icon: ClipboardList, color: "text-green-500" },
  devoir_controle: { label: "Devoir de contrôle", icon: FileText, color: "text-orange-500" },
  devoir_synthese: { label: "Devoir de synthèse", icon: GraduationCap, color: "text-red-500" },
  fiche_revision: { label: "Fiche de révision", icon: Sparkles, color: "text-purple-500" },
};

const SOURCE_LABELS: Record<string, string> = {
  ai_generated: "Généré par IA",
  uploaded: "PDF importé",
  ai_adapted: "Adapté par IA",
};

interface ContentItem {
  _id: string;
  title: string;
  subject: string;
  level: string;
  contentType: string;
  source: string;
  body: string;
  pdfUrl?: string;
  devoirNumber?: number;
  trimester?: number;
  establishment?: string;
  teacherName?: string;
  createdAt: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const katexReady = useKaTeX();
  const contentRef = useRef<HTMLDivElement>(null);

  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // Empty until the teacher picks one — then it overrides the type's default.
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/content/${id}`);
        if (res.status === 404) { setNotFound(true); return; }
        const json = await res.json();
        if (res.ok) setItem(json.data.item);
        else toast.error("Erreur de chargement");
      } catch {
        toast.error("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (item?.body && katexReady && contentRef.current) {
      renderKaTeX(contentRef.current);
    }
  }, [item, katexReady]);

  const handleCopy = () => {
    if (!item?.body) return;
    navigator.clipboard.writeText(item.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Contenu copié !");
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !item) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <FileText className="h-16 w-16 mx-auto text-[hsl(var(--muted-foreground))]/30" />
        <h2 className="text-xl font-semibold">Document introuvable</h2>
        <p className="text-[hsl(var(--muted-foreground))] text-sm">Ce contenu n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
        <Button variant="outline" onClick={() => router.push("/teacher/content")}>
          <ArrowLeft className="h-4 w-4" /> Retour à la bibliothèque
        </Button>
      </div>
    );
  }

  const meta = TYPE_META[item.contentType] || TYPE_META.resume;
  const template = templateId ? getTemplate(templateId) : defaultTemplateFor(item.contentType);
  const Icon = meta.icon;
  const hasBody = item.body && item.body.trim().length > 0;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 mt-0.5" onClick={() => router.push("/teacher/content")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="secondary" className="text-xs">{SOURCE_LABELS[item.source] || item.source}</Badge>
            <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
          </div>
          <h1 className="text-2xl font-bold truncate">{item.title}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-0.5">
            {item.subject} • {item.level} • {new Date(item.createdAt).toLocaleDateString("fr-TN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Document card */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center ${meta.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">{item.subject}</span>
            <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:inline">• {item.level}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {hasBody && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                <span className="hidden sm:inline text-xs">{copied ? "Copié" : "Copier"}</span>
              </Button>
            )}
            {item.pdfUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Ouvrir PDF</span>
                </a>
              </Button>
            )}
            {hasBody && (
              <>
                {/* Paper the document prints on */}
                <Select value={template.id} onValueChange={setTemplateId}>
                  <SelectTrigger className="h-8 w-[140px] sm:w-[168px] text-xs px-2.5" title={template.description}>
                    <SelectValue placeholder="Modèle" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[320px]">
                    {templatesFor(item.contentType).map((t) => (
                      <SelectItem key={t.id} value={t.id} textValue={t.label}>
                        <span className="flex flex-col gap-0.5 py-0.5">
                          <span className="text-xs font-medium">{t.label}</span>
                          <span className="text-[10px] leading-snug text-[hsl(var(--muted-foreground))]">{t.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="gradient" size="sm"
                  onClick={() => printAsPDF(item, contentRef.current?.innerHTML || "", template)}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Télécharger PDF</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {hasBody ? (
          <div className="p-8">
            <div
              ref={contentRef}
              className="prose prose-sm max-w-none
                [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:underline [&_h1]:text-[hsl(var(--foreground))]
                [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-[hsl(var(--primary))] [&_h2]:border-b [&_h2]:border-[hsl(var(--border))] [&_h2]:pb-1
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1.5
                [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1
                [&_p]:my-2 [&_p]:leading-relaxed [&_p]:text-[hsl(var(--foreground))]
                [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc
                [&_li]:my-1 [&_li]:leading-relaxed
                [&_blockquote]:border-l-4 [&_blockquote]:border-[hsl(var(--primary))]/40 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-[hsl(var(--muted-foreground))] [&_blockquote]:bg-[hsl(var(--primary))]/5 [&_blockquote]:rounded-r-lg
                [&_code]:bg-[hsl(var(--muted))] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
                [&_strong]:font-semibold
                [&_hr]:border-[hsl(var(--border))] [&_hr]:my-5"
              dangerouslySetInnerHTML={{ __html: mdToHtml(item.body) }}
            />
          </div>
        ) : item.pdfUrl ? (
          <div className="p-12 text-center space-y-4">
            <FileText className="h-14 w-14 mx-auto text-[hsl(var(--muted-foreground))]/30" />
            <p className="font-medium">Ce document est un PDF importé</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Le contenu textuel n&apos;est pas disponible pour les PDFs importés.</p>
            <Button variant="gradient" asChild>
              <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Ouvrir le PDF Cloudinary
              </a>
            </Button>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">Aucun contenu disponible pour ce document.</p>
          </div>
        )}
      </div>
    </div>
  );
}
