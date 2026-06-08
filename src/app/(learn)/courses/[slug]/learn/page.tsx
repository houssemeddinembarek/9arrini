"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play, FileText, Brain, CheckCircle2, Lock, ChevronLeft,
  ChevronRight, Menu, X, Download, ArrowLeft, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const LESSONS = [
  { id: "1", title: "Introduction to Web Development", type: "video", duration: 3600, completed: true, isPreview: true },
  { id: "2", title: "HTML Fundamentals", type: "video", duration: 7200, completed: true, isPreview: true },
  { id: "3", title: "CSS Styling & Layout", type: "video", duration: 9000, completed: true, isPreview: false },
  { id: "4", title: "JavaScript Quiz", type: "quiz", duration: 1800, completed: false, isPreview: false },
  { id: "5", title: "JavaScript Deep Dive", type: "video", duration: 10800, completed: false, isPreview: false },
  { id: "6", title: "DOM Manipulation — PDF Guide", type: "pdf", duration: 0, completed: false, isPreview: false },
  { id: "7", title: "React Fundamentals", type: "video", duration: 12600, completed: false, isPreview: false },
  { id: "8", title: "Node.js & Express", type: "video", duration: 10800, completed: false, isPreview: false },
];

export default function LearnPage({ params }: { params: { slug: string } }) {
  const [currentLessonId, setCurrentLessonId] = useState("4");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentLesson = LESSONS.find((l) => l.id === currentLessonId) || LESSONS[0];
  const currentIndex = LESSONS.findIndex((l) => l.id === currentLessonId);
  const completedCount = LESSONS.filter((l) => l.completed).length;
  const progress = Math.round((completedCount / LESSONS.length) * 100);

  const getLessonIcon = (type: string, size = "h-4 w-4") => {
    if (type === "video") return <Play className={size} />;
    if (type === "pdf") return <FileText className={size} />;
    if (type === "quiz") return <Brain className={size} />;
    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Topbar */}
      <div className="h-14 border-b border-[hsl(var(--border))] flex items-center px-4 gap-3 shrink-0">
        <Link href={`/courses/${params.slug}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:block">Back to Course</span>
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate hidden sm:block">
            Complete Web Development Bootcamp
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[hsl(var(--muted-foreground))] hidden md:block">
            {completedCount}/{LESSONS.length} lessons
          </span>
          <Progress value={progress} className="w-24 h-1.5 hidden md:flex" />
          <span className="text-xs font-medium text-[hsl(var(--primary))]">{progress}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className={cn("flex-1 flex flex-col overflow-hidden", sidebarOpen ? "lg:pr-0" : "")}>
          {/* Video / PDF / Quiz area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {currentLesson.type === "video" && (
              <div className="max-w-4xl mx-auto">
                <div className="aspect-video bg-black rounded-2xl flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center mx-auto mb-3 cursor-pointer hover:scale-110 transition-transform">
                      <Play className="h-7 w-7 fill-white ml-1" />
                    </div>
                    <p className="text-sm opacity-70">Video player ready</p>
                    <p className="text-xs opacity-50 mt-1">Connect your video URL to embed</p>
                  </div>
                  {/* Video controls overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
                    <div className="flex items-center gap-3">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20">
                        <Play className="h-4 w-4 fill-white" />
                      </Button>
                      <div className="flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer">
                        <div className="h-full w-1/3 bg-white rounded-full" />
                      </div>
                      <span className="text-xs text-white">12:45 / 38:20</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{currentLesson.title}</h1>
                    <p className="text-[hsl(var(--muted-foreground))]">
                      Lesson {currentIndex + 1} of {LESSONS.length}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">
                    <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                    Mark Complete
                  </Button>
                </div>
              </div>
            )}

            {currentLesson.type === "pdf" && (
              <div className="max-w-4xl mx-auto">
                <div className="aspect-video bg-[hsl(var(--muted))] rounded-2xl flex items-center justify-center mb-6 border border-[hsl(var(--border))]">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-[hsl(var(--muted-foreground))]/40 mx-auto mb-3" />
                    <p className="font-medium">PDF Lesson</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                      {currentLesson.title}
                    </p>
                    <Button variant="gradient" size="sm">
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">{currentLesson.title}</h1>
              </div>
            )}

            {currentLesson.type === "quiz" && (
              <div className="max-w-2xl mx-auto">
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">{currentLesson.title}</h1>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">4 questions • 30 minutes</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                      <p className="font-medium mb-3">1. What does the DOM stand for?</p>
                      <div className="space-y-2">
                        {["Document Object Model", "Data Object Management", "Document Oriented Module", "Dynamic Object Method"].map((opt, i) => (
                          <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] cursor-pointer hover:bg-[hsl(var(--accent))] transition-colors">
                            <input type="radio" name="q1" className="accent-[hsl(var(--primary))]" />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button variant="gradient" className="w-full mt-6">
                    Submit Quiz
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="max-w-4xl mx-auto mt-6 flex justify-between">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentLessonId(LESSONS[currentIndex - 1]?.id)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="gradient"
                disabled={currentIndex === LESSONS.length - 1}
                onClick={() => setCurrentLessonId(LESSONS[currentIndex + 1]?.id)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 border-l border-[hsl(var(--border))] flex flex-col hidden lg:flex">
            <div className="p-4 border-b border-[hsl(var(--border))]">
              <h2 className="font-semibold text-sm mb-1">Course Content</h2>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="flex-1 h-1.5" />
                <span className="text-xs font-medium text-[hsl(var(--primary))]">{progress}%</span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {LESSONS.map((lesson, idx) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLessonId(lesson.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all text-sm",
                      lesson.id === currentLessonId
                        ? "bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30"
                        : "hover:bg-[hsl(var(--accent))]"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                      lesson.completed ? "bg-green-500/20 text-green-500" :
                      lesson.id === currentLessonId ? "gradient-bg text-white" :
                      "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                    )}>
                      {lesson.completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : getLessonIcon(lesson.type, "h-3.5 w-3.5")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-medium line-clamp-2", lesson.id === currentLessonId && "text-[hsl(var(--primary))]")}>
                        {lesson.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
