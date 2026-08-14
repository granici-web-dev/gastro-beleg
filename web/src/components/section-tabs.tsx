"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { tabsForPath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Sits under the topbar and carries everything the sidebar no longer lists. */
export function SectionTabs() {
  const pathname = usePathname();
  const tabs = tabsForPath(pathname);

  if (!tabs) return null;

  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto px-4 md:px-8">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "border-primary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
