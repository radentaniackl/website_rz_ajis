import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnakLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
            <div className="h-10 bg-muted animate-pulse rounded w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted animate-pulse rounded mb-4" />
          
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
