import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { propinsi, type Propinsi } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/propinsi")({
  head: () => ({ meta: [{ title: "Propinsi — AJIS" }, { name: "description", content: "Referensi propinsi Indonesia." }] }),
  component: PropinsiPage,
});

const columns: DataColumn<Propinsi>[] = [
  { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
  { key: "nama", header: "Nama Propinsi", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
];

function PropinsiPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Propinsi" subtitle="Referensi wilayah administratif." crumbs={[{ label: "Referensi" }, { label: "Propinsi" }]} />
      <DataTable columns={columns} data={propinsi} labelSingular="propinsi" />
    </div>
  );
}