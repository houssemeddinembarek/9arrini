"use client";

import Link from "next/link";
import Image from "next/image";
import { PlusCircle, Eye, Edit, Trash2, Users, Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SAMPLE_COURSES = [
  {
    id: "1",
    title: "Complete Web Development Bootcamp",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&q=80",
    category: "Web Development",
    level: "beginner",
    status: "published",
    students: 1847,
    rating: 4.9,
    lessons: 48,
    slug: "web-development-bootcamp",
  },
  {
    id: "2",
    title: "Advanced React Patterns & Architecture",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=300&q=80",
    category: "Web Development",
    level: "advanced",
    status: "published",
    students: 923,
    rating: 4.8,
    lessons: 32,
    slug: "advanced-react-patterns",
  },
  {
    id: "3",
    title: "JavaScript Fundamentals for Beginners",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=300&q=80",
    category: "Programming",
    level: "beginner",
    status: "draft",
    students: 0,
    rating: 0,
    lessons: 12,
    slug: "js-fundamentals",
  },
];

export default function TeacherCoursesPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Manage all your courses in one place.
          </p>
        </div>
        <Link href="/teacher/courses/create">
          <Button variant="gradient">
            <PlusCircle className="h-4 w-4" /> Create Course
          </Button>
        </Link>
      </div>

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
              {SAMPLE_COURSES.map((course) => (
                <tr key={course.id} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-[hsl(var(--muted))]">
                        <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{course.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] capitalize">{course.level}</Badge>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{course.lessons} lessons</span>
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
                      {course.rating > 0 ? course.rating.toFixed(1) : "—"}
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
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
    </div>
  );
}
