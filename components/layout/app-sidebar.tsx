'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Map, 
  CalendarDays, 
  BookOpen, 
  FileCheck2, 
  FileText, 
  Award,
  Settings,
  Database,
  Heart,
  ChevronDown,
  GraduationCap,
  UserCog,
  Contact
} from 'lucide-react';
import { Session } from 'next-auth';

import { useTabs } from '@/hooks/use-tabs';

interface AppSidebarProps {
  session: Session | null;
  isCollapsed?: boolean;
  onClose?: () => void; // Added for mobile overlay
}

export function AppSidebar({ session, isCollapsed = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const { addTab } = useTabs();

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = session?.user?.id_group_user;

  const SECTIONS = [
    {
      key: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      standalone: true,
      items: [{ href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, iconName: "LayoutDashboard", roles: [1, 2, 9] }],
    },
    {
      key: "referensi",
      title: "Referensi Wilayah",
      icon: Database,
      items: [
        { href: "/dashboard/referensi", label: "Overview", icon: Database, iconName: "Database", roles: [1, 2, 9] },
        { href: "/dashboard/referensi/propinsi", label: "Propinsi", icon: Map, iconName: "Map", roles: [1, 2, 9] },
        { href: "/dashboard/referensi/kabupaten", label: "Kabupaten", icon: Map, iconName: "Map", roles: [1, 2, 9] },
        { href: "/dashboard/referensi/kecamatan", label: "Kecamatan", icon: Map, iconName: "Map", roles: [1, 2, 9] },
        { href: "/dashboard/referensi/desa", label: "Desa", icon: Map, iconName: "Map", roles: [1, 2, 9] },
      ],
    },
    {
      key: "master",
      title: "Master Data",
      icon: Building2,
      items: [
        { href: "/dashboard/kantor", label: "Kantor", icon: Building2, iconName: "Building2", roles: [1] },
        { href: "/dashboard/wilayah", label: "Wilayah Pembinaan", icon: Map, iconName: "Map", roles: [1, 2] },
        { href: "/dashboard/semester", label: "Semester", icon: CalendarDays, iconName: "CalendarDays", roles: [1] },
        { href: "/dashboard/sdm", label: "SDM/Fasilitator", icon: Contact, iconName: "Contact", roles: [1, 2] },
      ],
    },
    {
      key: "anak",
      title: "Data Anak",
      icon: Users,
      items: [
        { href: "/dashboard/anak", label: "Data Anak", icon: Users, iconName: "Users", roles: [1, 2, 9] },
        { href: "/dashboard/donatur", label: "Donatur", icon: Heart, iconName: "Heart", roles: [1] },
      ],
    },
    {
      key: "pembinaan",
      title: "Aktivitas Pembinaan",
      icon: BookOpen,
      items: [
        { href: "/dashboard/sesi", label: "Sesi Pembinaan", icon: CalendarDays, iconName: "CalendarDays", roles: [1, 2, 9] },
        { href: "/dashboard/hafalan", label: "Hafalan", icon: BookOpen, iconName: "BookOpen", roles: [1, 2, 9] },
        { href: "/dashboard/evaluasi", label: "Evaluasi", icon: FileCheck2, iconName: "FileCheck2", roles: [1, 2, 9] },
        { href: "/dashboard/pembinaan-dokumentasi", label: "Dokumentasi", icon: FileText, iconName: "FileText", roles: [1, 2, 9] },
      ],
    },
    {
      key: "laporan",
      title: "Laporan",
      icon: FileText,
      items: [
        { href: "/dashboard/laporan", label: "Laporan Semester", icon: FileText, iconName: "FileText", roles: [1, 2, 9] },
        { href: "/dashboard/prestasi", label: "Laporan Prestasi", icon: Award, iconName: "Award", roles: [1, 2, 9] },
      ],
    },
    {
      key: "pengguna",
      title: "Pengguna",
      icon: Users,
      items: [
        { href: "/dashboard/users", label: "Users", icon: Users, iconName: "Users", roles: [1, 2] },
      ],
    },
    {
      key: "sistem",
      title: "Sistem",
      icon: Settings,
      items: [
        { href: "/dashboard/settings", label: "Settings", icon: Settings, iconName: "Settings", roles: [1] },
      ],
    }
  ];

  // Auto-open active group
  useEffect(() => {
    if (!mounted) return;
    const next: Record<string, boolean> = {};
    for (const sec of SECTIONS) {
      if (sec.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/"))) {
        next[sec.key] = true;
      }
    }
    setOpenGroups((prev) => ({ ...prev, ...next }));
  }, [pathname, mounted]);

  const toggleGroup = (key: string) => setOpenGroups((s) => ({ ...s, [key]: !s[key] }));

  // Debug role (from original code)
  if (process.env.NODE_ENV === 'development') {
    // console.log('Session role:', role);
  }

  const activePath = mounted ? pathname : '';

  return (
    <aside className={cn(
      "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:h-screen lg:sticky lg:top-0",
      isCollapsed ? "w-0 opacity-0 overflow-hidden lg:w-0" : "w-64 opacity-100"
    )}>
      {/* Header Sidebar */}
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 outline-none" onClick={onClose}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold text-sidebar-foreground">AJIS</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Anak Juara IS
            </div>
          </div>
        </Link>
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {SECTIONS.map((sec) => {
          // Filter out items not allowed by role (or if role is undefined, allow them initially or gracefully)
          const items = sec.items.filter(it => !role || it.roles.includes(role));
          if (items.length === 0) return null;

          const isActiveSection = mounted && items.some(
            (it) => activePath === it.href || activePath.startsWith(it.href + "/")
          );

          // Standalone (Dashboard)
          if (sec.standalone) {
            const it = items[0];
            const active = activePath === it.href;
            return (
              <Link
                key={sec.key}
                href={it.href}
                onClick={() => {
                  onClose?.();
                  addTab({ path: it.href, label: it.label, iconName: it.iconName });
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <sec.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{sec.title}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              
              {isOpen && (
                <ul className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border/60 pl-2">
                  {items.map((it) => {
                    const active = mounted && (activePath === it.href || activePath.startsWith(it.href + "/"));
                    return (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={() => {
                            onClose?.();
                            addTab({ path: it.href, label: it.label, iconName: it.iconName });
                          }}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors",
                            active
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              active ? "bg-primary" : "bg-muted-foreground/40"
                            )}
                          />
                          <it.icon className="h-3.5 w-3.5 shrink-0" />
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

        {/* Fallback when no routes */}
        {mounted && SECTIONS.flatMap(s => s.items.filter(it => !role || it.roles.includes(role))).length === 0 && (
          <div className="px-4 py-2 text-sm text-muted-foreground">
            No routes available for your role
          </div>
        )}
      </nav>

      {/* Profil Bawah */}
      <div className="border-t border-sidebar-border p-4 shrink-0">
        <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
            <UserCog className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-bold text-foreground">
              {mounted ? session?.user?.username || 'User' : 'User'}
            </div>
            <div className="truncate text-[10px] text-muted-foreground">
              {role === 1 ? 'Super Admin' : role === 2 ? 'Branch Admin' : role === 9 ? 'Korwil' : 'Pengguna'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
