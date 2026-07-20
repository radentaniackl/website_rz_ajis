import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge } from "@/components/ajis/status-badge";
import { jabatanSDM, type JabatanSDM } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/jabatan")({
  head: () => ({ meta: [{ title: "Jabatan SDM — AJIS" }, { name: "description", content: "Referensi jabatan SDM AJIS." }] }),
  component: JabatanPage,
});

const columns: DataColumn<JabatanSDM>[] = [
  { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
  { key: "nama", header: "Nama Jabatan", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
  { key: "level", header: "Level", render: (r) => <StatusBadge tone={r.level <= 2 ? "primary" : r.level === 3 ? "info" : "muted"}>Level {r.level}</StatusBadge> },
];

function JabatanPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Jabatan SDM"
        subtitle="Struktur jabatan organisasi."
        crumbs={[{ label: "Master Data" }, { label: "Jabatan" }]}
        actions={<Button onClick={() => toast.info("Form tambah jabatan (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Tambah Jabatan</Button>}
      />
      <DataTable columns={columns} data={jabatanSDM} labelSingular="jabatan" />
    </div>
  );
}