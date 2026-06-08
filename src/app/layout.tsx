import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "9arrini Academy — Apprenez en petit groupe avec un prof et l'IA",
    template: "%s | 9arrini Academy",
  },
  description:
    "La plateforme tunisienne qui réunit profs experts et IA pour des cours particuliers en groupe via réunions en ligne. Du primaire au Bac.",
  keywords: [
    "9arrini", "cours particuliers Tunisie", "soutien scolaire", "Bac Tunisie",
    "cours en ligne", "IA éducation", "cours en groupe", "prof particulier",
  ],
  authors: [{ name: "9arrini Academy" }],
  openGraph: {
    type: "website",
    locale: "fr_TN",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "9arrini Academy — Apprenez en petit groupe avec un prof et l'IA",
    description:
      "Cours particuliers en groupe, assistant IA Aria, et contenu pédagogique adapté au programme tunisien.",
    siteName: "9arrini Academy",
  },
  twitter: {
    card: "summary_large_image",
    title: "9arrini Academy — Apprenez en petit groupe avec un prof et l'IA",
    description:
      "Cours particuliers en groupe, assistant IA, et contenu pédagogique adapté au programme tunisien.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
