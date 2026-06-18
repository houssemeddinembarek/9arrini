"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  BookOpen, Users, Star, PlusCircle, ArrowRight,
  Edit, Eye, Trash2, MoreVertical, BarChart2, GraduationCap, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/useAuthStore";
import { useI18n } from "@/lib/i18n/context";

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

interface TeacherStats {
  totalStudents: number;
  totalReviews: number;
  totalLessons: number;
  publishedCount: number;
  draftCount: number;
  courseCount: number;
  avgRating: number;
}

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const { dict } = useI18n();
  const t = dict.dashboard.teacher;
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/teacher/dashboard");
        const json = await res.json();
        if (!active) return;
        if (json.success) {
          setCourses(json.data.courses);
          setStats(json.data.stats);
        } else {
          toast.error(json.error || t.toastLoadFailed);
        }
      } catch {
        if (active) toast.error(t.toastLoadFailed);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const deleteCourse = async (slug: string) => {
    const prev = courses;
    setCourses((c) => c.filter((x) => x.slug !== slug));
    try {
      const res = await fetch(`/api/courses/${slug}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success(t.toastDeleted);
      } else {
        setCourses(prev);
        toast.error(json.error || t.toastDeleteFailed);
      }
    } catch {
      setCourses(prev);
      toast.error(t.toastDeleteFailed);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {t.greeting} {user?.name?.split(" ")[0]}! {t.overview}
          </p>
        </div>
        <Link href="/teacher/courses">
          <Button variant="gradient">
            <PlusCircle className="h-4 w-4" />
            {t.createCourse}
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t.statStudents} value={(stats?.totalStudents ?? 0).toLocaleString()} subtitle={t.acrossCourses} icon={Users} color="purple" />
          <StatCard title={t.statRating} value={stats?.totalReviews ? stats.avgRating.toFixed(2) : "—"} subtitle={`${t.reviewsFrom} ${(stats?.totalReviews ?? 0).toLocaleString()} ${t.reviewsWord}`} icon={Star} color="orange" />
          <StatCard title={t.statPublished} value={stats?.publishedCount ?? 0} subtitle={`${stats?.draftCount ?? 0} ${t.draftsWord}`} icon={BookOpen} color="blue" />
          <StatCard title={t.statLessons} value={stats?.totalLessons ?? 0} subtitle={t.acrossCourses} icon={FileText} color="green" />
        </div>
      )}

      {/* Courses Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.myCourses}</h2>
          <Link href="/teacher/courses" className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
            {t.viewAll} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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
            <p className="font-medium">{t.noCourses}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              {t.noCoursesDesc}
            </p>
            <Link href="/teacher/courses">
              <Button variant="gradient" size="sm">
                <PlusCircle className="h-4 w-4" /> {t.createCourse}
              </Button>
            </Link>
          </div>
        ) : (
        <div className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted))]/50 border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                    {t.colCourse}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden md:table-cell">
                    {t.colStatus}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden lg:table-cell">
                    {t.colStudents}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide hidden lg:table-cell">
                    {t.colRating}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
                    {t.colActions}
                  </th>
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
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {course.level}
                            </Badge>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {course.lessons} {t.lessonsWord}
                            </span>
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
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/courses/${course.slug}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/teacher/courses/${course.slug}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <Link href={`/teacher/analytics`}>
                              <DropdownMenuItem>
                                <BarChart2 className="h-4 w-4 mr-2" /> {t.menuAnalytics}
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/teacher/students`}>
                              <DropdownMenuItem>
                                <GraduationCap className="h-4 w-4 mr-2" /> {t.menuStudents}
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => deleteCourse(course.slug)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> {t.menuDelete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
