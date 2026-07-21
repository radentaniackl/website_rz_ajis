import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { PAGE_REGISTRY, type PageMeta } from "./page-registry";

export interface OpenTab {
  path: string;
  label: string;
  icon: PageMeta["icon"];
}

interface TabsCtx {
  tabs: OpenTab[];
  active: string;
  openTab: (path: string) => void;
  closeTab: (path: string) => void;
  closeOthers: (path: string) => void;
  closeAll: () => void;
}

const Ctx = createContext<TabsCtx | null>(null);

const HOME = "/dashboard";

export function TabsProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<OpenTab[]>(() => {
    const home = PAGE_REGISTRY[HOME];
    return home ? [{ path: HOME, label: home.label, icon: home.icon }] : [];
  });
  const [active, setActive] = useState<string>(HOME);

  // Sync route → open tab (max 1 per path)
  useEffect(() => {
    const meta = PAGE_REGISTRY[pathname];
    if (!meta) return;
    setTabs((cur) =>
      cur.some((t) => t.path === pathname)
        ? cur
        : [...cur, { path: pathname, label: meta.label, icon: meta.icon }],
    );
    setActive(pathname);
  }, [pathname]);

  const openTab = useCallback(
    (path: string) => {
      const meta = PAGE_REGISTRY[path];
      if (!meta) return;
      setTabs((cur) =>
        cur.some((t) => t.path === path)
          ? cur
          : [...cur, { path, label: meta.label, icon: meta.icon }],
      );
      setActive(path);
      navigate({ to: path });
    },
    [navigate],
  );

  const closeTab = useCallback(
    (path: string) => {
      if (path === HOME) return; // keep Dashboard pinned
      setTabs((cur) => {
        const idx = cur.findIndex((t) => t.path === path);
        if (idx === -1) return cur;
        const next = cur.filter((t) => t.path !== path);
        if (active === path) {
          const fallback = next[idx - 1] ?? next[0] ?? { path: HOME };
          setActive(fallback.path);
          navigate({ to: fallback.path });
        }
        return next;
      });
    },
    [active, navigate],
  );

  const closeOthers = useCallback(
    (path: string) => {
      setTabs((cur) => cur.filter((t) => t.path === path || t.path === HOME));
      setActive(path);
      navigate({ to: path });
    },
    [navigate],
  );

  const closeAll = useCallback(() => {
    const home = PAGE_REGISTRY[HOME];
    setTabs(home ? [{ path: HOME, label: home.label, icon: home.icon }] : []);
    setActive(HOME);
    navigate({ to: HOME });
  }, [navigate]);

  const value = useMemo(
    () => ({ tabs, active, openTab, closeTab, closeOthers, closeAll }),
    [tabs, active, openTab, closeTab, closeOthers, closeAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTabs must be used inside TabsProvider");
  return ctx;
}