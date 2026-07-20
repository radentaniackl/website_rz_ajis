import { createFileRoute } from "@tanstack/react-router";
import { Plus, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import { users, kantorMap, groupUserMap, wilayahMap, type User } from "@/lib/mock-data";
import { useRbac, scopeFilter } from "@/lib/rbac";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/users")({
  head: () => ({ meta: [{ title: "Users — AJIS" }, { name: "description", content: "Manajemen akun pengguna AJIS." }] }),
  component: UsersPage,
});

const columns: DataColumn<User>[] = [
  { key: "username", header: "Username", render: (r) => (
      <div>
        <div className="font-semibold text-foreground">{r.username}</div>
        <div className="text-[11px] text-muted-foreground">NIK: {r.nik}</div>
      </div>
    ), searchable: (r) => r.username },
  { key: "group", header: "Role", render: (r) => <StatusBadge tone="primary">{groupUserMap.get(r.group_user_id)?.nama ?? "—"}</StatusBadge>, searchable: (r) => groupUserMap.get(r.group_user_id)?.nama ?? "" },
  { key: "kantor", header: "Kantor", render: (r) => kantorMap.get(r.kantor_id)?.nama ?? "—", searchable: (r) => kantorMap.get(r.kantor_id)?.nama ?? "" },
  { key: "wilayah", header: "Wilayah", render: (r) =>
      r.wilayah_ids.length === 0
        ? <span className="text-muted-foreground">Semua</span>
        : <span className="text-xs text-muted-foreground">{r.wilayah_ids.map((id) => wilayahMap.get(id)?.nama_wilayah).filter(Boolean).join(", ")}</span>
  },
  { key: "date_insert", header: "Dibuat", render: (r) => <span className="font-mono text-xs">{r.date_insert}</span> },
  { key: "aktif", header: "Status", render: (r) => <StatusBadge tone={aktifTone(r.aktif)}>{r.aktif === "y" ? "Aktif" : "Nonaktif"}</StatusBadge> },
];

function UsersPage() {
  const { user } = useRbac();
  const data = scopeFilter(users, user);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Users"
        subtitle="Manajemen akun & assignment wilayah pembinaan."
        crumbs={[{ label: "Pengguna" }, { label: "Users" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info("Reset password massal (demo)")}><Key className="mr-1.5 h-4 w-4" /> Reset Password</Button>
            <Button onClick={() => toast.info("Form tambah user (demo)")}><Plus className="mr-1.5 h-4 w-4" /> Tambah User</Button>
          </>
        }
      />
      <DataTable columns={columns} data={data} labelSingular="user" />
    </div>
  );
}