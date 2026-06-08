"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, BookOpen, Award, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COURSES = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp 2024",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80",
    teacher: "Sarah Johnson",
    category: "Web Development",
    progress: 65,
    completedLessons: 31,
    totalLessons: 48,
    status: "in_progress",
    slug: "web-development-bootcamp",
  },
  {
    id: "2",
    title: "Machine Learning & AI Fundamentals",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80",
    teacher: "Dr. Marcus Chen",
    category: "AI & ML",
    progress: 28,
    completedLessons: 17,
    totalLessons: 60,
    status: "in_progress",
    slug: "machine-learning-ai",
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass",
    thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&q=80",
    teacher: "Emily Park",
    category: "Design",
    progress: 100,
    completedLessons: 35,
    totalLessons: 35,
    status: "completed",
    slug: "ui-ux-design",
  },
];

export default function MyCoursesPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const filtered = COURSES.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Track your learning progress</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder="Search your courses..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently Accessed</SelectItem>
            <SelectItem value="progress">By Progress</SelectItem>
            <SelectItem value="title">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({COURSES.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {["all", "in_progress", "completed"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered
                .filter((c) => tab === "all" || c.status === tab)
                .map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-video bg-[hsl(var(--muted))]">
                      <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                      {course.status === "completed" && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                            <Award className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <Badge variant="secondary" className="text-xs mb-2 capitalize">
                        {course.category}
                      </Badge>
                      <h3 className="font-semibold mb-1 line-clamp-2">{course.title}</h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                        by {course.teacher}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-[hsl(var(--muted-foreground))]">
                            {course.completedLessons}/{course.totalLessons} lessons
                          </span>
                          <span className="font-semibold text-[hsl(var(--primary))]">
                            {course.progress}%
                          </span>
                        </div>
                        <Progress value={course.progress} className="h-1.5" />
                      </div>

                      <Link href={`/courses/${course.slug}/learn`}>
                        <Button
                          variant={course.status === "completed" ? "outline" : "gradient"}
                          size="sm"
                          className="w-full"
                        >
                          {course.status === "completed" ? (
                            <><Award className="h-4 w-4" /> View Certificate</>
                          ) : (
                            <><Play className="h-4 w-4 fill-white" /> Continue</>
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>

            {filtered.filter((c) => tab === "all" || c.status === tab).length === 0 && (
              <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No courses found</p>
                <Link href="/courses">
                  <Button variant="outline" className="mt-4">Browse Courses</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
