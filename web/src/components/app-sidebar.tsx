"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, RotateCcw } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { TENANT } from "@/lib/mock/data";
import { navigation, navItemForPath } from "@/lib/navigation";
import { usePrototype } from "@/lib/store";

export function AppSidebar() {
  const pathname = usePathname();
  const { reset } = usePrototype();
  const { isMobile, setOpenMobile } = useSidebar();
  const current = navItemForPath(pathname);

  const close = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3">
        <Link
          href="/uebersicht"
          onClick={close}
          className="flex items-center gap-2.5 rounded-md px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            GB
          </span>
          <span className="grid group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              GastroBeleg
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {TENANT.name}
            </span>
          </span>
        </Link>
        <Button
          asChild
          size="lg"
          className="w-full justify-start bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/85 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <Link href="/scan" onClick={close}>
            <Camera />
            <span className="group-data-[collapsible=icon]:hidden">
              Beleg erfassen
            </span>
          </Link>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={current?.href === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href} onClick={close}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 p-3">
        <div className="rounded-md bg-sidebar-accent/60 p-3 text-xs text-sidebar-foreground/80 group-data-[collapsible=icon]:hidden">
          <p className="font-medium text-sidebar-foreground">
            {TENANT.plan} — {TENANT.documentsUsed} von {TENANT.documentsIncluded} Belegen
          </p>
          <p className="mt-1 truncate">{TENANT.inboxAddress}</p>
        </div>
        <ThemeToggle className="justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" />
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <RotateCcw />
          <span className="group-data-[collapsible=icon]:hidden">
            Prototyp zurücksetzen
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
