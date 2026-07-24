'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { semesterSchema, semesterUpdateSchema, type SemesterInput, type SemesterUpdateInput } from '@/lib/validation/schemas';
import { createSemesterAction, updateSemesterAction } from '@/app/actions/semester';

interface SemesterFormProps {
  initialData?: Partial<SemesterInput>;
  isEdit?: boolean;
  semesterId?: number;
}

export function SemesterForm({ initialData, isEdit = false, semesterId }: SemesterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof semesterSchema>>({
    resolver: zodResolver(semesterSchema),
    defaultValues: initialData as z.infer<typeof semesterSchema> || {
      onprogress: 'n',
      lapsem: 'y',
    },
  });

  const handleSubmit = async (data: z.infer<typeof semesterSchema>) => {
    setIsSubmitting(true);
    try {
      let result;
      if (isEdit && semesterId) {
        result = await updateSemesterAction(semesterId, data);
      } else {
        result = await createSemesterAction(data);
      }
      
      if (result.success) {
        toast.success(isEdit ? "Semester berhasil diperbarui" : "Semester berhasil ditambahkan");
        router.push("/dashboard/semester");
        router.refresh();
      } else {
        toast.error(result.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Semester" : "Tambah Semester Baru"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Semester *</Label>
            <Input 
              id="nama" 
              {...form.register("nama")}
              placeholder="Contoh: Juli - Desember 2026"
              className={form.formState.errors.nama ? "border-red-500" : ""}
            />
            {form.formState.errors.nama && (
              <p className="text-sm text-destructive">{form.formState.errors.nama.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tglAwal">Tanggal Awal</Label>
              <Input 
                id="tglAwal" 
                type="date" 
                {...form.register("tglAwal")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tglAkhir">Tanggal Akhir</Label>
              <Input 
                id="tglAkhir" 
                type="date" 
                {...form.register("tglAkhir")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <SearchableSelect
                id="jenis"
                label="Jenis Semester"
                options={[
                  { value: 'ganjil', label: 'Ganjil' },
                  { value: 'genap', label: 'Genap' },
                ]}
                value={form.watch("jenis") || undefined}
                onValueChange={(value) => form.setValue("jenis", value)}
                placeholder="Pilih jenis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Input 
                id="tahun" 
                type="number" 
                min="2000" 
                max="2100"
                {...form.register("tahun", { 
                  valueAsNumber: true,
                  setValueAs: (v) => v === "" ? undefined : Number(v)
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <SearchableSelect
                id="onprogress"
                label="Status"
                options={[
                  { value: 'y', label: 'Aktif' },
                  { value: 'n', label: 'Tidak Aktif' },
                ]}
                value={form.watch("onprogress") || "n"}
                onValueChange={(value) => form.setValue("onprogress", value as 'y' | 'n')}
                placeholder="Pilih status"
              />
            </div>
            <div className="space-y-2">
              <SearchableSelect
                id="lapsem"
                label="Laporan Semester"
                options={[
                  { value: 'y', label: 'Ya' },
                  { value: 'n', label: 'Tidak' },
                ]}
                value={form.watch("lapsem") || "y"}
                onValueChange={(value) => form.setValue("lapsem", value as 'y' | 'n')}
                placeholder="Pilih status laporan"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Tanggal Donasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tglAwalDonasi">Tanggal Awal Donasi</Label>
                <Input 
                  id="tglAwalDonasi" 
                  type="date" 
                  {...form.register("tglAwalDonasi")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tglAkhirDonasi">Tanggal Akhir Donasi</Label>
                <Input 
                  id="tglAkhirDonasi" 
                  type="date" 
                  {...form.register("tglAkhirDonasi")}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Tanggal Saldo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tglAwalSaldo">Tanggal Awal Saldo</Label>
                <Input 
                  id="tglAwalSaldo" 
                  type="date" 
                  {...form.register("tglAwalSaldo")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tglAkhirSaldo">Tanggal Akhir Saldo</Label>
                <Input 
                  id="tglAkhirSaldo" 
                  type="date" 
                  {...form.register("tglAkhirSaldo")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kodeLama">Kode Lama</Label>
            <Input 
              id="kodeLama" 
              {...form.register("kodeLama")}
              placeholder="Kode lama semester"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : isEdit ? "Perbarui" : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
