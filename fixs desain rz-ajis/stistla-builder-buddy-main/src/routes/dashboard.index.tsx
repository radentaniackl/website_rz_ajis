import { createFileRoute } from "@tanstack/react-router";
import { Baby, CalendarCheck2, BookOpen, GraduationCap, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/ajis/page-header";
import { StatCard } from "@/components/ajis/stat-card";
import { StatusBadge } from "@/components/ajis/status-badge";
import {
  anak,
  sesi,
  hafalan,
  evaluasi,
  wilayahMap,
  kantorMap,
} from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AJIS Admin Panel" },
      { name: "description", content: "Ringkasan operasional Anak Juara: anak, sesi, hafalan, evaluasi." },
    ],
  }),
  component: DashboardHome,
});

const CHART_DATA = [
  { bulan: "Feb", sesi: 48, hafalan: 120 },
  { bulan: "Mar", sesi: 62, hafalan: 148 },
  { bulan: "Apr", sesi: 71, hafalan: 168 },
  { bulan: "Mei", sesi: 80, hafalan: 195 },
  { bulan: "Jun", sesi: 92, hafalan: 220 },
  { bulan: "Jul", sesi: 104, hafalan: 245 },
];

function DashboardHome() {
  const { user } = useRbac();
  const anakScope = scopeFilter(anak, user);
  const sesiScope = scopeFilter(sesi, user);
  const hafalanScope = scopeFilter(hafalan, user);
  const evalScope = scopeFilter(evaluasi, user);

  const rataEval =
    evalScope.length === 0
      ? 0
      : Math.round(evalScope.reduce((s, e) => s + e.skor, 0) / evalScope.length);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        subtitle={`Selamat datang, ${user.username}. Data disaring sesuai role Anda (${user.label}).`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Anak" value={anakScope.length} hint="Dalam scope Anda" icon={Baby} tone="primary" />
        <StatCard label="Sesi Pembinaan" value={sesiScope.length} hint="30 hari terakhir" icon={CalendarCheck2} tone="info" />
        <StatCard label="Setoran Hafalan" value={hafalanScope.length} hint="Total tercatat" icon={BookOpen} tone="success" />
        <StatCard label="Rata Evaluasi" value={`${rataEval}`} hint="Skala 0–100" icon={GraduationCap} tone="warning" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="ajis-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Tren Aktivitas Semester Ini</h3>
              <p className="text-xs text-muted-foreground">Sesi & setoran hafalan per bulan</p>
            </div>
            <StatusBadge tone="success">
              <TrendingUp className="mr-1 h-3 w-3" /> +18% vs bulan lalu
            </StatusBadge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSesi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gHaf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="bulan" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="sesi" stroke="var(--color-primary)" fill="url(#gSesi)" strokeWidth={2} />
                <Area type="monotone" dataKey="hafalan" stroke="var(--color-success)" fill="url(#gHaf)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ajis-card p-5">
          <h3 className="mb-4 text-base font-bold text-foreground">Sesi Terbaru</h3>
          <ul className="space-y-3">
            {sesiScope.slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{s.materi}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {wilayahMap.get(s.wilayah_pembinaan_id)?.nama_wilayah ?? "—"} ·{" "}
                    {kantorMap.get(s.kantor_id)?.kode ?? "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {s.tanggal} · {s.jumlah_hadir} hadir
                  </div>
                </div>
              </li>
            ))}
            {sesiScope.length === 0 && (
              <li className="text-sm text-muted-foreground">Tidak ada sesi dalam scope Anda.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}