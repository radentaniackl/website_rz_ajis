"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Home as HomeIcon, ChevronLeft, ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useTabs } from "@/hooks/use-tabs";
import { useRouter } from "next/navigation";

export function TabsBar() {
  const { tabs, activePath, setActivePath, closeTab } = useTabs();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  const scrollBy = (direction: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    updateScrollButtons();

    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    const observer = new ResizeObserver(updateScrollButtons);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      observer.disconnect();
    };
  }, [tabs, updateScrollButtons]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const activeTab = el.querySelector<HTMLElement>(
      `[data-tab-path="${CSS.escape(activePath)}"]`,
    );
    activeTab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activePath, tabs]);

  return (
    <div className="sticky top-16 z-10 w-full min-w-0 shrink-0 border-b border-border bg-muted/60 backdrop-blur">
      <div className="relative h-10 w-full min-w-0">
        {canScrollLeft && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 items-center bg-gradient-to-r from-muted/95 via-muted/80 to-transparent pl-0.5">
            <button
              type="button"
              aria-label="Scroll tab ke kiri"
              onClick={() => scrollBy("left")}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex h-full w-full min-w-0 items-end gap-0.5 overflow-x-auto overflow-y-hidden px-2 pt-2 scrollbar-none"
          onWheel={(e) => {
            if (e.deltaY === 0) return;
            e.currentTarget.scrollLeft += e.deltaY;
            e.preventDefault();
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.path === activePath;
            const isHome = tab.path === "/dashboard";

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Icon = isHome ? HomeIcon : (Icons as any)[tab.iconName] || Icons.Circle;

            return (
              <button
                key={tab.path}
                data-tab-path={tab.path}
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
                <Icon className="h-3.5 w-3.5 shrink-0" />
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
                      "ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-destructive/15 hover:text-destructive",
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

        {canScrollRight && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-9 items-center justify-end bg-gradient-to-l from-muted/95 via-muted/80 to-transparent pr-0.5">
            <button
              type="button"
              aria-label="Scroll tab ke kanan"
              onClick={() => scrollBy("right")}
              className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
