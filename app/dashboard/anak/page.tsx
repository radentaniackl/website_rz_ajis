import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { AnakActions } from "@/components/anak/anak-actions";
import { Users, Search, Plus } from "lucide-react";
import { getAnakList } from "@/app/actions/anak";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";

async function AnakTable({ searchParams, userRole }: { searchParams: { page?: string; search?: string; field?: string; direction?: string }, userRole: number }) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;
  
  const result = await getAnakList({ page, pageSize: 20, search });
  
  if (!result.success || !result.data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Gagal memuat data anak
      </div>
    );
  }

  const { data, total } = result.data;

  if (data.length === 0) {
    return (
      <EmptyState 
        icon={Users}
        title="Belum ada data anak" 
        description={search ? "Tidak ada anak yang cocok dengan pencarian" : "Anda belum menambahkan data anak apapun."}
      />
    );
  }

  // Determine permissions based on user role
  const canEdit = userRole !== 9; // Korwil cannot edit anak
  const canDelete = userRole !== 9; // Korwil cannot delete anak

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Link 
                  href={`/dashboard/anak?${new URLSearchParams({ ...searchParams, field: 'kodeAnak', direction: searchParams.direction === 'asc' ? 'desc' : 'asc' }).toString()}`}
                  className="hover:text-foreground"
                >
                  Kode Anak
                </Link>
              </TableHead>
              <TableHead>
                <Link 
                  href={`/dashboard/anak?${new URLSearchParams({ ...searchParams, field: 'nik', direction: searchParams.direction === 'asc' ? 'desc' : 'asc' }).toString()}`}
                  className="hover:text-foreground"
                >
                  NIK
                </Link>
              </TableHead>
              <TableHead>
                <Link 
                  href={`/dashboard/anak?${new URLSearchParams({ ...searchParams, field: 'namaLengkap', direction: searchParams.direction === 'asc' ? 'desc' : 'asc' }).toString()}`}
                  className="hover:text-foreground"
                >
                  Nama Lengkap
                </Link>
              </TableHead>
              <TableHead>Jenis Kelamin</TableHead>
              <TableHead>Tanggal Lahir</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((anak) => (
              <TableRow key={anak.id}>
                <TableCell className="font-medium">{anak.kodeAnak}</TableCell>
                <TableCell>{anak.nik}</TableCell>
                <TableCell>{anak.namaLengkap}</TableCell>
                <TableCell>{anak.jnsKel === 'L' || anak.jnsKel === 'l' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                <TableCell>{anak.tglLahir ? new Date(anak.tglLahir).toLocaleDateString('id-ID') : '-'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    anak.aktif === 'y' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {anak.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <AnakActions id={Number(anak.id)} canEdit={canEdit} canDelete={canDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Menampilkan {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} dari {total} anak
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            asChild
          >
            <Link href={{ pathname: '/dashboard/anak', query: { ...searchParams, page: page - 1 } }}>
              Sebelumnya
            </Link>
          </Button>
          <span className="text-sm font-medium">
            Halaman {page} dari {Math.ceil(total / 20)}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page * 20 >= total}
            asChild
          >
            <Link href={{ pathname: '/dashboard/anak', query: { ...searchParams, page: page + 1 } }}>
              Selanjutnya
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

export default async function AnakPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  const userRole = session?.user?.id_group_user || 1;
  
  // Determine if user can create anak
  const canCreate = userRole !== 9; // Korwil cannot create anak

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Anak" 
        description="Kelola data anak binaan"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Anak</CardTitle>
            {canCreate && (
              <Link href="/dashboard/anak/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Anak
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                name="search"
                placeholder="Cari anak berdasarkan nama, kode, atau NIK..." 
                className="pl-10"
                defaultValue={resolvedSearchParams.search}
              />
            </div>
            <Button type="submit">Cari</Button>
            {resolvedSearchParams.search && (
              <Link href="/dashboard/anak">
                <Button variant="outline" type="button">Reset</Button>
              </Link>
            )}
          </form>
          
          <Suspense fallback={<div className="text-center py-8">Memuat data...</div>}>
            <AnakTable searchParams={resolvedSearchParams} userRole={userRole} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
