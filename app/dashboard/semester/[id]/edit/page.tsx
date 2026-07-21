import { SemesterForm } from '@/components/semester/semester-form';
import { getSemesterDetail } from '@/app/actions/semester';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Edit Semester',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSemesterPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  const result = await getSemesterDetail(id);

  if (!result.success || !result.data) {
    return <div>Semester tidak ditemukan</div>;
  }

  const semester = result.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Semester"
        description="Perbarui data semester"
        action={
          <Button variant="outline" asChild>
            <Link href="/dashboard/semester">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
        }
      />

      <SemesterForm 
        initialData={semester} 
        isEdit={true} 
        semesterId={id} 
      />
    </div>
  );
}
