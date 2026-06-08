"use client";

import { useEffect, useState } from "react";
import {
  Users, BookOpen, GraduationCap, TrendingUp, ShieldCheck,
  AlertCircle, CheckCircle2, Clock, ArrowRight, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const RECENT_USERS = [
  { id: "1", name: "Alex Chen", email: "alex@example.com", role: "student", joinedAt: "2 hours ago", avatar: "" },
  { id: "2", name: "Maria Santos", email: "maria@example.com", role: "teacher", joinedAt: "4 hours ago", avatar: "" },
  { id: "3", name: "James Kim", email: "james@example.com", role: "student", joinedAt: "6 hours ago", avatar: "" },
  { id: "4", name: "Aisha Johnson", email: "aisha@example.com", role: "teacher", joinedAt: "1 day ago", avatar: "" },
  { id: "5", name: "Carlos Ruiz", email: "carlos@example.com", role: "student", joinedAt: "2 days ago", avatar: "" },
];

const PENDING_APPROVALS = [
  { id: "1", name: "Dr. Priya Nair", specialty: "Data Science", applied: "3 hours ago" },
  { id: "2", name: "Tom Williams", specialty: "DevOps", applied: "1 day ago" },
];

const PLATFORM_ACTIVITY = [
  { icon: CheckCircle2, color: "text-green-500", message: "New course published: Advanced Python", time: "5 min ago" },
  { icon: Users, color: "text-blue-500", message: "8 new students enrolled today", time: "2 hours ago" },
  { icon: AlertCircle, color: "text-amber-500", message: "Teacher application pending review", time: "3 hours ago" },
  { icon: Activity, color: "text-purple-500", message: "Course 'ML Basics' reached 1,000 students", time: "5 hours ago" },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (json.success) {
          setStats(json.data.stats);
        }
      } catch {
        // Use fallback demo data
        setStats({ totalUsers: 1284, totalStudents: 1156, totalTeachers: 47, publishedCourses: 89, totalEnrollments: 4320 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
            <Button variant="ghost" size="sm" className="text-[hsl(var(--primary))]">
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {RECENT_USERS.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[hsl(var(--border))] last:border-0">
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
                <Badge variant={u.role === "teacher" ? "purple" : "blue"} className="capitalize">
                  {u.role}
                </Badge>
                <span className="text-xs text-[hsl(var(--muted-foreground))] hidden sm:block">{u.joinedAt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pending Teacher Approvals */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              Pending Approvals
              <Badge variant="warning" className="ml-auto">{PENDING_APPROVALS.length}</Badge>
            </h3>
            <div className="space-y-3">
              {PENDING_APPROVALS.map((p) => (
                <div key={p.id} className="bg-white dark:bg-[hsl(var(--card))] rounded-xl p-3">
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                    {p.specialty} • {p.applied}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="gradient" className="flex-1 h-7 text-xs">Approve</Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-xs text-red-500 hover:text-red-500">Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
              Platform Activity
            </h3>
            <div className="space-y-3">
              {PLATFORM_ACTIVITY.map(({ icon: Icon, color, message, time }) => (
                <div key={message} className="flex items-start gap-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-xs text-[hsl(var(--foreground))]">{message}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
