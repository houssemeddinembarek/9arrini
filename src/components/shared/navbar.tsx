"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, BookOpen, ChevronDown, Bell, Sparkles, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuthStore } from "@/stores/useAuthStore";
import { getInitials, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/stores/useNotificationStore";

const NAV_LINKS = [
  { label: "Profs", href: "/tutoring", icon: Users },
  { label: "Cours", href: "/courses", icon: BookOpen },
  { label: "Assistant IA", href: "/ai-assistant", icon: Sparkles },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsOpen(false); }, [pathname]);

  const getDashboardLink = () => {
    if (!user) return "/dashboard";
    if (user.role === "admin") return "/admin";
    if (user.role === "teacher") return "/teacher";
    return "/dashboard";
  };

  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || !isHome
          ? "bg-[hsl(var(--background))]/95 backdrop-blur-xl border-b border-[hsl(var(--border))] shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group shrink-0">
            <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-shadow">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="gradient-text">9arrini Academy</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
                  )}
                >
                  {link.label}
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] ml-0.5" />}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            {user ? (
              <>
                {/* Notification bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hidden md:flex"
                  onClick={() => router.push("/dashboard/notifications")}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="gradient-bg text-white text-xs font-bold">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium max-w-[90px] truncate">
                        {user.name.split(" ")[0]}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50 hidden md:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                        <Badge variant="purple" className="w-fit text-[10px] mt-1 capitalize">{user.role}</Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(getDashboardLink())}>
                      <GraduationCap className="h-4 w-4 mr-2" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <Avatar className="h-4 w-4 mr-2">
                        <AvatarFallback className="gradient-bg text-white text-[8px]">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => logout()}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>Sign in</Button>
                <Button size="sm" variant="gradient" onClick={() => router.push("/register")}>Get Started</Button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                      : "hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-[hsl(var(--border))] mt-2 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="gradient-bg text-white text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <Badge variant="purple" className="text-[10px] capitalize">{user.role}</Badge>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => router.push(getDashboardLink())}>
                    <GraduationCap className="h-4 w-4 mr-2" /> Dashboard
                  </Button>
                  <Button className="w-full" variant="destructive" onClick={() => logout()}>Sign out</Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => router.push("/login")}>Sign in</Button>
                  <Button className="flex-1" variant="gradient" onClick={() => router.push("/register")}>Get Started</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
