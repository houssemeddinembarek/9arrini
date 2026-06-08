"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export function useAuth(options?: { required?: boolean; redirectTo?: string }) {
  const { user, setUser, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) return;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json();
        if (json.success) {
          setUser(json.data.user);
        } else if (options?.required) {
          router.push(options.redirectTo || "/login");
        }
      } catch {
        if (options?.required) {
          router.push(options.redirectTo || "/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user };
}
