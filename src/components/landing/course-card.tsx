"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Users, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice, formatDuration, getInitials } from "@/lib/utils";

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    slug: string;
    shortDescription: string;
    thumbnail: string;
    category: string;
    level: string;
    price: number;
    isFree: boolean;
    rating: number;
    reviewCount: number;
    enrollmentCount: number;
    duration: number;
    teacher: {
      name: string;
      avatar?: string;
    };
  };
}

const LEVEL_COLORS: Record<string, "blue" | "warning" | "destructive"> = {
  beginner: "blue",
  intermediate: "warning",
  advanced: "destructive",
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.slug}`} className="group block">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden hover:shadow-xl hover:shadow-[hsl(var(--primary))]/10 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-[hsl(var(--muted))]">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full gradient-bg flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-white/60" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={LEVEL_COLORS[course.level] || "default"} className="capitalize">
              {course.level}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge variant={course.isFree ? "success" : "default"}>
              {course.isFree ? "Free" : formatPrice(course.price)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <Badge variant="secondary" className="w-fit text-xs mb-2 capitalize">
            {course.category}
          </Badge>

          <h3 className="font-semibold text-[hsl(var(--foreground))] line-clamp-2 mb-2 group-hover:text-[hsl(var(--primary))] transition-colors leading-snug">
            {course.title}
          </h3>

          <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4 flex-1">
            {course.shortDescription}
          </p>

          {/* Teacher */}
          <div className="flex items-center gap-2 mb-4">
            <Avatar className="h-6 w-6">
              <AvatarImage src={course.teacher?.avatar} />
              <AvatarFallback className="text-[10px] gradient-bg text-white">
                {getInitials(course.teacher?.name || "?")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {course.teacher?.name}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] pt-3 border-t border-[hsl(var(--border))]">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-[hsl(var(--foreground))]">
                {course.rating.toFixed(1)}
              </span>
              <span>({course.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{course.enrollmentCount.toLocaleString()}</span>
            </div>
            {course.duration > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(course.duration)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
