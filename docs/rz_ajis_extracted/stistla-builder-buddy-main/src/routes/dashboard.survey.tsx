import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge } from "@/components/ajis/status-badge";
import { survey, wilayahMap, type Survey } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/survey")({
  head: () => ({ meta: [{ title: "Survey — AJIS" }, { name: "description", content: "Survey wali santri & mutu pembinaan." }] }),
  component: SurveyPage,
});

const columns: DataColumn<Survey>[] = [
  { key: "tanggal", header: "Tanggal", render: (r) => <span className="font-mono text-xs">{r.tanggal}</span>, searchable: (r) => r.tanggal },
  { key: "judul", header: "Judul Survey", render: (r) => <span className="font-semibold text-foreground">{r.judul}</span>, searchable: (r) => r.judul },
  { key: "wilayah", header: "Wilayah", render: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—", searchable: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "" },
  { key: "responden", header: "Responden", render: (r) => <StatusBadge tone="info">{r.responden}</StatusBadge> },
  { key: "status", header: "Status", render: (r) => (
      <StatusBadge tone={r.status === "selesai" ? "success" : r.status === "berjalan" ? "warning" : "muted"}>{r.status}</StatusBadge>
    ) },
];

function SurveyPage() {
  const { user } = useRbac();
  const data = scopeFilter(survey, user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Survey"
        subtitle="Kuesioner wali santri & mutu pembinaan."
        crumbs={[{ label: "Aktivitas" }, { label: "Survey" }]}
        actions={<Button onClick={() => toast.info("Buat survey (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Buat Survey</Button>}
      />
      <DataTable columns={columns} data={data} labelSingular="survey" />
    </div>
  );
}