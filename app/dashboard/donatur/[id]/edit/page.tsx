import { DonaturForm } from '@/components/donatur/donatur-form';
import { getDonaturDetail } from '@/app/actions/donatur';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Edit Donatur',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDonaturPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  const result = await getDonaturDetail(id);

  if (!result.success || !result.data) {
    return <div>Donatur tidak ditemukan</div>;
  }

  const donatur = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Donatur"
        description="Perbarui data donatur"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/donatur">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        }
      />

      <DonaturForm 
        initialData={donatur} 
        isEdit={true} 
        donaturId={id} 
      />
    </div>
  );
}
