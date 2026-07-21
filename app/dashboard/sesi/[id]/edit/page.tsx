import { notFound } from 'next/navigation';
import { getPembinaanById } from '@/app/actions/pembinaan';
import { PembinaanForm } from '@/components/pembinaan/pembinaan-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Edit Sesi - AJIS`,
    description: 'Edit sesi pembinaan anak',
  };
}

export default async function EditPembinaanPage({ params }: { params: { id: string } }) {
  const result = await getPembinaanById(Number(params.id));

  if (!result.success || !result.data) {
    notFound();
  }

  const pembinaan = result.data;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/sesi/${pembinaan.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Sesi Pembinaan</h1>
          <p className="text-muted-foreground">Edit informasi sesi pembinaan</p>
        </div>
      </div>
      <PembinaanForm 
        initialData={pembinaan as any} 
        isEdit={true} 
        pembinaanId={Number(pembinaan.id)} 
      />
    </div>
  );
}
