"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefKabupatenInput, RefKabupatenUpdateInput, refKabupatenSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { createRefKabupaten, updateRefKabupaten } from '@/app/actions/ref-kabupaten';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RefKabupatenFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    kode: string;
    nama: string;
    propinsiId: number;
    isKota: boolean;
    ibukota: string | null;
    aktif: string;
  };
  propinsiOptions: Array<{ id: number; nama: string }>;
}

export function RefKabupatenForm({ mode, initialData, propinsiOptions }: RefKabupatenFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert propinsiOptions to SearchableSelectOption format
  const propinsiSelectOptions: SearchableSelectOption[] = propinsiOptions.map(p => ({
    value: String(p.id),
    label: p.nama,
  }));

  console.log('RefKabupatenForm rendered with:', { mode, initialData, propinsiOptions });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RefKabupatenInput>({
    resolver: zodResolver(refKabupatenSchema),
    defaultValues: initialData
      ? {
          kode: initialData.kode,
          nama: initialData.nama,
          propinsiId: initialData.propinsiId,
          isKota: initialData.isKota,
          ibukota: initialData.ibukota || '',
          aktif: initialData.aktif as 'y' | 'n',
        }
      : {
          kode: '',
          nama: '',
          propinsiId: 0,
          isKota: false,
          ibukota: '',
          aktif: 'y',
        },
  });

  console.log('RefKabupatenForm form initialized');

  const onSubmit = async (data: RefKabupatenInput) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'create') {
        result = await createRefKabupaten(data);
      } else {
        result = await updateRefKabupaten(initialData!.id, data as RefKabupatenUpdateInput);
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Kabupaten berhasil ditambahkan' : 'Kabupaten berhasil diubah');
        router.push('/dashboard/referensi/kabupaten');
      } else {
        toast.error(result.error || 'Gagal menyimpan data kabupaten/kota');
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
          <Label htmlFor="kode">Kode Kabupaten/Kota <span className="text-destructive">*</span></Label>
          <Input id="kode" placeholder="Contoh: 1101" {...register('kode')} disabled={isSubmitting} />
          {errors.kode && <p className="text-sm text-destructive">{errors.kode.message}</p>}
        </div>

        <div className="space-y-2">
          <SearchableSelect
            id="propinsiId"
            label="Propinsi"
            options={propinsiSelectOptions}
            value={initialData?.propinsiId.toString() || undefined}
            onValueChange={(value) => setValue('propinsiId', Number(value))}
            placeholder="Pilih propinsi"
            disabled={isSubmitting}
          />
          {errors.propinsiId && <p className="text-sm text-destructive">{errors.propinsiId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Kabupaten/Kota <span className="text-destructive">*</span></Label>
          <Input id="nama" placeholder="Contoh: Banda Aceh" {...register('nama')} disabled={isSubmitting} />
          {errors.nama && <p className="text-sm text-destructive">{errors.nama.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <SearchableSelect
              id="isKota"
              label="Jenis"
              options={[
                { value: 'kabupaten', label: 'Kabupaten' },
                { value: 'kota', label: 'Kota' },
              ]}
              value={initialData?.isKota ? 'kota' : 'kabupaten'}
              onValueChange={(value) => setValue('isKota', value === 'kota')}
              placeholder="Pilih jenis"
              disabled={isSubmitting}
            />
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
            {errors.aktif && <p className="text-sm text-destructive">{errors.aktif.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ibukota">Ibukota</Label>
          <Input id="ibukota" placeholder="Contoh: Meulaboh" {...register('ibukota')} disabled={isSubmitting} />
          {errors.ibukota && <p className="text-sm text-destructive">{errors.ibukota.message}</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Tambah Kabupaten' : 'Simpan Perubahan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/referensi/kabupaten')} disabled={isSubmitting}>
          Batal
        </Button>
      </div>
    </form>
  );
}
