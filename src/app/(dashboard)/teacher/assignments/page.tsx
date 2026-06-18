"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ClipboardList, Plus, Loader2, FileText, CalendarClock, Users, Trash2,
  Sparkles, Upload, Send, Check, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { getInitials, formatDate } from "@/lib/utils";

interface ContentItem { _id: string; title: string; contentType: string; }
interface StudentLite { _id: string; name: string; email: string; avatar?: string; }
interface GroupItem { _id: string; name: string; students: StudentLite[]; }

interface Assignment {
  _id: string;
  title: string;
  instructions?: string;
  dueDate: string;
  content?: { title: string };
  group?: { name: string };
  counts: { pending: number; submitted: number; corrected: number; total: number };
}

interface Submission {
  _id: string;
  status: "pending" | "submitted" | "corrected";
  workImages: string[];
  correctionImages: string[];
  aiCorrection?: string;
  student?: StudentLite;
}

const EMPTY = { title: "", contentId: "", dueDate: "", instructions: "", groupId: "" };

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [pickedStudents, setPickedStudents] = useState<string[]>([]);

  const [rosterFor, setRosterFor] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/assignments");
      const json = await res.json();
      if (json.success) setAssignments(json.data.assignments);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      try {
        const [cRes, gRes] = await Promise.all([fetch("/api/content"), fetch("/api/groups")]);
        const cJson = await cRes.json();
        const gJson = await gRes.json();
        if (cJson.success) setContents(cJson.data.items);
        if (gJson.success) setGroups(gJson.data.groups);
      } catch {
        /* ignore */
      }
    })();
  }, [load]);

  // Unique students across the teacher's groups, for individual targeting.
  const allStudents: StudentLite[] = Array.from(
    new Map(groups.flatMap((g) => g.students).map((s) => [s._id, s])).values()
  );

  const set = (k: keyof typeof EMPTY, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    if (!form.title || !form.contentId || !form.dueDate) {
      toast.error("Titre, contenu et date limite requis");
      return;
    }
    if (!form.groupId && pickedStudents.length === 0) {
      toast.error("Choisis un groupe ou des élèves");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          instructions: form.instructions,
          contentId: form.contentId,
          dueDate: form.dueDate,
          groupId: form.groupId || undefined,
          studentIds: pickedStudents,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Travail à faire envoyé");
        setCreateOpen(false);
        setForm(EMPTY);
        setPickedStudents([]);
        load();
      } else {
        toast.error(json.error || "Échec");
      }
    } catch {
      toast.error("Échec");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setAssignments((p) => p.filter((a) => a._id !== id));
        toast.success("Supprimé");
      } else toast.error(json.error || "Échec");
    } catch {
      toast.error("Échec");
    }
  };

  const openRoster = async (a: Assignment) => {
    setRosterFor(a);
    setRosterLoading(true);
    try {
      const res = await fetch(`/api/assignments/${a._id}`);
      const json = await res.json();
      if (json.success) setSubmissions(json.data.submissions || []);
    } catch {
      toast.error("Échec");
    } finally {
      setRosterLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-[hsl(var(--primary))]" /> Travail à faire
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Assign exercises, collect work, and send corrections</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient"><Plus className="h-4 w-4" /> Nouveau travail</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Créer un travail à faire</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Titre *</Label>
                <Input placeholder="ex. Exercices sur les fonctions" value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Contenu (exercice) *</Label>
                <Select value={form.contentId} onValueChange={(v) => set("contentId", v)}>
                  <SelectTrigger><SelectValue placeholder="Choisir un contenu créé" /></SelectTrigger>
                  <SelectContent>
                    {contents.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">Aucun contenu — crée-en dans la bibliothèque</div>
                    ) : (
                      contents.map((c) => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>À rendre avant *</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Groupe (optionnel)</Label>
                <Select value={form.groupId || "none"} onValueChange={(v) => set("groupId", v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Aucun groupe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun groupe</SelectItem>
                    {groups.map((g) => <SelectItem key={g._id} value={g._id}>{g.name} ({g.students.length})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {allStudents.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Élèves (optionnel) — {pickedStudents.length} sélectionné(s)</Label>
                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-[hsl(var(--border))] p-2">
                    {allStudents.map((s) => {
                      const checked = pickedStudents.includes(s._id);
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => setPickedStudents((p) => checked ? p.filter((x) => x !== s._id) : [...p, s._id])}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm ${checked ? "bg-[hsl(var(--primary))]/10" : "hover:bg-[hsl(var(--accent))]"}`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${checked ? "gradient-bg" : "border border-[hsl(var(--border))]"}`}>
                            {checked && <Check className="h-3 w-3 text-white" />}
                          </div>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Consignes (optionnel)</Label>
                <Textarea rows={2} placeholder="Instructions pour les élèves" value={form.instructions} onChange={(e) => set("instructions", e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button variant="gradient" onClick={create} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] p-12 text-center">
          <ClipboardList className="h-10 w-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Aucun travail à faire. Crée le premier.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div key={a._id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{a.title}</h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                  {a.content?.title && <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {a.content.title}</span>}
                  <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> avant le {formatDate(a.dueDate)}</span>
                  {a.group?.name && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {a.group.name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.counts.submitted > 0 && <Badge variant="warning">{a.counts.submitted} à corriger</Badge>}
                <Badge variant="success">{a.counts.corrected} corrigé(s)</Badge>
                <Button variant="outline" size="sm" onClick={() => openRoster(a)}>
                  <Eye className="h-4 w-4" /> {a.counts.total} élève(s)
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(a._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions + correction */}
      <Dialog open={!!rosterFor} onOpenChange={(o) => !o && setRosterFor(null)}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{rosterFor?.title} — travaux des élèves</DialogTitle></DialogHeader>
          {rosterLoading ? (
            <div className="flex items-center justify-center py-10 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">Aucun élève.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <SubmissionCard
                  key={s._id}
                  submission={s}
                  onUpdated={(updated) => {
                    setSubmissions((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
                    load();
                  }}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionCard({ submission, onUpdated }: { submission: Submission; onUpdated: (s: Submission) => void }) {
  const [open, setOpen] = useState(false);
  const [aiText, setAiText] = useState(submission.aiCorrection || "");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/submissions/${submission._id}/ai-correct`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setAiText(json.data.correction);
        toast.success("Correction IA générée — relis et envoie");
      } else {
        toast.error(json.error || "Échec IA");
      }
    } catch {
      toast.error("Échec IA");
    } finally {
      setGenerating(false);
    }
  };

  const send = async () => {
    if (!aiText.trim() && files.length === 0) {
      toast.error("Ajoute une correction (texte ou image)");
      return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      if (aiText.trim()) fd.append("correction", aiText.trim());
      files.forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/submissions/${submission._id}/correct`, { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        toast.success("Correction envoyée à l'élève");
        onUpdated({ ...submission, ...json.data });
        setFiles([]);
        setOpen(false);
      } else {
        toast.error(json.error || "Échec");
      }
    } catch {
      toast.error("Échec");
    } finally {
      setSending(false);
    }
  };

  const statusBadge =
    submission.status === "corrected" ? <Badge variant="success">Corrigé</Badge> :
    submission.status === "submitted" ? <Badge variant="warning">À corriger</Badge> :
    <Badge variant="secondary">En attente</Badge>;

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9"><AvatarImage src={submission.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(submission.student?.name || "?")}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{submission.student?.name}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{submission.student?.email}</p>
        </div>
        {statusBadge}
        {submission.status !== "pending" && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpen((o) => !o)}>
            {submission.status === "corrected" ? "Voir" : "Corriger"}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-[hsl(var(--border))] pt-3">
          {/* Student work */}
          {submission.workImages.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5">Travail de l&apos;élève</p>
              <div className="flex flex-wrap gap-2">
                {submission.workImages.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                    <Image src={src} alt="travail" fill className="object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {submission.status === "corrected" ? (
            <>
              {submission.aiCorrection && (
                <div className="rounded-lg bg-[hsl(var(--muted))]/40 p-3 text-sm whitespace-pre-line">{submission.aiCorrection}</div>
              )}
              {submission.correctionImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {submission.correctionImages.map((src) => (
                    <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="relative w-20 h-20 rounded-lg overflow-hidden border border-[hsl(var(--border))]">
                      <Image src={src} alt="correction" fill className="object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={generate} disabled={generating} className="w-full">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Générer la correction avec l&apos;IA
              </Button>
              <Textarea
                rows={6}
                placeholder="Correction (générée par l'IA puis modifiable, ou écris la tienne)…"
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-[hsl(var(--primary))] cursor-pointer">
                  <Upload className="h-3.5 w-3.5" /> Ajouter image(s) de correction
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                </label>
                {files.length > 0 && <span className="text-xs text-[hsl(var(--muted-foreground))]">{files.length} image(s)</span>}
              </div>
              <Button variant="gradient" size="sm" onClick={send} disabled={sending} className="w-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer la correction
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
