"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Star, Users, Clock, BookOpen, Play, FileText, CheckCircle2,
  Award, Globe, ArrowRight, Lock, Brain, Target, Zap, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDuration, getInitials } from "@/lib/utils";

interface LessonItem {
  _id: string;
  title: string;
  type: "video" | "pdf" | "text" | "quiz";
  duration?: number;
  isPreview?: boolean;
  videoUrl?: string;
  pdfUrl?: string;
}
interface ContentItem {
  _id: string;
  title: string;
  contentType: string;
  pdfUrl?: string;
}
interface TeacherInfo {
  name: string;
  avatar?: string;
  bio?: string;
  expertise?: string[];
}
interface CourseData {
  _id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: string;
  language: string;
  price: number;
  isFree: boolean;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  duration: number;
  certificate: boolean;
  objectives?: string[];
  requirements?: string[];
  teacher?: TeacherInfo;
  lessons: LessonItem[];
  contents: ContentItem[];
}

function lessonIcon(type: string) {
  if (type === "video") return <Play className="h-3.5 w-3.5" />;
  if (type === "pdf") return <FileText className="h-3.5 w-3.5" />;
  if (type === "quiz") return <Brain className="h-3.5 w-3.5" />;
  return <BookOpen className="h-3.5 w-3.5" />;
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/courses/${slug}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setCourse(json.data.course);
          setIsEnrolled(json.data.isEnrolled);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${slug}/enroll`, { method: "POST" });
      const json = await res.json();
      if (res.status === 401) {
        toast.error("Please login to enroll");
        router.push(`/login?from=/courses/${slug}`);
        return;
      }
      if (!res.ok && json.error !== "Already enrolled") {
        toast.error(json.error || "Enrollment failed");
        return;
      }
      setIsEnrolled(true);
      toast.success("🎉 Enrolled successfully!");
      router.push(`/courses/${slug}/learn`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen pt-16 flex flex-col items-center justify-center gap-4 text-center px-4">
        <BookOpen className="h-12 w-12 text-[hsl(var(--muted-foreground))]/40" />
        <div>
          <h1 className="text-xl font-bold">Course not found</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">This course may have been removed or unpublished.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/courses")}>Browse courses</Button>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const contents = course.contents || [];
  const objectives = (course.objectives || []).filter(Boolean);
  const requirements = (course.requirements || []).filter(Boolean);
  const totalDuration = course.duration || lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const totalItems = lessons.length + contents.length;
  const teacher = course.teacher;

  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[hsl(var(--muted))]/50 to-transparent py-10 border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Badge variant="secondary" className="mb-3">{course.category}</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{course.title}</h1>
              {course.shortDescription && (
                <p className="text-[hsl(var(--muted-foreground))] text-lg mb-6">{course.shortDescription}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                {course.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{course.rating.toFixed(1)}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">({course.reviewCount.toLocaleString()} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                  <Users className="h-4 w-4" />
                  {course.enrollmentCount.toLocaleString()} students
                </div>
                {totalDuration > 0 && (
                  <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                    <Clock className="h-4 w-4" />
                    {formatDuration(totalDuration)}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                  <Globe className="h-4 w-4" />
                  {course.language}
                </div>
                {course.certificate && (
                  <div className="flex items-center gap-1 text-green-500">
                    <Award className="h-4 w-4" />
                    Certificate included
                  </div>
                )}
              </div>

              {teacher && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={teacher.avatar} />
                    <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                      {getInitials(teacher.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm">Created by <span className="text-[hsl(var(--primary))] font-medium">{teacher.name}</span></p>
                </div>
              )}
            </div>

            {/* Sticky Purchase Card */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-xl">
                <div className="relative aspect-video bg-[hsl(var(--muted))]">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 gradient-bg flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl font-bold">
                      {course.isFree ? "Free" : `${course.price} DT`}
                    </span>
                  </div>

                  {isEnrolled ? (
                    <Button className="w-full" variant="gradient" onClick={() => router.push(`/courses/${slug}/learn`)}>
                      Go to Course <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button className="w-full" variant="gradient" loading={enrolling} onClick={handleEnroll}>
                      {course.isFree ? "Enroll for Free" : "Enroll Now"}
                    </Button>
                  )}

                  <div className="mt-4 space-y-2 text-sm">
                    {[
                      `${lessons.length} video lesson${lessons.length === 1 ? "" : "s"}`,
                      `${contents.length} PDF document${contents.length === 1 ? "" : "s"}`,
                      totalDuration > 0 ? formatDuration(totalDuration) + " of content" : "",
                      "Full lifetime access",
                      course.certificate ? "Certificate of completion" : "",
                    ].filter(Boolean).map((item) => (
                      <div key={item} className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:max-w-2xl">
          <Tabs defaultValue="overview">
            <TabsList className="mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {objectives.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
                    What you&apos;ll learn
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {objectives.map((obj) => (
                      <div key={obj} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-sm">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {requirements.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[hsl(var(--primary))]" />
                    Requirements
                  </h2>
                  <ul className="space-y-2">
                    {requirements.map((req) => (
                      <li key={req} className="flex items-start gap-2 text-sm">
                        <span className="text-[hsl(var(--primary))]">•</span> {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold mb-3">Description</h2>
                <p className="text-[hsl(var(--muted-foreground))] leading-relaxed whitespace-pre-line">
                  {course.description}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="curriculum">
              {totalItems === 0 ? (
                <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No content yet</p>
                  <p className="text-sm">The teacher hasn&apos;t added any lessons or documents to this course.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Video lessons */}
                  {lessons.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Play className="h-4 w-4 text-[hsl(var(--primary))]" /> Video lessons ({lessons.length})
                      </p>
                      {lessons.map((lesson) => {
                        const open = isEnrolled || lesson.isPreview;
                        return (
                          <div
                            key={lesson._id}
                            className="flex items-center gap-3 p-4 rounded-xl border border-[hsl(var(--border))]"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              lesson.type === "video" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                              lesson.type === "pdf" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                              "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            }`}>
                              {lessonIcon(lesson.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{lesson.title}</p>
                              {lesson.duration ? (
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatDuration(lesson.duration)}</p>
                              ) : null}
                            </div>
                            {lesson.isPreview && !isEnrolled ? (
                              <Badge variant="purple" className="text-xs">Preview</Badge>
                            ) : open ? (
                              <Badge variant="success" className="text-xs">Included</Badge>
                            ) : (
                              <Lock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* PDF documents */}
                  {contents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-[hsl(var(--primary))]" /> Documents ({contents.length})
                      </p>
                      {contents.map((doc) => (
                        <div key={doc._id} className="flex items-center gap-3 p-4 rounded-xl border border-[hsl(var(--border))]">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] capitalize">{doc.contentType.replace(/_/g, " ")}</p>
                          </div>
                          {isEnrolled && doc.pdfUrl ? (
                            <a href={doc.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="h-7 text-xs"><ExternalLink className="h-3.5 w-3.5" /> Open</Button>
                            </a>
                          ) : (
                            <Lock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="instructor">
              {teacher ? (
                <>
                  <div className="flex items-start gap-5 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={teacher.avatar} />
                      <AvatarFallback className="gradient-bg text-white text-xl font-bold">
                        {getInitials(teacher.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{teacher.name}</h2>
                      {teacher.expertise && teacher.expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {teacher.expertise.map((e) => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
                        </div>
                      )}
                    </div>
                  </div>
                  {teacher.bio && (
                    <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{teacher.bio}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Instructor information unavailable.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
