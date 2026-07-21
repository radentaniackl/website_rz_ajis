'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Trash2, Search } from 'lucide-react';
import { deletePembinaanAction } from '@/app/actions/pembinaan';
import { toast } from 'sonner';

interface PembinaanTableProps {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}

export function PembinaanTable({ data, total, page, pageSize, search }: PembinaanTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/dashboard/sesi?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/dashboard/sesi?${params.toString()}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi pembinaan ini?')) {
      return;
    }

    setIsDeleting(id);
    try {
      const result = await deletePembinaanAction(id);
      if (result.success) {
        toast.success('Sesi pembinaan berhasil dihapus');
        router.refresh();
      } else {
        toast.error(result.error || 'Gagal menghapus sesi pembinaan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari sesi pembinaan..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Anak</TableHead>
                <TableHead>Jenis Pembinaan</TableHead>
                <TableHead>Judul Materi</TableHead>
                <TableHead>Kehadiran</TableHead>
                <TableHead>Tampil</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? 'Tidak ada hasil pencarian' : 'Belum ada data sesi pembinaan'}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((pembinaan) => (
                  <TableRow key={pembinaan.id}>
                    <TableCell>{pembinaan.tglPembinaan}</TableCell>
                    <TableCell>{pembinaan.anakId}</TableCell>
                    <TableCell>{pembinaan.jenisPembinaan || '-'}</TableCell>
                    <TableCell>{pembinaan.judulMateri || '-'}</TableCell>
                    <TableCell>{pembinaan.kehadiran || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={pembinaan.tampil === 'y' ? 'default' : 'secondary'}>
                        {pembinaan.tampil === 'y' ? 'Ya' : 'Tidak'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/sesi/${pembinaan.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/sesi/${pembinaan.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pembinaan.id)}
                          disabled={isDeleting === pembinaan.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Menampilkan {data.length} dari {total} data
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
