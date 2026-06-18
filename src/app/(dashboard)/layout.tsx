"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { MeetingAlerts } from "@/components/meetings/meeting-alerts";
import { useAuthStore } from "@/stores/useAuthStore";
import { useI18n } from "@/lib/i18n/context";
import { getDir } from "@/lib/i18n/config";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, setUser, isLoading, setLoading } = useAuthStore();
  const { locale } = useI18n();
  const dir = getDir(locale);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Only block the UI with a spinner when we have no cached user yet.
      // Otherwise revalidate in the background so fields like isApproved stay fresh.
      if (!user) setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success) {
          setUser(json.data.user);
        } else {
          router.push("/login");
        }
      } catch {
        if (!user) router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-bg animate-pulse" />
          <div className="h-2 w-32 bg-[hsl(var(--muted))] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const role = user?.role || "student";

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Shared site navbar (fixed top-0, h-16) */}
      <Navbar />

      {/* Background watcher: raises join alerts for upcoming meetings */}
      <MeetingAlerts />

      {/* Sidebar + content sit below the navbar.
          Force LTR on this row so the sidebar keeps the same position in every
          language; the page content restores its own direction below. */}
      <div dir="ltr" className="flex flex-1 pt-16 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex h-full shrink-0">
          <Sidebar role={role} />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden pt-16">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative h-full">
              <Sidebar role={role} />
            </div>
          </div>
        )}

        {/* Main column */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile-only thin bar with sidebar trigger */}
          <div className="md:hidden flex items-center gap-2 px-3 py-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur-sm">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Menu</span>
          </div>
          <main dir={dir} className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
