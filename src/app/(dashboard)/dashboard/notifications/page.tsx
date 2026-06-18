"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { cn, formatRelativeTime } from "@/lib/utils";

interface ServerNotification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
} as const;

const COLORS = {
  success: "text-emerald-500 bg-emerald-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  error: "text-red-500 bg-red-500/10",
  info: "text-blue-500 bg-blue-500/10",
} as const;

export default function NotificationsPage() {
  const [items, setItems] = useState<ServerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { markAllRead } = useNotificationStore();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (json.success) {
          setItems(json.data.items);
          // Mark everything read now that the user is viewing the list.
          if (json.data.unread > 0) {
            await fetch("/api/notifications", { method: "PATCH" });
            markAllRead();
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [markAllRead]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-[hsl(var(--primary))]" />
          Notifications
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">Updates about your account and activity.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-3 text-[hsl(var(--muted-foreground))]/30" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const Icon = ICONS[n.type] || Info;
            const body = (
              <div
                className={cn(
                  "rounded-2xl border bg-[hsl(var(--card))] p-4 flex items-start gap-3 transition-colors",
                  n.isRead ? "border-[hsl(var(--border))]" : "border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5"
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", COLORS[n.type])}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />}
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 whitespace-pre-wrap">{n.message}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n._id} href={n.link} className="block">{body}</Link>
            ) : (
              <div key={n._id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
