"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { kantorSchema, type KantorInput, type KantorUpdateInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { createKantorAction, updateKantorAction } from '@/app/actions/kantor';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface KantorFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    kode: string;
    nama: string;
    alamat: string | null;
    noTelp: string | null;
    parentId: number | null;
    parentSecondId: number | null;
    kodeProgramRz: string | null;
    jenis: string | null;
    kodeKantorLegacy: string | null;
    aktif: string;
  };
}

export function KantorForm({ mode, initialData }: KantorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<KantorInput>({
    resolver: zodResolver(kantorSchema),
    defaultValues: initialData
      ? {
          kode: initialData.kode,
          nama: initialData.nama,
          alamat: initialData.alamat || '',
          noTelp: initialData.noTelp || '',
          parentId: initialData.parentId || undefined,
          parentSecondId: initialData.parentSecondId || undefined,
          kodeProgramRz: initialData.kodeProgramRz || '',
          jenis: initialData.jenis || '',
          kodeKantorLegacy: initialData.kodeKantorLegacy || '',
          aktif: initialData.aktif as 'y' | 'n',
        }
      : {
          kode: '',
          nama: '',
          alamat: '',
          noTelp: '',
          parentId: undefined,
          parentSecondId: undefined,
          kodeProgramRz: '',
          jenis: '',
          kodeKantorLegacy: '',
          aktif: 'y',
        },
  });

  const onSubmit = async (data: KantorInput) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'create') {
        result = await createKantorAction(data);
      } else {
        result = await updateKantorAction(initialData!.id, data as KantorUpdateInput);
      }

      if (result.success) {
        toast.success(
          mode === 'create' ? 'Kantor berhasil ditambahkan' : 'Kantor berhasil diubah'
        );
        router.push('/dashboard/kantor');
      } else {
        toast.error(result.error || 'Gagal menyimpan data kantor');
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
          <Label htmlFor="kode">
            Kode Kantor <span className="text-destructive">*</span>
          </Label>
          <Input
            id="kode"
            placeholder="Contoh: K001"
            {...register('kode')}
            disabled={isSubmitting}
          />
          {errors.kode && (
            <p className="text-sm text-destructive">{errors.kode.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nama">
            Nama Kantor <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nama"
            placeholder="Contoh: Kantor Jakarta"
            {...register('nama')}
            disabled={isSubmitting}
          />
          {errors.nama && (
            <p className="text-sm text-destructive">{errors.nama.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="alamat">Alamat</Label>
          <Input
            id="alamat"
            placeholder="Alamat kantor"
            {...register('alamat')}
            disabled={isSubmitting}
          />
          {errors.alamat && (
            <p className="text-sm text-destructive">{errors.alamat.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="noTelp">No Telepon</Label>
          <Input
            id="noTelp"
            placeholder="Contoh: 021-12345678"
            {...register('noTelp')}
            disabled={isSubmitting}
          />
          {errors.noTelp && (
            <p className="text-sm text-destructive">{errors.noTelp.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kodeProgramRz">Kode Program RZ</Label>
          <Input
            id="kodeProgramRz"
            placeholder="Contoh: RZ-JKT"
            {...register('kodeProgramRz')}
            disabled={isSubmitting}
          />
          {errors.kodeProgramRz && (
            <p className="text-sm text-destructive">{errors.kodeProgramRz.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="jenis">Jenis</Label>
          <Input
            id="jenis"
            placeholder="Contoh: Kantor Cabang"
            {...register('jenis')}
            disabled={isSubmitting}
          />
          {errors.jenis && (
            <p className="text-sm text-destructive">{errors.jenis.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kodeKantorLegacy">Kode Kantor Legacy</Label>
          <Input
            id="kodeKantorLegacy"
            placeholder="Kode kantor legacy"
            {...register('kodeKantorLegacy')}
            disabled={isSubmitting}
          />
          {errors.kodeKantorLegacy && (
            <p className="text-sm text-destructive">{errors.kodeKantorLegacy.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <SearchableSelect
            id="aktif"
            label="Status"
            options={[
              { value: 'y', label: 'Aktif' },
              { value: 'n', label: 'Nonaktif' },
            ]}
            value={initialData?.aktif === 'y' ? 'y' : 'n'}
            onValueChange={(value) => setValue('aktif', value as 'y' | 'n')}
            placeholder="Pilih status"
            disabled={isSubmitting}
          />
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
              ? 'Tambah Kantor'
              : 'Simpan Perubahan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/kantor')}
          disabled={isSubmitting}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
