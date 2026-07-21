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
import { UserActions } from './user-actions';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface UserTableProps {
  data: Array<{
    id: bigint;
    kodeLama: number | null;
    username: string;
    email: string | null;
    nik: string | null;
    kantorId: number | null;
    groupUserId: number | null;
    aktif: string;
    mustResetPassword: boolean;
    failedLoginAttempts: number;
    lockedUntil: string | null;
  }>;
  total: number;
  currentPage: number;
  totalPages: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function UserTable({
  data,
  total,
  currentPage,
  totalPages,
  canEdit = true,
  canDelete = true,
}: UserTableProps) {
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
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Kantor ID</TableHead>
              <TableHead>Group User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Password Reset</TableHead>
              <TableHead>Locked</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  Tidak ada data user
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id.toString()}>
                  <TableCell className="font-medium">{startRow + index}</TableCell>
                  <TableCell>{item.kodeLama || '-'}</TableCell>
                  <TableCell>{item.username}</TableCell>
                  <TableCell>{item.email || '-'}</TableCell>
                  <TableCell>{item.nik || '-'}</TableCell>
                  <TableCell>{item.kantorId ? String(item.kantorId) : '-'}</TableCell>
                  <TableCell>{item.groupUserId ? String(item.groupUserId) : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={item.aktif === 'y' ? 'default' : 'secondary'}>
                      {item.aktif === 'y' ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.mustResetPassword ? 'destructive' : 'secondary'}>
                      {item.mustResetPassword ? 'Required' : 'Not Required'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.lockedUntil ? 'destructive' : 'secondary'}>
                      {item.lockedUntil ? 'Locked' : 'Unlocked'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions id={Number(item.id)} canEdit={canEdit} canDelete={canDelete} />
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
            <Link href={`/dashboard/users?page=${currentPage - 1}`}>
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
                  <Link key={pageNum} href={`/dashboard/users?page=${pageNum}`}>
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
            <Link href={`/dashboard/users?page=${currentPage + 1}`}>
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
