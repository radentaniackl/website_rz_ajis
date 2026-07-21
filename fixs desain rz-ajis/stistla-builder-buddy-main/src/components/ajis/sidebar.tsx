import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Vote,
  ClipboardCheck,
  ChevronDown,
  Database,
  MapPinned,
  Activity,
  ShieldQuestion,
  Cog,
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
  key: string;
  title: string;
  icon: LucideIcon;
  standalone?: boolean;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    standalone: true,
    items: [{ to: "/dashboard", label: "Ringkasan", icon: LayoutDashboard }],
  },
  {
    key: "master",
    title: "Master Data",
    icon: Database,
    items: [
      { to: "/dashboard/kantor", label: "Kantor", icon: Building2, roles: ["super_admin"] },
      { to: "/dashboard/wilayah", label: "Wilayah Pembinaan", icon: MapPin },
      { to: "/dashboard/sdm", label: "SDM", icon: UserSquare2 },
      { to: "/dashboard/jabatan", label: "Jabatan SDM", icon: Briefcase, roles: ["super_admin"] },
    ],
  },
  {
    key: "referensi",
    title: "Referensi Wilayah",
    icon: MapPinned,
    items: [
      { to: "/dashboard/propinsi", label: "Propinsi", icon: Globe2, roles: ["super_admin"] },
      { to: "/dashboard/kabupaten", label: "Kabupaten", icon: Landmark, roles: ["super_admin"] },
      { to: "/dashboard/kecamatan", label: "Kecamatan", icon: Map, roles: ["super_admin"] },
      { to: "/dashboard/desa", label: "Desa", icon: Home, roles: ["super_admin"] },
    ],
  },
  {
    key: "anak",
    title: "Data Anak",
    icon: Baby,
    items: [
      { to: "/dashboard/anak", label: "Data Anak", icon: Baby },
      { to: "/dashboard/survey-kelayakan", label: "Survey Kelayakan", icon: ClipboardCheck },
    ],
  },
  {
    key: "pembinaan",
    title: "Aktivitas Pembinaan",
    icon: Activity,
    items: [
      { to: "/dashboard/sesi", label: "Sesi", icon: CalendarCheck2 },
      { to: "/dashboard/hafalan", label: "Hafalan", icon: BookOpen },
      { to: "/dashboard/evaluasi", label: "Evaluasi", icon: GraduationCap },
    ],
  },
  {
    key: "partisipasi",
    title: "Partisipasi",
    icon: ShieldQuestion,
    items: [
      { to: "/dashboard/survey", label: "Jajak Pendapat", icon: Vote },
    ],
  },
  {
    key: "pengguna",
    title: "Pengguna",
    icon: Users,
    items: [
      { to: "/dashboard/users", label: "Users", icon: Users, roles: ["super_admin", "branch_admin"] },
      { to: "/dashboard/group-user", label: "Group User", icon: ShieldCheck, roles: ["super_admin"] },
    ],
  },
  {
    key: "laporan",
    title: "Laporan",
    icon: FileText,
    items: [
      { to: "/dashboard/laporan", label: "Laporan Semester", icon: FileText },
      { to: "/dashboard/statistik", label: "Statistik", icon: BarChart3 },
    ],
  },
  {
    key: "sistem",
    title: "Sistem",
    icon: Cog,
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-open the group containing the active route
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const sec of SECTIONS) {
      if (sec.items.some((it) => pathname === it.to || pathname.startsWith(it.to + "/"))) {
        next[sec.key] = true;
      }
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  const toggleGroup = (key: string) =>
    setOpenGroups((s) => ({ ...s, [key]: !s[key] }));

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

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {SECTIONS.map((sec) => {
            const items = sec.items.filter((it) => !it.roles || it.roles.includes(user.role));
            if (items.length === 0) return null;

            const isActiveSection = items.some(
              (it) => pathname === it.to || pathname.startsWith(it.to + "/"),
            );

            // Standalone (Dashboard) — single top-level link, no group
            if (sec.standalone) {
              const it = items[0];
              const active = pathname === it.to;
              return (
                <Link
                  key={sec.key}
                  to={it.to}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <sec.icon className="h-4 w-4" />
                  <span>{sec.title}</span>
                </Link>
              );
            }

            const isOpen = openGroups[sec.key] ?? isActiveSection;

            return (
              <div key={sec.key}>
                <button
                  type="button"
                  onClick={() => toggleGroup(sec.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition-colors",
                    isActiveSection
                      ? "text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <sec.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{sec.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                {isOpen && (
                  <ul className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border/60 pl-2">
                    {items.map((it) => {
                      const active = pathname === it.to || pathname.startsWith(it.to + "/");
                      return (
                        <li key={it.to}>
                          <Link
                            to={it.to}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors",
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                active ? "bg-primary" : "bg-muted-foreground/40",
                              )}
                            />
                            <it.icon className="h-3.5 w-3.5" />
                            <span>{it.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
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