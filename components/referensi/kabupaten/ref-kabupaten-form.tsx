"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefKabupatenInput, RefKabupatenUpdateInput, refKabupatenSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedPropinsi, setSelectedPropinsi] = useState<string>(
    initialData?.propinsiId.toString() ?? ''
  );

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

  useEffect(() => {
    if (initialData) {
      setSelectedPropinsi(initialData.propinsiId.toString());
    }
  }, [initialData]);

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
          <Label htmlFor="propinsiId">Propinsi <span className="text-destructive">*</span></Label>
          <Select
            defaultValue={initialData?.propinsiId.toString() || ''}
            onValueChange={(value: string) => {
              setSelectedPropinsi(value);
              setValue('propinsiId', Number(value));
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger id="propinsiId">
              <SelectValue placeholder="Pilih propinsi" />
            </SelectTrigger>
            <SelectContent>
              {propinsiOptions.map((propinsi) => (
                <SelectItem key={propinsi.id} value={propinsi.id.toString()}>
                  {propinsi.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.propinsiId && <p className="text-sm text-destructive">{errors.propinsiId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Kabupaten/Kota <span className="text-destructive">*</span></Label>
          <Input id="nama" placeholder="Contoh: Banda Aceh" {...register('nama')} disabled={isSubmitting} />
          {errors.nama && <p className="text-sm text-destructive">{errors.nama.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="isKota">Jenis</Label>
              <Select
                defaultValue={initialData?.isKota ? 'kota' : 'kabupaten'}
                onValueChange={(value: string) => setValue('isKota', value === 'kota')}
                disabled={isSubmitting}
              >
                <SelectTrigger id="isKota">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kabupaten">Kabupaten</SelectItem>
                  <SelectItem value="kota">Kota</SelectItem>
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
