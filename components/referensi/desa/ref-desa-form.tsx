"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefDesaInput, RefDesaUpdateInput, refDesaSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import { createRefDesa, updateRefDesa } from '@/app/actions/ref-desa';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface RefDesaFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    kode: string;
    nama: string;
    kecamatanId: number;
    isKelurahan: boolean;
    nomorIndukDesa: string | null;
    aktif: string;
  };
  kecamatanOptions: Array<{ id: number; nama: string }>;
}

export function RefDesaForm({ mode, initialData, kecamatanOptions }: RefDesaFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert kecamatanOptions to SearchableSelectOption format
  const kecamatanSelectOptions: SearchableSelectOption[] = kecamatanOptions.map(k => ({
    value: String(k.id),
    label: k.nama,
  }));

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RefDesaInput>({
    resolver: zodResolver(refDesaSchema),
    defaultValues: initialData
      ? {
          kode: initialData.kode,
          nama: initialData.nama,
          kecamatanId: initialData.kecamatanId,
          isKelurahan: initialData.isKelurahan,
          nomorIndukDesa: initialData.nomorIndukDesa || '',
          aktif: initialData.aktif as 'y' | 'n',
        }
      : {
          kode: '',
          nama: '',
          kecamatanId: 0,
          isKelurahan: false,
          nomorIndukDesa: '',
          aktif: 'y',
        },
  });


  const onSubmit = async (data: RefDesaInput) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'create') {
        result = await createRefDesa(data);
      } else {
        result = await updateRefDesa(initialData!.id, data as RefDesaUpdateInput);
      }

      if (result.success) {
        toast.success(mode === 'create' ? 'Desa berhasil ditambahkan' : 'Desa berhasil diubah');
        router.push('/dashboard/referensi/desa');
      } else {
        toast.error(result.error || 'Gagal menyimpan data desa');
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
          <Label htmlFor="kode">Kode Desa/Kelurahan <span className="text-destructive">*</span></Label>
          <Input id="kode" placeholder="Contoh: 1101010" {...register('kode')} disabled={isSubmitting} />
          {errors.kode && <p className="text-sm text-destructive">{errors.kode.message}</p>}
        </div>

        <div className="space-y-2">
          <SearchableSelect
            id="kecamatanId"
            label="Kecamatan"
            options={kecamatanSelectOptions}
            value={initialData?.kecamatanId.toString() || undefined}
            onValueChange={(value) => setValue('kecamatanId', Number(value))}
            placeholder="Pilih kecamatan"
            disabled={isSubmitting}
          />
          {errors.kecamatanId && <p className="text-sm text-destructive">{errors.kecamatanId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Desa/Kelurahan <span className="text-destructive">*</span></Label>
          <Input id="nama" placeholder="Contoh: Lamdom" {...register('nama')} disabled={isSubmitting} />
          {errors.nama && <p className="text-sm text-destructive">{errors.nama.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <SearchableSelect
              id="isKelurahan"
              label="Tipe"
              options={[
                { value: 'desa', label: 'Desa' },
                { value: 'kelurahan', label: 'Kelurahan' },
              ]}
              value={initialData?.isKelurahan ? 'kelurahan' : 'desa'}
              onValueChange={(value) => setValue('isKelurahan', value === 'kelurahan')}
              placeholder="Pilih tipe"
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
              onValueChange={(value) => setValue('aktif', value)}
              placeholder="Pilih status"
              disabled={isSubmitting}
            />
            {errors.aktif && <p className="text-sm text-destructive">{errors.aktif.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomorIndukDesa">Nomor Induk Desa</Label>
          <Input id="nomorIndukDesa" placeholder="Contoh: 000123" {...register('nomorIndukDesa')} disabled={isSubmitting} />
          {errors.nomorIndukDesa && <p className="text-sm text-destructive">{errors.nomorIndukDesa.message}</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : mode === 'create' ? 'Tambah Desa' : 'Simpan Perubahan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/dashboard/referensi/desa')} disabled={isSubmitting}>
          Batal
        </Button>
      </div>
    </form>
  );
}
