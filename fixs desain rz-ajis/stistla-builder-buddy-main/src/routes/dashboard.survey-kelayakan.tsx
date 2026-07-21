import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { SurveiKelayakan } from "@/lib/mock-data";
import { useLookups } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/survey-kelayakan")({
  head: () => ({ meta: [{ title: "Survey Kelayakan — AJIS" }, { name: "description", content: "Survey kelayakan calon anak binaan." }] }),
  component: Page,
});

function Page() {
  const { wilayah, kantor } = useLookups();
  const columns = useMemo<DataColumn<SurveiKelayakan>[]>(() => [
    { key: "tanggal", header: "Tanggal", render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>, searchable: (r) => r.tanggal },
    { key: "nama_calon", header: "Nama Calon", render: (r) => <span className="font-semibold text-foreground">{r.nama_calon}</span>, searchable: (r) => r.nama_calon },
    { key: "wilayah", header: "Wilayah", render: (r) => wilayah.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—" },
    { key: "kantor", header: "Kantor", render: (r) => <span className="text-muted-foreground">{kantor.get(r.kantor_id)?.kode ?? "—"}</span> },
    { key: "status_ortu", header: "Status Ortu", render: (r) => <StatusBadge tone="info">{r.status_ortu.replace("_", " ")}</StatusBadge> },
    { key: "kondisi_rumah", header: "Rumah", render: (r) => <StatusBadge tone={r.kondisi_rumah === "layak" ? "success" : r.kondisi_rumah === "cukup" ? "warning" : "danger"}>{r.kondisi_rumah}</StatusBadge> },
    { key: "skor", header: "Skor", render: (r) => <StatusBadge tone={r.skor_kelayakan >= 80 ? "success" : r.skor_kelayakan >= 65 ? "warning" : "danger"}>{r.skor_kelayakan}</StatusBadge> },
    { key: "rekom", header: "Rekomendasi", render: (r) => <StatusBadge tone={r.rekomendasi === "layak" ? "success" : r.rekomendasi === "ditinjau" ? "warning" : "danger"}>{r.rekomendasi.replace("_", " ")}</StatusBadge> },
  ], [wilayah, kantor]);

  return (
    <ResourcePage<SurveiKelayakan>
      slice="surveiKelayakan"
      title="Survey Kelayakan"
      subtitle="Hasil survey kelayakan calon anak binaan — input dilakukan dari menu Data Anak."
      crumbs={[{ label: "Data Anak" }, { label: "Survey Kelayakan" }]}
      labelSingular="survey"
      applyScope
      readOnly
      columns={columns}
      fields={[
        { name: "tanggal", label: "Tanggal", type: "date", required: true },
        { name: "nama_calon", label: "Nama Calon", type: "text", required: true },
        { name: "wilayah_pembinaan_id", label: "Wilayah", type: "number" },
        { name: "kantor_id", label: "Kantor", type: "number" },
        { name: "status_ortu", label: "Status Ortu", type: "select", options: [
          { value: "yatim", label: "Yatim" }, { value: "piatu", label: "Piatu" }, { value: "yatim_piatu", label: "Yatim Piatu" }, { value: "dhuafa", label: "Dhuafa" },
        ], defaultValue: "dhuafa" },
        { name: "penghasilan_wali", label: "Penghasilan Wali (Rp)", type: "number", defaultValue: 0 },
        { name: "jumlah_saudara", label: "Jumlah Saudara", type: "number", defaultValue: 0 },
        { name: "kondisi_rumah", label: "Kondisi Rumah", type: "select", options: [
          { value: "layak", label: "Layak" }, { value: "cukup", label: "Cukup" }, { value: "kurang", label: "Kurang" },
        ], defaultValue: "cukup" },
        { name: "skor_kelayakan", label: "Skor Kelayakan (0-100)", type: "number", defaultValue: 75 },
        { name: "rekomendasi", label: "Rekomendasi", type: "select", options: [
          { value: "layak", label: "Layak" }, { value: "ditinjau", label: "Ditinjau" }, { value: "tidak_layak", label: "Tidak Layak" },
        ], defaultValue: "ditinjau" },
        { name: "catatan", label: "Catatan", type: "textarea" },
      ]}
    />
  );
}
