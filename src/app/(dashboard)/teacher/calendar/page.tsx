"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, Video, MapPin,
  Users, Bell, Calendar, Trash2, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MeetingHistory } from "@/components/meetings/meeting-history";
import { toast } from "sonner";
import { cn, toDateInputValue } from "@/lib/utils";

interface Group {
  _id: string;
  name: string;
  color: string;
}

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  group?: Group;
  date: string;
  startTime: string;
  endTime?: string;
  type: "online" | "in-person" | "hybrid";
  meetingUrl?: string;
  location?: string;
  reminder: { enabled: boolean; minutesBefore: number };
  status: "scheduled" | "cancelled" | "completed";
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TYPE_LABELS: Record<string, string> = {
  online: "Online",
  "in-person": "In Person",
  hybrid: "Hybrid",
};

const TYPE_BADGE: Record<string, "purple" | "success" | "secondary"> = {
  online: "purple",
  "in-person": "success",
  hybrid: "secondary",
};

const COLOR_CLASSES: Record<string, string> = {
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
};

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface ClassOption {
  _id: string;
  title: string;
  subject: string;
}

interface FormData {
  title: string;
  description: string;
  groupId: string;
  classId: string;
  studentIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  type: "online" | "in-person" | "hybrid";
  meetingUrl: string;
  location: string;
  reminderEnabled: boolean;
  reminderMinutes: number;
}

