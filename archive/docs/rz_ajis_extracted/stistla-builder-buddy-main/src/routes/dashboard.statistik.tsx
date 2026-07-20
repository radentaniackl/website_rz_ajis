import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/ajis/page-header";
import { laporanSemester, wilayahMap, anak } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";

export const Route = createFileRoute("/dashboard/statistik")({
  head: () => ({ meta: [{ title: "Statistik — AJIS" }, { name: "description", content: "Visualisasi statistik operasional AJIS." }] }),
  component: StatistikPage,
});

const COLORS = ["var(--color-primary)", "var(--color-info)", "var(--color-success)", "var(--color-warning)", "var(--color-destructive)"];

function StatistikPage() {
  const { user } = useRbac();
  const laporan = scopeFilter(laporanSemester, user);
  const anakData = scopeFilter(anak, user);

  const barData = laporan.map((l) => ({
    wilayah: wilayahMap.get(l.wilayah_pembinaan_id)?.nama_wilayah.replace("Wilayah ", "") ?? "—",
    anak: l.total_anak,
    sesi: l.total_sesi,
  }));

  const pieData = [
    { name: "Aktif", value: anakData.filter((a) => a.status === "aktif").length },
    { name: "Lulus", value: anakData.filter((a) => a.status === "lulus").length },
    { name: "Keluar", value: anakData.filter((a) => a.status === "keluar").length },
  ].filter((d) => d.value > 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Statistik" subtitle="Ringkasan visual operasional AJIS." crumbs={[{ label: "Laporan" }, { label: "Statistik" }]} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="ajis-card p-5 xl:col-span-2">
          <h3 className="mb-4 text-base font-bold text-foreground">Anak & Sesi per Wilayah</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="wilayah" stroke="var(--color-muted-foreground)" fontSize={11} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="anak" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="sesi" fill="var(--color-info)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="ajis-card p-5">
          <h3 className="mb-4 text-base font-bold text-foreground">Status Anak Binaan</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}