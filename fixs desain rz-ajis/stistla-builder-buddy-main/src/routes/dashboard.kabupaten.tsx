import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Kabupaten } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/kabupaten")({
  head: () => ({ meta: [{ title: "Kabupaten — AJIS" }, { name: "description", content: "Referensi kabupaten/kota." }] }),
  component: Page,
});

function Page() {
  const { propinsi } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<Kabupaten>[]>(() => [
    { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
    { key: "nama", header: "Nama Kabupaten", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
    { key: "propinsi", header: "Propinsi", render: (r) => propinsi.get(r.propinsi_id)?.nama ?? "—" },
  ], [propinsi]);

  return (
    <ResourcePage<Kabupaten>
      slice="kabupaten"
      title="Kabupaten / Kota"
      subtitle="Referensi wilayah administratif."
      crumbs={[{ label: "Referensi" }, { label: "Kabupaten" }]}
      addLabel="Tambah Kabupaten"
      labelSingular="kabupaten"
      columns={columns}
      fields={[
        { name: "kode", label: "Kode", type: "text", required: true },
        { name: "nama", label: "Nama Kabupaten", type: "text", required: true },
        { name: "propinsi_id", label: "Propinsi", type: "select", required: true, options: opts.propinsi },
      ]}
    />
  );
}
