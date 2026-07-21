import { X, Home as HomeIcon, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTabs } from "@/lib/tabs";
import { PAGE_REGISTRY } from "@/lib/page-registry";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function TabsBar() {
  const { tabs, active, openTab, closeTab, closeOthers, closeAll } = useTabs();

  return (
    <div className="sticky top-16 z-10 flex items-end gap-0.5 border-b border-border bg-muted/60 px-2 pt-2 backdrop-blur">
      <div className="flex flex-1 items-end gap-0.5 overflow-x-auto pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.path === active;
          const isHome = tab.path === "/dashboard";
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => openTab(tab.path)}
              className={cn(
                // folder-style: rounded top, sits on a "shelf", raised when active
                "group relative flex shrink-0 items-center gap-2 rounded-t-lg border border-b-0 px-3.5 py-2 text-[13px] font-semibold transition-all",
                isActive
                  ? "-mb-px border-border bg-card text-primary shadow-[0_-2px_0_0_var(--color-primary)_inset]"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:bg-card/80 hover:text-foreground",
              )}
            >
              {isHome ? <HomeIcon className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
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
          <DropdownMenuItem onClick={() => closeOthers(active)} disabled={tabs.length <= 1}>
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

/**
 * Keep-alive host: every opened tab stays mounted so form/table state
 * survives switching between folders.
 */
export function TabsHost() {
  const { tabs, active } = useTabs();
  return (
    <div className="relative">
      {tabs.map((tab) => {
        const meta = PAGE_REGISTRY[tab.path];
        if (!meta) return null;
        const Comp = meta.Component;
        const isActive = tab.path === active;
        return (
          <div key={tab.path} hidden={!isActive} aria-hidden={!isActive}>
            <Comp />
          </div>
        );
      })}
    </div>
  );
}