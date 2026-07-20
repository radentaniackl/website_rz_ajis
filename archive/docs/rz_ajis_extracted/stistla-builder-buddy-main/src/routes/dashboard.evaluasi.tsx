import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge } from "@/components/ajis/status-badge";
import { evaluasi, anakMap, wilayahMap, type Evaluasi } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/evaluasi")({
  head: () => ({ meta: [{ title: "Evaluasi — AJIS" }, { name: "description", content: "Evaluasi & penilaian anak binaan." }] }),
  component: EvaluasiPage,
});

function tone(skor: number) {
  if (skor >= 90) return "success" as const;
  if (skor >= 80) return "info" as const;
  if (skor >= 70) return "warning" as const;
  return "danger" as const;
}

const columns: DataColumn<Evaluasi>[] = [
  { key: "tanggal", header: "Tanggal", render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>, searchable: (r) => r.tanggal },
  { key: "anak", header: "Anak", render: (r) => <span className="font-semibold text-foreground">{anakMap.get(r.anak_id)?.nama ?? "—"}</span>, searchable: (r) => anakMap.get(r.anak_id)?.nama ?? "" },
  { key: "wilayah", header: "Wilayah", render: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—", searchable: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "" },
  { key: "aspek", header: "Aspek", render: (r) => <StatusBadge tone="primary">{r.aspek}</StatusBadge>, searchable: (r) => r.aspek },
  { key: "semester", header: "Semester", render: (r) => <span className="font-mono text-xs">{r.semester}</span> },
  { key: "skor", header: "Skor", render: (r) => <StatusBadge tone={tone(r.skor)}>{r.skor}</StatusBadge> },
];

function EvaluasiPage() {
  const { user } = useRbac();
  const data = scopeFilter(evaluasi, user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Evaluasi"
        subtitle="Penilaian per aspek pembinaan anak binaan."
        crumbs={[{ label: "Aktivitas" }, { label: "Evaluasi" }]}
        actions={<Button onClick={() => toast.info("Form entri evaluasi (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Entri Evaluasi</Button>}
      />
      <DataTable columns={columns} data={data} labelSingular="evaluasi" />
    </div>
  );
}