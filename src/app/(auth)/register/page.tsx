"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, User, GraduationCap, BookOpen, Check, MapPin, Layers, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SocialButtons } from "@/components/auth/social-buttons";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";
import { STAGES, SECTIONS, GOVERNORATES, sectionApplies } from "@/lib/tunisia-education";
import { useI18n } from "@/lib/i18n/context";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "teacher" | "parent";
  stage?: string;
  year?: string;
  section?: string;
  governorate?: string;
};

const ROLES = [
  { value: "student" as const, icon: GraduationCap },
  { value: "teacher" as const, icon: BookOpen },
  { value: "parent" as const, icon: Users },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { dict } = useI18n();
  const t = dict.auth.register;
  const tr = dict.auth.roles;

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, t.nameMin),
          email: z.string().email(t.emailInvalid),
          password: z.string().min(6, t.passwordMin),
          confirmPassword: z.string(),
          role: z.enum(["student", "teacher", "parent"]),
          stage: z.string().optional(),
          year: z.string().optional(),
          section: z.string().optional(),
          governorate: z.string().optional(),
        })
        .superRefine((d, ctx) => {
          if (d.password !== d.confirmPassword) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: t.passwordsNoMatch });
          }
          if (d.role === "student") {
            if (!d.stage) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stage"], message: t.chooseLevel });
            if (!d.year) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["year"], message: t.chooseYear });
            if (!d.governorate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["governorate"], message: t.chooseGovernorate });
            if (d.stage && d.year && sectionApplies(d.stage, d.year) && !d.section) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["section"], message: t.chooseBranch });
            }
          }
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student", stage: "", year: "", section: "", governorate: "", confirmPassword: "" },
  });

  const selectedRole = watch("role");
  const stage = watch("stage");
  const year = watch("year");
  const section = watch("section");
  const governorate = watch("governorate");
  const stageData = STAGES.find((s) => s.key === stage);
  const showSection = !!stage && !!year && sectionApplies(stage, year);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
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
      toast.success(t.createdToast);

      const role = json.data.user.role;
      if (role === "teacher") router.push("/teacher");
      else if (role === "parent") router.push("/parent");
      else router.push("/profile");
    } catch {
      toast.error(t.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl border border-[hsl(var(--border))] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">{t.title}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>{t.iAmA}</Label>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue("role", value)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all",
                    selectedRole === value
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50"
                  )}
                >
                  {selectedRole === value && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-bg flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <Icon className="h-6 w-6 mb-2 text-[hsl(var(--primary))]" />
                  <div className="font-semibold text-sm">{tr[value]}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{tr[`${value}Desc` as keyof typeof tr]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">{t.fullName}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                id="name"
                placeholder={t.fullNamePlaceholder}
                className="pl-10"
                {...register("name")}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

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
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t.password}</Label>
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
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder={t.confirmPasswordPlaceholder}
                className="pl-10"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          {/* Student schooling details */}
          {selectedRole === "student" && (
            <div className="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]/50 p-4">
              <p className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[hsl(var(--primary))]" /> {t.schooling}
              </p>

              {/* Niveau */}
              <div className="space-y-1.5">
                <Label>{t.niveau}</Label>
                <Select
                  value={stage || ""}
                  onValueChange={(v) => {
                    setValue("stage", v);
                    setValue("year", "");
                    setValue("section", "");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder={t.niveauPlaceholder} /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.stage && <p className="text-xs text-red-500">{errors.stage.message}</p>}
              </div>

              {/* Année scolaire */}
              {stageData && (
                <div className="space-y-1.5">
                  <Label>{t.year}</Label>
                  <Select
                    value={year || ""}
                    onValueChange={(v) => {
                      setValue("year", v);
                      setValue("section", "");
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder={t.yearPlaceholder} /></SelectTrigger>
                    <SelectContent>
                      {stageData.years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.year && <p className="text-xs text-red-500">{errors.year.message}</p>}
                </div>
              )}

              {/* Branche / Option (secondaire 2ème-3ème ou Bac) */}
              {showSection && (
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> {stage === "bac" ? t.option : t.branch}
                  </Label>
                  <Select value={section || ""} onValueChange={(v) => setValue("section", v)}>
                    <SelectTrigger><SelectValue placeholder={t.sectionPlaceholder} /></SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.section && <p className="text-xs text-red-500">{errors.section.message}</p>}
                </div>
              )}

              {/* Gouvernorat */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {t.governorate}</Label>
                <Select value={governorate || ""} onValueChange={(v) => setValue("governorate", v)}>
                  <SelectTrigger><SelectValue placeholder={t.governoratePlaceholder} /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {GOVERNORATES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.governorate && <p className="text-xs text-red-500">{errors.governorate.message}</p>}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" variant="gradient" loading={loading}>
            {loading ? t.submitting : t.submit}
          </Button>

          <SocialButtons from="/profile" />

          <p className="text-xs text-center text-[hsl(var(--muted-foreground))]">
            {t.termsPre}{" "}
            <Link href="/terms" className="text-[hsl(var(--primary))] hover:underline">{t.terms}</Link>
            {" "}{t.and}{" "}
            <Link href="/privacy" className="text-[hsl(var(--primary))] hover:underline">{t.privacy}</Link>
          </p>
        </form>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
          {t.haveAccount}{" "}
          <Link href="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">
            {t.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
