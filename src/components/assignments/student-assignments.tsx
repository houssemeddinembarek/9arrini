"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ClipboardList, Loader2, FileText, CalendarClock, Upload, Send,
  CheckCircle2, Clock, BookX, ExternalLink, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ContentBody } from "@/components/content/content-body";
import { formatDate } from "@/lib/utils";

interface StudentAssignment {
  submissionId: string;
  status: "pending" | "submitted" | "corrected";
  workImages: string[];
  correctionImages: string[];
  aiCorrection?: string;
  assignment: {
    _id: string;
    title: string;
    instructions?: string;
    dueDate: string;
    content?: { title: string; pdfUrl?: string; body?: string; subject?: string; level?: string };
    teacher?: { name: string };
  };
}

// The student must be able to clearly read the énoncé before doing their work.
// Shows the exercice text (rendered with math) and/or the imported PDF inline.
function EnonceViewer({ a }: { a: StudentAssignment }) {
  const [open, setOpen] = useState(false);
  const content = a.assignment.content;
  const hasBody = !!content?.body && content.body.trim().length > 0;
  const hasPdf = !!content?.pdfUrl;
  if (!hasBody && !hasPdf) return null;

  return (
    <>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" /> Voir l&apos;énoncé
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{content?.title || a.assignment.title}</DialogTitle>
            {(content?.subject || content?.level) && (
              <DialogDescription>
                {[content?.subject, content?.level].filter(Boolean).join(" • ")}
              </DialogDescription>
            )}
          </DialogHeader>

          {a.assignment.instructions && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3 text-sm">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" /> Consignes
              </p>
              <p className="whitespace-pre-line text-[hsl(var(--muted-foreground))]">{a.assignment.instructions}</p>
            </div>
          )}

          {hasBody && <ContentBody body={content!.body!} />}

          {hasPdf && (
            <div className="space-y-2">
              <iframe
                src={content!.pdfUrl}
                title="Énoncé PDF"
                className="w-full h-[60vh] rounded-xl border border-[hsl(var(--border))]"
              />
              <a href={content!.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" /> Ouvrir dans un nouvel onglet
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SubmitBox({ a, onDone }: { a: StudentAssignment; onDone: (imgs: string[]) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const submit = async () => {
    if (files.length === 0) {
      toast.error("Ajoute au moins une photo de ton travail");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/assignments/${a.assignment._id}/submit`, { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        toast.success("Travail envoyé à ton professeur");
        onDone(json.data.workImages);
        setFiles([]);
      } else {
        toast.error(json.error || "Échec de l'envoi");
      }
    } catch {
      toast.error("Échec de l'envoi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[hsl(var(--border))]">
      <label className="flex items-center gap-1.5 text-sm text-[hsl(var(--primary))] cursor-pointer">
        <Upload className="h-4 w-4" /> Photos de mon travail
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
      </label>
      {files.length > 0 && <span className="text-xs text-[hsl(var(--muted-foreground))]">{files.length} photo(s)</span>}
      <Button size="sm" variant="gradient" className="ml-auto" onClick={submit} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer
      </Button>
    </div>
  );
}

export function StudentAssignments() {
  const [items, setItems] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assignments");
        const json = await res.json();
        if (json.success) setItems(json.data.assignments);
      } catch {
        toast.error("Échec du chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-[hsl(var(--primary))]" /> Travail à faire
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Tes exercices à rendre. Fais-les sur papier et envoie les photos.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] p-12 text-center">
          <BookX className="h-10 w-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Aucun travail à faire pour le moment 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.submissionId} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{a.assignment.title}</h3>
                    {a.status === "corrected" ? (
                      <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Corrigé</Badge>
                    ) : a.status === "submitted" ? (
                      <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Rendu, en attente</Badge>
                    ) : (
                      <Badge variant="secondary">À faire</Badge>
                    )}
                  </div>
                  {a.assignment.instructions && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{a.assignment.instructions}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                    <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> avant le {formatDate(a.assignment.dueDate)}</span>
                    {a.assignment.teacher?.name && <span>Prof : {a.assignment.teacher.name}</span>}
                  </div>
                </div>
                <EnonceViewer a={a} />
              </div>

              {/* My uploaded work */}
              {a.workImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {a.workImages.map((src) => (
                    <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="relative w-16 h-16 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                      <Image src={src} alt="mon travail" fill className="object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {/* Correction (after corrected) */}
              {a.status === "corrected" && (
                <div className="mt-3 space-y-2 rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 p-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-green-700 dark:text-green-400">
                    <Sparkles className="h-3.5 w-3.5" /> Correction de ton professeur
                  </p>
                  {a.aiCorrection && <div className="text-sm whitespace-pre-line">{a.aiCorrection}</div>}
                  {a.correctionImages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {a.correctionImages.map((src) => (
                        <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                          <Image src={src} alt="correction" fill className="object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit / add more work while not yet corrected */}
              {a.status !== "corrected" && (
                <SubmitBox
                  a={a}
                  onDone={(imgs) =>
                    setItems((prev) =>
                      prev.map((x) => (x.submissionId === a.submissionId ? { ...x, status: "submitted", workImages: imgs } : x))
                    )
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
