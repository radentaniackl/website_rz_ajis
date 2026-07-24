"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefKecamatanInput, RefKecamatanUpdateInput, refKecamatanSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { createRefKecamatan, updateRefKecamatan } from '@/app/actions/ref-kecamatan';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RefKecamatanFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    kode: string;
    nama: string;
    kabupatenId: number;
    kodepos: string | null;
    aktif: string;
  };
  kabupatenOptions: Array<{ id: number; nama: string }>;
}

export function RefKecamatanForm({ mode, initialData, kabupatenOptions }: RefKecamatanFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert kabupatenOptions to SearchableSelectOption format
  const kabupatenSelectOptions: SearchableSelectOption[] = kabupatenOptions.map(k => ({
    value: String(k.id),
    label: k.nama,
  }));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RefKecamatanInput>({
    resolver: zodResolver(refKecamatanSchema),
    defaultValues: initialData
      ? {
          kode: initialData.kode,
          nama: initialData.nama,
          kabupatenId: initialData.kabupatenId,
          kodepos: initialData.kodepos || '',
          aktif: initialData.aktif as 'y' | 'n',
        }
      : {
          kode: '',
          nama: '',
          kabupatenId: 0,
          kodepos: '',
          aktif: 'y',
        },
  });


  const onSubmit = async (data: RefKecamatanInput) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'create') {
        result = await createRefKecamatan(data);
      } else {
        result = await updateRefKecamatan(initialData!.id, data as RefKecamatanUpdateInput);
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Kecamatan berhasil ditambahkan' : 'Kecamatan berhasil diubah');
        router.push('/dashboard/referensi/kecamatan');
      } else {
        toast.error(result.error || 'Gagal menyimpan data kecamatan');
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
          <Label htmlFor="kode">Kode Kecamatan <span className="text-destructive">*</span></Label>
          <Input id="kode" placeholder="Contoh: 1101010" {...register('kode')} disabled={isSubmitting} />
          {errors.kode && <p className="text-sm text-destructive">{errors.kode.message}</p>}
        </div>

        <div className="space-y-2">
          <SearchableSelect
            id="kabupatenId"
            label="Kabupaten"
            options={kabupatenSelectOptions}
            value={initialData?.kabupatenId.toString() || undefined}
            onValueChange={(value) => setValue('kabupatenId', Number(value))}
            placeholder="Pilih kabupaten"
            disabled={isSubmitting}
          />
          {errors.kabupatenId && <p className="text-sm text-destructive">{errors.kabupatenId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Kecamatan <span className="text-destructive">*</span></Label>
          <Input id="nama" placeholder="Contoh: Kuta Alam" {...register('nama')} disabled={isSubmitting} />
          {errors.nama && <p className="text-sm text-destructive">{errors.nama.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="kodepos">Kodepos</Label>
          <Input id="kodepos" placeholder="Contoh: 23231" {...register('kodepos')} disabled={isSubmitting} />
          {errors.kodepos && <p className="text-sm text-destructive">{errors.kodepos.message}</p>}
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
            onValueChange={(value) => setValue('aktif', value)}
            placeholder="Pilih status"
            disabled={isSubmitting}
          />
          {errors.aktif && <p className="text-sm text-destructive">{errors.aktif.message}</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Tambah Kecamatan' : 'Simpan Perubahan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/referensi/kecamatan')} disabled={isSubmitting}>
          Batal
        </Button>
      </div>
    </form>
  );
}
