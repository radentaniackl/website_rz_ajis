import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Sesi } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/sesi")({
  head: () => ({ meta: [{ title: "Sesi Pembinaan — AJIS" }, { name: "description", content: "Catatan sesi pembinaan Korwil." }] }),
  component: SesiPage,
});

function SesiPage() {
  const { wilayah, kantor } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<Sesi>[]>(() => [
    { key: "tanggal", header: "Tanggal", render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>, searchable: (r) => r.tanggal },
    { key: "materi", header: "Materi", render: (r) => <span className="font-semibold text-foreground">{r.materi}</span>, searchable: (r) => r.materi },
    { key: "wilayah", header: "Wilayah", render: (r) => wilayah.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—" },
    { key: "kantor", header: "Kantor", render: (r) => <span className="text-muted-foreground">{kantor.get(r.kantor_id)?.kode ?? "—"}</span> },
    { key: "pengajar", header: "Pengajar", render: (r) => r.pengajar, searchable: (r) => r.pengajar },
    { key: "durasi", header: "Durasi", render: (r) => <StatusBadge tone="info">{r.durasi_menit} mnt</StatusBadge> },
    { key: "hadir", header: "Hadir", render: (r) => <StatusBadge tone="success">{r.jumlah_hadir}</StatusBadge> },
  ], [wilayah, kantor]);

  return (
    <ResourcePage<Sesi>
      slice="sesi"
      title="Sesi Pembinaan"
      subtitle="Entri & rekap sesi oleh Koordinator Wilayah."
      crumbs={[{ label: "Aktivitas" }, { label: "Sesi" }]}
      addLabel="Entri Sesi"
      labelSingular="sesi"
      applyScope
      columns={columns}
      fields={[
        { name: "tanggal", label: "Tanggal", type: "date", required: true },
        { name: "materi", label: "Materi", type: "text", required: true },
        { name: "wilayah_pembinaan_id", label: "Wilayah", type: "select", required: true, options: opts.wilayah },
        { name: "kantor_id", label: "Kantor", type: "select", required: true, options: opts.kantor },
        { name: "pengajar", label: "Pengajar", type: "text", required: true },
        { name: "durasi_menit", label: "Durasi (menit)", type: "number", defaultValue: 90 },
        { name: "jumlah_hadir", label: "Jumlah Hadir", type: "number", defaultValue: 0 },
      ]}
    />
  );
}
