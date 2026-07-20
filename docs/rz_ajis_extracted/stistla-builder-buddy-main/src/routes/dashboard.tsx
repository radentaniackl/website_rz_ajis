import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AjisSidebar } from "@/components/ajis/sidebar";
import { AjisNavbar } from "@/components/ajis/navbar";
import { RbacProvider } from "@/lib/rbac";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <RbacProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AjisSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AjisNavbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
          <footer className="border-t border-border bg-card px-6 py-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} AJIS — Anak Juara Information System. Dibuat sesuai PRD v2.0.
          </footer>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    </RbacProvider>
  );
}