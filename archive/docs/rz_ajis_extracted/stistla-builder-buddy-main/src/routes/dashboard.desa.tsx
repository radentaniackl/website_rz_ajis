import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { desa, kecamatanMap, type Desa } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/desa")({
  head: () => ({ meta: [{ title: "Desa — AJIS" }, { name: "description", content: "Referensi desa/kelurahan." }] }),
  component: Page,
});

const columns: DataColumn<Desa>[] = [
  { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
  { key: "nama", header: "Nama Desa", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
  { key: "kecamatan", header: "Kecamatan", render: (r) => kecamatanMap.get(r.kecamatan_id)?.nama ?? "—", searchable: (r) => kecamatanMap.get(r.kecamatan_id)?.nama ?? "" },
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Desa / Kelurahan" subtitle="Referensi wilayah administratif." crumbs={[{ label: "Referensi" }, { label: "Desa" }]} />
      <DataTable columns={columns} data={desa} labelSingular="desa" />
    </div>
  );
}