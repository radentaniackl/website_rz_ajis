import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge } from "@/components/ajis/status-badge";
import { laporanSemester, kantorMap, wilayahMap, type LaporanSemester } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/laporan")({
  head: () => ({ meta: [{ title: "Laporan Semester — AJIS" }, { name: "description", content: "Rekap laporan semester per wilayah." }] }),
  component: LaporanPage,
});

const columns: DataColumn<LaporanSemester>[] = [
  { key: "semester", header: "Semester", render: (r) => <StatusBadge tone="primary">{r.semester}</StatusBadge>, searchable: (r) => r.semester },
  { key: "wilayah", header: "Wilayah", render: (r) => <span className="font-semibold text-foreground">{wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—"}</span>, searchable: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "" },
  { key: "kantor", header: "Kantor", render: (r) => <span className="text-muted-foreground">{kantorMap.get(r.kantor_id)?.nama ?? "—"}</span>, searchable: (r) => kantorMap.get(r.kantor_id)?.nama ?? "" },
  { key: "total_anak", header: "Anak", render: (r) => <StatusBadge tone="info">{r.total_anak}</StatusBadge> },
  { key: "total_sesi", header: "Sesi", render: (r) => <StatusBadge tone="info">{r.total_sesi}</StatusBadge> },
  { key: "rata_hafalan", header: "Rata Hafalan", render: (r) => <span className="font-mono font-semibold text-foreground">{r.rata_hafalan.toFixed(1)}</span> },
  { key: "status", header: "Status", render: (r) => <StatusBadge tone={r.status === "final" ? "success" : "warning"}>{r.status}</StatusBadge> },
];

function LaporanPage() {
  const { user } = useRbac();
  const data = scopeFilter(laporanSemester, user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Laporan Semester"
        subtitle="Rekap laporan semester per wilayah pembinaan."
        crumbs={[{ label: "Laporan" }, { label: "Semester" }]}
        actions={<Button onClick={() => toast.info("Export PDF (demo)")}><Download className="mr-1.5 h-4 w-4" /> Export PDF</Button>}
      />
      <DataTable columns={columns} data={data} labelSingular="laporan" />
    </div>
  );
}