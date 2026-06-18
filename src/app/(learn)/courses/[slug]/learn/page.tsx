"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Play, FileText, Brain, CheckCircle2, ChevronLeft,
  ChevronRight, Menu, X, ExternalLink, ArrowLeft, Loader2, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ItemKind = "video" | "pdf" | "quiz" | "text";

interface LearnItem {
  id: string;
  title: string;
  kind: ItemKind;
  duration?: number;
  videoUrl?: string;
  pdfUrl?: string;
  content?: string;
}

interface CourseLite {
  title: string;
  lessons: {
    _id: string;
    title: string;
    type: ItemKind;
    duration?: number;
    videoUrl?: string;
    pdfUrl?: string;
    content?: string;
  }[];
  contents: { _id: string; title: string; pdfUrl?: string }[];
}

function itemIcon(kind: ItemKind, size = "h-4 w-4") {
  if (kind === "video") return <Play className={size} />;
  if (kind === "pdf") return <FileText className={size} />;
  if (kind === "quiz") return <Brain className={size} />;
  return <BookOpen className={size} />;
}

export default function LearnPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [course, setCourse] = useState<CourseLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/courses/${slug}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          router.replace(`/courses/${slug}`);
          return;
        }
        // Learning is enrolled-only; bounce non-enrolled users to the detail page.
        if (!json.data.isEnrolled) {
          toast.error("Enroll to access this course");
          router.replace(`/courses/${slug}`);
          return;
        }
        setCourse(json.data.course);
      } catch {
        router.replace(`/courses/${slug}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, router]);

  // Unified list: video lessons first, then PDF documents.
  const items: LearnItem[] = useMemo(() => {
    if (!course) return [];
    const lessons: LearnItem[] = (course.lessons || []).map((l) => ({
      id: l._id,
      title: l.title,
      kind: l.type,
      duration: l.duration,
      videoUrl: l.videoUrl,
      pdfUrl: l.pdfUrl,
      content: l.content,
    }));
    const docs: LearnItem[] = (course.contents || []).map((c) => ({
      id: c._id,
      title: c.title,
      kind: "pdf",
      pdfUrl: c.pdfUrl,
    }));
    return [...lessons, ...docs];
  }, [course]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course || items.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <BookOpen className="h-12 w-12 text-[hsl(var(--muted-foreground))]/40" />
        <div>
          <h1 className="text-xl font-bold">Nothing to learn yet</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">This course has no lessons or documents yet.</p>
        </div>
        <Link href={`/courses/${slug}`}><Button variant="outline">Back to course</Button></Link>
      </div>
    );
  }

  const current = items.find((i) => i.id === currentId) || items[0];
  const currentIndex = items.findIndex((i) => i.id === current.id);
  const progress = Math.round((completed.size / items.length) * 100);

  const markComplete = (id: string) =>
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Topbar */}
      <div className="h-14 border-b border-[hsl(var(--border))] flex items-center px-4 gap-3 shrink-0">
        <Link href={`/courses/${slug}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:block">Back to Course</span>
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate hidden sm:block">{course.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[hsl(var(--muted-foreground))] hidden md:block">
            {completed.size}/{items.length} done
          </span>
          <Progress value={progress} className="w-24 h-1.5 hidden md:flex" />
          <span className="text-xs font-medium text-[hsl(var(--primary))]">{progress}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Video */}
            {current.kind === "video" && (
              <div className="max-w-4xl mx-auto">
                {current.videoUrl ? (
                  <video
                    key={current.id}
                    src={current.videoUrl}
                    controls
                    className="w-full aspect-video rounded-2xl bg-black mb-6 shadow-2xl"
                  />
                ) : (
                  <div className="aspect-video bg-black rounded-2xl flex items-center justify-center mb-6 text-white/70 text-sm">
                    No video uploaded for this lesson.
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{current.title}</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">
                      Lesson {currentIndex + 1} of {items.length}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => markComplete(current.id)}>
                    <CheckCircle2 className={cn("h-4 w-4 mr-1", completed.has(current.id) ? "text-green-500" : "")} />
                    {completed.has(current.id) ? "Completed" : "Mark Complete"}
                  </Button>
                </div>
              </div>
            )}

            {/* PDF */}
            {current.kind === "pdf" && (
              <div className="max-w-4xl mx-auto">
                {current.pdfUrl ? (
                  <iframe
                    key={current.id}
                    src={current.pdfUrl}
                    title={current.title}
                    className="w-full h-[70vh] rounded-2xl border border-[hsl(var(--border))] mb-6 bg-white"
                  />
                ) : (
                  <div className="aspect-video bg-[hsl(var(--muted))] rounded-2xl flex items-center justify-center mb-6 border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-sm">
                    No document attached.
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold">{current.title}</h1>
                  <div className="flex items-center gap-2 shrink-0">
                    {current.pdfUrl && (
                      <a href={current.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /> Open</Button>
                      </a>
                    )}
                    <Button variant="outline" size="sm" onClick={() => markComplete(current.id)}>
                      <CheckCircle2 className={cn("h-4 w-4 mr-1", completed.has(current.id) ? "text-green-500" : "")} />
                      {completed.has(current.id) ? "Done" : "Mark Done"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Text / other */}
            {(current.kind === "text" || current.kind === "quiz") && (
              <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">{current.title}</h1>
                {current.content ? (
                  <div className="prose-lesson text-[hsl(var(--foreground))] whitespace-pre-line">{current.content}</div>
                ) : (
                  <p className="text-[hsl(var(--muted-foreground))]">No content for this item yet.</p>
                )}
                <Button variant="outline" size="sm" className="mt-6" onClick={() => markComplete(current.id)}>
                  <CheckCircle2 className={cn("h-4 w-4 mr-1", completed.has(current.id) ? "text-green-500" : "")} />
                  {completed.has(current.id) ? "Completed" : "Mark Complete"}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="max-w-4xl mx-auto mt-6 flex justify-between">
              <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentId(items[currentIndex - 1]?.id)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="gradient" disabled={currentIndex === items.length - 1} onClick={() => setCurrentId(items[currentIndex + 1]?.id)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 border-l border-[hsl(var(--border))] flex-col hidden lg:flex">
            <div className="p-4 border-b border-[hsl(var(--border))]">
              <h2 className="font-semibold text-sm mb-1">Course Content</h2>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="flex-1 h-1.5" />
                <span className="text-xs font-medium text-[hsl(var(--primary))]">{progress}%</span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {items.map((item) => {
                  const done = completed.has(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentId(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all text-sm",
                        item.id === current.id
                          ? "bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30"
                          : "hover:bg-[hsl(var(--accent))]"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        done ? "bg-green-500/20 text-green-500" :
                        item.id === current.id ? "gradient-bg text-white" :
                        "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                      )}>
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : itemIcon(item.kind, "h-3.5 w-3.5")}
                      </div>
                      <p className={cn("flex-1 text-xs font-medium line-clamp-2", item.id === current.id && "text-[hsl(var(--primary))]")}>
                        {item.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
