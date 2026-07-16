"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefDesaInput, RefDesaUpdateInput, refDesaSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  useEffect(() => {
    if (initialData) {
      setValue('kecamatanId', initialData.kecamatanId);
    }
  }, [initialData, setValue]);

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
          <Label htmlFor="kecamatanId">Kecamatan <span className="text-destructive">*</span></Label>
          <Select
            defaultValue={initialData?.kecamatanId.toString() || ''}
            onValueChange={(value: string) => setValue('kecamatanId', Number(value))}
            disabled={isSubmitting}
          >
            <SelectTrigger id="kecamatanId">
              <SelectValue placeholder="Pilih kecamatan" />
            </SelectTrigger>
            <SelectContent>
              {kecamatanOptions.map((kecamatan) => (
                <SelectItem key={kecamatan.id} value={kecamatan.id.toString()}>
                  {kecamatan.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.kecamatanId && <p className="text-sm text-destructive">{errors.kecamatanId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Desa/Kelurahan <span className="text-destructive">*</span></Label>
          <Input id="nama" placeholder="Contoh: Lamdom" {...register('nama')} disabled={isSubmitting} />
          {errors.nama && <p className="text-sm text-destructive">{errors.nama.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="isKelurahan">Tipe</Label>
            <Select
              defaultValue={initialData?.isKelurahan ? 'kelurahan' : 'desa'}
              onValueChange={(value: string) => setValue('isKelurahan', value === 'kelurahan')}
              disabled={isSubmitting}
            >
              <SelectTrigger id="isKelurahan">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desa">Desa</SelectItem>
                <SelectItem value="kelurahan">Kelurahan</SelectItem>
              </SelectContent>
            </Select>
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
