import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ajis/resource-page";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Propinsi } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/propinsi")({
  head: () => ({ meta: [{ title: "Propinsi — AJIS" }, { name: "description", content: "Referensi propinsi Indonesia." }] }),
  component: Page,
});

const columns: DataColumn<Propinsi>[] = [
  { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
  { key: "nama", header: "Nama Propinsi", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
];

function Page() {
  return (
    <ResourcePage<Propinsi>
      slice="propinsi"
      title="Propinsi"
      subtitle="Referensi wilayah administratif."
      crumbs={[{ label: "Referensi" }, { label: "Propinsi" }]}
      addLabel="Tambah Propinsi"
      labelSingular="propinsi"
      columns={columns}
      fields={[
        { name: "kode", label: "Kode", type: "text", required: true },
        { name: "nama", label: "Nama Propinsi", type: "text", required: true },
      ]}
    />
  );
}
