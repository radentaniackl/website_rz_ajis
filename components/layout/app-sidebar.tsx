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
  Database
} from 'lucide-react';
import { Session } from 'next-auth';

interface AppSidebarProps {
  session: Session | null;
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePath = mounted ? pathname : '';
  const role = session?.user?.id_group_user;

  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard',
      roles: [1, 2, 9], // Super, Branch, Korwil
    },
    {
      label: 'Referensi',
      icon: Database,
      href: '/dashboard/referensi',
      roles: [1, 2, 9],
    },
    {
      label: 'Propinsi',
      icon: Map,
      href: '/dashboard/referensi/propinsi',
      roles: [1, 2, 9],
    },
    {
      label: 'Kabupaten',
      icon: Map,
      href: '/dashboard/referensi/kabupaten',
      roles: [1, 2, 9],
    },
    {
      label: 'Kecamatan',
      icon: Map,
      href: '/dashboard/referensi/kecamatan',
      roles: [1, 2, 9],
    },
    {
      label: 'Desa',
      icon: Map,
      href: '/dashboard/referensi/desa',
      roles: [1, 2, 9],
    },
    {
      label: 'Anak',
      icon: Users,
      href: '/dashboard/anak',
      roles: [1, 2, 9],
    },
    {
      label: 'Kantor',
      icon: Building2,
      href: '/dashboard/kantor',
      roles: [1], // Super only
    },
    {
      label: 'Wilayah',
      icon: Map,
      href: '/dashboard/wilayah',
      roles: [1, 2], // Super, Branch
    },
    {
      label: 'Users',
      icon: Users,
      href: '/dashboard/users',
      roles: [1, 2],
    },
    {
      label: 'Sesi Pembinaan',
      icon: CalendarDays,
      href: '/dashboard/sesi',
      roles: [1, 2, 9],
    },
    {
      label: 'Hafalan',
      icon: BookOpen,
      href: '/dashboard/hafalan',
      roles: [1, 2, 9],
    },
    {
      label: 'Evaluasi',
      icon: FileCheck2,
      href: '/dashboard/evaluasi',
      roles: [1, 2, 9],
    },
    {
      label: 'Laporan Semester',
      icon: FileText,
      href: '/dashboard/laporan',
      roles: [1, 2, 9],
    },
    {
      label: 'Laporan Prestasi',
      icon: Award,
      href: '/dashboard/prestasi',
      roles: [1, 2, 9],
    },
    {
      label: 'Settings',
      icon: Settings,
      href: '/dashboard/settings',
      roles: [1],
    },
  ];

  // Show all routes if role is not available (fallback for production issues)
  const filteredRoutes = role ? routes.filter(route => route.roles.includes(role)) : routes;

  // Debug: log to check if routes are being filtered
  if (process.env.NODE_ENV === 'development') {
    console.log('Session role:', role);
    console.log('Filtered routes:', filteredRoutes);
  }

  // Always render the sidebar structure even if there are issues
  return (
    <aside className="flex flex-col border-r bg-white w-64" style={{ minHeight: '100vh', minWidth: '16rem' }}>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl font-bold text-primary">RZ AJIS</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
          {filteredRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary',
                activePath === route.href || activePath.startsWith(`${route.href}/`)
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          ))}
          {filteredRoutes.length === 0 && (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              No routes available for your role
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
