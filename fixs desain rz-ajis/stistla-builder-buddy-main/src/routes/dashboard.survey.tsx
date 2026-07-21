import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ajis/page-header";
import { StatusBadge } from "@/components/ajis/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { FormModal } from "@/components/ajis/form-modal";
import { useSlice, useLookups, useOptions } from "@/lib/data-store";
import { useRbac, scopeFilter } from "@/lib/rbac";
import type { JajakPendapat } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/survey")({
  head: () => ({ meta: [{ title: "Jajak Pendapat — AJIS" }, { name: "description", content: "Hasil jajak pendapat wilayah pembinaan." }] }),
  component: Page,
});

function Page() {
  const { rows, add } = useSlice<JajakPendapat>("jajakPendapat");
  const { user } = useRbac();
  const { wilayah } = useLookups();
  const opts = useOptions();
  const [open, setOpen] = useState(false);

  const data = useMemo(() => scopeFilter(rows as never, user) as JajakPendapat[], [rows, user]);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Jajak Pendapat"
        subtitle="Ringkasan hasil polling dari wilayah pembinaan."
        crumbs={[{ label: "Aktivitas" }, { label: "Jajak Pendapat" }]}
        actions={<Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Buat Jajak</Button>}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.map((p) => {
          const total = p.opsi.reduce((s, o) => s + o.votes, 0) || 1;
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono text-muted-foreground">{p.tanggal} · {wilayah.get(p.wilayah_pembinaan_id)?.nama_wilayah ?? "—"}</div>
                  <div className="mt-1 text-base font-extrabold text-foreground">{p.judul}</div>
                  <div className="text-xs text-muted-foreground">{p.pertanyaan}</div>
                </div>
                <StatusBadge tone={p.status === "selesai" ? "success" : p.status === "berjalan" ? "warning" : "muted"}>{p.status}</StatusBadge>
              </div>
              <div className="mt-4 space-y-2.5">
                {p.opsi.map((o, idx) => {
                  const pct = Math.round((o.votes / total) * 100);
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-foreground">{o.label}</span>
                        <span className="text-muted-foreground">{o.votes} · {pct}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-[11px] text-muted-foreground">Total responden: <span className="font-bold text-foreground">{total === 1 && p.opsi.every((o) => o.votes === 0) ? 0 : total}</span></div>
            </Card>
          );
        })}
      </div>

      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Buat Jajak Pendapat"
        description="Buat polling baru untuk wilayah pembinaan."
        fields={[
          { name: "judul", label: "Judul", type: "text", required: true },
          { name: "pertanyaan", label: "Pertanyaan", type: "text", required: true },
          { name: "wilayah_pembinaan_id", label: "Wilayah", type: "select", required: true, options: opts.wilayah },
          { name: "tanggal", label: "Tanggal", type: "date", required: true, defaultValue: new Date().toISOString().slice(0, 10) },
          { name: "opsi_csv", label: "Opsi (pisah koma)", type: "text", required: true, placeholder: "Ya, Tidak, Ragu" },
          { name: "status", label: "Status", type: "select", options: [{ value: "draft", label: "Draft" }, { value: "berjalan", label: "Berjalan" }, { value: "selesai", label: "Selesai" }], defaultValue: "draft" },
        ]}
        onSubmit={(v) => {
          const opsi = String(v.opsi_csv).split(",").map((s) => ({ label: s.trim(), votes: 0 })).filter((o) => o.label);
          const id = add({
            judul: String(v.judul), pertanyaan: String(v.pertanyaan),
            wilayah_pembinaan_id: Number(v.wilayah_pembinaan_id),
            tanggal: String(v.tanggal), status: String(v.status) as JajakPendapat["status"], opsi,
          } as Omit<JajakPendapat, "id">);
          toast.success(`Jajak pendapat #${id} dibuat`);
          setOpen(false);
        }}
      />
    </div>
  );
}
