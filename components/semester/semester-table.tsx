'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import { deleteSemesterAction, setActiveSemesterAction } from '@/app/actions/semester';
import { toast } from 'sonner';

interface SemesterTableProps {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}

export function SemesterTable({ data, total, page, pageSize, search }: SemesterTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSettingActive, setIsSettingActive] = useState<number | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/dashboard/semester?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/dashboard/semester?${params.toString()}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus semester ini?')) {
      return;
    }

    setIsDeleting(id);
    try {
      const result = await deleteSemesterAction(id);
      if (result.success) {
        toast.success('Semester berhasil dihapus');
        router.refresh();
      } else {
        toast.error(result.error || 'Gagal menghapus semester');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetActive = async (id: number) => {
    setIsSettingActive(id);
    try {
      const result = await setActiveSemesterAction(id);
      if (result.success) {
        toast.success('Semester aktif berhasil diubah');
        router.refresh();
      } else {
        toast.error(result.error || 'Gagal mengubah semester aktif');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengubah semester aktif');
    } finally {
      setIsSettingActive(null);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari semester..."
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
                <TableHead>Nama Semester</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tahun</TableHead>
                <TableHead>Tanggal Awal</TableHead>
                <TableHead>Tanggal Akhir</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Laporan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada data semester
                  </TableCell>
                </TableRow>
              ) : (
                data.map((semester) => (
                  <TableRow key={semester.id}>
                    <TableCell className="font-medium">{semester.nama}</TableCell>
                    <TableCell>
                      <Badge variant={semester.jenis === 'ganjil' ? 'default' : 'secondary'}>
                        {semester.jenis === 'ganjil' ? 'Ganjil' : 'Genap'}
                      </Badge>
                    </TableCell>
                    <TableCell>{semester.tahun || '-'}</TableCell>
                    <TableCell>{formatDate(semester.tglAwal)}</TableCell>
                    <TableCell>{formatDate(semester.tglAkhir)}</TableCell>
                    <TableCell>
                      {semester.onprogress === 'y' ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          Tidak Aktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {semester.lapsem === 'y' ? (
                        <Badge variant="outline">Ya</Badge>
                      ) : (
                        <Badge variant="secondary">Tidak</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {semester.onprogress !== 'y' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetActive(semester.id)}
                            disabled={isSettingActive === semester.id}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/semester/${semester.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/semester/${semester.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(semester.id)}
                          disabled={isDeleting === semester.id}
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
            <div className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages} ({total} total)
            </div>
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
