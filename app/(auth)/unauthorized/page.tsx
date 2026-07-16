import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Akses Ditolak</CardTitle>
          <CardDescription>
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Jika Anda merasa ini adalah sebuah kesalahan, silakan hubungi administrator sistem (Super Admin).
          </p>
          <div className="pt-4">
            <Link href="/dashboard" className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full">
              Kembali ke Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
