'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Trash2, Search, MoreVertical, Download } from 'lucide-react';
import { deletePembinaanAction } from '@/app/actions/pembinaan';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const handleExport = () => {
    const headers = ['ID', 'Tanggal', 'Nama Anak', 'Kode Anak', 'Semester', 'Jenis Pembinaan', 'Judul Materi', 'Pemateri', 'Kehadiran', 'Tampil'];
    const csvContent = [
      headers.join(','),
      ...data.map(p => [
        p.id,
        `"${p.tglPembinaan || ''}"`,
        `"${p.anakNama || ''}"`,
        `"${p.anakKode || p.anakId || ''}"`,
        `"${p.semesterNama || p.semesterId || ''}"`,
        `"${p.jenisPembinaan || ''}"`,
        `"${p.judulMateri || ''}"`,
        `"${p.pemateri || ''}"`,
        `"${p.kehadiran || ''}"`,
        `"${p.tampil === 'y' ? 'Ya' : 'Tidak'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sesi-pembinaan-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data sesi pembinaan berhasil diexport');
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
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan nama anak, kode anak, materi, atau kode sesi..."
              defaultValue={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Anak</TableHead>
                <TableHead>Semester</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {search ? 'Tidak ada hasil pencarian' : 'Belum ada data sesi pembinaan'}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((pembinaan) => (
                  <TableRow key={pembinaan.id}>
                    <TableCell>{pembinaan.tglPembinaan}</TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{pembinaan.anakNama || `-`}</div>
                        {pembinaan.anakKode && (
                          <div className="text-xs text-muted-foreground">{pembinaan.anakKode}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{pembinaan.semesterNama || (pembinaan.semesterId ? `Semester ID: ${pembinaan.semesterId}` : '-')}</TableCell>
                    <TableCell>{pembinaan.jenisPembinaan || '-'}</TableCell>
                    <TableCell>{pembinaan.judulMateri || '-'}</TableCell>
                    <TableCell>{pembinaan.kehadiran || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={pembinaan.tampil === 'y' ? 'default' : 'secondary'}>
                        {pembinaan.tampil === 'y' ? 'Ya' : 'Tidak'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/sesi/${pembinaan.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/sesi/${pembinaan.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(pembinaan.id)}
                            disabled={isDeleting === pembinaan.id}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
