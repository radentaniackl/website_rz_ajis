import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge } from "@/components/ajis/status-badge";
import { sesi, wilayahMap, kantorMap, type Sesi } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/sesi")({
  head: () => ({ meta: [{ title: "Sesi Pembinaan — AJIS" }, { name: "description", content: "Catatan sesi pembinaan Korwil." }] }),
  component: SesiPage,
});

const columns: DataColumn<Sesi>[] = [
  { key: "tanggal", header: "Tanggal", render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>, searchable: (r) => r.tanggal },
  { key: "materi", header: "Materi", render: (r) => <span className="font-semibold text-foreground">{r.materi}</span>, searchable: (r) => r.materi },
  { key: "wilayah", header: "Wilayah", render: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—", searchable: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "" },
  { key: "kantor", header: "Kantor", render: (r) => <span className="text-muted-foreground">{kantorMap.get(r.kantor_id)?.kode ?? "—"}</span> },
  { key: "pengajar", header: "Pengajar", render: (r) => r.pengajar, searchable: (r) => r.pengajar },
  { key: "durasi", header: "Durasi", render: (r) => <StatusBadge tone="info">{r.durasi_menit} mnt</StatusBadge> },
  { key: "hadir", header: "Hadir", render: (r) => <StatusBadge tone="success">{r.jumlah_hadir}</StatusBadge> },
];

function SesiPage() {
  const { user } = useRbac();
  const data = scopeFilter(sesi, user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Sesi Pembinaan"
        subtitle="Entri & rekap sesi oleh Koordinator Wilayah."
        crumbs={[{ label: "Aktivitas" }, { label: "Sesi" }]}
        actions={<Button onClick={() => toast.info("Form entri sesi (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Entri Sesi</Button>}
      />
      <DataTable columns={columns} data={data} labelSingular="sesi" />
    </div>
  );
}