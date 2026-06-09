"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search, BookOpen, Video, FileText, Eye, Users, Star, ExternalLink, File, Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getInitials, formatDate } from "@/lib/utils";

interface Teacher {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface AdminCourse {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  category: string;
  level: string;
  status: "draft" | "published" | "archived";
  enrollmentCount: number;
  rating: number;
  lessonCount: number;
  teacher?: Teacher | null;
  createdAt: string;
}

interface AdminLesson {
  _id: string;
  title: string;
  type: "video" | "pdf" | "text" | "quiz";
  subject?: string;
  level?: string;
  pdfUrl?: string;
  videoUrl?: string;
  content?: string;
  teacher?: Teacher | null;
  course?: { _id: string; title: string; slug: string } | null;
  createdAt: string;
}

interface AdminContent {
  _id: string;
  title: string;
  subject: string;
  level: string;
  contentType: string;
  source: string;
  pdfUrl?: string;
  body?: string;
  teacher?: Teacher | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "success" | "secondary" | "warning"> = {
  published: "success",
  draft: "secondary",
  archived: "warning",
};

const LESSON_ICON = { video: Video, pdf: FileText, text: FileText, quiz: FileText } as const;

function TeacherCell({ teacher }: { teacher?: Teacher | null }) {
  if (!teacher) return <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>;
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7">
        <AvatarImage src={teacher.avatar} />
        <AvatarFallback className="gradient-bg text-white text-[10px] font-bold">
          {getInitials(teacher.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm">{teacher.name}</span>
    </div>
  );
}

export default function AdminCoursesPage() {
  const [tab, setTab] = useState("courses");
  const [search, setSearch] = useState("");

  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [content, setContent] = useState<AdminContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ title: string; url?: string; body?: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, lRes, pRes] = await Promise.all([
        fetch("/api/admin/courses"),
        fetch("/api/lessons?scope=all"),
        fetch("/api/content?scope=all"),
      ]);
      const [cJson, lJson, pJson] = await Promise.all([cRes.json(), lRes.json(), pRes.json()]);
      if (cJson.success) setCourses(cJson.data.courses);
      if (lJson.success) setLessons(lJson.data.items);
      if (pJson.success) setContent(pJson.data.items);
      if (!cJson.success) toast.error(cJson.error || "Failed to load courses");
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const q = search.trim().toLowerCase();
  const filteredCourses = courses.filter((c) => c.title.toLowerCase().includes(q));
  const filteredLessons = lessons.filter((l) => l.title.toLowerCase().includes(q));
  const filteredContent = content.filter((c) => c.title.toLowerCase().includes(q));
  // PDF lessons + uploaded/adapted PDF content together form the "PDF courses".
  const pdfLessons = filteredLessons.filter((l) => l.type === "pdf");

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Courses &amp; Content</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Browse every course, lesson, and PDF resource across the platform.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <Input
          placeholder="Search by title..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-1.5" /> Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="lessons">
            <Video className="h-4 w-4 mr-1.5" /> Lessons ({lessons.length})
          </TabsTrigger>
          <TabsTrigger value="pdf">
            <FileText className="h-4 w-4 mr-1.5" /> PDF Content ({content.length + pdfLessons.length})
          </TabsTrigger>
        </TabsList>

        {/* Courses */}
        <TabsContent value="courses" className="mt-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
            {loading ? (
              <TableSkeleton />
            ) : filteredCourses.length === 0 ? (
              <EmptyState icon={BookOpen} label="No courses found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))]">
                    <tr>
                      <Th>Course</Th>
                      <Th className="hidden md:table-cell">Teacher</Th>
                      <Th className="hidden lg:table-cell">Status</Th>
                      <Th className="hidden lg:table-cell">Students</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((c) => (
                      <tr key={c._id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm line-clamp-1">{c.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] capitalize">{c.category}</Badge>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{c.lessonCount} lessons</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><TeacherCell teacher={c.teacher} /></td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge variant={STATUS_VARIANT[c.status] || "secondary"} className="capitalize">{c.status}</Badge>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                            {c.enrollmentCount.toLocaleString()}
                            {c.rating > 0 && (
                              <>
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 ml-2" />
                                {c.rating.toFixed(1)}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/courses/${c.slug}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Lessons */}
        <TabsContent value="lessons" className="mt-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
            {loading ? (
              <TableSkeleton />
            ) : filteredLessons.length === 0 ? (
              <EmptyState icon={Video} label="No lessons found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))]">
                    <tr>
                      <Th>Lesson</Th>
                      <Th className="hidden md:table-cell">Teacher</Th>
                      <Th className="hidden lg:table-cell">Course</Th>
                      <Th className="hidden xl:table-cell">Created</Th>
                      <Th className="text-right">Open</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLessons.map((l) => {
                      const Icon = LESSON_ICON[l.type] || FileText;
                      const url = l.pdfUrl || l.videoUrl;
                      return (
                        <tr key={l._id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                              <div>
                                <p className="font-medium text-sm line-clamp-1">{l.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="secondary" className="text-[10px] capitalize">{l.type}</Badge>
                                  {l.subject && <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{l.subject}</span>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell"><TeacherCell teacher={l.teacher} /></td>
                          <td className="px-4 py-3 hidden lg:table-cell text-sm text-[hsl(var(--muted-foreground))]">
                            {l.course?.title || "—"}
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell text-xs text-[hsl(var(--muted-foreground))]">
                            {formatDate(l.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {l.type === "pdf" || l.type === "text" ? (
                              <DocActions
                                title={l.title}
                                url={l.pdfUrl}
                                body={l.pdfUrl ? undefined : l.content}
                                onPreview={setPreview}
                              />
                            ) : url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
                              </a>
                            ) : <span className="text-xs text-[hsl(var(--muted-foreground))]">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* PDF content (uploaded/AI content + PDF lessons) */}
        <TabsContent value="pdf" className="mt-4">
          <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
            {loading ? (
              <TableSkeleton />
            ) : filteredContent.length === 0 && pdfLessons.length === 0 ? (
              <EmptyState icon={File} label="No PDF content found." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))]">
                    <tr>
                      <Th>Document</Th>
                      <Th className="hidden md:table-cell">Teacher</Th>
                      <Th className="hidden lg:table-cell">Subject</Th>
                      <Th className="hidden lg:table-cell">Type</Th>
                      <Th className="text-right">PDF</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContent.map((c) => (
                      <tr key={c._id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                            <p className="font-medium text-sm line-clamp-1">{c.title}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><TeacherCell teacher={c.teacher} /></td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm">{c.subject}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge variant="secondary" className="text-[10px] capitalize">{c.contentType.replace(/_/g, " ")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DocActions
                            title={c.title}
                            url={c.pdfUrl}
                            body={c.pdfUrl ? undefined : c.body}
                            onPreview={setPreview}
                          />
                        </td>
                      </tr>
                    ))}
                    {pdfLessons.map((l) => (
                      <tr key={l._id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))] shrink-0" />
                            <p className="font-medium text-sm line-clamp-1">{l.title}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><TeacherCell teacher={l.teacher} /></td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm">{l.subject || "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Badge variant="blue" className="text-[10px]">PDF lesson</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DocActions title={l.title} url={l.pdfUrl} onPreview={setPreview} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Inline document viewer (PDF iframe or text body) */}
      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-5 py-3 border-b border-[hsl(var(--border))] flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base line-clamp-1 pr-4">{preview?.title}</DialogTitle>
            {preview?.url && (
              <a href={preview.url} target="_blank" rel="noopener noreferrer" className="shrink-0 mr-6">
                <Button variant="outline" size="sm" className="h-8">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Open / Download
                </Button>
              </a>
            )}
          </DialogHeader>
          {preview?.url ? (
            <iframe
              src={`/api/admin/pdf-proxy?url=${encodeURIComponent(preview.url)}#toolbar=1`}
              title={preview.title}
              className="w-full h-[80vh] bg-[hsl(var(--muted))]"
            />
          ) : (
            <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
              {preview?.body ? (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[hsl(var(--foreground))]">
                  {preview.body}
                </pre>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No readable content for this item.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocActions({
  url, body, title, onPreview,
}: {
  url?: string;
  body?: string;
  title: string;
  onPreview: (p: { title: string; url?: string; body?: string }) => void;
}) {
  const canPreview = !!url || !!body;
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title={url ? "Preview PDF" : "Read content"}
        disabled={!canPreview}
        onClick={() => onPreview({ title, url, body })}
      >
        <Eye className="h-4 w-4" />
      </Button>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" title="Open in new tab">
          <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
        </a>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="p-12 text-center">
      <Icon className="h-12 w-12 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/30" />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
    </div>
  );
}
