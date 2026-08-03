"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Check, X, Clock, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate, cn } from "@/lib/utils";

type Status = "present" | "absent" | "late";
interface Row { _id: string; name: string; avatar?: string; status: Status | null }

const OPTIONS: { value: Status; label: string; icon: React.ElementType; on: string }[] = [
  { value: "present", label: "Présent", icon: Check, on: "bg-emerald-500 text-white border-transparent" },
  { value: "late", label: "Retard", icon: Clock, on: "bg-amber-500 text-white border-transparent" },
  { value: "absent", label: "Absent", icon: X, on: "bg-red-500 text-white border-transparent" },
];

export default function AttendancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/meetings/${id}/attendance`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j.success) { setTitle(j.data.title); setDate(j.data.date); setRows(j.data.roster); }
        else setError(j.error || "Indisponible");
      })
      .catch(() => setError("Indisponible"))
      .finally(() => setLoading(false));
  }, [id]);

  const setStatus = (studentId: string, status: Status) =>
    setRows((rs) => rs.map((r) => (r._id === studentId ? { ...r, status } : r)));

  const markAll = (status: Status) => setRows((rs) => rs.map((r) => ({ ...r, status })));

  const save = async () => {
    setSaving(true);
    try {
      const marks = rows.filter((r) => r.status).map((r) => ({ student: r._id, status: r.status }));
      const res = await fetch(`/api/meetings/${id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks }),
      });
      if (!res.ok) throw new Error();
      toast.success("Présences enregistrées");
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (error) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">{error}</p>
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Retour</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-[hsl(var(--primary))]" /> Présences</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{title}{date ? ` · ${formatDate(date)}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => markAll("present")}><Check className="h-4 w-4" /> Tous présents</Button>
          <Button variant="gradient" size="sm" onClick={save} loading={saving}><Save className="h-4 w-4" /> Enregistrer</Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--border))] p-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Aucun élève sur cette réunion.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r._id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={r.avatar} alt="" />
                <AvatarFallback className="text-xs font-semibold">{getInitials(r.name)}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium flex-1 min-w-0 truncate">{r.name}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                {OPTIONS.map(({ value, label, icon: Icon, on }) => (
                  <button
                    key={value}
                    onClick={() => setStatus(r._id, value)}
                    title={label}
                    className={cn(
                      "h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors",
                      r.status === value ? on : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
