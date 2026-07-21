import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FormModal } from "@/components/ajis/form-modal";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { Anak, SurveiKelayakan } from "@/lib/mock-data";
import { useLookups, useOptions, useSlice } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/anak")({
  head: () => ({ meta: [{ title: "Data Anak — AJIS" }, { name: "description", content: "Data Anak Juara binaan." }] }),
  component: AnakPage,
});

function AnakPage() {
  const { wilayah, kantor } = useLookups();
  const opts = useOptions();
  const kelayakan = useSlice<SurveiKelayakan>("surveiKelayakan");
  const [surveyFor, setSurveyFor] = useState<Anak | null>(null);

  const columns = useMemo<DataColumn<Anak>[]>(() => [
    { key: "kode_lama", header: "ID", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode_lama}</span>, searchable: (r) => r.kode_lama },
    { key: "nama", header: "Nama Anak", render: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.nama}</div>
          <div className="text-[11px] text-muted-foreground">{r.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} · {r.tanggal_lahir}</div>
        </div>
      ), searchable: (r) => r.nama },
    { key: "wilayah", header: "Wilayah", render: (r) => wilayah.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—" },
    { key: "kantor", header: "Kantor", render: (r) => <span className="text-muted-foreground">{kantor.get(r.kantor_id)?.kode ?? "—"}</span> },
    { key: "wali", header: "Wali", render: (r) => (
        <div>
          <div className="font-medium text-foreground">{r.nama_wali}</div>
          <div className="text-[11px] text-muted-foreground">{r.no_hp_wali}</div>
        </div>
      ), searchable: (r) => r.nama_wali },
    { key: "status", header: "Status", render: (r) => (
        <StatusBadge tone={r.status === "aktif" ? "success" : r.status === "lulus" ? "info" : "muted"}>{r.status}</StatusBadge>
      ) },
  ], [wilayah, kantor]);

  return (
    <>
    <ResourcePage<Anak>
      slice="anak"
      title="Data Anak"
      subtitle="Anak binaan Anak Juara — disaring sesuai scope Anda."
      crumbs={[{ label: "Data Anak" }]}
      addLabel="Tambah Anak"
      labelSingular="anak"
      applyScope
      columns={columns}
      extraRowActions={(row) => (
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setSurveyFor(row);
          }}
        >
          <ClipboardCheck className="mr-2 h-4 w-4" /> Isi Survey Kelayakan
        </DropdownMenuItem>
      )}
      fields={[
        { name: "kode_lama", label: "Kode Anak", type: "text", required: true, placeholder: "A0011" },
        { name: "nama", label: "Nama Lengkap", type: "text", required: true },
        { name: "jenis_kelamin", label: "Jenis Kelamin", type: "select", required: true, options: [{ value: "L", label: "Laki-laki" }, { value: "P", label: "Perempuan" }], defaultValue: "L" },
        { name: "tanggal_lahir", label: "Tanggal Lahir", type: "date", required: true },
        { name: "wilayah_pembinaan_id", label: "Wilayah", type: "select", required: true, options: opts.wilayah },
        { name: "kantor_id", label: "Kantor", type: "select", required: true, options: opts.kantor },
        { name: "nama_wali", label: "Nama Wali", type: "text", required: true },
        { name: "no_hp_wali", label: "No. HP Wali", type: "text" },
        { name: "status", label: "Status", type: "select", options: [{ value: "aktif", label: "Aktif" }, { value: "lulus", label: "Lulus" }, { value: "keluar", label: "Keluar" }], defaultValue: "aktif" },
      ]}
    />

    <FormModal
      open={!!surveyFor}
      onOpenChange={(o) => !o && setSurveyFor(null)}
      title={`Survey Kelayakan — ${surveyFor?.nama ?? ""}`}
      description="Data survey akan disimpan ke modul Survey Kelayakan (read-only)."
      submitLabel="Simpan Survey"
      fields={[
        { name: "tanggal", label: "Tanggal Survey", type: "date", required: true, defaultValue: new Date().toISOString().slice(0, 10) },
        { name: "status_ortu", label: "Status Ortu", type: "select", required: true, options: [
          { value: "yatim", label: "Yatim" }, { value: "piatu", label: "Piatu" }, { value: "yatim_piatu", label: "Yatim Piatu" }, { value: "dhuafa", label: "Dhuafa" },
        ], defaultValue: "dhuafa" },
        { name: "penghasilan_wali", label: "Penghasilan Wali (Rp)", type: "number", defaultValue: 0 },
        { name: "jumlah_saudara", label: "Jumlah Saudara", type: "number", defaultValue: 0 },
        { name: "kondisi_rumah", label: "Kondisi Rumah", type: "select", required: true, options: [
          { value: "layak", label: "Layak" }, { value: "cukup", label: "Cukup" }, { value: "kurang", label: "Kurang" },
        ], defaultValue: "cukup" },
        { name: "skor_kelayakan", label: "Skor Kelayakan (0-100)", type: "number", defaultValue: 75 },
        { name: "rekomendasi", label: "Rekomendasi", type: "select", required: true, options: [
          { value: "layak", label: "Layak" }, { value: "ditinjau", label: "Ditinjau" }, { value: "tidak_layak", label: "Tidak Layak" },
        ], defaultValue: "ditinjau" },
        { name: "catatan", label: "Catatan", type: "textarea" },
      ]}
      onSubmit={(vals) => {
        if (!surveyFor) return;
        const payload: Record<string, unknown> = { ...vals };
        // coerce numbers
        ["penghasilan_wali", "jumlah_saudara", "skor_kelayakan"].forEach((k) => {
          if (payload[k] !== undefined) payload[k] = Number(payload[k]);
        });
        kelayakan.add({
          ...payload,
          nama_calon: surveyFor.nama,
          anak_id: surveyFor.id,
          wilayah_pembinaan_id: surveyFor.wilayah_pembinaan_id,
          kantor_id: surveyFor.kantor_id,
        } as never);
        toast.success(`Survey untuk ${surveyFor.nama} tersimpan`);
        setSurveyFor(null);
      }}
    />
    </>
  );
}
