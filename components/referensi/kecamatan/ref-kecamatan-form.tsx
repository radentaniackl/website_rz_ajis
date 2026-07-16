"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefKecamatanInput, RefKecamatanUpdateInput, refKecamatanSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  useEffect(() => {
    if (initialData) {
      setValue('kabupatenId', initialData.kabupatenId);
    }
  }, [initialData, setValue]);

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
          <Label htmlFor="kabupatenId">Kabupaten <span className="text-destructive">*</span></Label>
          <Select
            defaultValue={initialData?.kabupatenId.toString() || ''}
            onValueChange={(value: string) => setValue('kabupatenId', Number(value))}
            disabled={isSubmitting}
          >
            <SelectTrigger id="kabupatenId">
              <SelectValue placeholder="Pilih kabupaten" />
            </SelectTrigger>
            <SelectContent>
              {kabupatenOptions.map((kabupaten) => (
                <SelectItem key={kabupaten.id} value={kabupaten.id.toString()}>
                  {kabupaten.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
