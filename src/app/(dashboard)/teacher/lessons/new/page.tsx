"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Film, Upload, X, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SUBJECTS, LEVELS, formatDuration } from "@/lib/tunisia-education";

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/ogg"];
const MAX_BYTES = 100 * 1024 * 1024;

function bytesToHuman(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function NewLessonPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error(`Format non supporté (${f.type || "inconnu"}). MP4, WebM, MOV, MKV, OGG.`);
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error(`Fichier trop volumineux (${bytesToHuman(f.size)}). Maximum 100 MB.`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    setDuration(0);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const canSubmit = file && title.trim().length >= 3 && !uploading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append("file", file!);
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("subject", subject);
    form.append("level", level);
    form.append("isPreview", String(isPreview));

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/lessons");
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) setProgress(Math.round((evt.loaded / evt.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          toast.success("Leçon vidéo créée !");
          router.push("/teacher/lessons");
          return;
        }
        toast.error(json.error || "Erreur lors de l'upload");
      } catch {
        toast.error("Réponse invalide du serveur");
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      toast.error("Connexion interrompue pendant l'upload");
    };
    xhr.onabort = () => {
      setUploading(false);
      toast.info("Upload annulé");
    };
    xhr.send(form);
  };

  const handleCancel = () => {
    if (xhrRef.current) xhrRef.current.abort();
  };

  const resetFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl("");
    setDuration(0);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nouvelle leçon vidéo</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            La leçon sera ajoutée à votre bibliothèque. Vous pourrez l&apos;inclure dans un cours plus tard.
          </p>
        </div>
      </div>

      {/* Dropzone or preview */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
        {!file ? (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="block rounded-xl border-2 border-dashed border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] p-10 text-center cursor-pointer transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Film className="h-7 w-7 text-white" />
            </div>
            <p className="font-medium">Glissez votre vidéo ici, ou cliquez pour parcourir</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              MP4, WebM, MOV, MKV, OGG · Maximum 100 MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </label>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                className="w-full h-full"
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 shadow-lg"
                onClick={resetFile}
                disabled={uploading}
                title="Choisir un autre fichier"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] flex-wrap gap-2">
              <span className="font-medium text-foreground truncate max-w-[60%]">{file.name}</span>
              <span>{bytesToHuman(file.size)} · {formatDuration(duration)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
        <h2 className="font-semibold">Informations</h2>

        <div className="space-y-1.5">
          <Label>Titre de la leçon *</Label>
          <Input
            placeholder="ex: Introduction aux suites numériques"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description <span className="text-[hsl(var(--muted-foreground))] text-xs">(optionnel)</span></Label>
          <Textarea
            placeholder="Ce que les élèves vont apprendre dans cette vidéo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[90px] text-sm"
            disabled={uploading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Matière <span className="text-[hsl(var(--muted-foreground))] text-xs">(optionnel)</span></Label>
            <Select value={subject} onValueChange={setSubject} disabled={uploading}>
              <SelectTrigger><SelectValue placeholder="Choisir une matière" /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Niveau scolaire <span className="text-[hsl(var(--muted-foreground))] text-xs">(optionnel)</span></Label>
            <Select value={level} onValueChange={setLevel} disabled={uploading}>
              <SelectTrigger><SelectValue placeholder="Choisir un niveau" /></SelectTrigger>
              <SelectContent>
                {LEVELS.map((g) => (
                  <div key={g.group}>
                    <div className="px-2 py-1 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{g.group}</div>
                    {g.items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--border))] p-3 bg-[hsl(var(--muted))]/30">
          <div className="flex items-start gap-2 min-w-0">
            <Eye className="h-4 w-4 text-[hsl(var(--primary))] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <Label htmlFor="isPreview" className="cursor-pointer text-sm">Leçon de prévisualisation</Label>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Visible gratuitement par les élèves non inscrits à un cours.</p>
            </div>
          </div>
          <Switch id="isPreview" checked={isPreview} onCheckedChange={setIsPreview} disabled={uploading} />
        </div>
      </div>

      {/* Progress + submit */}
      {uploading && (
        <div className="rounded-2xl border border-[hsl(var(--primary))]/30 bg-[hsl(var(--primary))]/5 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {progress < 100 ? "Téléversement en cours..." : "Traitement par Cloudinary..."}
            </span>
            <span className="font-mono text-[hsl(var(--primary))]">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <div
              className="h-full gradient-bg transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
            {progress < 100
              ? "Ne fermez pas cette page. Les fichiers volumineux peuvent prendre quelques minutes."
              : "La vidéo est en cours de transcodage. Cela peut prendre 30–90 secondes selon la taille."}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Stockage sécurisé sur Cloudinary
        </div>
        <div className="flex items-center gap-2">
          {uploading ? (
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" /> Annuler
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => router.push("/teacher/lessons")}>
              Annuler
            </Button>
          )}
          <Button type="submit" variant="gradient" loading={uploading} disabled={!canSubmit}>
            <Upload className="h-4 w-4" /> {uploading ? "Téléversement..." : "Publier la leçon"}
          </Button>
        </div>
      </div>
    </form>
  );
}
