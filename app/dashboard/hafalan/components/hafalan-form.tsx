'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hafalanSchema, type HafalanInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createHafalanAction, updateHafalanAction } from '@/app/actions/hafalan';

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

interface HafalanFormProps {
  isEdit?: boolean;
  initialData?: Partial<HafalanInput>;
  hafalanId?: number;
  anakList: { id: number; namaLengkap: string; kodeAnak: string }[];
  itemHafalanList: { id: number; konten: string; jenis?: number }[];
  semesterList: { id: number; nama: string }[];
  isLoading?: boolean;
}

export function HafalanForm({
  isEdit = false,
  initialData,
  hafalanId,
  anakList,
  itemHafalanList,
  semesterList,
  isLoading = false,
}: HafalanFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<HafalanInput>({
    resolver: zodResolver(hafalanSchema),
    defaultValues: initialData || {
      anakId: undefined,
      itemHafalanId: undefined,
      jenis: '',
      kontenUji: '',
      tglPengujian: new Date().toISOString().split('T')[0],
      keterangan: '',
      semesterId: undefined,
    },
  });

  const handleSubmit = async (data: HafalanInput) => {
    setIsSubmitting(true);
    try {
      let result;
      if (isEdit && hafalanId) {
        result = await updateHafalanAction(hafalanId, data);
      } else {
        result = await createHafalanAction(data);
      }
      
      if (result.success) {
        toast.success(isEdit ? 'Data hafalan berhasil diupdate' : 'Data hafalan berhasil disimpan');
        router.push('/dashboard/hafalan');
        router.refresh();
      } else {
        toast.error(result.error || 'Gagal menyimpan data hafalan');
      }
    } catch (error) {
      toast.error(isEdit ? 'Gagal mengupdate data hafalan' : 'Gagal menyimpan data hafalan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="anakId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anak *</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih anak" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {anakList.map((anak) => (
                      <SelectItem key={anak.id} value={anak.id.toString()}>
                        {anak.namaLengkap} ({anak.kodeAnak})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="itemHafalanId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Hafalan</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih item hafalan (opsional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {itemHafalanList.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.konten}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kontenUji"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konten Uji *</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Al-Fatihah, Juz 30, Halaman 1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jenis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Hafalan</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Surah, Juz, Halaman" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tglPengujian"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Pengujian</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? formatDate(field.value) : <span>Pilih tanggal</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="semesterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Semester</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih semester" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {semesterList.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id.toString()}>
                        {semester.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="keterangan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keterangan</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Catatan tambahan mengenai hafalan..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/hafalan')} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Update' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
