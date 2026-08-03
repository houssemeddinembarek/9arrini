"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Loader2, Plus, ChevronRight, BookOpen, ClipboardList, Trophy, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface Child {
  _id: string;
  name: string;
  avatar?: string;
  xp?: number;
  level?: number;
  studentProfile?: { stage?: string; year?: string };
  stats: { courses: number; quizzesPassed: number; pendingWork: number };
}

export default function ParentOverviewPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [linking, setLinking] = useState(false);

  const load = () => {
    fetch("/api/parent/children")
      .then((r) => r.json())
      .then((j) => { if (j.success) setChildren(j.data.children); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleLink = async () => {
    if (!code.trim()) return;
    setLinking(true);
    try {
      const res = await fetch("/api/parent/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.error || "Code invalide"); return; }
      toast.success(json.data.alreadyLinked ? "Enfant déjà lié" : `${json.data.child.name} a été lié à votre compte`);
      setCode("");
      setLoading(true);
      load();
    } catch {
      toast.error("Erreur de liaison");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (id: string, name: string) => {
    if (!confirm(`Dissocier ${name} de votre compte ?`)) return;
    const res = await fetch(`/api/parent/children/${id}`, { method: "DELETE" });
    if (res.ok) {
      setChildren((c) => c.filter((x) => x._id !== id));
      toast.success("Enfant dissocié");
    } else {
      toast.error("Erreur");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-[hsl(var(--primary))]" /> Espace parent
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Suivez la progression de vos enfants.</p>
      </div>

      {/* Link a child by code */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-1"><Plus className="h-4 w-4 text-[hsl(var(--primary))]" /> Lier un enfant</h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
          Saisissez le code de liaison que l&apos;établissement vous a communiqué pour votre enfant.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Code d'invitation (ex: ABCD2345)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono tracking-widest uppercase"
            maxLength={12}
          />
          <Button variant="gradient" onClick={handleLink} loading={linking} disabled={!code.trim() || linking}>
            <Plus className="h-4 w-4" /> Lier
          </Button>
        </div>
      </div>

      {/* Children */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : children.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--border))] p-12 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/30" />
          <p className="font-medium">Aucun enfant lié pour le moment</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Utilisez ci-dessus le code communiqué par l&apos;établissement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((c) => (
            <div key={c._id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex items-center gap-4">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={c.avatar} alt="" />
                <AvatarFallback className="font-semibold">{getInitials(c.name)}</AvatarFallback>
              </Avatar>
              <Link href={`/parent/children/${c._id}`} className="flex-1 min-w-0 group">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate group-hover:text-[hsl(var(--primary))] transition-colors">{c.name}</h3>
                  <Badge variant="success" className="text-[10px]">Niv. {c.level ?? 1}</Badge>
                  {c.studentProfile?.year && <Badge variant="secondary" className="text-[10px]">{c.studentProfile.year}</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {c.stats.courses} cours</span>
                  <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {c.stats.quizzesPassed} quiz réussis</span>
                  <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> {c.stats.pendingWork} en attente</span>
                </div>
              </Link>
              <button
                onClick={() => handleUnlink(c._id, c.name)}
                title="Dissocier"
                className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-[hsl(var(--accent))] shrink-0"
              >
                <Unlink className="h-4 w-4" />
              </button>
              <Link href={`/parent/children/${c._id}`} className="p-2 text-[hsl(var(--muted-foreground))] shrink-0">
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