const TODAY = new Date();
const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  groupId: "",
  classId: "",
  studentIds: [],
  date: toDateInputValue(TODAY),
  startTime: "09:00",
  endTime: "10:00",
  type: "online",
  meetingUrl: "",
  location: "",
  reminderEnabled: true,
  reminderMinutes: 30,
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/meetings?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`);
        const json = await res.json();
        if (active) setMeetings(json.success ? json.data.meetings : []);
      } catch {
        if (active) setMeetings([]);
      }
    })();
    return () => { active = false; };
  }, [currentDate]);

  // Recipients to choose from: groups, classes, and individual students.
  useEffect(() => {
    (async () => {
      try {
        const [groupRes, classRes, studentRes] = await Promise.all([
          fetch("/api/groups"),
          fetch("/api/classes"),
          fetch("/api/teacher/students"),
        ]);
        const [groupJson, classJson, studentJson] = await Promise.all([
          groupRes.json(), classRes.json(), studentRes.json(),
        ]);
        if (groupJson.success) {
          setGroups((groupJson.data.groups || []).map((g: { _id: string; name: string; color: string }) => ({
            _id: g._id, name: g.name, color: g.color,
          })));
        }
        if (classJson.success) {
          setClasses((classJson.data.classes || []).map((c: { _id: string; title: string; subject: string }) => ({
            _id: c._id, title: c.title, subject: c.subject,
          })));
        }
        if (studentJson.success) {
          setStudents((studentJson.data.students || []).map((s: { _id: string; name: string; email: string }) => ({
            _id: s._id, name: s.name, email: s.email,
          })));
        }
      } catch {
        // best-effort; the form still works with whatever loaded
      }
    })();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const getMeetingsForDay = (day: number) => {
    return meetings.filter((m) => {
      // Dates are stored as UTC midnight of the intended day — read them in UTC
      // so a meeting never lands in the wrong calendar cell.
      const d = new Date(m.date);
      return d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day;
    });
  };

  const openCreateForDate = (day: number) => {
    const d = new Date(year, month, day);
    setForm({
      ...EMPTY_FORM,
      date: toDateInputValue(d),
    });
    setSelectedMeeting(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date || !form.startTime) {
      toast.error("Title, date and start time are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        group: form.groupId || undefined,
        classId: form.classId || undefined,
        studentIds: form.studentIds,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        type: form.type,
        meetingUrl: form.meetingUrl,
        location: form.location,
        reminder: { enabled: form.reminderEnabled, minutesBefore: form.reminderMinutes },
      };
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not schedule the meeting");
      setMeetings((prev) => [...prev, json.data.meeting]);
      toast.success("Meeting scheduled!");
      setShowModal(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not schedule the meeting");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    } catch {
      // offline
    }
    setMeetings((prev) => prev.filter((m) => m._id !== id));
    setSelectedMeeting(null);
    toast.success("Meeting removed");
  };

  const upcomingMeetings = meetings
    .filter((m) => new Date(m.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar & Meetings</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Schedule sessions with your groups and set reminders.
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={() => {
            setForm({ ...EMPTY_FORM, date: toDateInputValue(new Date()) });
            setSelectedMeeting(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4" /> New Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-lg">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-[hsl(var(--muted-foreground))] py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dayMeetings = getMeetingsForDay(day);
              const isToday =
                TODAY.getFullYear() === year &&
                TODAY.getMonth() === month &&
                TODAY.getDate() === day;

              return (
                <button
                  key={day}
                  onClick={() => openCreateForDate(day)}
                  className={cn(
                    "relative min-h-[52px] rounded-xl p-1.5 text-left transition-colors hover:bg-[hsl(var(--accent))] group",
                    isToday && "bg-[hsl(var(--primary))]/10 hover:bg-[hsl(var(--primary))]/15"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                      isToday
                        ? "gradient-bg text-white"
                        : "text-[hsl(var(--foreground))]"
                    )}
                  >
                    {day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayMeetings.slice(0, 2).map((m) => (
                      <div
                        key={m._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMeeting(m);
                        }}
                        className={cn(
                          "text-[10px] rounded px-1 py-0.5 truncate text-white leading-tight",
                          m.group ? (COLOR_CLASSES[m.group.color] || "bg-purple-500") : "gradient-bg"
                        )}
                      >
                        {m.startTime} {m.title}
                      </div>
                    ))}
                    {dayMeetings.length > 2 && (
                      <div className="text-[10px] text-[hsl(var(--muted-foreground))] pl-1">
                        +{dayMeetings.length - 2} more
                      </div>
                    )}
                  </div>
                  <Plus className="absolute top-1 right-1 h-3 w-3 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming meetings sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[hsl(var(--primary))]" />
              Upcoming
            </h3>
            {upcomingMeetings.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                No upcoming meetings
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((m) => {
                  const d = new Date(m.date);
                  return (
                    <button
                      key={m._id}
                      onClick={() => setSelectedMeeting(m)}
                      className="w-full text-left p-3 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/30 hover:bg-[hsl(var(--accent))] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5 shrink-0",
                            m.group
                              ? (COLOR_CLASSES[m.group.color] || "bg-purple-500")
                              : "bg-[hsl(var(--primary))]"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                            {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {m.startTime}
                            {m.endTime && ` – ${m.endTime}`}
                          </p>
                          {m.group && (
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                              {m.group.name}
                            </p>
                          )}
                        </div>
                        <Badge variant={TYPE_BADGE[m.type]} className="text-[10px] shrink-0">
                          {TYPE_LABELS[m.type]}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reminder note */}
          <div className="rounded-2xl bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-[hsl(var(--primary))]" />
              <p className="text-sm font-semibold text-[hsl(var(--primary))]">Reminders</p>
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              An email reminder is sent to every participant before the meeting starts, and an in-app alert pops up when it&apos;s about to begin.
            </p>
          </div>
        </div>
      </div>

      {/* History of past meetings */}
      <MeetingHistory />

      {/* Meeting detail modal */}
      {selectedMeeting && !showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedMeeting(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-lg">{selectedMeeting.title}</h2>
                {selectedMeeting.group && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {selectedMeeting.group.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedMeeting.description && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {selectedMeeting.description}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                {new Date(selectedMeeting.date).toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric",
                })}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                {selectedMeeting.startTime}
                {selectedMeeting.endTime && ` – ${selectedMeeting.endTime}`}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {selectedMeeting.type === "online" ? (
                  <Video className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                ) : (
                  <MapPin className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                )}
                <Badge variant={TYPE_BADGE[selectedMeeting.type]}>
                  {TYPE_LABELS[selectedMeeting.type]}
                </Badge>
              </div>
              {selectedMeeting.meetingUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <a
                    href={selectedMeeting.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--primary))] hover:underline truncate"
                  >
                    {selectedMeeting.meetingUrl}
                  </a>
                </div>
              )}
              {selectedMeeting.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  {selectedMeeting.location}
                </div>
              )}
              {selectedMeeting.reminder.enabled && (
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  Reminder {selectedMeeting.reminder.minutesBefore} min before
                </div>
              )}
            </div>

            {selectedMeeting.type !== "in-person" && (
              <Button
                variant="gradient"
                className="w-full"
                onClick={() => { window.location.href = `/meetings/${selectedMeeting._id}`; }}
              >
                <Video className="h-4 w-4" /> Join meeting room
              </Button>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleDelete(selectedMeeting._id)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedMeeting(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create meeting modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Schedule Meeting</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g. Math Revision Session"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  placeholder="Optional notes"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              {/* Who's invited — combine a group, a class, and/or hand-picked students. */}
              <div className="rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <span className="text-sm font-medium">Participants</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Group</Label>
                    <select
                      value={form.groupId}
                      onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                      className="w-full h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
                    >
                      <option value="">No group</option>
                      {groups.map((g) => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Class</Label>
                    <select
                      value={form.classId}
                      onChange={(e) => setForm({ ...form, classId: e.target.value })}
                      className="w-full h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
                    >
                      <option value="">No class</option>
                      {classes.map((c) => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {students.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Specific students {form.studentIds.length > 0 && `(${form.studentIds.length})`}</Label>
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-[hsl(var(--border))] divide-y divide-[hsl(var(--border))]">
                      {students.map((s) => {
                        const checked = form.studentIds.includes(s._id);
                        return (
                          <label key={s._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[hsl(var(--accent))]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setForm((f) => ({
                                  ...f,
                                  studentIds: e.target.checked
                                    ? [...f.studentIds, s._id]
                                    : f.studentIds.filter((id) => id !== s._id),
                                }))
                              }
                            />
                            <span className="truncate">{s.name}</span>
                            <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))] truncate">{s.email}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Leave all empty to create a meeting just for yourself.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Time *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      type="time"
                      className="pl-9"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      type="time"
                      className="pl-9"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Meeting Type</Label>
                <div className="flex gap-2">
                  {(["online", "in-person", "hybrid"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={cn(
                        "flex-1 py-2 rounded-xl border text-sm font-medium transition-all",
                        form.type === t
                          ? "gradient-bg text-white border-transparent shadow"
                          : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
                      )}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              {form.type !== "in-person" && (
                <div className="space-y-1.5">
                  <Label>Meeting URL</Label>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      className="pl-9"
                      placeholder="https://zoom.us/j/..."
                      value={form.meetingUrl}
                      onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {form.type !== "online" && (
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      className="pl-9"
                      placeholder="Room 204, Building A..."
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[hsl(var(--primary))]" />
                    <span className="text-sm font-medium">Reminder</span>
                  </div>
                  <Switch
                    checked={form.reminderEnabled}
                    onCheckedChange={(v) => setForm({ ...form, reminderEnabled: v })}
                  />
                </div>
                {form.reminderEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">Notify me</span>
                    <select
                      value={form.reminderMinutes}
                      onChange={(e) => setForm({ ...form, reminderMinutes: Number(e.target.value) })}
                      className="h-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 text-sm focus:outline-none"
                    >
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                    </select>
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">before</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="gradient" className="flex-1" onClick={handleSave} loading={saving}>
                <Calendar className="h-4 w-4" /> Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
