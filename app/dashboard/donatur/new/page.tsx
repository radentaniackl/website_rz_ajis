import { DonaturForm } from '@/components/donatur/donatur-form';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Tambah Donatur Baru',
};

export default function NewDonaturPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Donatur Baru"
        description="Lengkapi data donatur baru"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/donatur">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        }
      />

      <DonaturForm />
    </div>
  );
}
