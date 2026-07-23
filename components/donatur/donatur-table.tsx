'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Edit, Trash2, Search, MoreVertical, Download } from 'lucide-react';
import { deleteDonaturAction } from '@/app/actions/donatur';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DonaturTableProps {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
}

export function DonaturTable({ data, total, page, pageSize, search }: DonaturTableProps) {
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
    router.push(`/dashboard/donatur?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/dashboard/donatur?${params.toString()}`);
  };

  const handleExport = () => {
    // Export data to CSV
    const headers = ['ID', 'Nama Lengkap', 'Nama Publikasi', 'Status Donatur', 'Email', 'Telepon', 'HP', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(donatur => [
        donatur.id,
        `"${donatur.namaLengkap || ''}"`,
        `"${donatur.namaPublikasi || ''}"`,
        `"${donatur.statusDonatur || ''}"`,
        `"${donatur.email || ''}"`,
        `"${donatur.telp || ''}"`,
        `"${donatur.hp || ''}"`,
        `"${donatur.aktif === 'y' ? 'Aktif' : 'Nonaktif'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `donatur-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data berhasil diexport');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus donatur ini?')) {
      return;
    }

    setIsDeleting(id);
    try {
      const result = await deleteDonaturAction(id);
      if (result.success) {
        toast.success('Donatur berhasil dihapus');
        router.refresh();
      } else {
        toast.error(result.error || 'Gagal menghapus donatur');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus');
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      'individu': { label: 'Individu', variant: 'default' },
      'corporate': { label: 'Corporate', variant: 'secondary' },
      'komunitas': { label: 'Komunitas', variant: 'outline' },
      'lembaga': { label: 'Lembaga', variant: 'outline' },
      'masjid': { label: 'Masjid', variant: 'secondary' },
      'sekolah': { label: 'Sekolah', variant: 'outline' },
      'yayasan': { label: 'Yayasan', variant: 'secondary' },
      'instansi': { label: 'Instansi', variant: 'outline' },
      'organisasi': { label: 'Organisasi', variant: 'outline' },
      'media': { label: 'Media', variant: 'outline' },
      'lainnya': { label: 'Lainnya', variant: 'outline' },
    };
    const config = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAktifBadge = (aktif: string) => {
    if (aktif === 'y') {
      return <Badge variant="default" className="bg-green-500">Aktif</Badge>;
    } else if (aktif === 'n') {
      return <Badge variant="outline">Nonaktif</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari donatur..."
              value={search}
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
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Status Donatur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Tidak ada data donatur
                  </TableCell>
                </TableRow>
              ) : (
                data.map((donatur) => (
                  <TableRow key={donatur.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{donatur.namaLengkap}</div>
                        {donatur.namaPublikasi && donatur.namaPublikasi !== donatur.namaLengkap && (
                          <div className="text-sm text-muted-foreground">{donatur.namaPublikasi}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(donatur.statusDonatur)}</TableCell>
                    <TableCell>{donatur.email || '-'}</TableCell>
                    <TableCell>{donatur.hp || donatur.telp || '-'}</TableCell>
                    <TableCell>{getAktifBadge(donatur.aktif)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/donatur/${donatur.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/donatur/${donatur.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(donatur.id)} disabled={isDeleting === donatur.id}>
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
