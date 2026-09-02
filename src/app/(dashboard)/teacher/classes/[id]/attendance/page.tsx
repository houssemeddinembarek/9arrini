"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Check, X, Clock, Save, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatDate, cn } from "@/lib/utils";

type Status = "present" | "absent" | "late";
interface Row { _id: string; name: string; avatar?: string; status: Status | null }

const OPTIONS: { value: Status; label: string; icon: React.ElementType; on: string }[] = [
  { value: "present", label: "Présent", icon: Check, on: "bg-emerald-500 text-white border-transparent" },
  { value: "late", label: "Retard", icon: Clock, on: "bg-amber-500 text-white border-transparent" },
  { value: "absent", label: "Absent", icon: X, on: "bg-red-500 text-white border-transparent" },
];

// Présences for one séance (class session). The assigned teacher marks each
// confirmed student; admins open the same screen read-only.
export default function ClassAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [canMark, setCanMark] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/classes/${id}/attendance`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (ok && j.success) {
          setTitle(j.data.title);
          setSubject(j.data.subject || "");
          setDate(j.data.date);
          setSlot([j.data.startTime, j.data.endTime].filter(Boolean).join(" – "));
          setCanMark(!!j.data.canMark);
          setRows(j.data.roster);
        } else {
          setError(j.error || "Indisponible");
        }
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
      const res = await fetch(`/api/classes/${id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      toast.success("Présences enregistrées");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (error) {
    return (
      <div className="max-w-md mx-auto rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-6 sm:p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">{error}</p>
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /> Retour</Button>
      </div>
    );
  }

  const counts = OPTIONS.map((o) => ({ ...o, n: rows.filter((r) => r.status === o.value).length }));
  const unmarked = rows.filter((r) => !r.status).length;

  return (
    <div className="space-y-5 max-w-2xl">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-[hsl(var(--primary))] shrink-0" /> Présences
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            {title}
            {subject ? ` · ${subject}` : ""}
            {date ? ` · ${formatDate(date)}` : ""}
            {slot ? ` · ${slot}` : ""}
          </p>
        </div>
        {canMark && rows.length > 0 && (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => markAll("present")}>
              <Check className="h-4 w-4" /> Tous présents
            </Button>
            <Button variant="gradient" size="sm" onClick={save} loading={saving}>
              <Save className="h-4 w-4" /> Enregistrer
            </Button>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {counts.map(({ value, label, n }) => (
            <Badge key={value} variant={value === "present" ? "success" : value === "late" ? "warning" : "destructive"}>
              {label} : {n}
            </Badge>
          ))}
          {unmarked > 0 && <Badge variant="secondary">Non noté : {unmarked}</Badge>}
        </div>
      )}

      {!canMark && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Lecture seule — seul le professeur de la séance peut modifier les présences.
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[hsl(var(--border))] p-12 text-center text-sm text-[hsl(var(--muted-foreground))]">
          Aucun élève confirmé sur cette séance.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r._id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 flex flex-wrap items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={r.avatar} alt="" />
                <AvatarFallback className="text-xs font-semibold">{getInitials(r.name)}</AvatarFallback>
              </Avatar>
              <p className="text-sm font-medium flex-1 min-w-[6rem] truncate">{r.name}</p>
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                {OPTIONS.map(({ value, label, icon: Icon, on }) => (
                  <button
                    key={value}
                    disabled={!canMark}
                    onClick={() => setStatus(r._id, value)}
                    title={label}
                    className={cn(
                      "h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors disabled:cursor-default",
                      r.status === value ? on : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]",
                      canMark && r.status !== value && "hover:bg-[hsl(var(--accent))]",
                      !canMark && r.status !== value && "opacity-40",
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
