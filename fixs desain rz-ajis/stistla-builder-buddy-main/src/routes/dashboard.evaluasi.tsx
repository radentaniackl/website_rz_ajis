import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Evaluasi } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/evaluasi")({
  head: () => ({ meta: [{ title: "Evaluasi — AJIS" }, { name: "description", content: "Evaluasi & penilaian anak binaan." }] }),
  component: EvaluasiPage,
});

function toneOf(skor: number) {
  if (skor >= 90) return "success" as const;
  if (skor >= 80) return "info" as const;
  if (skor >= 70) return "warning" as const;
  return "danger" as const;
}

function EvaluasiPage() {
  const { anak, wilayah } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<Evaluasi>[]>(() => [
    { key: "tanggal", header: "Tanggal", render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>, searchable: (r) => r.tanggal },
    { key: "anak", header: "Anak", render: (r) => <span className="font-semibold text-foreground">{anak.get(r.anak_id)?.nama ?? "—"}</span> },
    { key: "wilayah", header: "Wilayah", render: (r) => wilayah.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—" },
    { key: "aspek", header: "Aspek", render: (r) => <StatusBadge tone="primary">{r.aspek}</StatusBadge>, searchable: (r) => r.aspek },
    { key: "semester", header: "Semester", render: (r) => <span className="font-mono text-xs">{r.semester}</span> },
    { key: "skor", header: "Skor", render: (r) => <StatusBadge tone={toneOf(r.skor)}>{r.skor}</StatusBadge> },
  ], [anak, wilayah]);

  return (
    <ResourcePage<Evaluasi>
      slice="evaluasi"
      title="Evaluasi"
      subtitle="Penilaian per aspek pembinaan anak binaan."
      crumbs={[{ label: "Aktivitas" }, { label: "Evaluasi" }]}
      addLabel="Entri Evaluasi"
      labelSingular="evaluasi"
      applyScope
      columns={columns}
      fields={[
        { name: "tanggal", label: "Tanggal", type: "date", required: true },
        { name: "anak_id", label: "Anak", type: "select", required: true, options: opts.anak },
        { name: "wilayah_pembinaan_id", label: "Wilayah", type: "select", required: true, options: opts.wilayah },
        { name: "aspek", label: "Aspek", type: "select", required: true, options: ["Akhlak", "Hafalan", "Kedisiplinan", "Kehadiran", "Pemahaman"].map((v) => ({ value: v, label: v })) },
        { name: "semester", label: "Semester", type: "text", defaultValue: "2026-1" },
        { name: "skor", label: "Skor (0-100)", type: "number", defaultValue: 80 },
      ]}
    />
  );
}
