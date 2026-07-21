'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pembinaanDokumentasiSchema, pembinaanDokumentasiUpdateSchema, type PembinaanDokumentasiInput, type PembinaanDokumentasiUpdateInput } from '@/lib/validation/schemas';
import { createPembinaanDokumentasiAction, updatePembinaanDokumentasiAction } from '@/app/actions/pembinaan-dokumentasi';
import { getSemesterOptions, getKantorOptions, getWilayahOptions } from '@/app/actions/dropdown-data';
import { ImageUpload } from '@/components/shared/image-upload';

interface DokumentasiFormProps {
  initialData?: Partial<PembinaanDokumentasiInput>;
  isEdit?: boolean;
  dokumentasiId?: number;
}

export function DokumentasiForm({ initialData, isEdit = false, dokumentasiId }: DokumentasiFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [semesterOptions, setSemesterOptions] = useState<{ value: number; label: string }[]>([]);
  const [kantorOptions, setKantorOptions] = useState<{ value: number; label: string }[]>([]);
  const [wilayahOptions, setWilayahOptions] = useState<{ value: number; label: string }[]>([]);
  const [imageData, setImageData] = useState<string | undefined>(initialData?.image);

  const form = useForm<z.infer<typeof pembinaanDokumentasiSchema>>({
    resolver: zodResolver(pembinaanDokumentasiSchema),
    defaultValues: initialData as z.infer<typeof pembinaanDokumentasiSchema> || {},
  });

  useEffect(() => {
    async function loadOptions() {
      const [semesterResult, kantorResult, wilayahResult] = await Promise.all([
        getSemesterOptions(),
        getKantorOptions(),
        getWilayahOptions()
      ]);
      
      if (semesterResult.success && semesterResult.data) {
        setSemesterOptions(semesterResult.data);
      }
      if (kantorResult.success && kantorResult.data) {
        setKantorOptions(kantorResult.data);
      }
      if (wilayahResult.success && wilayahResult.data) {
        setWilayahOptions(wilayahResult.data);
      }
    }
    loadOptions();
  }, []);

  const handleSubmit = async (data: z.infer<typeof pembinaanDokumentasiSchema>) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        image: imageData,
      };

      let result;
      if (isEdit && dokumentasiId) {
        result = await updatePembinaanDokumentasiAction(dokumentasiId, submitData);
      } else {
        result = await createPembinaanDokumentasiAction(submitData);
      }
      
      if (result.success) {
        toast.success(isEdit ? "Dokumentasi berhasil diperbarui" : "Dokumentasi berhasil ditambahkan");
        router.push("/dashboard/pembinaan-dokumentasi");
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
          <CardTitle>{isEdit ? 'Edit' : 'Tambah'} Dokumentasi Pembinaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Dokumentasi *</Label>
            <Input 
              id="nama" 
              {...form.register("nama")}
              placeholder="Nama dokumentasi"
              className={form.formState.errors.nama ? "border-red-500" : ""}
            />
            {form.formState.errors.nama && (
              <p className="text-sm text-destructive">{form.formState.errors.nama.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Gambar</Label>
            <ImageUpload
              value={imageData}
              onChange={setImageData}
              onRemove={() => setImageData(undefined)}
              disabled={isSubmitting}
              accept="image/*"
              maxSize={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="semesterId">Semester</Label>
              <Select 
                onValueChange={(value) => form.setValue("semesterId", Number(value))} 
                value={form.watch("semesterId")?.toString() || ""}
              >
                <SelectTrigger id="semesterId">
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kantorId">Kantor</Label>
              <Select 
                onValueChange={(value) => form.setValue("kantorId", Number(value))} 
                value={form.watch("kantorId")?.toString() || ""}
              >
                <SelectTrigger id="kantorId">
                  <SelectValue placeholder="Pilih kantor" />
                </SelectTrigger>
                <SelectContent>
                  {kantorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wilayahPembinaanId">Wilayah Pembinaan</Label>
              <Select 
                onValueChange={(value) => form.setValue("wilayahPembinaanId", Number(value))} 
                value={form.watch("wilayahPembinaanId")?.toString() || ""}
              >
                <SelectTrigger id="wilayahPembinaanId">
                  <SelectValue placeholder="Pilih wilayah" />
                </SelectTrigger>
                <SelectContent>
                  {wilayahOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uploadGdrive">Upload Google Drive</Label>
            <Input 
              id="uploadGdrive" 
              {...form.register("uploadGdrive")}
              placeholder="ID atau link Google Drive"
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
