"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star, Users, Clock, BookOpen, Play, FileText, CheckCircle2,
  Award, Globe, ArrowRight, Lock, ChevronDown, ChevronUp,
  Brain, Target, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDuration, getInitials } from "@/lib/utils";

const SAMPLE_COURSE = {
  slug: "web-development-bootcamp",
  title: "Complete Web Development Bootcamp 2024",
  shortDescription: "Become a full-stack web developer. Learn HTML, CSS, JavaScript, React, Node.js, MongoDB and deploy real apps.",
  description: "This comprehensive bootcamp takes you from absolute beginner to professional full-stack developer. Through hands-on projects, you'll build real-world applications including a social network, e-commerce platform, and RESTful API.",
  thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=80",
  category: "Web Development",
  level: "beginner",
  language: "English",
  price: 89,
  isFree: false,
  rating: 4.9,
  reviewCount: 2847,
  enrollmentCount: 18500,
  duration: 72000,
  certificate: true,
  teacher: {
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    bio: "Senior full-stack engineer with 10+ years building scalable web apps at top tech companies including Google and Stripe.",
    courses: 12,
    students: 18500,
    rating: 4.9,
  },
  objectives: [
    "Build real-world full-stack web applications from scratch",
    "Master React, Node.js, Express, and MongoDB",
    "Deploy applications to production using cloud services",
    "Understand REST APIs, authentication, and security",
    "Write clean, maintainable, and scalable code",
    "Work with version control using Git and GitHub",
  ],
  requirements: [
    "Basic computer skills (no coding experience needed)",
    "A computer with internet access",
    "Willingness to learn and practice daily",
  ],
  lessons: [
    { id: "1", title: "Introduction to Web Development", type: "video", duration: 3600, isPreview: true },
    { id: "2", title: "HTML Fundamentals", type: "video", duration: 7200, isPreview: true },
    { id: "3", title: "CSS Styling & Layout", type: "video", duration: 9000, isPreview: false },
    { id: "4", title: "JavaScript Basics Quiz", type: "quiz", duration: 1800, isPreview: false },
    { id: "5", title: "JavaScript Deep Dive", type: "video", duration: 10800, isPreview: false },
    { id: "6", title: "DOM Manipulation PDF", type: "pdf", duration: 0, isPreview: false },
    { id: "7", title: "React Fundamentals", type: "video", duration: 12600, isPreview: false },
    { id: "8", title: "Node.js & Express", type: "video", duration: 10800, isPreview: false },
  ],
};

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["1"]);
  const router = useRouter();

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${params.slug}/enroll`, { method: "POST" });
      const json = await res.json();
      if (res.status === 401) {
        toast.error("Please login to enroll");
        router.push(`/login?from=/courses/${params.slug}`);
        return;
      }
      if (!res.ok && json.error !== "Already enrolled") {
        toast.error(json.error || "Enrollment failed");
        return;
      }
      setIsEnrolled(true);
      toast.success("🎉 Enrolled successfully!");
      router.push(`/courses/${params.slug}/learn`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setEnrolling(false);
    }
  };

  const getLessonIcon = (type: string) => {
    if (type === "video") return <Play className="h-3.5 w-3.5" />;
    if (type === "pdf") return <FileText className="h-3.5 w-3.5" />;
    if (type === "quiz") return <Brain className="h-3.5 w-3.5" />;
    return <BookOpen className="h-3.5 w-3.5" />;
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[hsl(var(--muted))]/50 to-transparent py-10 border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Badge variant="secondary" className="mb-3">{SAMPLE_COURSE.category}</Badge>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
                {SAMPLE_COURSE.title}
              </h1>
              <p className="text-[hsl(var(--muted-foreground))] text-lg mb-6">
                {SAMPLE_COURSE.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{SAMPLE_COURSE.rating}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">({SAMPLE_COURSE.reviewCount.toLocaleString()} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                  <Users className="h-4 w-4" />
                  {SAMPLE_COURSE.enrollmentCount.toLocaleString()} students
                </div>
                <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                  <Clock className="h-4 w-4" />
                  {formatDuration(SAMPLE_COURSE.duration)}
                </div>
                <div className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                  <Globe className="h-4 w-4" />
                  {SAMPLE_COURSE.language}
                </div>
                {SAMPLE_COURSE.certificate && (
                  <div className="flex items-center gap-1 text-green-500">
                    <Award className="h-4 w-4" />
                    Certificate included
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={SAMPLE_COURSE.teacher.avatar} />
                  <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                    {getInitials(SAMPLE_COURSE.teacher.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">Created by <span className="text-[hsl(var(--primary))] font-medium">{SAMPLE_COURSE.teacher.name}</span></p>
                </div>
              </div>
            </div>

            {/* Sticky Purchase Card */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-xl">
                <div className="relative aspect-video">
                  <Image src={SAMPLE_COURSE.thumbnail} alt={SAMPLE_COURSE.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg">
                      <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-black/70 text-white border-0">Preview available</Badge>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl font-bold">
                      {SAMPLE_COURSE.isFree ? "Free" : `$${SAMPLE_COURSE.price}`}
                    </span>
                    {!SAMPLE_COURSE.isFree && (
                      <span className="text-[hsl(var(--muted-foreground))] line-through text-lg">$179</span>
                    )}
                    {!SAMPLE_COURSE.isFree && (
                      <Badge variant="destructive">50% OFF</Badge>
                    )}
                  </div>

                  {isEnrolled ? (
                    <Button className="w-full" variant="gradient" onClick={() => router.push(`/courses/${params.slug}/learn`)}>
                      Go to Course <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button className="w-full" variant="gradient" loading={enrolling} onClick={handleEnroll}>
                      {SAMPLE_COURSE.isFree ? "Enroll for Free" : "Buy Now"}
                    </Button>
                  )}

                  <p className="text-xs text-center text-[hsl(var(--muted-foreground))] mt-2">
                    30-day money-back guarantee
                  </p>

                  <div className="mt-4 space-y-2 text-sm">
                    {[
                      `${SAMPLE_COURSE.lessons.length} lessons`,
                      formatDuration(SAMPLE_COURSE.duration) + " of content",
                      "Full lifetime access",
                      "Access on mobile & desktop",
                      SAMPLE_COURSE.certificate ? "Certificate of completion" : "",
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
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Objectives */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
                  What you&apos;ll learn
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_COURSE.objectives.map((obj) => (
                    <div key={obj} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {SAMPLE_COURSE.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2 text-sm">
                      <span className="text-[hsl(var(--primary))]">•</span> {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold mb-3">Description</h2>
                <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {SAMPLE_COURSE.description}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="curriculum">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {SAMPLE_COURSE.lessons.length} lessons •{" "}
                    {formatDuration(SAMPLE_COURSE.duration)} total
                  </p>
                </div>
                {SAMPLE_COURSE.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border border-[hsl(var(--border))] ${
                      lesson.isPreview ? "hover:bg-[hsl(var(--accent))] cursor-pointer" : "opacity-80"
                    } transition-colors`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      lesson.type === "video" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                      lesson.type === "pdf" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {getLessonIcon(lesson.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{lesson.title}</p>
                      {lesson.duration > 0 && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDuration(lesson.duration)}
                        </p>
                      )}
                    </div>
                    {lesson.isPreview ? (
                      <Badge variant="purple" className="text-xs">Preview</Badge>
                    ) : (
                      <Lock className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="instructor">
              <div className="flex items-start gap-5 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={SAMPLE_COURSE.teacher.avatar} />
                  <AvatarFallback className="gradient-bg text-white text-xl font-bold">
                    {getInitials(SAMPLE_COURSE.teacher.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{SAMPLE_COURSE.teacher.name}</h2>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm mb-3">Senior Full-Stack Engineer & Educator</p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{SAMPLE_COURSE.teacher.rating} Rating</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <span>{SAMPLE_COURSE.teacher.students.toLocaleString()} Students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <span>{SAMPLE_COURSE.teacher.courses} Courses</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                {SAMPLE_COURSE.teacher.bio}
              </p>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Reviews will appear here</p>
                <p className="text-sm">Be the first to review this course after enrolling!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
