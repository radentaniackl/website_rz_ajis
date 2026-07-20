import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

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
    <DashboardLayoutWrapper session={session}>
      {children}
    </DashboardLayoutWrapper>
  );
}
