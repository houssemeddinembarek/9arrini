import Link from "next/link";
import { BookOpen, AtSign, Code2, Link2, Play, Mail } from "lucide-react";

const FOOTER_LINKS = {
  Plateforme: [
    { label: "Trouver un prof", href: "/tutoring" },
    { label: "Assistant IA", href: "/ai-assistant" },
    { label: "Devenir prof", href: "/register?role=teacher" },
    { label: "Tarifs", href: "/#pricing" },
  ],
  Société: [
    { label: "À propos", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Carrières", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Ressources: [
    { label: "Centre d'aide", href: "/help" },
    { label: "Communauté", href: "/community" },
    { label: "Devenir professeur", href: "/teach" },
    { label: "Programme officiel", href: "/curriculum" },
  ],
  Légal: [
    { label: "Confidentialité", href: "/privacy" },
    { label: "Conditions d'utilisation", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
    { label: "RGPD", href: "/gdpr" },
  ],
};

const SOCIAL_LINKS = [
  { icon: AtSign, href: "#", label: "Twitter" },
  { icon: Code2, href: "#", label: "GitHub" },
  { icon: Link2, href: "#", label: "LinkedIn" },
  { icon: Play, href: "#", label: "YouTube" },
  { icon: Mail, href: "mailto:contact@9arrini.tn", label: "Email" },
];

export function Footer() {
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
              <span className="gradient-text">9arrini Academy</span>
            </Link>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
              La plateforme tunisienne qui réunit profs et IA pour des cours particuliers en petits groupes.
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
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {label}
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
            © {new Date().getFullYear()} 9arrini Academy. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))]">
            Fait avec
            <span className="text-red-500 mx-1">♥</span>
            en Tunisie 🇹🇳
          </div>
        </div>
      </div>
    </footer>
  );
}
