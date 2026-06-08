"use client";

import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { getInitials } from "@/lib/utils";

interface TopbarProps {
  title?: string;
  onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  return (
    <header className="h-16 border-b border-[hsl(var(--border))] flex items-center gap-4 px-4 sm:px-6 bg-[hsl(var(--background))]/95 backdrop-blur-sm sticky top-0 z-40">
      {/* Mobile menu */}
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title */}
      {title && (
        <h1 className="text-lg font-semibold hidden md:block">{title}</h1>
      )}

      {/* Search */}
      <div className="flex-1 max-w-md ml-auto md:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input placeholder="Search courses, lessons..." className="pl-9 h-9 bg-[hsl(var(--muted))]/50" />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={user?.avatar} />
          <AvatarFallback className="gradient-bg text-white text-xs font-bold">
            {user ? getInitials(user.name) : "U"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
