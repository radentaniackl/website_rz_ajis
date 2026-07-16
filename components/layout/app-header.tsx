'use client';

import { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LogOut, User as UserIcon, Lock } from 'lucide-react';
import { AppSidebar } from './app-sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface AppHeaderProps {
  session: Session | null;
}

export function AppHeader({ session }: AppHeaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const avatarInitial = mounted ? session?.user?.username?.charAt(0).toUpperCase() || 'U' : 'U';
  const displayUsername = mounted ? session?.user?.username || 'User' : 'User';

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 justify-between sticky top-0 z-10 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger>
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground md:hidden shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </div>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0 w-64">
            <AppSidebar session={session} />
          </SheetContent>
        </Sheet>
        
        {/* Breadcrumb - Simple implementation for now */}
        <div suppressHydrationWarning className="hidden md:flex text-sm text-muted-foreground items-center gap-1">
          {mounted &&
            segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const path = `/${segments.slice(0, index + 1).join('/')}`;
              return (
                <span key={path} className="flex items-center gap-1">
                  {index > 0 && <span>/</span>}
                  {isLast ? (
                    <span className="font-medium text-foreground capitalize">
                      {segment}
                    </span>
                  ) : (
                    <Link href={path} className="hover:text-foreground capitalize transition-colors">
                      {segment}
                    </Link>
                  )}
                </span>
              );
            })}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-input bg-background hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          type="button"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {avatarInitial}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground">
            <UserIcon className="mr-2 h-4 w-4" />
            {displayUsername}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { window.location.href = '/reset-password'; }}>
            <Lock className="mr-2 h-4 w-4" />
            Ganti Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
