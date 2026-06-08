import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "purple" | "blue" | "green" | "orange" | "red";
}

const COLORS = {
  purple: "from-purple-500 to-violet-600",
  blue: "from-blue-500 to-cyan-500",
  green: "from-green-500 to-emerald-500",
  orange: "from-orange-500 to-amber-500",
  red: "from-red-500 to-pink-500",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = "purple" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 flex items-start gap-4 hover:shadow-lg transition-shadow">
      <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg", COLORS[color])}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs mt-1 font-medium", trend.value >= 0 ? "text-green-500" : "text-red-500")}>
            <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
            <span className="text-[hsl(var(--muted-foreground))] font-normal">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
