"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Users, BookOpen, GraduationCap, Activity, ShieldCheck, Layers, BarChart2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  pendingTeachers: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalBookings: number;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (json.success) setStats(json.data.stats);
        else toast.error(json.error || "Failed to load analytics");
      } catch {
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-[hsl(var(--primary))]" />
          Analytics
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Platform-wide metrics at a glance.</p>
      </div>

      {loading || !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} subtitle="All accounts" icon={Users} color="purple" />
          <StatCard title="Students" value={stats.totalStudents.toLocaleString()} subtitle="Registered learners" icon={Activity} color="blue" />
          <StatCard title="Teachers" value={stats.totalTeachers.toLocaleString()} subtitle={`${stats.pendingTeachers} pending`} icon={ShieldCheck} color="orange" />
          <StatCard title="Total Courses" value={stats.totalCourses.toLocaleString()} subtitle={`${stats.publishedCourses} published`} icon={BookOpen} color="green" />
          <StatCard title="Published Courses" value={stats.publishedCourses.toLocaleString()} subtitle="Live on platform" icon={Layers} color="blue" />
          <StatCard title="Enrollments" value={stats.totalEnrollments.toLocaleString()} subtitle="All time" icon={GraduationCap} color="purple" />
          <StatCard title="Tutoring Bookings" value={stats.totalBookings.toLocaleString()} subtitle="All time" icon={Activity} color="green" />
          <StatCard title="Pending Teachers" value={stats.pendingTeachers.toLocaleString()} subtitle="Awaiting approval" icon={ShieldCheck} color="orange" />
        </div>
      )}
    </div>
  );
}
