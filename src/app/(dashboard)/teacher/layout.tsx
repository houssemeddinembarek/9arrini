"use client";

import Link from "next/link";
import { Clock, ShieldCheck, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  // The parent dashboard layout resolves the session before rendering children,
  // so a teacher here whose account is not yet approved is gated out and sent
  // to their profile to complete verification (photo + proof documents).
  if (user?.role === "teacher" && user.isApproved === false) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="max-w-md w-full rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Complete your verification</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">
            To unlock your dashboard, complete your profile: add a photo and upload
            documents proving you are a teacher, then submit for review. An administrator
            will approve your account or let you know what&apos;s missing.
          </p>
          <Link href="/profile">
            <Button variant="gradient">
              <UserCog className="h-4 w-4" /> Go to my profile
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mt-5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verification keeps the platform safe for everyone.
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
