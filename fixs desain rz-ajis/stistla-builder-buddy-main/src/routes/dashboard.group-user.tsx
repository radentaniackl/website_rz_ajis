import { createFileRoute } from "@tanstack/react-router";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { GroupUser } from "@/lib/mock-data";

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
    <ResourcePage<GroupUser>
      slice="groupUser"
      title="Group User"
      subtitle="Definisi role RBAC untuk seluruh pengguna."
      crumbs={[{ label: "Pengguna" }, { label: "Group User" }]}
      addLabel="Tambah Group"
      labelSingular="group"
      columns={columns}
      fields={[
        { name: "nama", label: "Nama Group", type: "text", required: true },
        { name: "keterangan", label: "Keterangan", type: "textarea" },
        { name: "aktif", label: "Status", type: "select", options: [{ value: "y", label: "Aktif" }, { value: "n", label: "Nonaktif" }], defaultValue: "y" },
      ]}
    />
  );
}
