"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialButtons } from "@/components/auth/social-buttons";
import { useAuthStore } from "@/stores/useAuthStore";
import { useI18n } from "@/lib/i18n/context";
import { isAdmin } from "@/lib/roles";

type LoginForm = { email: string; password: string };

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const { dict } = useI18n();
  const t = dict.auth.login;
  const tr = dict.auth.roles;
  const from = searchParams.get("from") || "/profile";

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t.emailInvalid),
        password: z.string().min(1, t.passwordRequired),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || t.failed);
        return;
      }

      setUser(json.data.user);
      toast.success(t.welcomeToast);

      const role = json.data.user.role;
      if (isAdmin(role)) router.push("/admin");
      else if (role === "teacher") router.push("/teacher");
      else if (role === "parent") router.push("/parent");
      else router.push(from === "/dashboard" ? "/profile" : from);
    } catch {
      toast.error(t.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl border border-[hsl(var(--border))] p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{t.title}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">{t.subtitle}</p>
        </div>

       

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t.email}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                id="email"
                type="email"
                placeholder={t.emailPlaceholder}
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">{t.password}</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-[hsl(var(--primary))] hover:underline"
              >
                {t.forgot}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t.passwordPlaceholder}
                className="pl-10 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" variant="gradient" loading={loading}>
            {loading ? t.submitting : t.submit}
          </Button>
        </form>

        <div className="mt-6">
          <SocialButtons from={from} />
        </div>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
          {t.noAccount}{" "}
          <Link href="/register" className="text-[hsl(var(--primary))] font-medium hover:underline">
            {t.createFree}
          </Link>
        </p>
      </div>
    </div>
  );
}
