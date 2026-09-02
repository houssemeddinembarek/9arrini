"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, BookOpen, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { RegisterRole } from "@/components/auth/register-form";

const ROLES: { role: RegisterRole; icon: React.ElementType; href: string }[] = [
  { role: "student", icon: GraduationCap, href: "/register/student" },
  { role: "teacher", icon: BookOpen, href: "/register/teacher" },
  { role: "parent", icon: Users, href: "/register/parent" },
];

/**
 * First step of sign-up: pick who you are. Each card routes to that actor's own
 * form, which is where the role-specific fields live (schooling for students,
 * the child code for parents, the verification notice for teachers).
 */
export function RoleChooser() {
  const { dict } = useI18n();
  const t = dict.auth.register;
  const roles = dict.auth.roles;

  return (
    <div className="w-full max-w-3xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.subtitle}</p>
      </div>

      <p className="mt-10 text-center text-xs font-semibold uppercase tracking-[0.09em] text-muted-foreground">
        {t.iAmA}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {ROLES.map(({ role, icon: Icon, href }) => (
          <Link
            key={role}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-start shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-md)] focus-visible:border-primary sm:flex-col sm:items-start sm:gap-0 sm:p-7"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:h-14 sm:w-14">
              <Icon className="h-6 w-6" />
            </span>

            <span className="min-w-0 flex-1 sm:mt-5">
              <span className="block text-lg font-semibold">{roles[role]}</span>
              <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                {roles[`${role}Desc`]}
              </span>
            </span>

            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5 sm:mt-6 sm:h-4 sm:w-4" />
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t.signIn}
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t.termsPre}{" "}
        <Link href="/terms" className="text-primary hover:underline">{t.terms}</Link>{" "}
        {t.and}{" "}
        <Link href="/privacy" className="text-primary hover:underline">{t.privacy}</Link>
      </p>
    </div>
  );
}
