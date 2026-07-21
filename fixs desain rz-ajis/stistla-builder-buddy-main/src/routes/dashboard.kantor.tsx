import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Kantor } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/kantor")({
  head: () => ({ meta: [{ title: "Kantor — AJIS" }, { name: "description", content: "Master data kantor AJIS." }] }),
  component: KantorPage,
});

function KantorPage() {
  const { kantor } = useLookups();
  const opts = useOptions();

  const columns = useMemo<DataColumn<Kantor>[]>(() => [
    { key: "kode", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode}</span>, searchable: (r) => r.kode },
    { key: "nama", header: "Nama Kantor", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
    { key: "jenis", header: "Jenis", render: (r) => (
        <StatusBadge tone={r.jenis === "pusat" ? "primary" : r.jenis === "regional" ? "info" : "muted"}>{r.jenis.toUpperCase()}</StatusBadge>
      ) },
    { key: "parent", header: "Induk", render: (r) => (r.parent_id ? kantor.get(r.parent_id)?.nama ?? "—" : "—") },
    { key: "alamat", header: "Alamat", render: (r) => <span className="text-muted-foreground">{r.alamat}</span>, searchable: (r) => r.alamat },
    { key: "no_telp", header: "Telepon", render: (r) => r.no_telp },
    { key: "aktif", header: "Status", render: (r) => <StatusBadge tone={aktifTone(r.aktif)}>{r.aktif === "y" ? "Aktif" : "Nonaktif"}</StatusBadge> },
  ], [kantor]);

  return (
    <ResourcePage<Kantor>
      slice="kantor"
      title="Kantor"
      subtitle="Kelola hierarki kantor: pusat → regional → cabang."
      crumbs={[{ label: "Master Data" }, { label: "Kantor" }]}
      addLabel="Tambah Kantor"
      labelSingular="kantor"
      columns={columns}
      fields={[
        { name: "kode", label: "Kode", type: "text", required: true, placeholder: "CBG-XXX" },
        { name: "nama", label: "Nama Kantor", type: "text", required: true },
        { name: "jenis", label: "Jenis", type: "select", required: true, options: [
          { value: "pusat", label: "Pusat" }, { value: "regional", label: "Regional" }, { value: "cabang", label: "Cabang" },
        ], defaultValue: "cabang" },
        { name: "parent_id", label: "Induk", type: "select", options: [{ value: "", label: "— tidak ada —" }, ...opts.kantor], defaultValue: "" },
        { name: "no_telp", label: "Telepon", type: "text" },
        { name: "aktif", label: "Status", type: "select", options: [{ value: "y", label: "Aktif" }, { value: "n", label: "Nonaktif" }], defaultValue: "y" },
        { name: "alamat", label: "Alamat", type: "textarea" },
      ]}
    />
  );
}