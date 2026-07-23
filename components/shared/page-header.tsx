import { ReactNode } from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  crumbs?: Crumb[]; // Support breadcrumbs according to Stisla design
}

export function PageHeader({ title, description, action, crumbs = [] }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between py-2">
      <div>
        {/* Breadcrumb Navigation */}
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              {c.href ? (
                <Link href={c.href} className="hover:text-primary transition-colors">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        
        {/* Title & Description */}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      
      {/* Actions */}
      {action && (
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          {action}
        </div>
      )}
    </div>
  );
}
