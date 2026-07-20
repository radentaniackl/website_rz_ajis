import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { kabupaten, propinsiMap, type Kabupaten } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/kabupaten")({
  head: () => ({ meta: [{ title: "Kabupaten — AJIS" }, { name: "description", content: "Referensi kabupaten/kota." }] }),
  component: Page,
});

const columns: DataColumn<Kabupaten>[] = [
  { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
  { key: "nama", header: "Nama Kabupaten", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
  { key: "propinsi", header: "Propinsi", render: (r) => propinsiMap.get(r.propinsi_id)?.nama ?? "—", searchable: (r) => propinsiMap.get(r.propinsi_id)?.nama ?? "" },
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Kabupaten / Kota" subtitle="Referensi wilayah administratif." crumbs={[{ label: "Referensi" }, { label: "Kabupaten" }]} />
      <DataTable columns={columns} data={kabupaten} labelSingular="kabupaten" />
    </div>
  );
}