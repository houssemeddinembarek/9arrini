"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/useCourses";
import { useI18n } from "@/lib/i18n/context";
import { CourseCard } from "./course-card";

export function PopularCourses() {
  const router = useRouter();
  const { dict } = useI18n();
  const t = dict.popularCourses;
  const { courses, loading, fetchCourses } = useCourses({ limit: 6 });

  useEffect(() => {
    fetchCourses({ sort: "popular" });
  }, [fetchCourses]);

  // Don't render the section if there are no courses to show.
  if (!loading && courses.length === 0) return null;

  return (
    <section className="py-24 bg-[hsl(var(--muted))]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
              <TrendingUp className="h-4 w-4" />
              {t.badge}
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">
              {t.titleBefore} <span className="gradient-text">{t.titleHighlight}</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-2 max-w-xl">
              {t.subtitle}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/courses")}
            className="shrink-0"
          >
            {t.viewAll}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))
            : courses.map((course) => (
                <CourseCard key={course._id} course={course as never} />
              ))}
        </div>
      </div>
    </section>
  );
}
