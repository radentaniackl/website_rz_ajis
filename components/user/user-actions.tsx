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
import { MoreHorizontal, Pencil, Trash2, Eye, Key } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { deleteUserAction } from '@/app/actions/user';
import { toast } from 'sonner';

interface UserActionsProps {
  id: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function UserActions({ id, canEdit = true, canDelete = true }: UserActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUserAction(id);
      if (result.success) {
        toast.success('User berhasil dihapus (deactivated)');
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(result.error || 'Gagal menghapus user');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus user');
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
            <Link href={`/dashboard/users/${id}`} className="flex items-center w-full">
              <Eye className="mr-2 h-4 w-4" />
              Detail
            </Link>
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem>
              <Link href={`/dashboard/users/${id}/edit`} className="flex items-center w-full">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem>
              <Link href={`/dashboard/users/${id}/reset-password`} className="flex items-center w-full">
                <Key className="mr-2 h-4 w-4" />
                Reset Password
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
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin <strong>menonaktifkan</strong> user ini? User akan diubah statusnya menjadi nonaktif dan tidak dapat login.
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
