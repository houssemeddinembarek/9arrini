"use client";

import { useState, useEffect } from "react";
import { Search, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseCard } from "@/components/landing/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/useCourses";
import { SUBJECTS, CLASS_LEVELS, TRIMESTERS, studentClasse } from "@/lib/tunisia-education";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", ...SUBJECTS];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [classe, setClasse] = useState("all");
  const [trimestre, setTrimestre] = useState("all");
  const [sort, setSort] = useState("newest");

  const { courses, loading, error, pagination, fetchCourses } = useCourses();

  // Debounce the search input so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Pre-filter the list to the student's registered level: read their profile
  // once on load and default the Classe filter to their class. They can still
  // change it afterwards.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (cancelled || !json.success) return;
        const c = studentClasse(json.data.user?.studentProfile);
        if (c) setClasse(c);
      } catch {
        /* not logged in or offline — keep showing all classes */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch from the database whenever filters change.
  useEffect(() => {
    const params: Record<string, string> = { sort };
    if (activeCategory !== "All") params.category = activeCategory;
    if (classe !== "all") params.classe = classe;
    if (trimestre !== "all") params.trimestre = trimestre;
    if (debouncedSearch) params.search = debouncedSearch;
    fetchCourses(params);
  }, [activeCategory, classe, trimestre, sort, debouncedSearch, fetchCourses]);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setClasse("all");
    setTrimestre("all");
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))] py-10 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Explore <span className="gradient-text">Courses</span>
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Filtrez par classe et par matière, du primaire au baccalauréat.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            <Input
              placeholder="Search courses, skills, teachers..."
              className="pl-11 h-12 rounded-xl text-base bg-[hsl(var(--background))]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                activeCategory === cat
                  ? "gradient-bg text-white shadow-md"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex gap-2 flex-1">
            <Select value={classe} onValueChange={setClasse}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {CLASS_LEVELS.map((stage) => (
                  <SelectGroup key={stage.stage}>
                    <SelectLabel>{stage.stage}</SelectLabel>
                    {stage.classes.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            <Select value={trimestre} onValueChange={setTrimestre}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Trimestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les trimestres</SelectItem>
                {TRIMESTERS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-[hsl(var(--muted-foreground))] whitespace-nowrap">
              {pagination.total} courses
            </span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--muted-foreground))]/30" />
            <h3 className="text-lg font-semibold mb-2">Couldn&apos;t load courses</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">{error}</p>
            <Button variant="outline" onClick={() => fetchCourses({ sort })}>
              Try Again
            </Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--muted-foreground))]/30" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course as never} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
