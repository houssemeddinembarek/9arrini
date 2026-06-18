"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  GraduationCap, Plus, Clock, CalendarDays, Wallet, Users, Trash2,
  CheckCircle2, XCircle, Loader2, UserCheck, BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { getInitials, formatDate } from "@/lib/utils";
import { SUBJECTS, LEVELS } from "@/lib/tunisia-education";

interface TeacherOption {
  _id: string;
  name: string;
  avatar?: string;
  teachingProfile?: {
    subjects?: string[];
    levels?: string[];
    hourlyRate?: number;
    availability?: { day: string; from: string; to: string }[];
  };
}

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
  teacher?: { _id: string; name: string; avatar?: string };
  pendingCount: number;
  confirmedCount: number;
}

interface Enrollment {
  _id: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  student?: { _id: string; name: string; email: string; avatar?: string };
}

const EMPTY_FORM = {
  title: "", subject: "", level: "", description: "",
  teacher: "", date: "", startTime: "", endTime: "", price: "",
};

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Roster dialog
  const [rosterClass, setRosterClass] = useState<ClassRow | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  const loadClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/classes");
      const json = await res.json();
      if (json.success) setClasses(json.data.classes);
    } catch {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadClasses();
      try {
        const res = await fetch("/api/admin/users?role=teacher&approved=true&limit=100");
        const json = await res.json();
        if (json.success) setTeachers(json.data.users);
      } catch {
        /* ignore */
      }
    })();
  }, [loadClasses]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t._id === form.teacher),
    [teachers, form.teacher]
  );

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const createClass = async () => {
    if (!form.title || !form.subject || !form.level || !form.teacher || !form.date || !form.startTime || !form.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price) || 0 }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Class created");
        setCreateOpen(false);
        setForm(EMPTY_FORM);
        loadClasses();
      } else {
        toast.error(json.error || "Failed to create class");
      }
    } catch {
      toast.error("Failed to create class");
    } finally {
      setSaving(false);
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setClasses((p) => p.filter((c) => c._id !== id));
        toast.success("Class removed");
      } else {
        toast.error(json.error || "Failed to remove");
      }
    } catch {
      toast.error("Failed to remove");
    }
  };

  const openRoster = async (cls: ClassRow) => {
    setRosterClass(cls);
    setRosterLoading(true);
    try {
      const res = await fetch(`/api/classes/${cls._id}`);
      const json = await res.json();
      if (json.success) setEnrollments(json.data.enrollments || []);
    } catch {
      toast.error("Failed to load roster");
    } finally {
      setRosterLoading(false);
    }
  };

  const review = async (enrollmentId: string, action: "confirm" | "reject") => {
    try {
      const res = await fetch(`/api/class-enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        setEnrollments((p) => p.map((e) => (e._id === enrollmentId ? { ...e, status: json.data.status } : e)));
        toast.success(action === "confirm" ? "Payment confirmed — student enrolled" : "Request rejected");
        loadClasses();
      } else {
        toast.error(json.error || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-[hsl(var(--primary))]" /> Classes
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Schedule classes, assign teachers, and confirm enrollments after payment</p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient"><Plus className="h-4 w-4" /> New class</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create a class</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input placeholder="e.g. Mathématiques 7ème" value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Subject *</Label>
                  <Select value={form.subject} onValueChange={(v) => set("subject", v)}>
                    <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Level *</Label>
                  <Select value={form.level} onValueChange={(v) => set("level", v)}>
                    <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.flatMap((g) => g.items).map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Teacher *</Label>
                <Select value={form.teacher} onValueChange={(v) => set("teacher", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a professor" /></SelectTrigger>
                  <SelectContent>
                    {teachers.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">No approved teachers</div>
                    ) : (
                      teachers.map((t) => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
                {selectedTeacher?.teachingProfile && (
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-3 text-xs space-y-1.5 mt-1">
                    {!!selectedTeacher.teachingProfile.subjects?.length && (
                      <p><span className="text-[hsl(var(--muted-foreground))]">Teaches:</span> {selectedTeacher.teachingProfile.subjects.join(", ")}</p>
                    )}
                    {!!selectedTeacher.teachingProfile.levels?.length && (
                      <p><span className="text-[hsl(var(--muted-foreground))]">Levels:</span> {selectedTeacher.teachingProfile.levels.join(", ")}</p>
                    )}
                    <div>
                      <span className="text-[hsl(var(--muted-foreground))]">Availability:</span>{" "}
                      {selectedTeacher.teachingProfile.availability?.length
                        ? selectedTeacher.teachingProfile.availability.map((a) => `${a.day} ${a.from}–${a.to}`).join(" · ")
                        : "Not set"}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>From *</Label>
                  <Input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>To *</Label>
                  <Input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Price (DT)</Label>
                <Input type="number" min="0" placeholder="0" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={2} placeholder="Optional details for students" value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="gradient" onClick={createClass} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] p-12 text-center">
          <GraduationCap className="h-10 w-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No classes yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div key={c._id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{c.title}</h3>
                  <Badge variant="purple">{c.subject}</Badge>
                  <Badge variant="secondary">{c.level}</Badge>
                  {c.status === "cancelled" && <Badge variant="destructive">Cancelled</Badge>}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                  {c.teacher && (
                    <span className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5"><AvatarImage src={c.teacher.avatar} /><AvatarFallback className="text-[8px]">{getInitials(c.teacher.name)}</AvatarFallback></Avatar>
                      {c.teacher.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(c.date)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.startTime}–{c.endTime}</span>
                  <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> {c.price} DT</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.pendingCount > 0 && <Badge variant="warning">{c.pendingCount} pending</Badge>}
                <Badge variant="success" className="gap-1"><UserCheck className="h-3 w-3" /> {c.confirmedCount}</Badge>
                <Button variant="outline" size="sm" onClick={() => openRoster(c)}>
                  <Users className="h-4 w-4" /> Manage
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteClass(c._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roster / payment confirmation dialog */}
      <Dialog open={!!rosterClass} onOpenChange={(o) => !o && setRosterClass(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{rosterClass?.title} — enrollments</DialogTitle></DialogHeader>
          {rosterLoading ? (
            <div className="flex items-center justify-center py-10 text-[hsl(var(--muted-foreground))]"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">No join requests yet.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((e) => (
                <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--border))]">
                  <Avatar className="h-9 w-9"><AvatarImage src={e.student?.avatar} /><AvatarFallback className="text-xs">{getInitials(e.student?.name || "?")}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{e.student?.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{e.student?.email}</p>
                  </div>
                  {e.status === "pending" ? (
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="gradient" className="h-7 text-xs" onClick={() => review(e._id, "confirm")}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Payment received
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-red-500" onClick={() => review(e._id, "reject")}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : e.status === "confirmed" ? (
                    <Badge variant="success" className="gap-1"><BadgeCheck className="h-3 w-3" /> Enrolled</Badge>
                  ) : (
                    <Badge variant="secondary" className="capitalize">{e.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
