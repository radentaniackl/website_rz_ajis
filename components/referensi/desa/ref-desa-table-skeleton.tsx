export function RefDesaTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted">
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" />
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" />
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" />
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" />
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" />
          <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" />
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
