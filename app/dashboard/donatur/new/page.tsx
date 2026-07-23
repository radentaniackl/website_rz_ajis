import { DonaturForm } from '@/components/donatur/donatur-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Tambah Donatur Baru',
};

export default function NewDonaturPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/donatur">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Donatur Baru</h1>
          <p className="text-sm text-muted-foreground">
            Lengkapi data donatur baru
          </p>
        </div>
      </div>

      <DonaturForm />
    </div>
  );
}
