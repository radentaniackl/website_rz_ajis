import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  Baby,
  BookOpen,
  BarChart3,
  Settings,
  Globe2,
  Landmark,
  Map,
  Home,
  UserCog,
  ShieldCheck,
  Briefcase,
  UserSquare2,
  FileText,
  CalendarCheck2,
  GraduationCap,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRbac, type RoleKey } from "@/lib/rbac";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: RoleKey[];
}
interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Dashboard",
    items: [{ to: "/dashboard", label: "Ringkasan", icon: LayoutDashboard }],
  },
  {
    title: "Master Data",
    items: [
      { to: "/dashboard/kantor", label: "Kantor", icon: Building2, roles: ["super_admin"] },
      { to: "/dashboard/wilayah", label: "Wilayah Pembinaan", icon: MapPin },
      { to: "/dashboard/sdm", label: "SDM", icon: UserSquare2 },
      { to: "/dashboard/jabatan", label: "Jabatan SDM", icon: Briefcase, roles: ["super_admin"] },
    ],
  },
  {
    title: "Referensi Wilayah",
    items: [
      { to: "/dashboard/propinsi", label: "Propinsi", icon: Globe2, roles: ["super_admin"] },
      { to: "/dashboard/kabupaten", label: "Kabupaten", icon: Landmark, roles: ["super_admin"] },
      { to: "/dashboard/kecamatan", label: "Kecamatan", icon: Map, roles: ["super_admin"] },
      { to: "/dashboard/desa", label: "Desa", icon: Home, roles: ["super_admin"] },
    ],
  },
  {
    title: "Data Anak",
    items: [{ to: "/dashboard/anak", label: "Data Anak", icon: Baby }],
  },
  {
    title: "Aktivitas Pembinaan",
    items: [
      { to: "/dashboard/sesi", label: "Sesi", icon: CalendarCheck2 },
      { to: "/dashboard/hafalan", label: "Hafalan", icon: BookOpen },
      { to: "/dashboard/evaluasi", label: "Evaluasi", icon: GraduationCap },
      { to: "/dashboard/survey", label: "Survey", icon: Send },
    ],
  },
  {
    title: "Pengguna",
    items: [
      { to: "/dashboard/users", label: "Users", icon: Users, roles: ["super_admin", "branch_admin"] },
      { to: "/dashboard/group-user", label: "Group User", icon: ShieldCheck, roles: ["super_admin"] },
    ],
  },
  {
    title: "Laporan",
    items: [
      { to: "/dashboard/laporan", label: "Laporan Semester", icon: FileText },
      { to: "/dashboard/statistik", label: "Statistik", icon: BarChart3 },
    ],
  },
  {
    title: "Sistem",
    items: [{ to: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["super_admin"] }],
  },
];

export function AjisSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useRbac();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {open && (
        <button
          aria-label="Tutup sidebar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold text-sidebar-foreground">AJIS</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Anak Juara IS
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((sec) => {
            const items = sec.items.filter((it) => !it.roles || it.roles.includes(user.role));
            if (items.length === 0) return null;
            return (
              <div key={sec.title} className="px-3 py-2">
                <div className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {sec.title}
                </div>
                <ul className="space-y-0.5">
                  {items.map((it) => {
                    const active =
                      it.to === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname === it.to || pathname.startsWith(it.to + "/");
                    return (
                      <li key={it.to}>
                        <Link
                          to={it.to}
                          onClick={onClose}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          )}
                        >
                          <it.icon className="h-4 w-4" />
                          <span>{it.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UserCog className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-bold text-foreground">{user.username}</div>
              <div className="truncate text-[10px] text-muted-foreground">{user.label}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}