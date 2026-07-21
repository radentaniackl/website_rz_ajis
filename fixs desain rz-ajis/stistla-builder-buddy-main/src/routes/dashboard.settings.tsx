import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ajis/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — AJIS" }, { name: "description", content: "Konfigurasi sistem AJIS." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Settings" subtitle="Konfigurasi sistem & preferensi umum." crumbs={[{ label: "Sistem" }, { label: "Settings" }]} />

      <form
        className="ajis-card divide-y divide-border"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Pengaturan disimpan (demo).");
        }}
      >
        <section className="p-6">
          <h3 className="text-base font-bold text-foreground">Informasi Aplikasi</h3>
          <p className="mt-1 text-xs text-muted-foreground">Nama & branding yang tampil di seluruh sistem.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Nama Aplikasi</Label>
              <Input defaultValue="AJIS — Anak Juara Information System" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Kontak Support</Label>
              <Input defaultValue="support@ajis.id" />
            </div>
          </div>
        </section>

        <section className="p-6">
          <h3 className="text-base font-bold text-foreground">Keamanan & Session</h3>
          <p className="mt-1 text-xs text-muted-foreground">Kebijakan expiry token & reset password.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Session Expiry (menit)</Label>
              <Input type="number" defaultValue={60} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Panjang Password Minimum</Label>
              <Input type="number" defaultValue={8} />
            </div>
          </div>
          <Separator className="my-5" />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Wajib Ganti Password Awal</div>
              <div className="text-xs text-muted-foreground">User baru diminta ganti password pada login pertama.</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Audit Log</div>
              <div className="text-xs text-muted-foreground">Catat setiap akses data sensitif.</div>
            </div>
            <Switch defaultChecked />
          </div>
        </section>

        <section className="p-6">
          <h3 className="text-base font-bold text-foreground">Batas Query</h3>
          <p className="mt-1 text-xs text-muted-foreground">Pengaturan performa (default sesuai PRD §2.1).</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Rows per Page</Label>
              <Input type="number" defaultValue={20} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Export Limit</Label>
              <Input type="number" defaultValue={10000} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider">Query Timeout (ms)</Label>
              <Input type="number" defaultValue={5000} />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 p-6">
          <Button type="button" variant="outline">Batal</Button>
          <Button type="submit">Simpan Perubahan</Button>
        </div>
      </form>
    </div>
  );
}