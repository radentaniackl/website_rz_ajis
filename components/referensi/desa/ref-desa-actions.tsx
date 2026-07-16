"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { deleteRefDesa } from '@/app/actions/ref-desa';
import { toast } from 'sonner';

interface RefDesaActionsProps {
  id: number;
}

export function RefDesaActions({ id }: RefDesaActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteRefDesa(id);
      if (result.success) {
        toast.success('Desa berhasil dihapus');
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(result.error || 'Gagal menghapus desa/kelurahan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus desa/kelurahan');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link href={`/dashboard/referensi/desa/${id}`} className="flex items-center w-full">
              <Eye className="mr-2 h-4 w-4" />
              Detail
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href={`/dashboard/referensi/desa/${id}/edit`} className="flex items-center w-full">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Desa/Kelurahan</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus desa/kelurahan ini?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
