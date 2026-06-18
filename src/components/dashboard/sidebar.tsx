"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, LayoutDashboard, GraduationCap, Users, Settings,
  BarChart2, MessageSquare, Calendar, Brain,
  Video, FileText, ChevronLeft, ChevronRight, LogOut,
  UsersRound, FileQuestion, ClipboardList,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/useAuthStore";
import { useI18n } from "@/lib/i18n/context";
import { getInitials, cn } from "@/lib/utils";

type NavKey = keyof ReturnType<typeof useI18n>["dict"]["dashboard"]["nav"];

interface NavItem {
  key: NavKey;
  href: string;
  icon: React.ElementType;
  badge?: string;
  section?: string;
}

// Students have no dashboard — their hub is the profile screen.
const STUDENT_NAV: NavItem[] = [
  { key: "profile", href: "/profile", icon: LayoutDashboard },
  { key: "myCourses", href: "/dashboard/my-courses", icon: BookOpen },
  { key: "classes", href: "/dashboard/classes", icon: GraduationCap },
  { key: "assignments", href: "/dashboard/assignments", icon: ClipboardList },
  { key: "quiz", href: "/dashboard/quizzes", icon: FileQuestion },
  { key: "meetings", href: "/dashboard/meetings", icon: Video },
  { key: "tutoring", href: "/dashboard/tutoring", icon: Calendar },
  { key: "aiAssistant", href: "/ai-assistant", icon: Brain },
  { key: "settings", href: "/profile/settings", icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { key: "dashboard", href: "/teacher", icon: LayoutDashboard },
  { key: "myCourses", href: "/teacher/courses", icon: BookOpen },
  { key: "content", href: "/teacher/content", icon: FileText },
  { key: "lessons", href: "/teacher/lessons", icon: Video },
  { key: "aiAssistant", href: "/teacher/ai-assistant", icon: Brain },
  { key: "quizzes", href: "/teacher/quizzes", icon: FileQuestion },
  { key: "groups", href: "/teacher/groups", icon: UsersRound },
  { key: "classes", href: "/teacher/classes", icon: GraduationCap },
  { key: "assignments", href: "/teacher/assignments", icon: ClipboardList },
  { key: "calendar", href: "/teacher/calendar", icon: Calendar },
  { key: "tutoring", href: "/teacher/tutoring", icon: Video },
  { key: "students", href: "/teacher/students", icon: Users },
  { key: "analytics", href: "/teacher/analytics", icon: BarChart2 },
  { key: "messages", href: "/teacher/messages", icon: MessageSquare },
  { key: "settings", href: "/teacher/settings", icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "users", href: "/admin/users", icon: Users },
  { key: "classes", href: "/admin/classes", icon: GraduationCap },
  { key: "courses", href: "/admin/courses", icon: BookOpen },
  { key: "aiAssistant", href: "/admin/ai-assistant", icon: Brain },
  { key: "analytics", href: "/admin/analytics", icon: BarChart2 },
  { key: "reports", href: "/admin/reports", icon: FileText },
  { key: "settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  role?: "student" | "teacher" | "admin";
}

export function Sidebar({ role = "student" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { dict } = useI18n();
  const nav = dict.dashboard.nav;

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
                    <TooltipContent side="right">{nav[item.key]}</TooltipContent>
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
                  <span className="flex-1">{nav[item.key]}</span>
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
                  {user?.role ? dict.dashboard.roleBadge[user.role] : ""}
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
