"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Clock, Award, Zap, Play, ArrowRight, Brain,
  TrendingUp, Star, Target, Flame, Trophy, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/useAuthStore";

const SAMPLE_ENROLLED_COURSES = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&q=80",
    teacher: "Sarah Johnson",
    progress: 65,
    nextLesson: "React Hooks Deep Dive",
    totalLessons: 48,
    completedLessons: 31,
  },
  {
    id: "2",
    title: "Machine Learning & AI Fundamentals",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&q=80",
    teacher: "Dr. Marcus Chen",
    progress: 28,
    nextLesson: "Neural Network Architecture",
    totalLessons: 60,
    completedLessons: 17,
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass",
    thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=300&q=80",
    teacher: "Emily Park",
    progress: 92,
    nextLesson: "Portfolio Review",
    totalLessons: 35,
    completedLessons: 32,
  },
];

const ACHIEVEMENTS = [
  { icon: Flame, label: "7-day streak", color: "text-orange-500 bg-orange-500/10" },
  { icon: Trophy, label: "Top 10%", color: "text-amber-500 bg-amber-500/10" },
  { icon: Star, label: "5-star quiz", color: "text-purple-500 bg-purple-500/10" },
];

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            You&apos;re making great progress! Keep it up.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/courses">
            <Button variant="outline" size="sm">
              Browse Courses
            </Button>
          </Link>
          <Link href="/ai-assistant">
            <Button variant="gradient" size="sm">
              <Brain className="h-4 w-4" />
              AI Assistant
            </Button>
          </Link>
        </div>
      </div>

      {/* XP Level Bar */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-lg text-white font-bold text-xl">
              {user?.level || 1}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">Level {user?.level || 1} Learner</span>
                <Badge variant="purple" className="text-xs">+120 XP today</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={72} className="w-32 h-2" />
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {user?.xp || 0} / 1000 XP to Level {(user?.level || 1) + 1}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {ACHIEVEMENTS.map(({ icon: Icon, label, color }) => (
              <div key={label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${color}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Enrolled Courses" value={3} subtitle="2 in progress" icon={BookOpen} color="purple" trend={{ value: 1, label: "this month" }} />
          <StatCard title="Hours Learned" value="47h" subtitle="This month" icon={Clock} color="blue" trend={{ value: 18, label: "vs last month" }} />
          <StatCard title="Certificates" value={1} subtitle="Web Dev certified" icon={Award} color="green" />
          <StatCard title="Quiz Score" value="88%" subtitle="Average score" icon={Target} color="orange" trend={{ value: 5, label: "improvement" }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Continue Learning</h2>
            <Link href="/dashboard/my-courses" className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {SAMPLE_ENROLLED_COURSES.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-md transition-all group"
              >
                <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-[hsl(var(--muted))]">
                  <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1 mb-1">{course.title}</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                    Next: {course.nextLesson}
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={course.progress} className="flex-1 h-1.5" />
                    <span className="text-xs font-medium text-[hsl(var(--primary))] shrink-0">
                      {course.progress}%
                    </span>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                    {course.completedLessons}/{course.totalLessons} lessons
                  </p>
                </div>
                <Link href={`/courses/${course.id}/learn`}>
                  <Button size="sm" variant={course.progress === 100 ? "outline" : "gradient"} className="shrink-0">
                    {course.progress === 100 ? "Review" : "Continue"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Assistant CTA */}
          <div className="rounded-2xl border border-[hsl(var(--primary))]/30 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent p-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center mb-3 shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold mb-1">Ask Aria AI</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Get instant help with your lessons, summarize PDFs, or generate practice questions.
            </p>
            <Link href="/ai-assistant">
              <Button variant="gradient" size="sm" className="w-full">
                Chat with Aria <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Upcoming Tutoring */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[hsl(var(--primary))]" />
              Upcoming Sessions
            </h3>
            <div className="text-center py-6 text-[hsl(var(--muted-foreground))]">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6" />
              </div>
              <p className="text-sm">No upcoming sessions</p>
              <Link href="/dashboard/tutoring">
                <Button variant="outline" size="sm" className="mt-3">
                  Book a Session
                </Button>
              </Link>
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Weekly Goal
              </h3>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">4/5 days</span>
            </div>
            <Progress value={80} className="h-2.5 mb-2" />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              You&apos;re 80% toward your goal of learning 5 days this week!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
