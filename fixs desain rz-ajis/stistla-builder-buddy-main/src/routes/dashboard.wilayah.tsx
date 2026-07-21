import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { WilayahPembinaan } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/wilayah")({
  head: () => ({ meta: [{ title: "Wilayah Pembinaan — AJIS" }, { name: "description", content: "Data wilayah pembinaan Anak Juara." }] }),
  component: WilayahPage,
});

function WilayahPage() {
  const { kantor, desa } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<WilayahPembinaan>[]>(() => [
    { key: "kode_lama", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode_lama}</span>, searchable: (r) => String(r.kode_lama) },
    { key: "nama_wilayah", header: "Nama Wilayah", render: (r) => <span className="font-semibold text-foreground">{r.nama_wilayah}</span>, searchable: (r) => r.nama_wilayah },
    { key: "kantor", header: "Kantor", render: (r) => kantor.get(r.kantor_id)?.nama ?? "—" },
    { key: "desa", header: "Desa", render: (r) => desa.get(r.desa_id)?.nama ?? "—" },
    { key: "alamat_wilayah", header: "Alamat", render: (r) => <span className="text-muted-foreground">{r.alamat_wilayah}</span>, searchable: (r) => r.alamat_wilayah },
    { key: "status_approve", header: "Approval", render: (r) => (
        <StatusBadge tone={r.status_approve === "approved" ? "success" : r.status_approve === "pending" ? "warning" : "danger"}>{r.status_approve}</StatusBadge>
      ) },
    { key: "aktif", header: "Status", render: (r) => <StatusBadge tone={aktifTone(r.aktif)}>{r.aktif === "y" ? "Aktif" : "Nonaktif"}</StatusBadge> },
  ], [kantor, desa]);

  return (
    <ResourcePage<WilayahPembinaan>
      slice="wilayah"
      title="Wilayah Pembinaan"
      subtitle="Titik lokasi kegiatan pembinaan Anak Juara."
      crumbs={[{ label: "Master Data" }, { label: "Wilayah Pembinaan" }]}
      addLabel="Tambah Wilayah"
      labelSingular="wilayah"
      columns={columns}
      fields={[
        { name: "kode_lama", label: "Kode Lama", type: "number", required: true },
        { name: "nama_wilayah", label: "Nama Wilayah", type: "text", required: true },
        { name: "kantor_id", label: "Kantor", type: "select", required: true, options: opts.kantor },
        { name: "desa_id", label: "Desa", type: "select", required: true, options: opts.desa },
        { name: "status_approve", label: "Approval", type: "select", options: [
          { value: "approved", label: "Approved" }, { value: "pending", label: "Pending" }, { value: "rejected", label: "Rejected" },
        ], defaultValue: "pending" },
        { name: "aktif", label: "Status", type: "select", options: [{ value: "y", label: "Aktif" }, { value: "n", label: "Nonaktif" }], defaultValue: "y" },
        { name: "alamat_wilayah", label: "Alamat", type: "textarea" },
      ]}
    />
  );
}
