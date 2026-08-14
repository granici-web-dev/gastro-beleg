"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsHydrated } from "@/lib/use-hydrated";

/**
 * Light and dark only — "system" stays the default until someone chooses, but a
 * three-way control for one preference is more machinery than the choice needs.
 *
 * Renders the light-mode face until hydration: the resolved theme is unknown on
 * the server, and guessing an icon means it visibly flips a moment later.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useIsHydrated();
  const isDark = hydrated && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      aria-label={isDark ? "Helles Design" : "Dunkles Design"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
      <span className="group-data-[collapsible=icon]:hidden">
        {isDark ? "Helles Design" : "Dunkles Design"}
      </span>
    </Button>
  );
}
