"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { refPropinsiSchema, type RefPropinsiInput, type RefPropinsiUpdateInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createRefPropinsi, updateRefPropinsi } from '@/app/actions/ref-propinsi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RefPropinsiFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    kode: string;
    nama: string;
    ibukota: string | null;
    aktif: string;
  };
}

export function RefPropinsiForm({ mode, initialData }: RefPropinsiFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RefPropinsiInput>({
    resolver: zodResolver(refPropinsiSchema),
    defaultValues: initialData
      ? {
          kode: initialData.kode,
          nama: initialData.nama,
          ibukota: initialData.ibukota || '',
          aktif: initialData.aktif as 'y' | 'n',
        }
      : {
          kode: '',
          nama: '',
          ibukota: '',
          aktif: 'y',
        },
  });

  const onSubmit = async (data: RefPropinsiInput) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'create') {
        result = await createRefPropinsi(data);
      } else {
        result = await updateRefPropinsi(initialData!.id, data as RefPropinsiUpdateInput);
      }

      if (result.success) {
        toast.success(
          mode === 'create' ? 'Propinsi berhasil ditambahkan' : 'Propinsi berhasil diubah'
        );
        router.push('/dashboard/referensi/propinsi');
        router.refresh();
      } else {
        toast.error(result.error || 'Gagal menyimpan data propinsi');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="kode">
              Kode Propinsi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="kode"
              placeholder="Contoh: 11"
              {...register('kode')}
              disabled={isSubmitting}
            />
            {errors.kode && (
              <p className="text-sm text-destructive">{errors.kode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nama">
              Nama Propinsi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nama"
              placeholder="Contoh: Aceh"
              {...register('nama')}
              disabled={isSubmitting}
            />
            {errors.nama && (
              <p className="text-sm text-destructive">{errors.nama.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ibukota">Ibukota</Label>
            <Input
              id="ibukota"
              placeholder="Contoh: Banda Aceh"
              {...register('ibukota')}
              disabled={isSubmitting}
            />
            {errors.ibukota && (
              <p className="text-sm text-destructive">{errors.ibukota.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="aktif">Status</Label>
            <Select
              defaultValue={initialData?.aktif === 'y' ? 'aktif' : 'nonaktif'}
              onValueChange={(value: string) => setValue('aktif', value === 'aktif' ? 'y' : 'n')}
              disabled={isSubmitting}
            >
              <SelectTrigger id="aktif">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
            {errors.aktif && (
              <p className="text-sm text-destructive">{errors.aktif.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Menyimpan...'
              : mode === 'create'
                ? 'Tambah Propinsi'
                : 'Simpan Perubahan'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/referensi/propinsi')}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
