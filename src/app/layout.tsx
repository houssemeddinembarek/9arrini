import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getDir } from "@/lib/i18n/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Telmidhi — Apprenez en petit groupe avec un prof et l'IA",
    template: "%s | Telmidhi",
  },
  description:
    "La plateforme tunisienne qui réunit profs experts et IA pour des cours particuliers en groupe via réunions en ligne. Du primaire au Bac.",
  keywords: [
    "Telmidhi", "cours particuliers Tunisie", "soutien scolaire", "Bac Tunisie",
    "cours en ligne", "IA éducation", "cours en groupe", "prof particulier",
  ],
  authors: [{ name: "Telmidhi" }],
  openGraph: {
    type: "website",
    locale: "fr_TN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Telmidhi — Apprenez en petit groupe avec un prof et l'IA",
    description:
      "Cours particuliers en groupe, assistant IA Aria, et contenu pédagogique adapté au programme tunisien.",
    siteName: "Telmidhi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Telmidhi — Apprenez en petit groupe avec un prof et l'IA",
    description:
      "Cours particuliers en groupe, assistant IA, et contenu pédagogique adapté au programme tunisien.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={getDir(locale)}
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased">
        <Providers locale={locale} dict={dict}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
