"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen, FileText, GraduationCap, ClipboardList, Sparkles,
  Upload, Trash2, ExternalLink, Filter, Search, Plus, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  resume: { label: "Résumé", icon: BookOpen, color: "text-blue-500" },
  exercices: { label: "Exercices", icon: ClipboardList, color: "text-green-500" },
  devoir_controle: { label: "DC", icon: FileText, color: "text-orange-500" },
  devoir_synthese: { label: "DS", icon: GraduationCap, color: "text-red-500" },
  fiche_revision: { label: "Fiche", icon: Sparkles, color: "text-purple-500" },
};

const SOURCE_LABELS: Record<string, string> = {
  ai_generated: "IA",
  uploaded: "PDF importé",
  ai_adapted: "IA adaptée",
};

interface ContentItem {
  _id: string;
  title: string;
  subject: string;
  level: string;
  contentType: string;
  source: string;
  pdfUrl?: string;
  body?: string;
  createdAt: string;
}

export default function ContentLibraryPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("contentType", filterType);
      const res = await fetch(`/api/content?${params}`);
      const json = await res.json();
      if (res.ok) setItems(json.data.items);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce contenu ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i._id !== id));
        toast.success("Contenu supprimé");
      } else {
        toast.error("Erreur de suppression");
      }
    } finally {
      setDeleting(null);
    }
  };

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.level.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bibliothèque de contenu</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-0.5">
            {items.length} document{items.length !== 1 ? "s" : ""} enregistré{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/teacher/generate-content">
          <Button variant="gradient">
            <Plus className="h-4 w-4" /> Ajouter du contenu
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            className="pl-9"
            placeholder="Rechercher par titre, matière, niveau..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="resume">Résumés</SelectItem>
            <SelectItem value="exercices">Exercices</SelectItem>
            <SelectItem value="devoir_controle">Devoirs de contrôle</SelectItem>
            <SelectItem value="devoir_synthese">Devoirs de synthèse</SelectItem>
            <SelectItem value="fiche_revision">Fiches de révision</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchItems}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/30" />
          <p className="font-medium">
            {search ? "Aucun résultat trouvé" : "Aucun contenu dans la bibliothèque"}
          </p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {search ? "Essayez d'autres mots-clés" : "Commencez par générer ou importer du contenu"}
          </p>
          {!search && (
            <Link href="/teacher/generate-content">
              <Button variant="gradient" className="mt-4">
                <Sparkles className="h-4 w-4" /> Créer du contenu
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const meta = TYPE_META[item.contentType] || TYPE_META.resume;
            const Icon = meta.icon;
            return (
              <div
                key={item._id}
                className="group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {SOURCE_LABELS[item.source] || item.source}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{item.subject} • {item.level}</p>
                  <Badge variant="outline" className="text-[10px] mt-2">{meta.label}</Badge>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[hsl(var(--border))]">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(item.createdAt).toLocaleDateString("fr-TN")}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.pdfUrl && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    {item.body && (
                      <Link href={`/teacher/content/${item._id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <BookOpen className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(item._id)}
                      disabled={deleting === item._id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
