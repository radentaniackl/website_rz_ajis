import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "info" | "danger";

const TONE_BG: Record<Tone, string> = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-info text-info-foreground",
  danger: "bg-destructive text-destructive-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="ajis-card flex items-center overflow-hidden">
      <div
        className={cn(
          "flex h-full items-center justify-center px-5 py-6",
          TONE_BG[tone],
        )}
      >
        <Icon className="h-8 w-8" />
      </div>
      <div className="flex-1 px-5 py-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 text-2xl font-extrabold text-foreground">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}