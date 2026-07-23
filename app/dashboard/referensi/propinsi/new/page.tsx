import { RefPropinsiForm } from '@/components/referensi/propinsi/ref-propinsi-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewRefPropinsiPage() {

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/referensi/propinsi">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Tambah Propinsi Baru</h1>
          <p className="text-sm text-muted-foreground">
            Isi form di bawah untuk menambah data propinsi baru
          </p>
        </div>
      </div>



      <RefPropinsiForm mode="create" />
    </div>
  );
}
