"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "./course-card";

const SAMPLE_COURSES = [
  {
    _id: "1",
    title: "Complete Web Development Bootcamp 2024",
    slug: "web-development-bootcamp",
    shortDescription: "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB from scratch to build full-stack apps.",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80",
    category: "Web Development",
    level: "beginner",
    price: 89,
    isFree: false,
    rating: 4.9,
    reviewCount: 2847,
    enrollmentCount: 18500,
    duration: 72000,
    teacher: { name: "Sarah Johnson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" },
  },
  {
    _id: "2",
    title: "Machine Learning & AI Fundamentals",
    slug: "machine-learning-ai",
    shortDescription: "Master the foundations of ML, neural networks, and AI with Python, TensorFlow, and real-world projects.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
    category: "AI & ML",
    level: "intermediate",
    price: 119,
    isFree: false,
    rating: 4.8,
    reviewCount: 1923,
    enrollmentCount: 12300,
    duration: 86400,
    teacher: { name: "Dr. Marcus Chen", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" },
  },
  {
    _id: "3",
    title: "UI/UX Design Masterclass",
    slug: "ui-ux-design",
    shortDescription: "Learn Figma, design systems, user research, and build a professional design portfolio.",
    thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&q=80",
    category: "Design",
    level: "beginner",
    price: 0,
    isFree: true,
    rating: 4.7,
    reviewCount: 3201,
    enrollmentCount: 25000,
    duration: 54000,
    teacher: { name: "Emily Park", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" },
  },
  {
    _id: "4",
    title: "Advanced TypeScript for React Developers",
    slug: "advanced-typescript-react",
    shortDescription: "Level up your React skills with advanced TypeScript patterns, generics, and type-safe architecture.",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&q=80",
    category: "Web Development",
    level: "advanced",
    price: 79,
    isFree: false,
    rating: 4.9,
    reviewCount: 876,
    enrollmentCount: 5600,
    duration: 43200,
    teacher: { name: "Alex Rivera", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
  },
  {
    _id: "5",
    title: "Data Science with Python",
    slug: "data-science-python",
    shortDescription: "Master pandas, matplotlib, scikit-learn and go from data cleaning to predictive modeling.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    category: "Data Science",
    level: "intermediate",
    price: 99,
    isFree: false,
    rating: 4.8,
    reviewCount: 1456,
    enrollmentCount: 9800,
    duration: 64800,
    teacher: { name: "Dr. Priya Sharma", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80" },
  },
  {
    _id: "6",
    title: "Mobile App Development with React Native",
    slug: "react-native-mobile-dev",
    shortDescription: "Build cross-platform iOS and Android apps using React Native, Expo, and modern best practices.",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80",
    category: "Mobile Dev",
    level: "intermediate",
    price: 0,
    isFree: true,
    rating: 4.6,
    reviewCount: 998,
    enrollmentCount: 7200,
    duration: 57600,
    teacher: { name: "James Wilson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
  },
];

export function PopularCourses() {
  const router = useRouter();

  return (
    <section className="py-24 bg-[hsl(var(--muted))]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium mb-4">
              <TrendingUp className="h-4 w-4" />
              Most Popular
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold">
              Top-rated <span className="gradient-text">courses</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-2 max-w-xl">
              Hand-picked courses loved by thousands of learners worldwide.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/courses")}
            className="shrink-0"
          >
            View All Courses
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_COURSES.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
