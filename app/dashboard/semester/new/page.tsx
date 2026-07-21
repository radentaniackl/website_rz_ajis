import { SemesterForm } from '@/components/semester/semester-form';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Tambah Semester Baru',
};

export default function NewSemesterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Semester Baru"
        description="Lengkapi data semester baru"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/semester">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        }
      />

      <SemesterForm />
    </div>
  );
}
