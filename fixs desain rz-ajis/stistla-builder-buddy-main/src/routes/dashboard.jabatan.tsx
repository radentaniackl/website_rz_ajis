import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { JabatanSDM } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/jabatan")({
  head: () => ({ meta: [{ title: "Jabatan SDM — AJIS" }, { name: "description", content: "Referensi jabatan SDM." }] }),
  component: JabatanPage,
});

const columns: DataColumn<JabatanSDM>[] = [
  { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
  { key: "nama", header: "Nama Jabatan", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
  { key: "level", header: "Level", render: (r) => <StatusBadge tone={r.level <= 2 ? "primary" : r.level === 3 ? "info" : "muted"}>Level {r.level}</StatusBadge> },
];

function JabatanPage() {
  return (
    <ResourcePage<JabatanSDM>
      slice="jabatan"
      title="Jabatan SDM"
      subtitle="Struktur jabatan organisasi."
      crumbs={[{ label: "Master Data" }, { label: "Jabatan" }]}
      addLabel="Tambah Jabatan"
      labelSingular="jabatan"
      columns={columns}
      fields={[
        { name: "kode", label: "Kode", type: "text", required: true },
        { name: "nama", label: "Nama Jabatan", type: "text", required: true },
        { name: "level", label: "Level", type: "number", required: true, defaultValue: 5 },
      ]}
    />
  );
}
