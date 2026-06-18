import Link from "next/link";
import { BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center shadow">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="gradient-text">Telmidhi</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Background */}
      <div className="fixed inset-0 mesh-gradient -z-10" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />

      <main className="flex flex-1 items-center justify-center px-4 pt-16 pb-8">
        {children}
      </main>
    </div>
  );
}
