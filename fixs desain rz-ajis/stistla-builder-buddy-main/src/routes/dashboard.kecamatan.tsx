import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Kecamatan } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/kecamatan")({
  head: () => ({ meta: [{ title: "Kecamatan — AJIS" }, { name: "description", content: "Referensi kecamatan." }] }),
  component: Page,
});

function Page() {
  const { kabupaten } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<Kecamatan>[]>(() => [
    { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
    { key: "nama", header: "Nama Kecamatan", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
    { key: "kabupaten", header: "Kabupaten", render: (r) => kabupaten.get(r.kabupaten_id)?.nama ?? "—" },
  ], [kabupaten]);

  return (
    <ResourcePage<Kecamatan>
      slice="kecamatan"
      title="Kecamatan"
      subtitle="Referensi wilayah administratif."
      crumbs={[{ label: "Referensi" }, { label: "Kecamatan" }]}
      addLabel="Tambah Kecamatan"
      labelSingular="kecamatan"
      columns={columns}
      fields={[
        { name: "kode", label: "Kode", type: "text", required: true },
        { name: "nama", label: "Nama Kecamatan", type: "text", required: true },
        { name: "kabupaten_id", label: "Kabupaten", type: "select", required: true, options: opts.kabupaten },
      ]}
    />
  );
}
