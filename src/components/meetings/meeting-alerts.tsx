"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";

interface UpcomingMeeting {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  reminder?: { enabled: boolean; minutesBefore: number };
}

// Combine a meeting's calendar date with its "HH:MM" start time into a local Date.
function meetingStart(date: string, startTime: string): Date {
  const d = new Date(date);
  const [h, m] = startTime.split(":").map(Number);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

const POLL_MS = 60_000;
const GRACE_MS = 30 * 60_000; // keep alerting up to 30 min after start

/**
 * Background watcher (renders nothing): polls the user's upcoming meetings and
 * raises a one-time toast with a Join action as each one is about to start.
 */
export function MeetingAlerts() {
  const router = useRouter();
  const { user } = useAuthStore();
  const alerted = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    let active = true;

    const check = async () => {
      try {
        const res = await fetch("/api/meetings?upcoming=true");
        const json = await res.json();
        if (!active || !json.success) return;

        const now = Date.now();
        for (const meeting of json.data.meetings as UpcomingMeeting[]) {
          if (alerted.current.has(meeting._id)) continue;

          const start = meetingStart(meeting.date, meeting.startTime).getTime();
          const lead = meeting.reminder?.enabled ? (meeting.reminder.minutesBefore || 0) * 60_000 : 0;

          // Inside the reminder window (or just started) but not long over.
          if (now >= start - lead && now <= start + GRACE_MS) {
            alerted.current.add(meeting._id);
            const mins = Math.round((start - now) / 60_000);
            toast(meeting.title, {
              description: mins > 0 ? `Starting in ${mins} min` : "Starting now",
              duration: 15_000,
              action: {
                label: "Join",
                onClick: () => router.push(`/meetings/${meeting._id}`),
              },
            });
          }
        }
      } catch {
        // best-effort; ignore transient failures
      }
    };

    check();
    const interval = setInterval(check, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, router]);

  return null;
}
