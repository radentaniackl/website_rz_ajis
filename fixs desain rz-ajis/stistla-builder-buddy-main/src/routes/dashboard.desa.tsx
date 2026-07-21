import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Desa } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/desa")({
  head: () => ({ meta: [{ title: "Desa — AJIS" }, { name: "description", content: "Referensi desa/kelurahan." }] }),
  component: Page,
});

function Page() {
  const { kecamatan } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<Desa>[]>(() => [
    { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
    { key: "nama", header: "Nama Desa", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
    { key: "kecamatan", header: "Kecamatan", render: (r) => kecamatan.get(r.kecamatan_id)?.nama ?? "—" },
  ], [kecamatan]);

  return (
    <ResourcePage<Desa>
      slice="desa"
      title="Desa / Kelurahan"
      subtitle="Referensi wilayah administratif."
      crumbs={[{ label: "Referensi" }, { label: "Desa" }]}
      addLabel="Tambah Desa"
      labelSingular="desa"
      columns={columns}
      fields={[
        { name: "kode", label: "Kode", type: "text", required: true },
        { name: "nama", label: "Nama Desa", type: "text", required: true },
        { name: "kecamatan_id", label: "Kecamatan", type: "select", required: true, options: opts.kecamatan },
      ]}
    />
  );
}
