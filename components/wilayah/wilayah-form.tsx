"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { wilayahSchema, type WilayahInput, type WilayahUpdateInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
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
  const [kantorOptions, setKantorOptions] = useState<SearchableSelectOption[]>([]);
  const [desaOptions, setDesaOptions] = useState<SearchableSelectOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);
      // Fetch kantor list
      const kantorRes = await fetch('/api/kantor/list');
      if (kantorRes.ok) {
        const kantorData = await kantorRes.json();
        setKantorOptions(
          (kantorData.data || []).map((k: { id: number; nama: string; kode: string }) => ({
            value: String(k.id),
            label: k.nama,
            subtitle: k.kode,
          }))
        );
      }

      // Fetch desa list
      const desaRes = await fetch('/api/referensi/desa/list');
      if (desaRes.ok) {
        const desaData = await desaRes.json();
        setDesaOptions(
          (desaData.data || []).map((d: { id: number; nama: string; kecamatanNama?: string; kabupatenNama?: string }) => ({
            value: String(d.id),
            label: d.nama,
            subtitle: d.kecamatanNama ? `${d.kecamatanNama}, ${d.kabupatenNama}` : undefined,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Gagal memuat data referensi');
    } finally {
      setLoadingDropdowns(false);
    }
  };

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
          <SearchableSelect
            id="kantorId"
            label="Kantor"
            options={kantorOptions}
            value={initialData?.kantorId ? String(initialData.kantorId) : undefined}
            onValueChange={(value) => setValue('kantorId', value ? Number(value) : undefined)}
            placeholder={loadingDropdowns ? 'Memuat...' : 'Pilih kantor'}
            disabled={isSubmitting || loadingDropdowns}
          />
          {errors.kantorId && (
            <p className="text-sm text-destructive">{errors.kantorId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <SearchableSelect
            id="desaId"
            label="Lokasi (Desa)"
            options={desaOptions}
            value={initialData?.desaId ? String(initialData.desaId) : undefined}
            onValueChange={(value) => setValue('desaId', value ? Number(value) : undefined)}
            placeholder={loadingDropdowns ? 'Memuat...' : 'Pilih desa'}
            disabled={isSubmitting || loadingDropdowns}
          />
          {errors.desaId && (
            <p className="text-sm text-destructive">{errors.desaId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <SearchableSelect
            id="statusApprove"
            label="Status Approve"
            options={[
              { value: 'y', label: 'Approved (y)' },
              { value: 't', label: 'Approved (t)' },
            ]}
            value={initialData?.statusApprove || undefined}
            onValueChange={(value) => setValue('statusApprove', value)}
            placeholder="Pilih status approve"
            disabled={isSubmitting}
          />
          {errors.statusApprove && (
            <p className="text-sm text-destructive">{errors.statusApprove.message}</p>
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
            onValueChange={(value) => setValue('aktif', value)}
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
