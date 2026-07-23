"use client";

import { X, Home as HomeIcon, MoreHorizontal } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useTabs } from "@/hooks/use-tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function TabsBar() {
  const { tabs, activePath, setActivePath, closeTab, closeOthers, closeAll } = useTabs();
  const router = useRouter();

  return (
    <div className="sticky top-16 z-10 flex items-end gap-0.5 border-b border-border bg-muted/60 px-2 pt-2 backdrop-blur">
      <div className="flex items-end gap-0.5 overflow-x-auto pb-0 scrollbar-none max-w-[calc(100vw-280px)]">
        {tabs.map((tab) => {
          const isActive = tab.path === activePath;
          const isHome = tab.path === "/dashboard";
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = isHome ? HomeIcon : (Icons as any)[tab.iconName] || Icons.Circle;

          return (
            <button
              key={tab.path}
              onClick={() => {
                setActivePath(tab.path);
                router.push(tab.path);
              }}
              className={cn(
                "group relative flex shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-3.5 py-2 text-[13px] font-semibold transition-all",
                isActive
                  ? "-mb-px border-border bg-card text-primary shadow-[0_-2px_0_0_var(--color-primary)_inset]"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-card/80 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="max-w-[160px] truncate">{tab.label}</span>
              {!isHome && (
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Tutup ${tab.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.path);
                  }}
                  className={cn(
                    "ml-1 flex h-4 w-4 items-center justify-center rounded hover:bg-destructive/15 hover:text-destructive",
                    isActive ? "text-muted-foreground" : "text-muted-foreground/70",
                  )}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="mb-1 h-7 w-7 shrink-0 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => closeOthers(activePath)} disabled={tabs.length <= 1}>
            Tutup tab lain
          </DropdownMenuItem>
          <DropdownMenuItem onClick={closeAll} disabled={tabs.length <= 1}>
            Tutup semua tab
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
