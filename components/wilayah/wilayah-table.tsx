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
import { WilayahActions } from './wilayah-actions';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface WilayahTableProps {
  data: Array<{
    id: bigint;
    kodeLama: number | null;
    namaWilayah: string;
    alamatWilayah: string | null;
    kantorId: number | null;
    desaId: number | null;
    statusApprove: string | null;
    aktif: string;
  }>;
  total: number;
  currentPage: number;
  totalPages: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function WilayahTable({
  data,
  total,
  currentPage,
  totalPages,
  canEdit = true,
  canDelete = true,
}: WilayahTableProps) {
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
              <TableHead>Kode Lama</TableHead>
              <TableHead>Nama Wilayah</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Kantor ID</TableHead>
              <TableHead>Desa ID</TableHead>
              <TableHead>Status Approve</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Tidak ada data wilayah
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-medium">{startRow + index}</TableCell>
                  <TableCell>{item.kodeLama || '-'}</TableCell>
                  <TableCell>{item.namaWilayah}</TableCell>
                  <TableCell>{item.alamatWilayah || '-'}</TableCell>
                  <TableCell>{item.kantorId ? String(item.kantorId) : '-'}</TableCell>
                  <TableCell>{item.desaId ? String(item.desaId) : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.statusApprove === 'y' || item.statusApprove === 't' ? 'default' : 'secondary'}>
                      {item.statusApprove === 'y' || item.statusApprove === 't' ? 'Approved' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.aktif === 'y' ? 'default' : 'secondary'}>
                      {item.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <WilayahActions id={Number(item.id)} canEdit={canEdit} canDelete={canDelete} />
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
            <Link href={`/dashboard/wilayah?page=${currentPage - 1}`}>
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
                  <Link key={pageNum} href={`/dashboard/wilayah?page=${pageNum}`}>
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
            <Link href={`/dashboard/wilayah?page=${currentPage + 1}`}>
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
