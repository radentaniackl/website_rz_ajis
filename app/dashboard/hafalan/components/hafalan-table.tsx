'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { deleteHafalanAction } from '@/app/actions/hafalan';

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface HafalanTableProps {
  data: any[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export function HafalanTable({
  data,
  total,
  currentPage,
  totalPages,
}: HafalanTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    router.push(`?${newParams.toString()}`);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data hafalan ini?')) {
      try {
        const result = await deleteHafalanAction(id);
        if (result.success) {
          toast.success('Data hafalan berhasil dihapus');
          router.refresh();
        } else {
          toast.error(result.error || 'Gagal menghapus data hafalan');
        }
      } catch (error) {
        toast.error('Gagal menghapus data hafalan');
      }
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Tidak ada data hafalan ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Anak</TableHead>
              <TableHead>Konten Uji</TableHead>
              <TableHead>Tanggal Pengujian</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((hafalan) => (
              <TableRow key={hafalan.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{hafalan.anakNama || '-'}</p>
                    <p className="text-xs text-muted-foreground">{hafalan.anakKode || '-'}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{hafalan.kontenUji}</p>
                    {hafalan.itemHafalanKonten && (
                      <p className="text-xs text-muted-foreground">{hafalan.itemHafalanKonten}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {formatDate(hafalan.tglPengujian)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{hafalan.semesterNama || '-'}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {hafalan.keterangan || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/hafalan/${hafalan.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/hafalan/${hafalan.id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(Number(hafalan.id))}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {data.length} dari {total} data
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
