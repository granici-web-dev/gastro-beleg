"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Camera,
  FileText,
  LayoutDashboard,
  Menu,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SectionTabs } from "@/components/section-tabs";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { navItemForPath } from "@/lib/navigation";
import { TENANT } from "@/lib/mock/data";
import { useScrolledPast } from "@/lib/use-scrolled";

const mobileTabs = [
  { href: "/uebersicht", label: "Übersicht", icon: LayoutDashboard },
  { href: "/belege", label: "Belege", icon: FileText },
  { href: "/abgleich", label: "Abgleich", icon: ArrowLeftRight },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrolled = useScrolledPast(24);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          {/*
           * Topbar and tabs share one sticky surface: two stacked sticky
           * elements produced two hairlines and had no way to lift together
           * once the content slid underneath them.
           */}
          <div
            data-scrolled={scrolled || undefined}
            className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur transition-shadow duration-[var(--duration-moderate-01)] ease-[var(--ease-standard)] data-scrolled:shadow-e2"
          >
            <TopBar scrolled={scrolled} />
            <SectionTabs />
          </div>
          <div
            key={pathname}
            className="page-enter min-w-0 flex-1 px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12"
          >
            {children}
          </div>
          <MobileTabBar />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function TopBar({ scrolled }: { scrolled: boolean }) {
  const pathname = usePathname();
  const current = navItemForPath(pathname);
  const onScanPage = pathname.startsWith("/scan");

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-3 px-4 md:px-8">
      <SidebarTrigger className="hidden md:flex" />
      {/*
       * On a phone the sidebar is a drawer, so nothing else names the business.
       * It sits where the page title will land once you scroll, and hands the
       * row over at the same moment.
       */}
      <div
        className={cn(
          "absolute inset-y-0 left-4 flex flex-col justify-center transition-opacity duration-[var(--duration-moderate-01)] ease-[var(--ease-standard)] md:hidden",
          scrolled ? "opacity-0" : "opacity-100",
        )}
      >
        <p className="truncate text-sm font-medium">{TENANT.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {TENANT.location}
        </p>
      </div>
      {/*
       * The page owns its heading. The topbar repeats it only once the heading
       * has scrolled out of sight — otherwise every index page said its own
       * name three times over 150px (topbar, tab, H1).
       */}
      <div
        aria-hidden={!scrolled}
        className={cn(
          "min-w-0 flex-1 transition-[opacity,transform] duration-[var(--duration-moderate-01)] ease-[var(--ease-standard)]",
          scrolled
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-1 opacity-0",
        )}
      >
        <p className="truncate text-sm font-medium">
          {current?.label ?? "GastroBeleg"}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {current?.description ?? "Prototyp"}
        </p>
      </div>
      {onScanPage ? null : (
        <Button asChild size="sm" className="ml-auto hidden md:inline-flex">
          <Link href="/scan">
            <Camera />
            Beleg erfassen
          </Link>
        </Button>
      )}
    </header>
  );
}

function MobileTabBar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <nav className="bg-sidebar text-sidebar-foreground fixed inset-x-0 bottom-0 z-40 flex h-20 items-start justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom)] md:hidden">
      {mobileTabs.slice(0, 2).map((tab) => (
        <MobileTab key={tab.href} tab={tab} pathname={pathname} />
      ))}

      <Link
        href="/scan"
        aria-label="Beleg erfassen"
        className="bg-sidebar-primary text-sidebar-primary-foreground -mt-6 flex size-14 shrink-0 items-center justify-center rounded-full shadow-lg ring-4 ring-sidebar"
      >
        <Camera className="size-6" />
      </Link>

      {mobileTabs.slice(2).map((tab) => (
        <MobileTab key={tab.href} tab={tab} pathname={pathname} />
      ))}

      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className="text-sidebar-foreground/60 flex h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-md text-[11px]"
      >
        <Menu className="size-5" />
        Mehr
      </button>
    </nav>
  );
}

function MobileTab({
  tab,
  pathname,
}: {
  tab: (typeof mobileTabs)[number];
  pathname: string;
}) {
  const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  return (
    <Link
      href={tab.href}
      className={cn(
        "flex h-12 min-w-14 flex-col items-center justify-center gap-1 rounded-md text-[11px]",
        isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60",
      )}
    >
      <tab.icon className="size-5" />
      {tab.label}
    </Link>
  );
}
