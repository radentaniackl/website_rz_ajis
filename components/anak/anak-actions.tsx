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
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { forceDeleteAnakAction } from '@/app/actions/anak';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';
import { SurveyForm } from './survey-form';

interface AnakActionsProps {
  id: number;
  userRole?: number;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function AnakActions({ id, canEdit = true, canDelete = true }: AnakActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await forceDeleteAnakAction(id);
      if (result.success) {
        toast.success('Anak berhasil dihapus (permanen)');
        setIsDeleteDialogOpen(false);
      } else {
        const dependents = (result as any).dependents as Record<string, number> | undefined;
        if (dependents) {
          // Show dependent counts
          const keys = Object.keys(dependents).filter((k) => dependents[k] > 0);
          const list = keys.map((k) => `${k}: ${dependents[k]}`).join(', ');
          toast.error(result.error + ' ' + list);
        } else {
          toast.error(result.error || 'Gagal menghapus anak');
        }
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menghapus anak');
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
            <Link href={`/dashboard/anak/${id}`} className="flex items-center w-full">
              <Eye className="mr-2 h-4 w-4" />
              Detail
            </Link>
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuItem onClick={() => setIsSurveyOpen(true)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Isi Survey
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href={`/dashboard/anak/${id}/edit`} className="flex items-center w-full">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
            </>
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
            <DialogTitle>Hapus Anak</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin <strong>menghapus permanen</strong> data anak ini? Tindakan ini tidak dapat dikembalikan.
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

      <SurveyForm
        anakId={id}
        open={isSurveyOpen}
        onOpenChange={setIsSurveyOpen}
        onSubmitSuccess={() => {
          // You could optionally refresh data or trigger router.refresh() here
        }}
      />
    </>
  );
}
