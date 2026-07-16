import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, Search, Plus, MoreHorizontal } from "lucide-react";
import { getAnakList } from "@/app/actions/anak";
import { Suspense } from "react";

async function AnakTable({ searchParams }: { searchParams: { page?: string; search?: string } }) {
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Anak</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Nama Lengkap</TableHead>
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
                <TableCell>{anak.jnsKel === 'L' ? 'Laki-laki' : 'Perempuan'}</TableCell>
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
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Menampilkan {data.length} dari {total} anak
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams as any);
              params.set('page', String(page - 1));
              window.location.search = params.toString();
            }}
          >
            Sebelumnya
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page * 20 >= total}
            onClick={() => {
              const params = new URLSearchParams(searchParams as any);
              params.set('page', String(page + 1));
              window.location.search = params.toString();
            }}
          >
            Selanjutnya
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
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Anak
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari anak berdasarkan nama, kode, atau NIK..." 
                className="pl-10"
                defaultValue={resolvedSearchParams.search}
              />
            </div>
          </div>
          
          <Suspense fallback={<div className="text-center py-8">Memuat data...</div>}>
            <AnakTable searchParams={resolvedSearchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
