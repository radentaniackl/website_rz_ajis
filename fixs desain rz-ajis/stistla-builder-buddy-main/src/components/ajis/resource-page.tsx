import { useMemo, useState, type ReactNode } from "react";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader, type Crumb } from "@/components/ajis/page-header";
import { DataTable, type DataColumn } from "@/components/ajis/data-table";
import { FormModal, type FieldSpec } from "@/components/ajis/form-modal";
import { DetailDrawer } from "@/components/ajis/detail-drawer";
import { ImportExcel } from "@/components/ajis/import-excel";
import { useSlice, type SliceKey } from "@/lib/data-store";
import { useRbac, scopeFilter } from "@/lib/rbac";

export interface ResourcePageProps<T extends { id: number }> {
  slice: SliceKey;
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  addLabel?: string;
  labelSingular?: string;
  columns: DataColumn<T>[];
  fields: FieldSpec[];
  applyScope?: boolean;
  extraActions?: React.ReactNode;
  emptyMessage?: string;
  /** Apply defaults when creating (e.g. fill kantor_id from active user) */
  createDefaults?: (user: ReturnType<typeof useRbac>["user"]) => Record<string, unknown>;
  /** Hide default CRUD toolbar (add + import) — for read-only pages */
  readOnly?: boolean;
  /** Disable Excel import button */
  hideImport?: boolean;
  /** Extra row-level menu items rendered above Edit */
  extraRowActions?: (row: T) => ReactNode;
}

export function ResourcePage<T extends { id: number }>({
  slice, title, subtitle, crumbs, addLabel, labelSingular = "data",
  columns, fields, applyScope = false, extraActions, emptyMessage, createDefaults,
  readOnly = false, hideImport = false, extraRowActions,
}: ResourcePageProps<T>) {
  const { rows, add, update, remove } = useSlice<T>(slice);
  const { user } = useRbac();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [viewing, setViewing] = useState<T | null>(null);

  const data = useMemo(() => (applyScope ? scopeFilter(rows as never, user) : rows), [rows, applyScope, user]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (row: T) => { setEditing(row); setFormOpen(true); };

  const initial = editing ?? (createDefaults ? createDefaults(user) : undefined);

  const exportCsv = () => {
    const header = fields.map((f) => f.label).join(",");
    const body = (data as T[]).map((r) =>
      fields.map((f) => JSON.stringify((r as Record<string, unknown>)[f.name] ?? "")).join(","),
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${slice}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV berhasil");
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={title}
        subtitle={subtitle}
        crumbs={crumbs}
        actions={
          <>
            {extraActions}
            <Button variant="outline" onClick={exportCsv}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            {!readOnly && !hideImport && (
              <ImportExcel
                slice={slice}
                title={title}
                fields={fields}
                onImport={(rows) => {
                  rows.forEach((r) => add(r as never));
                }}
              />
            )}
            {!readOnly && (
              <Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> {addLabel ?? "Tambah"}</Button>
            )}
          </>
        }
      />

      <DataTable
        columns={columns}
        data={data as T[]}
        labelSingular={labelSingular}
        emptyMessage={emptyMessage}
        onView={(r) => setViewing(r)}
        onEdit={readOnly ? undefined : (r) => openEdit(r)}
        onDelete={readOnly ? undefined : (r) => setPendingDelete(r)}
        extraRowActions={extraRowActions}
      />

      <DetailDrawer
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        title={`Detail ${labelSingular}`}
        row={viewing}
        fields={fields}
      />

      <FormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editing ? `Ubah ${labelSingular}` : `Tambah ${labelSingular}`}
        description={editing ? `Perbarui data dengan ID #${editing.id}.` : "Isi form berikut untuk menambah data baru."}
        fields={fields}
        initial={initial as Record<string, unknown>}
        submitLabel={editing ? "Perbarui" : "Simpan"}
        onSubmit={(values) => {
          const coerced: Record<string, unknown> = { ...values };
          for (const f of fields) {
            if ((f.name.endsWith("_id") || f.type === "number") && coerced[f.name] !== "" && coerced[f.name] !== undefined) {
              const n = Number(coerced[f.name]);
              coerced[f.name] = Number.isNaN(n) ? coerced[f.name] : n;
            }
            if (f.name.endsWith("_id") && coerced[f.name] === "") coerced[f.name] = null;
          }
          if (editing) {
            update({ ...(editing as object), ...coerced } as T);
            toast.success(`${title} #${editing.id} diperbarui`);
          } else {
            const id = add(coerced as never);
            toast.success(`${title} baru ditambahkan (ID #${id})`);
          }
          setFormOpen(false);
        }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <span className="font-semibold text-foreground">#{pendingDelete?.id}</span> akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) {
                  remove(pendingDelete.id);
                  toast.success(`Data #${pendingDelete.id} dihapus`);
                  setPendingDelete(null);
                }
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}