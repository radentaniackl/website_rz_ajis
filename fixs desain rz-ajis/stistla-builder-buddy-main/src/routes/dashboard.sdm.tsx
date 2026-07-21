import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { SDM } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/sdm")({
  head: () => ({ meta: [{ title: "SDM — AJIS" }, { name: "description", content: "Data SDM AJIS." }] }),
  component: SdmPage,
});

function SdmPage() {
  const { jabatan, kantor } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<SDM>[]>(() => [
    { key: "kode_lama", header: "Kode", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode_lama}</span>, searchable: (r) => r.kode_lama },
    { key: "nama", header: "Nama", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
    { key: "nik", header: "NIK", render: (r) => <span className="font-mono text-xs">{r.nik}</span>, searchable: (r) => r.nik },
    { key: "jabatan", header: "Jabatan", render: (r) => <StatusBadge tone="info">{jabatan.get(r.jabatan_id)?.nama ?? "—"}</StatusBadge> },
    { key: "kantor", header: "Kantor", render: (r) => kantor.get(r.kantor_id)?.nama ?? "—" },
    { key: "no_hp", header: "No. HP", render: (r) => r.no_hp },
    { key: "aktif", header: "Status", render: (r) => <StatusBadge tone={aktifTone(r.aktif)}>{r.aktif === "y" ? "Aktif" : "Nonaktif"}</StatusBadge> },
  ], [jabatan, kantor]);

  return (
    <ResourcePage<SDM>
      slice="sdm"
      title="SDM"
      subtitle="Data pengurus, manajer, dan pembina."
      crumbs={[{ label: "Master Data" }, { label: "SDM" }]}
      addLabel="Tambah SDM"
      labelSingular="SDM"
      columns={columns}
      fields={[
        { name: "kode_lama", label: "Kode", type: "text", required: true },
        { name: "nama", label: "Nama Lengkap", type: "text", required: true },
        { name: "nik", label: "NIK", type: "text", required: true },
        { name: "jabatan_id", label: "Jabatan", type: "select", required: true, options: opts.jabatan },
        { name: "kantor_id", label: "Kantor", type: "select", required: true, options: opts.kantor },
        { name: "no_hp", label: "No. HP", type: "text" },
        { name: "aktif", label: "Status", type: "select", options: [{ value: "y", label: "Aktif" }, { value: "n", label: "Nonaktif" }], defaultValue: "y" },
      ]}
    />
  );
}
