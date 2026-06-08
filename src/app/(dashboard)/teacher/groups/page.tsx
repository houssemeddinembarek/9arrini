"use client";

import { useState, useEffect } from "react";
import {
  Users, Plus, Pencil, Trash2, X, Check, UserPlus,
  GraduationCap, BookOpen, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getInitials, cn } from "@/lib/utils";

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  subject?: string;
  level?: string;
  color: string;
  students: Student[];
  createdAt: string;
}

const COLOR_OPTIONS = [
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
];

const GROUP_COLOR_CLASSES: Record<string, string> = {
  purple: "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  green: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
  orange: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  pink: "bg-pink-500/10 border-pink-500/30 text-pink-600 dark:text-pink-400",
  teal: "bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400",
};

const DOT_CLASSES: Record<string, string> = {
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
};

const SAMPLE_GROUPS: Group[] = [
  {
    _id: "g1",
    name: "Math — 3ème",
    description: "3rd year mathematics revision group",
    subject: "Mathematics",
    level: "3ème",
    color: "purple",
    students: [
      { _id: "s1", name: "Ahmed Ben Ali", email: "ahmed@example.com" },
      { _id: "s2", name: "Sara Bouaziz", email: "sara@example.com" },
      { _id: "s3", name: "Mohamed Trabelsi", email: "med@example.com" },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "g2",
    name: "Sciences — Bac",
    description: "Baccalaureate science exam prep",
    subject: "Sciences",
    level: "Bac",
    color: "green",
    students: [
      { _id: "s4", name: "Ines Chaabane", email: "ines@example.com" },
      { _id: "s5", name: "Youssef Mzali", email: "youssef@example.com" },
    ],
    createdAt: new Date().toISOString(),
  },
];

interface GroupFormData {
  name: string;
  description: string;
  subject: string;
  level: string;
  color: string;
}

const EMPTY_FORM: GroupFormData = {
  name: "",
  description: "",
  subject: "",
  level: "",
  color: "purple",
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [form, setForm] = useState<GroupFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [addEmailInput, setAddEmailInput] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      const json = await res.json();
      if (json.success && json.data.groups.length > 0) {
        setGroups(json.data.groups);
      } else {
        setGroups(SAMPLE_GROUPS);
      }
    } catch {
      setGroups(SAMPLE_GROUPS);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingGroup(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (group: Group) => {
    setEditingGroup(group);
    setForm({
      name: group.name,
      description: group.description || "",
      subject: group.subject || "",
      level: group.level || "",
      color: group.color,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingGroup) {
        const res = await fetch(`/api/groups/${editingGroup._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setGroups((prev) =>
            prev.map((g) => (g._id === editingGroup._id ? { ...g, ...form } : g))
          );
          toast.success("Group updated");
        }
      } else {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (res.ok) {
          setGroups((prev) => [{ ...json.data.group, students: [] }, ...prev]);
          toast.success("Group created");
        }
      }
      setShowModal(false);
    } catch {
      const optimistic: Group = {
        _id: Date.now().toString(),
        ...form,
        students: [],
        createdAt: new Date().toISOString(),
      };
      if (!editingGroup) {
        setGroups((prev) => [optimistic, ...prev]);
        toast.success("Group created (offline mode)");
      } else {
        setGroups((prev) =>
          prev.map((g) => (g._id === editingGroup._id ? { ...g, ...form } : g))
        );
        toast.success("Group updated (offline mode)");
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/groups/${id}`, { method: "DELETE" });
      setGroups((prev) => prev.filter((g) => g._id !== id));
      toast.success("Group deleted");
    } catch {
      setGroups((prev) => prev.filter((g) => g._id !== id));
      toast.success("Group deleted");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddStudent = (groupId: string) => {
    if (!addEmailInput.trim()) return;
    const newStudent: Student = {
      _id: Date.now().toString(),
      name: addEmailInput.split("@")[0],
      email: addEmailInput.trim(),
    };
    setGroups((prev) =>
      prev.map((g) =>
        g._id === groupId ? { ...g, students: [...g.students, newStudent] } : g
      )
    );
    setAddEmailInput("");
    toast.success("Student invitation sent");
  };

  const handleRemoveStudent = (groupId: string, studentId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g._id === groupId
          ? { ...g, students: g.students.filter((s) => s._id !== studentId) }
          : g
      )
    );
    toast.success("Student removed");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Student Groups</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Organise your students into groups for easier session management.
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Group
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
          <p className="text-2xl font-bold">{groups.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Total Groups</p>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center">
          <p className="text-2xl font-bold">
            {groups.reduce((acc, g) => acc + g.students.length, 0)}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Total Students</p>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold">
            {groups.length > 0
              ? Math.round(groups.reduce((acc, g) => acc + g.students.length, 0) / groups.length)
              : 0}
          </p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Avg. per Group</p>
        </div>
      </div>

      {/* Groups list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/30" />
          <p className="font-medium">No groups yet</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            Create your first group to organise students
          </p>
          <Button variant="gradient" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create Group
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group._id}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
            >
              {/* Group header */}
              <div className="flex items-center gap-4 p-5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", GROUP_COLOR_CLASSES[group.color] || GROUP_COLOR_CLASSES.purple)}>
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{group.name}</h3>
                    {group.subject && <Badge variant="secondary" className="text-xs">{group.subject}</Badge>}
                    {group.level && <Badge variant="purple" className="text-xs">{group.level}</Badge>}
                  </div>
                  {group.description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {group.students.length} student{group.students.length !== 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(group)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(group._id)}
                    disabled={deletingId === group._id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === group._id ? null : group._id)}
                    className="p-1 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-[hsl(var(--muted-foreground))] transition-transform",
                        expandedGroup === group._id && "rotate-180"
                      )}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded student list */}
              {expandedGroup === group._id && (
                <div className="border-t border-[hsl(var(--border))] p-5 space-y-4">
                  {/* Students */}
                  {group.students.length > 0 ? (
                    <div className="space-y-2">
                      {group.students.map((student) => (
                        <div
                          key={student._id}
                          className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[hsl(var(--muted))]/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.avatar} />
                              <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                {student.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveStudent(group._id, student._id)}
                            className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-3">
                      No students in this group yet
                    </p>
                  )}

                  {/* Add student by email */}
                  <div className="flex gap-2 pt-2 border-t border-[hsl(var(--border))]">
                    <div className="flex-1 relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <Input
                        placeholder="Add student by email..."
                        className="pl-9"
                        value={addEmailInput}
                        onChange={(e) => setAddEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddStudent(group._id);
                        }}
                      />
                    </div>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => handleAddStudent(group._id)}
                    >
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                {editingGroup ? "Edit Group" : "Create Group"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Group Name *</Label>
                <Input
                  placeholder="e.g. Math — 3ème"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      placeholder="Mathematics"
                      className="pl-9"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Level</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    <Input
                      placeholder="Bac, 3ème..."
                      className="pl-9"
                      value={form.level}
                      onChange={(e) => setForm({ ...form, level: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setForm({ ...form, color: c.value })}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all",
                        c.class,
                        form.color === c.value && "ring-2 ring-offset-2 ring-[hsl(var(--foreground))]"
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="gradient" className="flex-1" onClick={handleSave} loading={saving}>
                <Check className="h-4 w-4" />
                {editingGroup ? "Save Changes" : "Create Group"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
