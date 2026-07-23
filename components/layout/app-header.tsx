'use client';

import { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, User as UserIcon, Lock, PanelLeft, Search, Bell, ChevronDown, UserCog } from 'lucide-react';
import { AppSidebar } from './app-sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface AppHeaderProps {
  session: Session | null;
  onSidebarToggle?: () => void;
}

export function AppHeader({ session, onSidebarToggle }: AppHeaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const displayUsername = mounted ? session?.user?.username || 'User' : 'User';
  const role = session?.user?.id_group_user;
  const roleLabel = role === 1 ? 'Super Admin' : role === 2 ? 'Branch Admin' : role === 9 ? 'Korwil' : 'Pengguna';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-2">
        {/* Mobile menu */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 w-64 border-r-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <AppSidebar session={session} onClose={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={onSidebarToggle}
        >
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Search Input (Visual Placeholder) */}
      <div className="relative hidden max-w-md flex-1 md:block ml-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari data, anak, atau modul…" className="h-10 pl-9 bg-muted/50 border-transparent focus-visible:bg-background" />
      </div>

      {/* Right Side Tools */}
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative hidden sm:flex text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserCog className="h-4 w-4" />
              </div>
              <div className="hidden text-left leading-tight md:block">
                <div className="text-sm font-bold text-foreground">{displayUsername}</div>
                <div className="text-[11px] font-semibold text-muted-foreground">{roleLabel}</div>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayUsername}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Profil Saya</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { window.location.href = '/reset-password'; }} className="cursor-pointer">
              <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Ganti Password</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
