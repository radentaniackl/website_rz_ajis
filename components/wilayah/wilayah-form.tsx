"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wilayahSchema, type WilayahInput, type WilayahUpdateInput } from '@/lib/validation/schemas';
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
import { createWilayahAction, updateWilayahAction } from '@/app/actions/wilayah';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface WilayahFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    kodeLama: number | null;
    namaWilayah: string;
    alamatWilayah: string | null;
    kantorId: number | null;
    desaId: number | null;
    statusApprove: string | null;
    aktif: string;
  };
}

export function WilayahForm({ mode, initialData }: WilayahFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WilayahInput>({
    resolver: zodResolver(wilayahSchema),
    defaultValues: initialData
      ? {
          kodeLama: initialData.kodeLama || undefined,
          namaWilayah: initialData.namaWilayah,
          alamatWilayah: initialData.alamatWilayah || '',
          kantorId: initialData.kantorId || undefined,
          desaId: initialData.desaId || undefined,
          statusApprove: initialData.statusApprove || undefined,
          aktif: initialData.aktif as 'y' | 'n',
        }
      : {
          kodeLama: undefined,
          namaWilayah: '',
          alamatWilayah: '',
          kantorId: undefined,
          desaId: undefined,
          statusApprove: undefined,
          aktif: 'y',
        },
  });

  const onSubmit = async (data: WilayahInput) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'create') {
        result = await createWilayahAction(data);
      } else {
        result = await updateWilayahAction(initialData!.id, data as WilayahUpdateInput);
      }

      if (result.success) {
        toast.success(
          mode === 'create' ? 'Wilayah berhasil ditambahkan' : 'Wilayah berhasil diubah'
        );
        router.push('/dashboard/wilayah');
      } else {
        toast.error(result.error || 'Gagal menyimpan data wilayah');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="kodeLama">Kode Lama</Label>
          <Input
            id="kodeLama"
            type="number"
            placeholder="Contoh: 1"
            {...register('kodeLama', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.kodeLama && (
            <p className="text-sm text-destructive">{errors.kodeLama.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="namaWilayah">
            Nama Wilayah <span className="text-destructive">*</span>
          </Label>
          <Input
            id="namaWilayah"
            placeholder="Contoh: Jakarta Pusat"
            {...register('namaWilayah')}
            disabled={isSubmitting}
          />
          {errors.namaWilayah && (
            <p className="text-sm text-destructive">{errors.namaWilayah.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="alamatWilayah">Alamat Wilayah</Label>
          <Input
            id="alamatWilayah"
            placeholder="Alamat wilayah"
            {...register('alamatWilayah')}
            disabled={isSubmitting}
          />
          {errors.alamatWilayah && (
            <p className="text-sm text-destructive">{errors.alamatWilayah.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kantorId">Kantor ID</Label>
          <Input
            id="kantorId"
            type="number"
            placeholder="Kantor ID"
            {...register('kantorId', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.kantorId && (
            <p className="text-sm text-destructive">{errors.kantorId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="desaId">Desa ID</Label>
          <Input
            id="desaId"
            type="number"
            placeholder="Desa ID"
            {...register('desaId', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.desaId && (
            <p className="text-sm text-destructive">{errors.desaId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="statusApprove">Status Approve</Label>
            <Select
              defaultValue={initialData?.statusApprove || undefined}
              onValueChange={(value: string) => setValue('statusApprove', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="statusApprove">
                <SelectValue placeholder="Pilih status approve" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="y">Approved (y)</SelectItem>
                <SelectItem value="t">Approved (t)</SelectItem>
              </SelectContent>
            </Select>
          {errors.statusApprove && (
            <p className="text-sm text-destructive">{errors.statusApprove.message}</p>
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
              ? 'Tambah Wilayah'
              : 'Simpan Perubahan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/wilayah')}
          disabled={isSubmitting}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
