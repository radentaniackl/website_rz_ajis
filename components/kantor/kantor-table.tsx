"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KantorActions } from './kantor-actions';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface KantorTableProps {
  data: Array<{
    id: bigint;
    kode: string;
    nama: string;
    alamat: string | null;
    noTelp: string | null;
    kodeProgramRz: string | null;
    jenis: string | null;
    aktif: string;
  }>;
  total: number;
  currentPage: number;
  totalPages: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function KantorTable({
  data,
  total,
  currentPage,
  totalPages,
  canEdit = true,
  canDelete = true,
}: KantorTableProps) {
  const pageSize = 20;
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, total);

  const handleExport = () => {
    // Export data to CSV
    const headers = ['ID', 'Kode', 'Nama Kantor', 'Alamat', 'No Telepon', 'Kode Program RZ', 'Jenis', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.id,
        `"${item.kode || ''}"`,
        `"${item.nama || ''}"`,
        `"${item.alamat || ''}"`,
        `"${item.noTelp || ''}"`,
        `"${item.kodeProgramRz || ''}"`,
        `"${item.jenis || ''}"`,
        `"${item.aktif === 'y' ? 'Aktif' : 'Nonaktif'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kantor-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data berhasil diexport');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Kantor</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>No Telepon</TableHead>
              <TableHead>Kode Program RZ</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Tidak ada data kantor
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-medium">{startRow + index}</TableCell>
                  <TableCell>{item.kode}</TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell>{item.alamat || '-'}</TableCell>
                  <TableCell>{item.noTelp || '-'}</TableCell>
                  <TableCell>{item.kodeProgramRz || '-'}</TableCell>
                  <TableCell>{item.jenis || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.aktif === 'y' ? 'default' : 'secondary'}>
                      {item.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <KantorActions id={Number(item.id)} canEdit={canEdit} canDelete={canDelete} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan {total > 0 ? startRow : 0} sampai {endRow} dari {total} hasil
        </p>
        <div className="flex items-center gap-2">
          {currentPage === 1 ? (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Link href={`/dashboard/kantor?page=${currentPage - 1}`}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                currentPage === pageNum ? (
                  <Button key={pageNum} variant="default" size="sm">
                    {pageNum}
                  </Button>
                ) : (
                  <Link key={pageNum} href={`/dashboard/kantor?page=${pageNum}`}>
                    <Button variant="outline" size="sm">
                      {pageNum}
                    </Button>
                  </Link>
                )
              );
            })}
          </div>

          {currentPage === totalPages || totalPages === 0 ? (
            <Button variant="outline" size="sm" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Link href={`/dashboard/kantor?page=${currentPage + 1}`}>
              <Button variant="outline" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
