"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, LayoutDashboard, GraduationCap, Users, Settings,
  BarChart2, MessageSquare, Calendar, Brain,
  PlusCircle, Video, FileText, ChevronLeft, ChevronRight, LogOut, Sparkles,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/useAuthStore";
import { getInitials, cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  section?: string;
}

// Students have no dashboard — their hub is the profile screen.
const STUDENT_NAV: NavItem[] = [
  { label: "Profile", href: "/profile", icon: LayoutDashboard },
  { label: "My Courses", href: "/dashboard/my-courses", icon: BookOpen },
  { label: "Tutoring", href: "/dashboard/tutoring", icon: Calendar },
  { label: "AI Assistant", href: "/ai-assistant", icon: Brain },
  { label: "Settings", href: "/profile/settings", icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { label: "My Courses", href: "/teacher/courses", icon: BookOpen },
  { label: "Create Course", href: "/teacher/courses/create", icon: PlusCircle },
  { label: "Generate Content", href: "/teacher/generate-content", icon: Sparkles },
  { label: "Content Library", href: "/teacher/content", icon: FileText },
  { label: "Lessons", href: "/teacher/lessons", icon: Video },
  { label: "AI Assistant", href: "/teacher/ai-assistant", icon: Brain },
  { label: "Quizzes", href: "/teacher/quizzes", icon: GraduationCap },
  { label: "Groups", href: "/teacher/groups", icon: UsersRound },
  { label: "Calendar", href: "/teacher/calendar", icon: Calendar },
  { label: "Tutoring", href: "/teacher/tutoring", icon: Video },
  { label: "Students", href: "/teacher/students", icon: Users },
  { label: "Analytics", href: "/teacher/analytics", icon: BarChart2 },
  { label: "Messages", href: "/teacher/messages", icon: MessageSquare },
  { label: "Settings", href: "/teacher/settings", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "AI Assistant", href: "/admin/ai-assistant", icon: Brain },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  role?: "student" | "teacher" | "admin";
}

export function Sidebar({ role = "student" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const navItems = role === "admin" ? ADMIN_NAV : role === "teacher" ? TEACHER_NAV : STUDENT_NAV;

  const isActive = (href: string) => {
    if (["/profile", "/teacher", "/admin"].includes(href)) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "relative flex flex-col h-full bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] transition-all duration-300",
          collapsed ? "w-[70px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-4 border-b border-[hsl(var(--border))] shrink-0">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shrink-0 shadow">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            {!collapsed && <span className="font-bold text-lg gradient-text">Skillora</span>}
          </Link>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              if (collapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl transition-colors mx-auto",
                          active
                            ? "gradient-bg text-white shadow-md"
                            : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "gradient-bg text-white shadow-md"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User footer */}
        <div className="border-t border-[hsl(var(--border))] p-3 shrink-0">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                      {user ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{user?.email}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[hsl(var(--accent))] transition-colors">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                  {user ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <Badge variant="purple" className="text-[10px] capitalize px-1.5 py-0 mt-0.5">
                  {user?.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-[hsl(var(--muted-foreground))] hover:text-red-500"
                onClick={() => logout()}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center justify-center hover:bg-[hsl(var(--accent))] transition-colors shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}
