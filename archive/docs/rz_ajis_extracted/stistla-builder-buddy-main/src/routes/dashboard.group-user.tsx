import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import { groupUser, type GroupUser } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/group-user")({
  head: () => ({ meta: [{ title: "Group User — AJIS" }, { name: "description", content: "Definisi role & permission pengguna." }] }),
  component: Page,
});

const columns: DataColumn<GroupUser>[] = [
  { key: "nama", header: "Nama Group", render: (r) => <span className="font-semibold text-foreground">{r.nama}</span>, searchable: (r) => r.nama },
  { key: "keterangan", header: "Keterangan", render: (r) => <span className="text-muted-foreground">{r.keterangan}</span>, searchable: (r) => r.keterangan },
  { key: "aktif", header: "Status", render: (r) => <StatusBadge tone={aktifTone(r.aktif)}>{r.aktif === "y" ? "Aktif" : "Nonaktif"}</StatusBadge> },
];

function Page() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Group User"
        subtitle="Definisi role RBAC untuk seluruh pengguna."
        crumbs={[{ label: "Pengguna" }, { label: "Group User" }]}
        actions={<Button onClick={() => toast.info("Form tambah group (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Tambah Group</Button>}
      />
      <DataTable columns={columns} data={groupUser} labelSingular="group" />
    </div>
  );
}