import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TabItem {
  path: string;
  label: string;
  iconName: string;
}

interface TabsState {
  tabs: TabItem[];
  activePath: string;
  addTab: (tab: TabItem) => void;
  setActivePath: (path: string) => void;
  closeTab: (path: string) => void;
  closeOthers: (path: string) => void;
  closeAll: () => void;
}

const DASHBOARD_TAB: TabItem = {
  path: "/dashboard",
  label: "Dashboard",
  iconName: "Home",
};

export const useTabs = create<TabsState>()(
  persist(
    (set) => ({
      tabs: [DASHBOARD_TAB],
      activePath: "/dashboard",

      addTab: (tab) =>
        set((state) => {
          if (!state.tabs.find((t) => t.path === tab.path)) {
            return { tabs: [...state.tabs, tab], activePath: tab.path };
          }
          return { activePath: tab.path };
        }),

      setActivePath: (path) => set({ activePath: path }),

      closeTab: (path) =>
        set((state) => {
          if (path === "/dashboard") return state; // Never close dashboard
          const newTabs = state.tabs.filter((t) => t.path !== path);
          let newActive = state.activePath;
          if (state.activePath === path) {
            const index = state.tabs.findIndex((t) => t.path === path);
            const prev = state.tabs[index - 1];
            newActive = prev ? prev.path : "/dashboard";
          }
          return { tabs: newTabs, activePath: newActive };
        }),

      closeOthers: (path) =>
        set((state) => {
          const keep = state.tabs.filter(
            (t) => t.path === "/dashboard" || t.path === path
          );
          return { tabs: keep, activePath: path };
        }),

      closeAll: () => set({ tabs: [DASHBOARD_TAB], activePath: "/dashboard" }),
    }),
    {
      name: "ajis-tabs-storage",
    }
  )
);
