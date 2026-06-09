"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Video, PlusCircle, Film, Trash2, Play, Eye, EyeOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBJECTS, formatDuration } from "@/lib/tunisia-education";

type Lesson = {
  _id: string;
  title: string;
  description?: string;
  type: "video" | "pdf" | "text" | "quiz";
  subject?: string;
  level?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  isPreview: boolean;
  createdAt: string;
};

export default function TeacherLessonsPage() {
  const [items, setItems] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLessons = async (subject?: string) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (subject && subject !== "all") q.set("subject", subject);
      const res = await fetch(`/api/lessons${q.toString() ? `?${q}` : ""}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Erreur de chargement");
        return;
      }
      setItems(json.data.items);
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons(subjectFilter);
  }, [subjectFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette leçon ? Cette action est irréversible.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Erreur de suppression");
        return;
      }
      setItems((prev) => prev.filter((it) => it._id !== id));
      toast.success("Leçon supprimée");
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leçons vidéo</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1 text-sm">
            Votre bibliothèque de leçons vidéo, réutilisables dans plusieurs cours.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/teacher/lessons/new">
            <PlusCircle className="h-4 w-4" /> Nouvelle leçon
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filtrer par matière" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les matières</SelectItem>
            {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {!loading && (
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {items.length} leçon{items.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 opacity-80">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Aucune leçon pour l&apos;instant</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm mb-4">
            Téléversez votre première vidéo pédagogique. Vous pourrez l&apos;intégrer ensuite à un ou plusieurs cours.
          </p>
          <Button variant="gradient" asChild>
            <Link href="/teacher/lessons/new">
              <PlusCircle className="h-4 w-4" /> Créer ma première leçon
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((lesson) => (
            <LessonCard
              key={lesson._id}
              lesson={lesson}
              onPreview={() => setSelected(lesson)}
              onDelete={() => handleDelete(lesson._id)}
              deleting={deletingId === lesson._id}
            />
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="pr-8">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected?.videoUrl && (
            <div className="rounded-xl overflow-hidden bg-black aspect-video">
              {/* Cloudinary serves mp4 with proper headers; native <video> handles seeking. */}
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={selected.videoUrl} controls autoPlay className="w-full h-full" />
            </div>
          )}
          <div className="space-y-2 text-sm">
            {selected?.description && (
              <p className="text-[hsl(var(--muted-foreground))]">{selected.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {selected?.subject && <Badge variant="blue">{selected.subject}</Badge>}
              {selected?.level && <Badge variant="secondary">{selected.level}</Badge>}
              {selected?.duration ? <Badge variant="outline">{formatDuration(selected.duration)}</Badge> : null}
              {selected?.isPreview && <Badge variant="purple">Prévisualisation gratuite</Badge>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LessonCard({
  lesson,
  onPreview,
  onDelete,
  deleting,
}: {
  lesson: Lesson;
  onPreview: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <button
        type="button"
        onClick={onPreview}
        className="relative aspect-video bg-gradient-to-br from-[hsl(var(--muted))] to-[hsl(var(--muted))]/50 overflow-hidden"
      >
        {lesson.thumbnailUrl ? (
          <Image
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            fill
            unoptimized
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="h-12 w-12 text-[hsl(var(--muted-foreground))]/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl">
            <Play className="h-6 w-6 text-[hsl(var(--primary))] ml-0.5" />
          </div>
        </div>
        {lesson.duration ? (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono">
            {formatDuration(lesson.duration)}
          </span>
        ) : null}
        {lesson.isPreview && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[hsl(var(--primary))] text-white text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1">
            <Eye className="h-3 w-3" /> Prévisualisation
          </span>
        )}
      </button>

      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{lesson.title}</h3>
        {(lesson.subject || lesson.level) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {lesson.subject && <Badge variant="blue" className="text-[10px]">{lesson.subject}</Badge>}
            {lesson.level && <Badge variant="secondary" className="text-[10px]">{lesson.level}</Badge>}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] inline-flex items-center gap-1">
            {lesson.isPreview ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {lesson.isPreview ? "Public" : "Cours uniquement"}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onPreview} title="Lire">
              <Play className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-red-500 hover:text-red-600"
              onClick={onDelete}
              loading={deleting}
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
