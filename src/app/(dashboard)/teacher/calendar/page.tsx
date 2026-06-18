"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, Video, MapPin,
  Users, Bell, Calendar, Trash2, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

const SAMPLE_MEETINGS: Meeting[] = [
  {
    _id: "m1",
    title: "Math Revision Session",
    description: "Cover chapters 3 and 4",
    group: { _id: "g1", name: "Math — 3ème", color: "purple" },
    date: new Date().toISOString(),
    startTime: "10:00",
    endTime: "11:00",
    type: "online",
    meetingUrl: "https://zoom.us/j/123456",
    reminder: { enabled: true, minutesBefore: 30 },
    status: "scheduled",
  },
  {
    _id: "m2",
    title: "Science Exam Prep",
    group: { _id: "g2", name: "Sciences — Bac", color: "green" },
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    startTime: "14:00",
    endTime: "15:30",
    type: "in-person",
    location: "Room 204",
    reminder: { enabled: true, minutesBefore: 60 },
    status: "scheduled",
  },
];

interface FormData {
  title: string;
  description: string;
  groupId: string;
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
  date: TODAY.toISOString().split("T")[0],
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [remindersChecked, setRemindersChecked] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [meetRes, groupRes] = await Promise.all([
        fetch(`/api/meetings?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`),
        fetch("/api/groups"),
      ]);
      const meetJson = await meetRes.json();
      const groupJson = await groupRes.json();
      if (meetJson.success && meetJson.data.meetings.length > 0) {
        setMeetings(meetJson.data.meetings);
      } else {
        setMeetings(SAMPLE_MEETINGS);
      }
      if (groupJson.success && groupJson.data.groups.length > 0) {
        setGroups(groupJson.data.groups.map((g: { _id: string; name: string; color: string }) => ({
          _id: g._id,
          name: g.name,
          color: g.color,
        })));
      }
    } catch {
      setMeetings(SAMPLE_MEETINGS);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check reminders once on mount
  useEffect(() => {
    if (remindersChecked) return;
    setRemindersChecked(true);

    const fired: string[] = JSON.parse(localStorage.getItem("skillora-reminders-fired") || "[]");
    const now = new Date();

    SAMPLE_MEETINGS.forEach((meeting) => {
      if (!meeting.reminder.enabled) return;
      if (fired.includes(meeting._id)) return;

      const meetingDate = new Date(meeting.date);
      const [h, m] = meeting.startTime.split(":").map(Number);
      meetingDate.setHours(h, m, 0, 0);

      const diffMs = meetingDate.getTime() - now.getTime();
      const diffMin = diffMs / 60000;

      if (diffMin > 0 && diffMin <= meeting.reminder.minutesBefore) {
        toast.info(
          `Reminder: "${meeting.title}" starts in ${Math.round(diffMin)} min`,
          { duration: 8000 }
        );
        fired.push(meeting._id);
        localStorage.setItem("skillora-reminders-fired", JSON.stringify(fired));
      }
    });
  }, [remindersChecked]);

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
      const d = new Date(m.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const openCreateForDate = (day: number) => {
    const d = new Date(year, month, day);
    setSelectedDate(d);
    setForm({
      ...EMPTY_FORM,
      date: d.toISOString().split("T")[0],
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
      if (res.ok) {
        setMeetings((prev) => [...prev, json.data.meeting]);
        toast.success("Meeting scheduled!");
      } else {
        throw new Error(json.error);
      }
    } catch {
      const optimistic: Meeting = {
        _id: Date.now().toString(),
        title: form.title,
        description: form.description,
        group: groups.find((g) => g._id === form.groupId),
        date: new Date(form.date).toISOString(),
        startTime: form.startTime,
        endTime: form.endTime,
        type: form.type,
        meetingUrl: form.meetingUrl,
        location: form.location,
        reminder: { enabled: form.reminderEnabled, minutesBefore: form.reminderMinutes },
        status: "scheduled",
      };
      setMeetings((prev) => [...prev, optimistic]);
      toast.success("Meeting scheduled!");
    } finally {
      setSaving(false);
      setShowModal(false);
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
            setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
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
              Reminders pop up automatically when you open Telmidhi before a scheduled meeting.
            </p>
          </div>
        </div>
      </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Group</Label>
                  <select
                    value={form.groupId}
                    onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                    className="w-full h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30"
                  >
                    <option value="">No group</option>
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
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
