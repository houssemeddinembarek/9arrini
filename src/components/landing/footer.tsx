"use client";

import Link from "next/link";
import { AtSign, Code2, Link2, Play, Mail } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useI18n } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type ColumnKey = keyof Dictionary["footer"]["columns"];
type LinkKey = keyof Dictionary["footer"]["links"];

// Footer columns reference dictionary keys; labels resolve at render time.
const FOOTER_COLUMNS: { column: ColumnKey; links: { key: LinkKey; href: string }[] }[] = [
  {
    column: "platform",
    links: [
      { key: "findTeacher", href: "/tutoring" },
      { key: "aiAssistant", href: "/ai-assistant" },
      { key: "becomeTeacher", href: "/register?role=teacher" },
      { key: "pricing", href: "/#pricing" },
    ],
  },
  {
    column: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "blog", href: "/blog" },
      { key: "careers", href: "/careers" },
      { key: "contact", href: "/contact" },
    ],
  },
  {
    column: "resources",
    links: [
      { key: "help", href: "/help" },
      { key: "community", href: "/community" },
      { key: "teach", href: "/teach" },
      { key: "curriculum", href: "/curriculum" },
    ],
  },
  {
    column: "legal",
    links: [
      { key: "privacy", href: "/privacy" },
      { key: "terms", href: "/terms" },
      { key: "cookies", href: "/cookies" },
      { key: "gdpr", href: "/gdpr" },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: AtSign, href: "#", label: "Twitter" },
  { icon: Code2, href: "#", label: "GitHub" },
  { icon: Link2, href: "#", label: "LinkedIn" },
  { icon: Play, href: "#", label: "YouTube" },
  { icon: Mail, href: "mailto:contact@telmidhi.tn", label: "Email" },
];

export function Footer() {
  const { dict } = useI18n();
  const t = dict.footer;

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2 lg:pe-10">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t.tagline}
            </p>
            <div className="mt-6 flex gap-2">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {FOOTER_COLUMNS.map(({ column, links }) => (
            <nav key={column} aria-label={t.columns[column]}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t.columns[column]}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map(({ key, href }) => (
                  <li key={key}>
                    <Link
                      href={href}
                      className="text-sm text-foreground/75 transition-colors hover:text-primary"
                    >
                      {t.links[key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Telmidhi. {t.rights}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {t.madeWith}
            <span className="mx-0.5 text-[hsl(var(--destructive))]">♥</span>
            {t.inTunisia}
          </p>
        </div>
      </div>
    </footer>
  );
}
