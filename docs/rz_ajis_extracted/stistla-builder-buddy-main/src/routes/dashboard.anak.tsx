import { createFileRoute } from "@tanstack/react-router";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge } from "@/components/ajis/status-badge";
import { anak, wilayahMap, kantorMap, type Anak } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/anak")({
  head: () => ({ meta: [{ title: "Data Anak — AJIS" }, { name: "description", content: "Data Anak Juara binaan." }] }),
  component: AnakPage,
});

const columns: DataColumn<Anak>[] = [
  { key: "kode_lama", header: "ID", render: (r) => <span className="font-mono text-xs font-bold text-primary">{r.kode_lama}</span>, searchable: (r) => r.kode_lama },
  { key: "nama", header: "Nama Anak", render: (r) => (
      <div>
        <div className="font-semibold text-foreground">{r.nama}</div>
        <div className="text-[11px] text-muted-foreground">{r.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} · {r.tanggal_lahir}</div>
      </div>
    ), searchable: (r) => r.nama },
  { key: "wilayah", header: "Wilayah", render: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "—", searchable: (r) => wilayahMap.get(r.wilayah_pembinaan_id)?.nama_wilayah ?? "" },
  { key: "kantor", header: "Kantor", render: (r) => <span className="text-muted-foreground">{kantorMap.get(r.kantor_id)?.kode ?? "—"}</span> },
  { key: "wali", header: "Wali", render: (r) => (
      <div>
        <div className="font-medium text-foreground">{r.nama_wali}</div>
        <div className="text-[11px] text-muted-foreground">{r.no_hp_wali}</div>
      </div>
    ), searchable: (r) => r.nama_wali },
  { key: "status", header: "Status", render: (r) => (
      <StatusBadge tone={r.status === "aktif" ? "success" : r.status === "lulus" ? "info" : "muted"}>{r.status}</StatusBadge>
    ) },
];

function AnakPage() {
  const { user } = useRbac();
  const data = scopeFilter(anak, user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Data Anak"
        subtitle="Anak binaan Anak Juara, disaring sesuai scope Anda."
        crumbs={[{ label: "Data Anak" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info("Export CSV (demo)")}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button onClick={() => toast.info("Form tambah anak (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Tambah Anak</Button>
          </>
        }
      />
      <DataTable columns={columns} data={data} labelSingular="anak" />
    </div>
  );
}