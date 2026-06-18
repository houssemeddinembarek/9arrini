"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { PlusCircle, Eye, Edit, Trash2, Users, Star, BookOpen, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { SUBJECTS, CLASS_LEVELS, TRIMESTERS } from "@/lib/tunisia-education";

const CATEGORIES = SUBJECTS;

interface TeacherCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  category: string;
  classe: string;
  level: string;
  status: string;
  students: number;
  rating: number;
  reviewCount: number;
  lessons: number;
}

const EMPTY_FORM = {
  title: "",
  shortDescription: "",
  description: "",
  category: "",
  classe: "",
  trimestre: "",
  level: "beginner",
  language: "English",
  isFree: true,
  price: "",
};

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/dashboard");
      const json = await res.json();
      if (json.success) setCourses(json.data.courses);
      else toast.error(json.error || "Failed to load courses");
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => { await fetchCourses(); })();
  }, [fetchCourses]);

  const deleteCourse = async (slug: string) => {
    const prev = courses;
    setCourses((c) => c.filter((x) => x.slug !== slug));
    try {
      const res = await fetch(`/api/courses/${slug}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) toast.success("Course deleted");
      else {
        setCourses(prev);
        toast.error(json.error || "Failed to delete course");
      }
    } catch {
      setCourses(prev);
      toast.error("Failed to delete course");
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setTags([]);
    setTagInput("");
  };

  const createCourse = async () => {
    if (form.title.trim().length < 5) return toast.error("Title must be at least 5 characters");
    if (form.description.trim().length < 20) return toast.error("Description must be at least 20 characters");
    if (!form.category) return toast.error("Please select a matière");
    if (!form.classe) return toast.error("Please select a classe");
    if (!form.trimestre) return toast.error("Please select a trimestre");

    setCreating(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          shortDescription: form.shortDescription.trim(),
          category: form.category,
          classe: form.classe,
          trimestre: form.trimestre,
          level: form.level,
          language: form.language,
          isFree: form.isFree,
          price: form.isFree ? 0 : Number(form.price) || 0,
          tags,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to create course");
        return;
      }
      toast.success("Course created — add lessons from the editor when ready");
      setOpen(false);
      resetForm();
      await fetchCourses();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Create and manage all your courses in one place.
          </p>
        </div>
        <Button variant="gradient" onClick={() => setOpen(true)}>
          <PlusCircle className="h-4 w-4" /> Create Course
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
            <BookOpen className="h-6 w-6 text-[hsl(var(--muted-foreground))]" />
          </div>
          <p className="font-medium">No courses yet</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            Create your first course to start teaching.
          </p>
          <Button variant="gradient" size="sm" onClick={() => setOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Create Course
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden lg:table-cell">Students</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden lg:table-cell">Rating</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-[hsl(var(--muted))]">
                          {course.thumbnail ? (
                            <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{course.title}</p>
                          <div className="flex items-center flex-wrap gap-2 mt-0.5">
                            {course.category && <Badge variant="purple" className="text-[10px]">{course.category}</Badge>}
                            {course.classe && <Badge variant="blue" className="text-[10px]">{course.classe}</Badge>}
                            <Badge variant="secondary" className="text-[10px] capitalize">{course.level}</Badge>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{course.lessons} lesson{course.lessons === 1 ? "" : "s"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <Badge variant={course.status === "published" ? "success" : "secondary"} className="capitalize">
                        {course.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                        {course.students.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {course.reviewCount > 0 ? course.rating.toFixed(1) : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/courses/${course.slug}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/teacher/courses/${course.slug}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteCourse(course.slug)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inline create-course dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a new course</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Course title *</Label>
              <Input
                placeholder="e.g. Mathématiques — Préparation au Bac"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Short description</Label>
              <Input
                placeholder="One line shown on the course card"
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Full description *</Label>
              <Textarea
                placeholder="What students will learn, who it's for, prerequisites…"
                className="min-h-[110px]"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Matière *</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir une matière" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Classe *</Label>
                <Select value={form.classe} onValueChange={(v) => setForm((f) => ({ ...f, classe: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir une classe" /></SelectTrigger>
                  <SelectContent>
                    {CLASS_LEVELS.map((stage) => (
                      <SelectGroup key={stage.stage}>
                        <SelectLabel>{stage.stage}</SelectLabel>
                        {stage.classes.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Trimestre *</Label>
                <Select value={form.trimestre} onValueChange={(v) => setForm((f) => ({ ...f, trimestre: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un trimestre" /></SelectTrigger>
                  <SelectContent>
                    {TRIMESTERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                />
                <Button type="button" variant="outline" onClick={addTag}><Plus className="h-4 w-4" /></Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
              <Switch
                id="isFree"
                checked={form.isFree}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isFree: v }))}
              />
              <div className="flex-1">
                <Label htmlFor="isFree" className="cursor-pointer">Free course</Label>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Students can enroll without paying</p>
              </div>
              {!form.isFree && (
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] text-sm">DT</span>
                  <Input
                    type="number"
                    min={0}
                    className="pl-8"
                    placeholder="40"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }} disabled={creating}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={createCourse} loading={creating}>
              <PlusCircle className="h-4 w-4" /> Create course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
