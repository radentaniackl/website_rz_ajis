import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import { wilayahPembinaan, kantorMap, desaMap, type WilayahPembinaan } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/wilayah")({
  head: () => ({ meta: [{ title: "Wilayah Pembinaan — AJIS" }, { name: "description", content: "Data wilayah pembinaan Anak Juara per kantor & desa." }] }),
  component: WilayahPage,
});

const columns: DataColumn<WilayahPembinaan>[] = [
  { key: "kode_lama", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode_lama}</span>, searchable: (r) => String(r.kode_lama) },
  { key: "nama_wilayah", header: "Nama Wilayah", render: (r) => <span className="font-semibold text-foreground">{r.nama_wilayah}</span>, searchable: (r) => r.nama_wilayah },
  { key: "kantor", header: "Kantor", render: (r) => kantorMap.get(r.kantor_id)?.nama ?? "—", searchable: (r) => kantorMap.get(r.kantor_id)?.nama ?? "" },
  { key: "desa", header: "Desa", render: (r) => desaMap.get(r.desa_id)?.nama ?? "—", searchable: (r) => desaMap.get(r.desa_id)?.nama ?? "" },
  { key: "alamat_wilayah", header: "Alamat", render: (r) => <span className="text-muted-foreground">{r.alamat_wilayah}</span>, searchable: (r) => r.alamat_wilayah },
  { key: "status_approve", header: "Approval", render: (r) => (
      <StatusBadge tone={r.status_approve === "approved" ? "success" : r.status_approve === "pending" ? "warning" : "danger"}>
        {r.status_approve}
      </StatusBadge>
    ) },
  { key: "aktif", header: "Status", render: (r) => <StatusBadge tone={aktifTone(r.aktif)}>{r.aktif === "y" ? "Aktif" : "Nonaktif"}</StatusBadge> },
];

function WilayahPage() {
  const { user } = useRbac();
  const data = scopeFilter(wilayahPembinaan.map((w) => ({ ...w, wilayah_pembinaan_id: w.id })), user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Wilayah Pembinaan"
        subtitle="Titik lokasi kegiatan pembinaan Anak Juara."
        crumbs={[{ label: "Master Data" }, { label: "Wilayah Pembinaan" }]}
        actions={<Button onClick={() => toast.info("Form tambah wilayah (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Tambah Wilayah</Button>}
      />
      <DataTable columns={columns} data={data} labelSingular="wilayah" />
    </div>
  );
}