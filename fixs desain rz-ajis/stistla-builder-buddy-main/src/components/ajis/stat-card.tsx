import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "info" | "danger";

const GRAD: Record<Tone, string> = {
  primary: "ajis-stat-grad-primary",
  success: "ajis-stat-grad-success",
  warning: "ajis-stat-grad-warning",
  info: "ajis-stat-grad-info",
  danger: "ajis-stat-grad-danger",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
  trend?: { value: number; direction: "up" | "down" };
}) {
  const TrendIcon = trend?.direction === "down" ? TrendingDown : TrendingUp;
  return (
    <div className={cn("relative overflow-hidden rounded-xl p-5 text-white shadow-[0_10px_25px_-10px_rgb(15_34_58/25%)]", GRAD[tone])}>
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -right-2 h-24 w-24 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest opacity-90">{label}</div>
          <div className="mt-2 text-3xl font-extrabold leading-none">{value}</div>
          {hint && <div className="mt-2 text-xs opacity-85">{hint}</div>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {trend && (
        <div className="relative mt-3 inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs font-semibold">
          <TrendIcon className="h-3.5 w-3.5" />
          {trend.value > 0 ? "+" : ""}{trend.value}% vs bulan lalu
        </div>
      )}
    </div>
  );
}