"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  GraduationCap, Clock, CalendarDays, Wallet, Users, Loader2, Video, BookX,
  Check, X, UserPlus, ClipboardCheck, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getInitials, formatDate } from "@/lib/utils";

interface ClassRow {
  _id: string;
  title: string;
  subject: string;
  level: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "open" | "cancelled" | "completed";
  confirmedCount: number;
  pendingCount: number;
}

interface Student {
  _id: string;
  status: string;
  isFree?: boolean;
  student?: { _id?: string; name: string; email: string; avatar?: string };
}

interface FreeSeances { allowance: number; used: number; remaining: number }

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rosterClass, setRosterClass] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [freeBalances, setFreeBalances] = useState<Record<string, FreeSeances>>({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/classes");
        const json = await res.json();
        if (json.success) setClasses(json.data.classes);
      } catch {
        toast.error("Failed to load classes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openRoster = async (cls: ClassRow) => {
    setRosterClass(cls);
    setRosterLoading(true);
    try {
      const res = await fetch(`/api/classes/${cls._id}`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data.enrollments || []);
        setFreeBalances(json.data.freeSeances || {});
      }
    } catch {
      toast.error("Failed to load students");
    } finally {
      setRosterLoading(false);
    }
  };

  // Accept or decline a pending join request, then update the local roster + counts.
  const respond = async (enrollmentId: string, action: "confirm" | "reject") => {
    setActingId(enrollmentId);
    try {
      const res = await fetch(`/api/class-enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed");

      if (action === "confirm") {
        setStudents((prev) =>
          prev.map((s) => (s._id === enrollmentId ? { ...s, status: "confirmed" } : s))
        );
        setClasses((prev) =>
          prev.map((c) =>
            c._id === rosterClass?._id
              ? { ...c, pendingCount: Math.max(0, c.pendingCount - 1), confirmedCount: c.confirmedCount + 1 }
              : c
          )
        );
        toast.success("Student accepted");
      } else {
        setStudents((prev) => prev.filter((s) => s._id !== enrollmentId));
        setClasses((prev) =>
          prev.map((c) =>
            c._id === rosterClass?._id ? { ...c, pendingCount: Math.max(0, c.pendingCount - 1) } : c
          )
        );
        toast.success("Request declined");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActingId(null);
    }
  };

  const pending = students.filter((s) => s.status === "pending");
  const confirmed = students.filter((s) => s.status === "confirmed");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-[hsl(var(--primary))]" /> My Classes
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Classes assigned to you by the admin, with your enrolled students</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] p-12 text-center">
          <BookX className="h-10 w-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No classes assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c._id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{c.title}</h3>
                  <Badge variant="purple">{c.subject}</Badge>
                  <Badge variant="secondary">{c.level}</Badge>
                  {c.status === "cancelled" && <Badge variant="destructive">Cancelled</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(c.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.startTime}–{c.endTime}</span>
                  <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> {c.price} DT</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="relative" onClick={() => openRoster(c)}>
                  <Users className="h-4 w-4" /> {c.confirmedCount} student{c.confirmedCount === 1 ? "" : "s"}
                  {c.pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-1">{c.pendingCount} pending</Badge>
                  )}
                </Button>
                {/* Présences for this séance — the register of confirmed students. */}
                <Link href={`/teacher/classes/${c._id}/attendance`}>
                  <Button variant="outline" size="sm"><ClipboardCheck className="h-4 w-4" /> Présences</Button>
                </Link>
                {c.status !== "cancelled" && (
                  <Link href={`/classes/${c._id}/room`}>
                    <Button variant="gradient" size="sm"><Video className="h-4 w-4" /> Start</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rosterClass} onOpenChange={(o) => !o && setRosterClass(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{rosterClass?.title} — students</DialogTitle></DialogHeader>
          {rosterLoading ? (
            <div className="flex items-center justify-center py-10 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : students.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">No requests or enrolled students yet.</p>
          ) : (
            <div className="space-y-5">
              {pending.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" /> Pending requests ({pending.length})
                  </p>
                  {pending.map((s) => (
                    <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--border))]">
                      <Avatar className="h-9 w-9"><AvatarImage src={s.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(s.student?.name || "?")}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.student?.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{s.student?.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="gradient" size="sm" disabled={actingId === s._id} onClick={() => respond(s._id, "confirm")}>
                          {actingId === s._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
                        </Button>
                        <Button variant="outline" size="sm" disabled={actingId === s._id} onClick={() => respond(s._id, "reject")}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Enrolled ({confirmed.length})
                </p>
                {confirmed.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] py-2">No enrolled students yet.</p>
                ) : (
                  confirmed.map((s) => (
                    <div key={s._id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-[hsl(var(--border))]">
                      <Avatar className="h-9 w-9 shrink-0"><AvatarImage src={s.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(s.student?.name || "?")}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-[8rem]">
                        <p className="text-sm font-medium truncate">{s.student?.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{s.student?.email}</p>
                      </div>
                      {/* How this student got in, and what is left of their grant. */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                        {s.isFree ? (
                          <Badge variant="success" className="gap-1"><Gift className="h-3 w-3" /> Séance gratuite</Badge>
                        ) : (
                          <Badge variant="secondary">Payée</Badge>
                        )}
                        {freeBalances[String(s.student?._id ?? "")] && (
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                            {freeBalances[String(s.student?._id)].remaining} gratuite(s) restante(s)
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
