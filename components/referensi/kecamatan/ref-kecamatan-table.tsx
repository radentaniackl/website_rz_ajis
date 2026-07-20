"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefKecamatanActions } from './ref-kecamatan-actions';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface RefKecamatanTableProps {
  data: Array<{ id: bigint; kode: string; nama: string; kabupatenNama: string | null; kodepos: string | null; aktif: string }>;
  total: number;
  currentPage: number;
  totalPages: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function RefKecamatanTable({ data, total, currentPage, totalPages, canEdit = true, canDelete = true }: RefKecamatanTableProps) {
  const pageSize = 20;
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, total);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Kecamatan</TableHead>
              <TableHead>Kabupaten</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Tidak ada data kecamatan
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-medium">{startRow + index}</TableCell>
                  <TableCell>{item.kode}</TableCell>
                  <TableCell>{item.nama}</TableCell>
                  <TableCell>{item.kabupatenNama || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.aktif === 'y' ? 'default' : 'secondary'}>
                      {item.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RefKecamatanActions id={Number(item.id)} canEdit={canEdit} canDelete={canDelete} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
            <Link href={`/dashboard/referensi/kecamatan?page=${currentPage - 1}`}>
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

              return currentPage === pageNum ? (
                <Button key={pageNum} variant="default" size="sm">
                  {pageNum}
                </Button>
              ) : (
                <Link key={pageNum} href={`/dashboard/referensi/kecamatan?page=${pageNum}`}>
                  <Button variant="outline" size="sm">{pageNum}</Button>
                </Link>
              );
            })}
          </div>

          {currentPage === totalPages || totalPages === 0 ? (
            <Button variant="outline" size="sm" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Link href={`/dashboard/referensi/kecamatan?page=${currentPage + 1}`}>
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
