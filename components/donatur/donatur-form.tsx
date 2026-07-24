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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { donaturSchema, donaturUpdateSchema, type DonaturInput, type DonaturUpdateInput } from '@/lib/validation/schemas';
import { createDonaturAction, updateDonaturAction } from '@/app/actions/donatur';
import { getDesaOptions, getKantorOptions } from '@/app/actions/dropdown-data';

interface DonaturFormProps {
  initialData?: Partial<DonaturInput>;
  isEdit?: boolean;
  donaturId?: number;
}

export function DonaturForm({ initialData, isEdit = false, donaturId }: DonaturFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [desaOptions, setDesaOptions] = useState<{ value: number; label: string }[]>([]);
  const [kantorOptions, setKantorOptions] = useState<{ value: number; label: string }[]>([]);

  const form = useForm<z.infer<typeof donaturSchema>>({
    resolver: zodResolver(donaturSchema),
    defaultValues: initialData as z.infer<typeof donaturSchema> || {
      aktif: 'y',
      kirimSms: 'n',
      jenisKelamin: 't',
    },
  });

  useEffect(() => {
    async function loadOptions() {
      const kantorResult = await getKantorOptions();
      if (kantorResult.success && kantorResult.data) {
        setKantorOptions(kantorResult.data);
      }
    }
    loadOptions();
  }, []);

  const handleSubmit = async (data: z.infer<typeof donaturSchema>) => {
    setIsSubmitting(true);
    try {
      let result;
      if (isEdit && donaturId) {
        result = await updateDonaturAction(donaturId, data);
      } else {
        result = await createDonaturAction(data);
      }
      
      if (result.success) {
        toast.success(isEdit ? "Donatur berhasil diperbarui" : "Donatur berhasil ditambahkan");
        router.push("/dashboard/donatur");
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
      <Tabs defaultValue="identitas" className="w-full">
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-full w-max space-x-1">
            <TabsTrigger value="identitas">Identitas</TabsTrigger>
            <TabsTrigger value="kontak">Kontak</TabsTrigger>
            <TabsTrigger value="rekening">Rekening</TabsTrigger>
            <TabsTrigger value="lainnya">Lainnya</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="identitas">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Identitas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kodeLama">Kode Lama</Label>
                <Input 
                  id="kodeLama" 
                  {...form.register("kodeLama")}
                  placeholder="Kode lama donatur"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                <Input 
                  id="namaLengkap" 
                  {...form.register("namaLengkap")}
                  placeholder="Nama lengkap donatur"
                  className={form.formState.errors.namaLengkap ? "border-red-500" : ""}
                />
                {form.formState.errors.namaLengkap && (
                  <p className="text-sm text-destructive">{form.formState.errors.namaLengkap.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaPublikasi">Nama Publikasi</Label>
                <Input 
                  id="namaPublikasi" 
                  {...form.register("namaPublikasi")}
                  placeholder="Nama untuk publikasi"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tglLahir">Tanggal Lahir</Label>
                  <Input 
                    id="tglLahir" 
                    type="date" 
                    {...form.register("tglLahir")}
                  />
                </div>
                <div className="space-y-2">
                  <SearchableSelect
                    id="jenisKelamin"
                    label="Jenis Kelamin"
                    options={[
                      { value: 'l', label: 'Laki-laki' },
                      { value: 'p', label: 'Perempuan' },
                      { value: 't', label: 'Tidak Diketahui' },
                    ]}
                    value={form.watch("jenisKelamin") || "t"}
                    onValueChange={(value) => form.setValue("jenisKelamin", value as 'l' | 'p' | 't')}
                    placeholder="Pilih jenis kelamin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <SearchableSelect
                  id="statusDonatur"
                  label="Status Donatur"
                  options={[
                    { value: 'individu', label: 'Individu' },
                    { value: 'corporate', label: 'Corporate' },
                    { value: 'komunitas', label: 'Komunitas' },
                    { value: 'lembaga', label: 'Lembaga' },
                    { value: 'masjid', label: 'Masjid' },
                    { value: 'sekolah', label: 'Sekolah' },
                    { value: 'yayasan', label: 'Yayasan' },
                    { value: 'instansi', label: 'Instansi' },
                    { value: 'organisasi', label: 'Organisasi' },
                    { value: 'media', label: 'Media' },
                    { value: 'lainnya', label: 'Lainnya' },
                  ]}
                  value={form.watch("statusDonatur") || undefined}
                  onValueChange={(value) => form.setValue("statusDonatur", value)}
                  placeholder="Pilih status donatur"
                />
                {form.formState.errors.statusDonatur && (
                  <p className="text-sm text-destructive">{form.formState.errors.statusDonatur.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tglRegistrasi">Tanggal Registrasi</Label>
                <Input 
                  id="tglRegistrasi" 
                  type="date" 
                  {...form.register("tglRegistrasi")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SearchableSelect
                    id="aktif"
                    label="Status Aktif"
                    options={[
                      { value: 'y', label: 'Aktif' },
                      { value: 'n', label: 'Nonaktif' },
                      { value: 'p', label: 'Pending' },
                    ]}
                    value={form.watch("aktif") || "y"}
                    onValueChange={(value) => form.setValue("aktif", value as 'y' | 'n' | 'p')}
                    placeholder="Pilih status"
                  />
                </div>
                <div className="space-y-2">
                  <SearchableSelect
                    id="kirimSms"
                    label="Kirim SMS"
                    options={[
                      { value: 'y', label: 'Ya' },
                      { value: 'n', label: 'Tidak' },
                    ]}
                    value={form.watch("kirimSms") || "n"}
                    onValueChange={(value) => form.setValue("kirimSms", value as 'y' | 'n')}
                    placeholder="Pilih"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamatLengkap">Alamat Lengkap</Label>
                <Textarea 
                  id="alamatLengkap" 
                  {...form.register("alamatLengkap")}
                  placeholder="Alamat lengkap donatur"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamatSilaturahmi">Alamat Silaturahmi</Label>
                <Textarea 
                  id="alamatSilaturahmi" 
                  {...form.register("alamatSilaturahmi")}
                  placeholder="Alamat untuk silaturahmi"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kontak">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kontak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telp">Telepon</Label>
                  <Input 
                    id="telp" 
                    {...form.register("telp")}
                    placeholder="Nomor telepon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hp">HP</Label>
                  <Input 
                    id="hp" 
                    {...form.register("hp")}
                    placeholder="Nomor HP"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fax">Fax</Label>
                <Input 
                  id="fax" 
                  {...form.register("fax")}
                  placeholder="Nomor fax"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  {...form.register("email")}
                  placeholder="Alamat email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  {...form.register("website")}
                  placeholder="URL website"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Kontak Person</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaKontak">Nama Kontak</Label>
                    <Input 
                      id="namaKontak" 
                      {...form.register("namaKontak")}
                      placeholder="Nama kontak person"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telpKontak">Telepon Kontak</Label>
                      <Input 
                        id="telpKontak" 
                        {...form.register("telpKontak")}
                        placeholder="Nomor telepon kontak"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailKontak">Email Kontak</Label>
                      <Input 
                        id="emailKontak" 
                        type="email"
                        {...form.register("emailKontak")}
                        placeholder="Email kontak"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jabatanKontak">Jabatan Kontak</Label>
                    <Input 
                      id="jabatanKontak" 
                      {...form.register("jabatanKontak")}
                      placeholder="Jabatan kontak person"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rekening">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Rekening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaBank">Nama Bank</Label>
                <Input 
                  id="namaBank" 
                  {...form.register("namaBank")}
                  placeholder="Nama bank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noRekening">Nomor Rekening</Label>
                <Input 
                  id="noRekening" 
                  {...form.register("noRekening")}
                  placeholder="Nomor rekening"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="npwp">NPWP</Label>
                <Input 
                  id="npwp" 
                  {...form.register("npwp")}
                  placeholder="Nomor NPWP"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lainnya">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Lainnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <SearchableSelect
                  id="kantorDonaturId"
                  label="Kantor Donatur"
                  options={kantorOptions.map(o => ({ value: String(o.value), label: o.label }))}
                  value={form.watch("kantorDonaturId")?.toString() || undefined}
                  onValueChange={(value) => form.setValue("kantorDonaturId", Number(value))}
                  placeholder="Pilih kantor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niaRfo">NIA RFO</Label>
                <Input 
                  id="niaRfo" 
                  {...form.register("niaRfo")}
                  placeholder="Nomor NIA RFO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaRfo">Nama RFO</Label>
                <Input 
                  id="namaRfo" 
                  {...form.register("namaRfo")}
                  placeholder="Nama RFO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipePelayanan">Tipe Pelayanan</Label>
                <Input 
                  id="tipePelayanan" 
                  {...form.register("tipePelayanan")}
                  placeholder="Tipe pelayanan"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="verifikasi1"
                  checked={form.watch("verifikasi1")}
                  onCheckedChange={(checked) => form.setValue("verifikasi1", checked as boolean)}
                />
                <Label htmlFor="verifikasi1">Verifikasi 1</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="verifikasi2"
                  checked={form.watch("verifikasi2")}
                  onCheckedChange={(checked) => form.setValue("verifikasi2", checked as boolean)}
                />
                <Label htmlFor="verifikasi2">Verifikasi 2</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
