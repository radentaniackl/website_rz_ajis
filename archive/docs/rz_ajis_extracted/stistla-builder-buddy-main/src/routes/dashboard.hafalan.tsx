import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge } from "@/components/ajis/status-badge";
import { hafalan, anakMap, wilayahMap, type Hafalan } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/hafalan")({
  head: () => ({ meta: [{ title: "Hafalan — AJIS" }, { name: "description", content: "Catatan hafalan Al-Qur'an anak binaan." }] }),
  component: HafalanPage,
});

const columns: DataColumn<Hafalan>[] = [
  { key: "tanggal", header: "Tanggal", render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>, searchable: (r) => r.tanggal },
  { key: "anak", header: "Anak", render: (r) => <span className="font-semibold text-foreground">{anakMap.get(r.anak_id)?.nama ?? "—"}</span>, searchable: (r) => anakMap.get(r.anak_id)?.nama ?? "" },
  { key: "wilayah", header: "Wilayah", render: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—", searchable: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "" },
  { key: "surat", header: "Surat", render: (r) => <StatusBadge tone="primary">{r.surat}</StatusBadge>, searchable: (r) => r.surat },
  { key: "ayat", header: "Ayat", render: (r) => <span className="font-mono text-xs">{r.ayat_dari}–{r.ayat_sampai}</span> },
  { key: "nilai", header: "Nilai", render: (r) => (
      <StatusBadge tone={r.nilai === "A" ? "success" : r.nilai === "B" ? "info" : "warning"}>{r.nilai}</StatusBadge>
    ) },
];

function HafalanPage() {
  const { user } = useRbac();
  const data = scopeFilter(hafalan, user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Hafalan Al-Qur'an"
        subtitle="Setoran & progress hafalan anak binaan."
        crumbs={[{ label: "Aktivitas" }, { label: "Hafalan" }]}
        actions={<Button onClick={() => toast.info("Form entri hafalan (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Entri Hafalan</Button>}
      />
      <DataTable columns={columns} data={data} labelSingular="setoran" />
    </div>
  );
}