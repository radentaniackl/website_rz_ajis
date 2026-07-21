import { PembinaanForm } from '@/components/pembinaan/pembinaan-form';

export const metadata = {
  title: 'Tambah Sesi - AJIS',
  description: 'Tambah sesi pembinaan baru',
};

export default function NewPembinaanPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tambah Sesi Pembinaan</h1>
        <p className="text-muted-foreground">Buat sesi pembinaan baru</p>
      </div>
      <PembinaanForm />
    </div>
  );
}
