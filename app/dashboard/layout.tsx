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
    <div className="flex min-h-screen w-full flex-col bg-muted/10 md:flex-row">
      <div className="hidden border-r bg-muted/40 md:block">
        <AppSidebar session={session} />
      </div>
      
      <div className="flex flex-col sm:gap-4 md:py-0 w-full min-w-0">
        <AppHeader session={session} />
        
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
