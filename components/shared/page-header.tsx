import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 md:py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
