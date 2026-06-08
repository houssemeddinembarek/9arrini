"use client";

import { useState, useCallback } from "react";
import { Search, SlidersHorizontal, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseCard } from "@/components/landing/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All", "Web Development", "Mobile Dev", "AI & ML", "Data Science",
  "Design", "Business", "Marketing", "Programming", "DevOps", "Cybersecurity",
];

const SAMPLE_COURSES = [
  { _id: "1", title: "Complete Web Development Bootcamp 2024", slug: "web-dev", shortDescription: "Learn HTML, CSS, JavaScript, React, Node.js and build full-stack apps.", thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80", category: "Web Development", level: "beginner", price: 89, isFree: false, rating: 4.9, reviewCount: 2847, enrollmentCount: 18500, duration: 72000, teacher: { name: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50" } },
  { _id: "2", title: "Machine Learning & AI Fundamentals", slug: "ml-ai", shortDescription: "Master ML, neural networks, and AI with Python and TensorFlow.", thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80", category: "AI & ML", level: "intermediate", price: 119, isFree: false, rating: 4.8, reviewCount: 1923, enrollmentCount: 12300, duration: 86400, teacher: { name: "Dr. Marcus Chen", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50" } },
  { _id: "3", title: "UI/UX Design Masterclass", slug: "ui-ux", shortDescription: "Learn Figma, design systems, and build a professional portfolio.", thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&q=80", category: "Design", level: "beginner", price: 0, isFree: true, rating: 4.7, reviewCount: 3201, enrollmentCount: 25000, duration: 54000, teacher: { name: "Emily Park", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50" } },
  { _id: "4", title: "Advanced TypeScript for React", slug: "ts-react", shortDescription: "Level up with advanced TypeScript patterns and type-safe architecture.", thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&q=80", category: "Web Development", level: "advanced", price: 79, isFree: false, rating: 4.9, reviewCount: 876, enrollmentCount: 5600, duration: 43200, teacher: { name: "Alex Rivera", avatar: "" } },
  { _id: "5", title: "Data Science with Python", slug: "data-science", shortDescription: "Master pandas, matplotlib, scikit-learn and predictive modeling.", thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80", category: "Data Science", level: "intermediate", price: 99, isFree: false, rating: 4.8, reviewCount: 1456, enrollmentCount: 9800, duration: 64800, teacher: { name: "Dr. Priya Sharma", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50" } },
  { _id: "6", title: "React Native Mobile Development", slug: "react-native", shortDescription: "Build cross-platform iOS and Android apps with React Native and Expo.", thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80", category: "Mobile Dev", level: "intermediate", price: 0, isFree: true, rating: 4.6, reviewCount: 998, enrollmentCount: 7200, duration: 57600, teacher: { name: "James Wilson", avatar: "" } },
  { _id: "7", title: "Cybersecurity Fundamentals", slug: "cybersecurity", shortDescription: "Learn ethical hacking, network security, and penetration testing.", thumbnail: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80", category: "Cybersecurity", level: "beginner", price: 89, isFree: false, rating: 4.7, reviewCount: 645, enrollmentCount: 4100, duration: 48000, teacher: { name: "Ryan Mitchell", avatar: "" } },
  { _id: "8", title: "DevOps & CI/CD Mastery", slug: "devops", shortDescription: "Docker, Kubernetes, GitHub Actions, and modern deployment pipelines.", thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&q=80", category: "DevOps", level: "advanced", price: 109, isFree: false, rating: 4.8, reviewCount: 732, enrollmentCount: 3900, duration: 61200, teacher: { name: "Lisa Chen", avatar: "" } },
  { _id: "9", title: "Digital Marketing Mastery", slug: "digital-marketing", shortDescription: "SEO, PPC, social media marketing, and growth hacking strategies.", thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80", category: "Marketing", level: "beginner", price: 0, isFree: true, rating: 4.5, reviewCount: 2100, enrollmentCount: 15000, duration: 36000, teacher: { name: "Sophia Martinez", avatar: "" } },
];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = SAMPLE_COURSES.filter((course) => {
    const matchSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || course.category === activeCategory;
    const matchLevel = level === "all" || course.level === level;
    return matchSearch && matchCat && matchLevel;
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="bg-[hsl(var(--muted))]/30 border-b border-[hsl(var(--border))] py-10 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Explore <span className="gradient-text">1,200+ Courses</span>
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Learn from expert instructors in web development, design, AI, and more.
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
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {filtered.length} courses
            </span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-44">
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
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--muted-foreground))]/30" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              Try adjusting your search or filters
            </p>
            <Button variant="outline" onClick={() => { setSearch(""); setActiveCategory("All"); setLevel("all"); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
