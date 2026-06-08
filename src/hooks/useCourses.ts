"use client";

import { useState, useCallback } from "react";
import type { ICourse, PaginatedResponse } from "@/types";

interface UseCoursesOptions {
  initialPage?: number;
  limit?: number;
}

export function useCourses(options: UseCoursesOptions = {}) {
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: options.initialPage || 1,
    limit: options.limit || 12,
    total: 0,
    totalPages: 0,
  });

  const fetchCourses = useCallback(async (params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...params,
      });
      const res = await fetch(`/api/courses?${qs}`);
      const json = await res.json();

      if (json.success) {
        setCourses(json.data.courses);
        setPagination((prev) => ({
          ...prev,
          total: json.data.total,
          totalPages: json.data.totalPages,
        }));
      } else {
        setError(json.error || "Failed to load courses");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const setPage = (page: number) => setPagination((prev) => ({ ...prev, page }));

  return { courses, loading, error, pagination, fetchCourses, setPage };
}
