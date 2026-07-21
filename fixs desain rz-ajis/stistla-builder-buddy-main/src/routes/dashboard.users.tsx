import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResourcePage } from "@/components/ajis/resource-page";
import { StatusBadge, aktifTone } from "@/components/ajis/status-badge";
import type { DataColumn } from "@/components/ajis/data-table";
import type { User } from "@/lib/mock-data";
import { useLookups, useOptions } from "@/lib/data-store";

export const Route = createFileRoute("/dashboard/users")({
  head: () => ({ meta: [{ title: "Users — AJIS" }, { name: "description", content: "Manajemen akun pengguna AJIS." }] }),
  component: UsersPage,
});

function UsersPage() {
  const { kantor, groupUser, wilayah } = useLookups();
  const opts = useOptions();
  const columns = useMemo<DataColumn<User>[]>(() => [
    { key: "username", header: "Username", render: (r) => (
        <div>
          <div className="font-semibold text-foreground">{r.username}</div>
          <div className="text-[11px] text-muted-foreground">NIK: {r.nik}</div>
        </div>
      ), searchable: (r) => r.username },
    { key: "group", header: "Role", render: (r) => <StatusBadge tone="primary">{groupUser.get(r.group_user_id)?.nama ?? "—"}</StatusBadge> },
    { key: "kantor", header: "Kantor", render: (r) => kantor.get(r.kantor_id)?.nama ?? "—" },
    { key: "wilayah", header: "Wilayah", render: (r) => r.wilayah_ids.length === 0
        ? <span className="text-muted-foreground">Semua</span>
        : <span className="text-xs text-muted-foreground">{r.wilayah_ids.map((id) => wilayah.get(id)?.nama_wilayah).filter(Boolean).join(", ")}</span> },
    { key: "date_insert", header: "Dibuat", render: (r) => <span className="font-mono text-xs">{r.date_insert}</span> },
    { key: "aktif", header: "Status", render: (r) => <StatusBadge tone={aktifTone(r.aktif)}>{r.aktif === "y" ? "Aktif" : "Nonaktif"}</StatusBadge> },
  ], [kantor, groupUser, wilayah]);

  return (
    <ResourcePage<User>
      slice="users"
      title="Users"
      subtitle="Manajemen akun & assignment wilayah pembinaan."
      crumbs={[{ label: "Pengguna" }, { label: "Users" }]}
      addLabel="Tambah User"
      labelSingular="user"
      columns={columns}
      fields={[
        { name: "username", label: "Username", type: "text", required: true },
        { name: "nik", label: "NIK", type: "text", required: true },
        { name: "group_user_id", label: "Group User", type: "select", required: true, options: opts.groupUser },
        { name: "kantor_id", label: "Kantor", type: "select", required: true, options: opts.kantor },
        { name: "date_insert", label: "Tanggal Dibuat", type: "date", defaultValue: new Date().toISOString().slice(0, 10) },
        { name: "aktif", label: "Status", type: "select", options: [{ value: "y", label: "Aktif" }, { value: "n", label: "Nonaktif" }], defaultValue: "y" },
      ]}
      createDefaults={() => ({ wilayah_ids: [] })}
    />
  );
}
