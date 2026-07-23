"use client";

import { useTabs } from "@/hooks/use-tabs";
import { useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

export function TabsHost({ children }: { children: ReactNode }) {
  const { activePath, setActivePath, tabs } = useTabs();
  const pathname = usePathname();
  const router = useRouter();

  // Store tab contents without triggering re-renders
  const [mountedTabs, setMountedTabs] = useState<Record<string, ReactNode>>({});

  useEffect(() => {
    if (pathname && pathname !== activePath) {
      setActivePath(pathname);
    }
  }, [pathname, activePath, setActivePath]);  // Use a functional state update to avoid depending on children which changes every render,
  // causing infinite loops. We only need to snapshot the children.
  useEffect(() => {
    setMountedTabs((prev) => {
      // Prevent state update if nothing changed (though children ref always changes, we can't deep compare)
      // Actually, updating state here on every render causes an infinite loop because 
      // setMountedTabs triggers a re-render, which provides a new children reference.
      // To fix this, we ONLY update the mounted tabs when the pathname changes!
      return {
        ...prev,
        [pathname]: children,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // REMOVED children from dependencies to stop infinite loop

  return (
    <div className="relative">
      {Object.entries(mountedTabs).map(([path, node]) => {
        // Always render the active path regardless of whether it's in tabs array
        // This ensures new pages (create/edit/view) are rendered immediately
        const isActive = path === activePath;
        const isTabAlive = tabs.some((t) => t.path === path) || path === "/dashboard" || isActive;

        if (!isTabAlive) return null;

        return (
          <div key={path} className={isActive ? "block" : "hidden"} aria-hidden={!isActive}>
            {/* Always use the latest children for the active path to ensure React gets the latest server updates */}
            {isActive ? children : node}
          </div>
        );
      })}
    </div>
  );
}
