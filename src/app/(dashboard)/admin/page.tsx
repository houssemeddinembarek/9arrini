"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users, BookOpen, GraduationCap, TrendingUp, ShieldCheck,
  Clock, ArrowRight, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MeetingHistory } from "@/components/meetings/meeting-history";
import { getInitials, formatRelativeTime } from "@/lib/utils";

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin" | "parent" | "superadmin";
  isApproved?: boolean;
  createdAt: string;
  avatar?: string;
}

interface PendingTeacher {
  _id: string;
  name: string;
  email: string;
  expertise?: string[];
  createdAt: string;
  avatar?: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    pendingTeachers: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [pending, setPending] = useState<PendingTeacher[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (json.success) {
          setStats(json.data.stats);
          setRecentUsers(json.data.recentUsers || []);
          setPending(json.data.pendingApprovals || []);
        } else {
          toast.error(json.error || "Failed to load dashboard");
        }
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const reviewTeacher = async (id: string, approve: boolean) => {
    try {
      const method = approve ? "PATCH" : "DELETE";
      const res = await fetch(`/api/admin/users/${id}`, {
        method,
        ...(approve
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isApproved: true }),
            }
          : {}),
      });
      const json = await res.json();
      if (json.success) {
        setPending((prev) => prev.filter((p) => p._id !== id));
        setStats((s) => ({ ...s, pendingTeachers: Math.max(0, s.pendingTeachers - 1) }));
        toast.success(approve ? "Teacher approved" : "Application rejected");
      } else {
        toast.error(json.error || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[hsl(var(--primary))]" />
            Admin Dashboard
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">Platform overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Export Report</Button>
          <Button variant="gradient" size="sm">
            <TrendingUp className="h-4 w-4" /> Analytics
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} subtitle={`${stats.totalTeachers} teachers`} icon={Users} color="purple" trend={{ value: 23, label: "this month" }} />
          <StatCard title="Published Courses" value={stats.publishedCourses} subtitle="Live on platform" icon={BookOpen} color="blue" trend={{ value: 8, label: "this week" }} />
          <StatCard title="Total Enrollments" value={stats.totalEnrollments.toLocaleString()} subtitle="All time" icon={GraduationCap} color="green" trend={{ value: 15, label: "this month" }} />
          <StatCard title="Active Students" value={stats.totalStudents.toLocaleString()} subtitle="Registered" icon={Activity} color="orange" trend={{ value: 19, label: "this month" }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="lg:col-span-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">Recent Registrations</h2>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="text-[hsl(var(--primary))]">
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : recentUsers.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">No registrations yet.</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-3 py-2 border-b border-[hsl(var(--border))] last:border-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{u.email}</p>
                  </div>
                  <Badge variant={u.role === "teacher" ? "purple" : u.role === "superadmin" ? "warning" : u.role === "admin" ? "destructive" : "blue"} className="capitalize">
                    {u.role}
                  </Badge>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block">{formatRelativeTime(u.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Teacher Approvals */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-5 h-fit">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            Pending Approvals
            <Badge variant="warning" className="ml-auto">{pending.length}</Badge>
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
              No teachers awaiting approval.
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => (
                <div key={p._id} className="bg-white dark:bg-[hsl(var(--card))] rounded-xl p-3">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                    {p.expertise?.length ? `${p.expertise.join(", ")} • ` : ""}{formatRelativeTime(p.createdAt)}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="gradient" className="flex-1 h-7 text-xs" onClick={() => reviewTeacher(p._id, true)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-red-500 hover:text-red-500" onClick={() => reviewTeacher(p._id, false)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform-wide meeting history */}
      <MeetingHistory title="Meeting history (all)" />
    </div>
  );
}
