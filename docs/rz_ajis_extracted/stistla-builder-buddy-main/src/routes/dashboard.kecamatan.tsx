import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { kecamatan, kabupatenMap, type Kecamatan } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/kecamatan")({
  head: () => ({ meta: [{ title: "Kecamatan — AJIS" }, { name: "description", content: "Referensi kecamatan." }] }),
  component: Page,
});

const columns: DataColumn<Kecamatan>[] = [
  { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
  { key: "nama", header: "Nama Kecamatan", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
  { key: "kabupaten", header: "Kabupaten", render: (r) => kabupatenMap.get(r.kabupaten_id)?.nama ?? "—", searchable: (r) => kabupatenMap.get(r.kabupaten_id)?.nama ?? "" },
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Kecamatan" subtitle="Referensi wilayah administratif." crumbs={[{ label: "Referensi" }, { label: "Kecamatan" }]} />
      <DataTable columns={columns} data={kecamatan} labelSingular="kecamatan" />
    </div>
  );
}