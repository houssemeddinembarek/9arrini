"use client";

import { BarChart2, TrendingUp, Users, Star, Construction } from "lucide-react";

const PLACEHOLDER_STATS = [
  { label: "Total Views", value: "12,840", icon: TrendingUp, color: "text-blue-500" },
  { label: "Enrollments", value: "2,770", icon: Users, color: "text-purple-500" },
  { label: "Avg. Rating", value: "4.85", icon: Star, color: "text-amber-500" },
  { label: "Completion Rate", value: "68%", icon: BarChart2, color: "text-green-500" },
];

export default function TeacherAnalyticsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Track engagement, enrollments, and revenue across your courses.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {PLACEHOLDER_STATS.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-center"
          >
            <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-[hsl(var(--border))] p-16 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 opacity-50">
          <BarChart2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Detailed Analytics</h3>
        <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm">
          Interactive charts, revenue breakdown, student progress heatmaps, and lesson completion funnels.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[hsl(var(--muted-foreground))]">
          <Construction className="h-3.5 w-3.5" />
          Under development
        </div>
      </div>
    </div>
  );
}
