import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between px-4 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      {/* Same restrained backdrop as the landing hero: one brand wash, one
          faint dot grid. */}
      <div className="fixed inset-0 -z-10 mesh-gradient" aria-hidden />
      <div className="bg-dotted bg-fade-b fixed inset-0 -z-10 opacity-60" aria-hidden />

      <main className="flex flex-1 items-center justify-center px-4 pb-12 pt-24">
        {children}
      </main>
    </div>
  );
}
