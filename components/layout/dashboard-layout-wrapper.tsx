"use client";

import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { TabsBar } from "./tabs-bar";
import { TabsHost } from "./tabs-host";
import { cn } from "@/lib/utils";
import React from "react";

interface DashboardLayoutWrapperProps {
  session: any;
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ 
  session, 
  children 
}: DashboardLayoutWrapperProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className={cn(
        "border-r bg-white flex-shrink-0 transition-all duration-300 ease-in-out md:block",
        isSidebarCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-64 opacity-100",
        "hidden" // Hidden by default on mobile, shown on md
      )}>
        <AppSidebar session={session} isCollapsed={isSidebarCollapsed} />
      </div>
      
      <div className="flex flex-1 flex-col">
        <AppHeader session={session} onSidebarToggle={toggleSidebar} />
        
        <TabsBar />
        <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-0 md:gap-8 bg-muted/20">
          <TabsHost>{children}</TabsHost>
        </main>
      </div>
    </div>
  );
}
