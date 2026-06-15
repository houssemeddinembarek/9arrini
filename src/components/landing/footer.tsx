"use client";

import Link from "next/link";
import { BookOpen, AtSign, Code2, Link2, Play, Mail } from "lucide-react";
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
    <footer className="bg-[hsl(var(--muted))]/30 border-t border-[hsl(var(--border))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="gradient-text">Telmidhi</span>
            </Link>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
              {t.tagline}
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]/50 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {FOOTER_COLUMNS.map(({ column, links }) => (
            <div key={column}>
              <h4 className="font-semibold text-sm mb-4">{t.columns[column]}</h4>
              <ul className="space-y-3">
                {links.map(({ key, href }) => (
                  <li key={key}>
                    <Link
                      href={href}
                      className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {t.links[key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[hsl(var(--border))] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            © {new Date().getFullYear()} Telmidhi. {t.rights}
          </p>
          <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
            {t.madeWith}
            <span className="text-red-500 mx-1">♥</span>
            {t.inTunisia}
          </div>
        </div>
      </div>
    </footer>
  );
}
