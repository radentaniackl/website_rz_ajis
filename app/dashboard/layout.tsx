import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="w-64 border-r bg-muted/40 flex-shrink-0">
        <AppSidebar session={session} />
      </div>
      
      <div className="flex flex-1 flex-col">
        <AppHeader session={session} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
