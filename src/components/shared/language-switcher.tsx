"use client";

import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, LOCALE_META } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/context";

export function LanguageSwitcher() {
  const { locale, dict, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={dict.nav.language}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{dict.nav.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((code) => {
          const meta = LOCALE_META[code];
          const active = code === locale;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setLocale(code)}
              className="flex items-center gap-2"
            >
              <span className="text-base">{meta.flag}</span>
              <span className="flex-1">{meta.label}</span>
              {active && <Check className="h-4 w-4 text-[hsl(var(--primary))]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
