import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — AJIS Admin Panel" },
      { name: "description", content: "Masuk ke panel admin AJIS." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("superadmin");
  const [password, setPassword] = useState("demo");

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="text-lg font-extrabold">AJIS</div>
            <div className="text-xs opacity-80">Anak Juara Information System</div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold leading-tight">
            Kelola pembinaan Anak Juara dari satu panel.
          </h2>
          <p className="mt-3 max-w-md text-sm opacity-85">
            Master data kantor & wilayah, entri sesi & hafalan, dan laporan
            semester — dengan RBAC per Super Admin, Branch Admin, dan Korwil.
          </p>
        </div>
        <p className="text-xs opacity-70">© {new Date().getFullYear()} Anak Juara</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="ajis-card w-full max-w-md p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Masuk ke AJIS</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gunakan akun demo untuk melihat panel.</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Login berhasil (demo).");
              navigate({ to: "/dashboard" });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider">
                Username
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 pl-9"
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox defaultChecked /> Ingat saya
              </label>
              <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
                Lupa password?
              </Link>
            </div>
            <Button type="submit" className="h-11 w-full text-sm font-bold">
              Masuk
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo — kredensial tidak divalidasi. Klik <b>Masuk</b> untuk lanjut.
          </p>
        </div>
        <Toaster position="top-right" richColors />
      </div>
    </div>
  );
}