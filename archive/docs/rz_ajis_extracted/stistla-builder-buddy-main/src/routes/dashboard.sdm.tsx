import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import { sdm, jabatanMap, kantorMap, type SDM } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/sdm")({
  head: () => ({ meta: [{ title: "SDM — AJIS" }, { name: "description", content: "Data sumber daya manusia (pengurus & pembina) AJIS." }] }),
  component: SdmPage,
});

const columns: DataColumn<SDM>[] = [
  { key: "kode_lama", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode_lama}</span>, searchable: (r) => r.kode_lama },
  { key: "nama", header: "Nama", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
  { key: "nik", header: "NIK", render: (r) => <span className="font-mono text-xs">{r.nik}</span>, searchable: (r) => r.nik },
  { key: "jabatan", header: "Jabatan", render: (r) => <StatusBadge tone="info">{jabatanMap.get(r.jabatan_id)?.nama ?? "—"}</StatusBadge>, searchable: (r) => jabatanMap.get(r.jabatan_id)?.nama ?? "" },
  { key: "kantor", header: "Kantor", render: (r) => kantorMap.get(r.kantor_id)?.nama ?? "—", searchable: (r) => kantorMap.get(r.kantor_id)?.nama ?? "" },
  { key: "no_hp", header: "No. HP", render: (r) => r.no_hp },
  { key: "aktif", header: "Status", render: (r) => <StatusBadge tone={aktifTone(r.aktif)}>{r.aktif === "y" ? "Aktif" : "Nonaktif"}</StatusBadge> },
];

function SdmPage() {
  const { user } = useRbac();
  const data = scopeFilter(sdm, user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="SDM"
        subtitle="Data pengurus, manajer, dan pembina."
        crumbs={[{ label: "Master Data" }, { label: "SDM" }]}
        actions={<Button onClick={() => toast.info("Form tambah SDM (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Tambah SDM</Button>}
      />
      <DataTable columns={columns} data={data} labelSingular="SDM" />
    </div>
  );
}