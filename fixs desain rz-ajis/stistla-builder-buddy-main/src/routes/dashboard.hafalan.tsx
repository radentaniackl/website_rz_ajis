import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Hafalan } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/hafalan")({
  head: () => ({ meta: [{ title: "Hafalan — AJIS" }, { name: "description", content: "Catatan hafalan Al-Qur'an anak binaan." }] }),
  component: HafalanPage,
});

function HafalanPage() {
  const { anak, wilayah } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<Hafalan>[]>(() => [
    { key: "tanggal", header: "Tanggal", render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>, searchable: (r) => r.tanggal },
    { key: "anak", header: "Anak", render: (r) => <span className="font-semibold text-foreground">{anak.get(r.anak_id)?.nama ?? "—"}</span> },
    { key: "wilayah", header: "Wilayah", render: (r) => wilayah.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—" },
    { key: "surat", header: "Surat", render: (r) => <StatusBadge tone="primary">{r.surat}</StatusBadge>, searchable: (r) => r.surat },
    { key: "ayat", header: "Ayat", render: (r) => <span className="font-mono text-xs">{r.ayat_dari}–{r.ayat_sampai}</span> },
    { key: "nilai", header: "Nilai", render: (r) => (
        <StatusBadge tone={r.nilai === "A" ? "success" : r.nilai === "B" ? "info" : "warning"}>{r.nilai}</StatusBadge>
      ) },
  ], [anak, wilayah]);

  return (
    <ResourcePage<Hafalan>
      slice="hafalan"
      title="Hafalan Al-Qur'an"
      subtitle="Setoran & progress hafalan anak binaan."
      crumbs={[{ label: "Aktivitas" }, { label: "Hafalan" }]}
      addLabel="Entri Hafalan"
      labelSingular="setoran"
      applyScope
      columns={columns}
      fields={[
        { name: "tanggal", label: "Tanggal", type: "date", required: true },
        { name: "anak_id", label: "Anak", type: "select", required: true, options: opts.anak },
        { name: "wilayah_pembinaan_id", label: "Wilayah", type: "select", required: true, options: opts.wilayah },
        { name: "surat", label: "Surat", type: "text", required: true, placeholder: "An-Naba" },
        { name: "ayat_dari", label: "Ayat Dari", type: "number", defaultValue: 1 },
        { name: "ayat_sampai", label: "Ayat Sampai", type: "number", defaultValue: 10 },
        { name: "nilai", label: "Nilai", type: "select", options: [{ value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" }], defaultValue: "A" },
      ]}
    />
  );
}
