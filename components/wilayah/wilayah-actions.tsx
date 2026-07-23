"use client";

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteWilayahAction } from '@/app/actions/wilayah';
import { toast } from 'sonner';

interface WilayahActionsProps {
  id: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function WilayahActions({ id, canEdit = true, canDelete = true }: WilayahActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteWilayahAction(id);
      if (result.success) {
        toast.success('Wilayah berhasil dihapus (permanen)');
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(result.error || 'Gagal menghapus wilayah');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus wilayah');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Link href={`/dashboard/wilayah/${id}`} className="flex items-center w-full">
              <Eye className="mr-2 h-4 w-4" />
              Detail
            </Link>
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem>
              <Link href={`/dashboard/wilayah/${id}/edit`} className="flex items-center w-full">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Wilayah</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin <strong>menghapus permanen</strong> wilayah ini? Tindakan ini akan
              menghapus data dari basis data dan tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
