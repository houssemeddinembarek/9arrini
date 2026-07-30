"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, type AuthProvider } from "firebase/auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { auth, googleProvider, facebookProvider } from "@/lib/firebase";
import { useI18n } from "@/lib/i18n/context";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

export function SocialButtons({ from = "/profile" }: { from?: string }) {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { dict } = useI18n();
  const t = dict.auth.social;
  const [pending, setPending] = useState<"google" | "facebook" | null>(null);

  const signIn = async (which: "google" | "facebook", provider: AuthProvider) => {
    setPending(which);
    try {
      const cred = await signInWithPopup(auth, provider);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/auth/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || t.failed);
        return;
      }

      setUser(json.data.user);
      toast.success(t.welcomeToast);
      const role = json.data.user.role;
      if (role === "admin") router.push("/admin");
      else if (role === "teacher") router.push("/teacher");
      else if (role === "parent") router.push("/parent");
      else router.push(from === "/dashboard" ? "/profile" : from);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      toast.error(t.failedRetry);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[hsl(var(--border))]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[hsl(var(--background))] px-2 text-[hsl(var(--muted-foreground))]">
            {t.orContinue}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn("google", googleProvider)}
          loading={pending === "google"}
          disabled={pending !== null}
        >
          {pending !== "google" && <GoogleIcon />} Google
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn("facebook", facebookProvider)}
          loading={pending === "facebook"}
          disabled={pending !== null}
        >
          {pending !== "facebook" && <FacebookIcon />} Facebook
        </Button>
      </div>
    </div>
  );
}
