"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { anakSchema, type AnakInput, type AnakUpdateInput } from "@/lib/validation/schemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createAnakAction, updateAnakAction } from "@/app/actions/anak";
import { getDesaOptions, getWilayahOptions, getKantorOptions, getSdmWilayahOptions } from "@/app/actions/dropdown-data";
import { uploadFoto } from "@/app/actions/upload";

interface AnakFormProps {
  initialData?: Partial<AnakInput>;
  isEdit?: boolean;
  anakId?: number;
}

export function AnakForm({ initialData, isEdit = false, anakId }: AnakFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const router = useRouter();
  const [desaOptions, setDesaOptions] = useState<{ value: number; label: string }[]>([]);
  const [wilayahOptions, setWilayahOptions] = useState<{ value: number; label: string }[]>([]);
  const [kantorOptions, setKantorOptions] = useState<{ value: number; label: string }[]>([]);
  const [sdmOptions, setSdmOptions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    async function fetchDropdownData() {
      const [desa, wilayah, kantor, sdm] = await Promise.all([
        getDesaOptions(),
        getWilayahOptions(),
        getKantorOptions(),
        getSdmWilayahOptions(),
      ]);
      if (desa.success) setDesaOptions(desa.data);
      if (wilayah.success) setWilayahOptions(wilayah.data);
      if (kantor.success) setKantorOptions(kantor.data);
      if (sdm.success) setSdmOptions(sdm.data);
    }
    fetchDropdownData();

    // Set initial foto preview if editing
    if (initialData?.foto) {
      setPreviewFoto(initialData.foto as string);
    }
  }, [initialData]);

  const form = useForm<z.infer<typeof anakSchema>>({
    resolver: zodResolver(anakSchema),
    defaultValues: initialData as z.infer<typeof anakSchema> || {
      kodeAnak: "",
      nik: "",
      namaLengkap: "",
      namaPanggilan: "",
      agama: "",
      jnsKel: "L",
      tempatLahir: "",
      tglLahir: "",
      anakKe: undefined,
      dariSaudara: undefined,
      alamat: "",
      desaId: undefined,
      jenjangPendidikan: "",
      kelas: "",
      namaSekolah: "",
      alamatSekolah: "",
      jurusan: "",
      semester: "",
      namaPt: "",
      alamatPt: "",
      noRekening: "",
      pemilikRekening: "",
      namaBank: "",
      foto: "",
      nilai: "",
      pelajaranFavorit: "",
      jarakRumah: "",
      alatTransportasi: "",
      hobi: "",
      prestasi: "",
      noKartuKeluarga: "",
      asnaf: "",
      statusOrtu: "",
      statusSurvey: "",
      statusKelayakan: "",
      statusAnakJuara: "",
      statusTersantuni: "",
      statusPinjam: "",
      statusMentor: "",
      aktif: "y",
      alumniJuara: "",
      juara: "",
      wilayahPembinaanId: undefined,
      kantorId: undefined,
      sdmWilayahId: undefined,
      namaMentorManual: "",
      tglTerdaftar: "",
      tglPengajuan: "",
      namaLengkapAyah: "",
      alamatAyah: "",
      desaAyahId: undefined,
      pekerjaanAyah: "",
      penghasilanAyah: undefined,
      tglKematianAyah: "",
      penyebabKematianAyah: "",
      namaLengkapIbu: "",
      alamatIbu: "",
      desaIbuId: undefined,
      pekerjaanIbu: "",
      penghasilanIbu: undefined,
      tglKematianIbu: "",
      penyebabKematianIbu: "",
      namaLengkapWali: "",
      alamatWali: "",
      desaWaliId: undefined,
      pekerjaanWali: "",
      penghasilanWali: undefined,
      telpDihubungi: "",
      atasNama: "",
      hubunganKerabat: "",
      viaInput: "",
      approvalIjf: "",
      kodeProgramRz: "",
      niaRfoBook: "",
      namaRfoBook: "",
      tglPeminjaman: "",
      tglExpired: "",
      bookVia: "",
      userBook: "",
      tinggalBersama: "",
      namaTinggal: "",
      ketTinggal: "",
      penghasilanTinggal: "",
      pekerjaanTinggal: "",
      tidakSerumahOrtu: "",
      kodeKantorLegacy: "",
      kodeIjgsAnak: "",
      uploadGdrive: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof anakSchema>) => {
    setIsSubmitting(true);
    try {
      // Validate required fields before submission
      const requiredFields = [
        { field: 'kodeAnak', label: 'Kode Anak' },
        { field: 'nik', label: 'NIK' },
        { field: 'namaLengkap', label: 'Nama Lengkap' },
        { field: 'jnsKel', label: 'Jenis Kelamin' },
        { field: 'tglLahir', label: 'Tanggal Lahir' },
      ];

      const missingFields = requiredFields.filter(
        ({ field }) => !data[field as keyof typeof data]
      );

      if (missingFields.length > 0) {
        const missingFieldNames = missingFields.map(f => f.label).join(', ');
        toast.error(`Field wajib yang belum diisi: ${missingFieldNames}`);
        setIsSubmitting(false);
        return;
      }

      // Handle foto upload if file is selected
      let fotoUrl = data.foto;
      if (data.foto === "FILE_UPLOAD_PENDING" && fotoFile) {
        const uploadResult = await uploadFoto(fotoFile);
        if (!uploadResult.success) {
          toast.error(uploadResult.error || 'Gagal mengupload foto');
          setIsSubmitting(false);
          return;
        }
        fotoUrl = uploadResult.url;
      } else if (data.foto === "FILE_UPLOAD_PENDING") {
        // File was removed, set to empty
        fotoUrl = "";
      }

      // Update data with uploaded foto URL
      const submitData = { ...data, foto: fotoUrl };

      let result;
      if (isEdit && anakId) {
        result = await updateAnakAction(anakId, submitData);
      } else {
        result = await createAnakAction(submitData);
      }
      
      if (result.success) {
        toast.success(isEdit ? "Data anak berhasil diperbarui" : "Data anak berhasil ditambahkan");
        router.push("/dashboard/anak");
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
      <Tabs defaultValue="identitas" className="w-full max-w-full">
        <div className="w-full max-w-full overflow-x-auto pb-2 scrollbar-thin">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-max space-x-1">
            <TabsTrigger value="identitas">Identitas</TabsTrigger>
            <TabsTrigger value="pendidikan">Pendidikan</TabsTrigger>
            <TabsTrigger value="keluarga">Keluarga</TabsTrigger>
            <TabsTrigger value="ayah">Ayah</TabsTrigger>
            <TabsTrigger value="ibu">Ibu</TabsTrigger>
            <TabsTrigger value="wali">Wali</TabsTrigger>
            <TabsTrigger value="kontak">Kontak</TabsTrigger>
            <TabsTrigger value="karakter">Karakter</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="organisasi">Organisasi</TabsTrigger>
            <TabsTrigger value="peminjaman">Peminjaman</TabsTrigger>
            <TabsTrigger value="tinggal">Tinggal</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Identitas Dasar */}
        <TabsContent value="identitas">
          <Card>
            <CardHeader>
              <CardTitle>Identitas Dasar Anak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kodeAnak">Kode Anak *</Label>
                  <Input 
                    id="kodeAnak" 
                    {...form.register("kodeAnak")}
                    className={form.formState.errors.kodeAnak ? "border-red-500" : ""}
                  />
                  {form.formState.errors.kodeAnak && (
                    <p className="text-sm text-destructive">{form.formState.errors.kodeAnak.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nik">NIK *</Label>
                  <Input 
                    id="nik" 
                    {...form.register("nik")} 
                    maxLength={16}
                    className={form.formState.errors.nik ? "border-red-500" : ""}
                  />
                  {form.formState.errors.nik && (
                    <p className="text-sm text-destructive">{form.formState.errors.nik.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                <Input 
                  id="namaLengkap" 
                  {...form.register("namaLengkap")}
                  className={form.formState.errors.namaLengkap ? "border-red-500" : ""}
                />
                {form.formState.errors.namaLengkap && (
                  <p className="text-sm text-destructive">{form.formState.errors.namaLengkap.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namaPanggilan">Nama Panggilan</Label>
                  <Input id="namaPanggilan" {...form.register("namaPanggilan")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agama">Agama</Label>
                  <Select onValueChange={(value) => form.setValue("agama", value)} value={form.watch("agama") || ""}>
                    <SelectTrigger id="agama">
                      <SelectValue placeholder="Pilih agama" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Islam">Islam</SelectItem>
                      <SelectItem value="Kristen">Kristen</SelectItem>
                      <SelectItem value="Katolik">Katolik</SelectItem>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Buddha">Buddha</SelectItem>
                      <SelectItem value="Konghucu">Konghucu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jnsKel">Jenis Kelamin *</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("jnsKel", value as "L" | "P")} 
                    value={form.watch("jnsKel") || ""}
                  >
                    <SelectTrigger 
                      id="jnsKel"
                      className={form.formState.errors.jnsKel ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.jnsKel && (
                    <p className="text-sm text-destructive">{form.formState.errors.jnsKel.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tglLahir">Tanggal Lahir *</Label>
                  <Input 
                    id="tglLahir" 
                    type="date" 
                    {...form.register("tglLahir")}
                    className={form.formState.errors.tglLahir ? "border-red-500" : ""}
                  />
                  {form.formState.errors.tglLahir && (
                    <p className="text-sm text-destructive">{form.formState.errors.tglLahir.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                  <Input id="tempatLahir" {...form.register("tempatLahir")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anakKe">Anak Ke-</Label>
                  <Input 
                    id="anakKe" 
                    type="number" 
                    {...form.register("anakKe", { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === "" ? undefined : Number(v)
                    })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dariSaudara">Dari Saudara</Label>
                  <Input 
                    id="dariSaudara" 
                    type="number" 
                    {...form.register("dariSaudara", { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === "" ? undefined : Number(v)
                    })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desaId">Desa</Label>
                  <SearchableSelect
                    id="desaId"
                    options={desaOptions.map(o => ({ value: String(o.value), label: o.label }))}
                    value={form.watch("desaId")?.toString()}
                    onValueChange={(v) => form.setValue("desaId", v ? Number(v) : undefined)}
                    placeholder="Ketik untuk cari desa..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Textarea id="alamat" {...form.register("alamat")} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="foto">Foto</Label>
                <div className="space-y-3">
                  {previewFoto && (
                    <div className="relative w-32 h-32 mx-auto">
                      <img
                        src={previewFoto}
                        alt="Preview Foto"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewFoto(null);
                          setFotoFile(null);
                          form.setValue("foto", "");
                        }}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <Input
                    id="foto"
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Ukuran foto maksimal 5MB");
                          return;
                        }
                        // Validate file type
                        if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
                          toast.error("Format foto harus PNG, JPG, atau JPEG");
                          return;
                        }
                        // Create preview
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewFoto(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                        // Store file for upload
                        setFotoFile(file);
                        // Set marker for upload (will be replaced with URL during submit)
                        form.setValue("foto", "FILE_UPLOAD_PENDING");
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500">Format: PNG, JPG, JPEG. Maksimal 5MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Pendidikan */}
        <TabsContent value="pendidikan">
          <Card>
            <CardHeader>
              <CardTitle>Pendidikan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jenjangPendidikan">Jenjang Pendidikan</Label>
                  <Input id="jenjangPendidikan" {...form.register("jenjangPendidikan")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kelas">Kelas</Label>
                  <Input id="kelas" {...form.register("kelas")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="namaSekolah">Nama Sekolah</Label>
                <Input id="namaSekolah" {...form.register("namaSekolah")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamatSekolah">Alamat Sekolah</Label>
                <Textarea id="alamatSekolah" {...form.register("alamatSekolah")} rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jurusan">Jurusan</Label>
                  <Input id="jurusan" {...form.register("jurusan")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input id="semester" {...form.register("semester")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namaPt">Nama Perguruan Tinggi</Label>
                  <Input id="namaPt" {...form.register("namaPt")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alamatPt">Alamat Perguruan Tinggi</Label>
                  <Input id="alamatPt" {...form.register("alamatPt")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Keluarga */}
        <TabsContent value="keluarga">
          <Card>
            <CardHeader>
              <CardTitle>Data Keluarga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noKartuKeluarga">No. Kartu Keluarga</Label>
                <Input id="noKartuKeluarga" {...form.register("noKartuKeluarga")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asnaf">Asnaf</Label>
                  <Select onValueChange={(value) => form.setValue("asnaf", value)} value={form.watch("asnaf") || ""}>
                    <SelectTrigger id="asnaf">
                      <SelectValue placeholder="Pilih asnaf" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dhuafa">Dhuafa</SelectItem>
                      <SelectItem value="Yatim">Yatim</SelectItem>
                      <SelectItem value="Piatu">Piatu</SelectItem>
                      <SelectItem value="Yatim Piatu">Yatim Piatu</SelectItem>
                      <SelectItem value="Miskin">Miskin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusOrtu">Status Orang Tua</Label>
                  <Select onValueChange={(value) => form.setValue("statusOrtu", value)} value={form.watch("statusOrtu") || ""}>
                    <SelectTrigger id="statusOrtu">
                      <SelectValue placeholder="Pilih status orang tua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kedua Orang Tua Hidup">Kedua Orang Tua Hidup</SelectItem>
                      <SelectItem value="Yatim">Yatim (Ayah meninggal)</SelectItem>
                      <SelectItem value="Piatu">Piatu (Ibu meninggal)</SelectItem>
                      <SelectItem value="Yatim Piatu">Yatim Piatu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Data Ayah */}
        <TabsContent value="ayah">
          <Card>
            <CardHeader>
              <CardTitle>Data Ayah</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaLengkapAyah">Nama Lengkap Ayah</Label>
                <Input id="namaLengkapAyah" {...form.register("namaLengkapAyah")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamatAyah">Alamat Ayah</Label>
                <Textarea id="alamatAyah" {...form.register("alamatAyah")} rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desaAyahId">Desa Ayah</Label>
                  <SearchableSelect
                    id="desaAyahId"
                    options={desaOptions.map(o => ({ value: String(o.value), label: o.label }))}
                    value={form.watch("desaAyahId")?.toString()}
                    onValueChange={(v) => form.setValue("desaAyahId", v ? Number(v) : undefined)}
                    placeholder="Ketik untuk cari desa ayah..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pekerjaanAyah">Pekerjaan Ayah</Label>
                  <Input id="pekerjaanAyah" {...form.register("pekerjaanAyah")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="penghasilanAyah">Penghasilan Ayah</Label>
                  <Input 
                    id="penghasilanAyah" 
                    type="number" 
                    {...form.register("penghasilanAyah", { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === "" ? undefined : Number(v)
                    })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tglKematianAyah">Tanggal Kematian Ayah</Label>
                  <Input id="tglKematianAyah" type="date" {...form.register("tglKematianAyah")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="penyebabKematianAyah">Penyebab Kematian Ayah</Label>
                <Input id="penyebabKematianAyah" {...form.register("penyebabKematianAyah")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Data Ibu */}
        <TabsContent value="ibu">
          <Card>
            <CardHeader>
              <CardTitle>Data Ibu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaLengkapIbu">Nama Lengkap Ibu</Label>
                <Input id="namaLengkapIbu" {...form.register("namaLengkapIbu")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamatIbu">Alamat Ibu</Label>
                <Textarea id="alamatIbu" {...form.register("alamatIbu")} rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desaIbuId">Desa Ibu</Label>
                  <SearchableSelect
                    id="desaIbuId"
                    options={desaOptions.map(o => ({ value: String(o.value), label: o.label }))}
                    value={form.watch("desaIbuId")?.toString()}
                    onValueChange={(v) => form.setValue("desaIbuId", v ? Number(v) : undefined)}
                    placeholder="Ketik untuk cari desa ibu..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pekerjaanIbu">Pekerjaan Ibu</Label>
                  <Input id="pekerjaanIbu" {...form.register("pekerjaanIbu")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="penghasilanIbu">Penghasilan Ibu</Label>
                  <Input 
                    id="penghasilanIbu" 
                    type="number" 
                    {...form.register("penghasilanIbu", { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === "" ? undefined : Number(v)
                    })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tglKematianIbu">Tanggal Kematian Ibu</Label>
                  <Input id="tglKematianIbu" type="date" {...form.register("tglKematianIbu")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="penyebabKematianIbu">Penyebab Kematian Ibu</Label>
                <Input id="penyebabKematianIbu" {...form.register("penyebabKematianIbu")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Data Wali */}
        <TabsContent value="wali">
          <Card>
            <CardHeader>
              <CardTitle>Data Wali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaLengkapWali">Nama Lengkap Wali</Label>
                <Input id="namaLengkapWali" {...form.register("namaLengkapWali")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamatWali">Alamat Wali</Label>
                <Textarea id="alamatWali" {...form.register("alamatWali")} rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desaWaliId">Desa Wali</Label>
                  <SearchableSelect
                    id="desaWaliId"
                    options={desaOptions.map(o => ({ value: String(o.value), label: o.label }))}
                    value={form.watch("desaWaliId")?.toString()}
                    onValueChange={(v) => form.setValue("desaWaliId", v ? Number(v) : undefined)}
                    placeholder="Ketik untuk cari desa wali..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pekerjaanWali">Pekerjaan Wali</Label>
                  <Input id="pekerjaanWali" {...form.register("pekerjaanWali")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="penghasilanWali">Penghasilan Wali</Label>
                <Input 
                  id="penghasilanWali" 
                  type="number" 
                  {...form.register("penghasilanWali", { 
                    valueAsNumber: true,
                    setValueAs: (v) => v === "" ? undefined : Number(v)
                  })} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Kontak & Rekening */}
        <TabsContent value="kontak">
          <Card>
            <CardHeader>
              <CardTitle>Kontak & Rekening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telpDihubungi">Telepon Dihubungi</Label>
                <Input id="telpDihubungi" {...form.register("telpDihubungi")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="atasNama">Atas Nama</Label>
                  <Input id="atasNama" {...form.register("atasNama")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hubunganKerabat">Hubungan Kerabat</Label>
                  <Input id="hubunganKerabat" {...form.register("hubunganKerabat")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="noRekening">No. Rekening</Label>
                <Input id="noRekening" {...form.register("noRekening")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pemilikRekening">Pemilik Rekening</Label>
                  <Input id="pemilikRekening" {...form.register("pemilikRekening")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaBank">Nama Bank</Label>
                  <Input id="namaBank" {...form.register("namaBank")} />
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 8: Karakter & Minat */}
        <TabsContent value="karakter">
          <Card>
            <CardHeader>
              <CardTitle>Karakter & Minat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nilai">Nilai</Label>
                <Select onValueChange={(value) => form.setValue("nilai", value)} value={form.watch("nilai") || ""}>
                  <SelectTrigger id="nilai">
                    <SelectValue placeholder="Pilih nilai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pelajaranFavorit">Pelajaran Favorit</Label>
                <Input id="pelajaranFavorit" {...form.register("pelajaranFavorit")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jarakRumah">Jarak Rumah</Label>
                  <Input id="jarakRumah" {...form.register("jarakRumah")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alatTransportasi">Alat Transportasi</Label>
                  <Input id="alatTransportasi" {...form.register("alatTransportasi")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hobi">Hobi</Label>
                <Textarea id="hobi" {...form.register("hobi")} rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prestasi">Prestasi</Label>
                <Textarea id="prestasi" {...form.register("prestasi")} rows={2} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 9: Status Program */}
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Status Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statusSurvey">Status Survey</Label>
                  <Select onValueChange={(value) => form.setValue("statusSurvey", value)} value={form.watch("statusSurvey") || ""}>
                    <SelectTrigger id="statusSurvey">
                      <SelectValue placeholder="Pilih status survey" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="y">Ya</SelectItem>
                      <SelectItem value="n">Tidak</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusKelayakan">Status Kelayakan</Label>
                  <Select onValueChange={(value) => form.setValue("statusKelayakan", value)} value={form.watch("statusKelayakan") || ""}>
                    <SelectTrigger id="statusKelayakan">
                      <SelectValue placeholder="Pilih status kelayakan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="y">Layak</SelectItem>
                      <SelectItem value="n">Tidak Layak</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statusAnakJuara">Status Anak Juara</Label>
                  <Select onValueChange={(value) => form.setValue("statusAnakJuara", value)} value={form.watch("statusAnakJuara") || ""}>
                    <SelectTrigger id="statusAnakJuara">
                      <SelectValue placeholder="Pilih status anak juara" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ya">Ya</SelectItem>
                      <SelectItem value="tidak">Tidak</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusTersantuni">Status Tersantuni</Label>
                  <Select onValueChange={(value) => form.setValue("statusTersantuni", value)} value={form.watch("statusTersantuni") || ""}>
                    <SelectTrigger id="statusTersantuni">
                      <SelectValue placeholder="Pilih status tersantuni" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="y">Ya</SelectItem>
                      <SelectItem value="n">Tidak</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statusPinjam">Status Pinjam</Label>
                  <Select onValueChange={(value) => form.setValue("statusPinjam", value)} value={form.watch("statusPinjam") || ""}>
                    <SelectTrigger id="statusPinjam">
                      <SelectValue placeholder="Pilih status pinjam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="y">Ya</SelectItem>
                      <SelectItem value="n">Tidak</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusMentor">Status Mentor</Label>
                  <Select onValueChange={(value) => form.setValue("statusMentor", value)} value={form.watch("statusMentor") || ""}>
                    <SelectTrigger id="statusMentor">
                      <SelectValue placeholder="Pilih status mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="y">Ya</SelectItem>
                      <SelectItem value="n">Tidak</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aktif">Aktif</Label>
                  <Select onValueChange={(value) => form.setValue("aktif", value as "y" | "n")} value={form.watch("aktif") || ""}>
                    <SelectTrigger id="aktif">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="y">Ya</SelectItem>
                      <SelectItem value="n">Tidak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alumniJuara">Alumni Juara</Label>
                  <Select onValueChange={(value) => form.setValue("alumniJuara", value)} value={form.watch("alumniJuara") || ""}>
                    <SelectTrigger id="alumniJuara">
                      <SelectValue placeholder="Pilih status alumni" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="y">Ya</SelectItem>
                      <SelectItem value="n">Tidak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="juara">Juara</Label>
                  <Select onValueChange={(value) => form.setValue("juara", value)} value={form.watch("juara") || ""}>
                    <SelectTrigger id="juara">
                      <SelectValue placeholder="Pilih status juara" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ya">Ya</SelectItem>
                      <SelectItem value="tidak">Tidak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 10: Organisasi */}
        <TabsContent value="organisasi">
          <Card>
            <CardHeader>
              <CardTitle>Organisasi & Penugasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wilayahPembinaanId">Wilayah Pembinaan</Label>
                  <SearchableSelect
                    id="wilayahPembinaanId"
                    options={wilayahOptions.map(o => ({ value: String(o.value), label: o.label }))}
                    value={form.watch("wilayahPembinaanId")?.toString()}
                    onValueChange={(v) => form.setValue("wilayahPembinaanId", v ? Number(v) : undefined)}
                    placeholder="Ketik untuk cari wilayah..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kantorId">Kantor</Label>
                  <SearchableSelect
                    id="kantorId"
                    options={kantorOptions.map(o => ({ value: String(o.value), label: o.label }))}
                    value={form.watch("kantorId")?.toString()}
                    onValueChange={(v) => form.setValue("kantorId", v ? Number(v) : undefined)}
                    placeholder="Ketik untuk cari kantor..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sdmWilayahId">SDM Wilayah (Mentor)</Label>
                  <SearchableSelect
                    id="sdmWilayahId"
                    options={sdmOptions.map(o => ({ value: String(o.value), label: o.label }))}
                    value={form.watch("sdmWilayahId")?.toString()}
                    onValueChange={(v) => form.setValue("sdmWilayahId", v ? Number(v) : undefined)}
                    placeholder="Ketik untuk cari SDM / mentor..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaMentorManual">Nama Mentor Manual</Label>
                  <Input id="namaMentorManual" {...form.register("namaMentorManual")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tglTerdaftar">Tanggal Terdaftar</Label>
                  <Input id="tglTerdaftar" type="date" {...form.register("tglTerdaftar")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tglPengajuan">Tanggal Pengajuan</Label>
                  <Input id="tglPengajuan" type="date" {...form.register("tglPengajuan")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 11: Program Peminjaman */}
        <TabsContent value="peminjaman">
          <Card>
            <CardHeader>
              <CardTitle>Program Peminjaman (RFO)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="niaRfoBook">NIA RFO Book</Label>
                  <Input id="niaRfoBook" {...form.register("niaRfoBook")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaRfoBook">Nama RFO Book</Label>
                  <Input id="namaRfoBook" {...form.register("namaRfoBook")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tglPeminjaman">Tanggal Peminjaman</Label>
                  <Input id="tglPeminjaman" type="date" {...form.register("tglPeminjaman")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tglExpired">Tanggal Expired</Label>
                  <Input id="tglExpired" type="date" {...form.register("tglExpired")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bookVia">Book Via</Label>
                  <Input id="bookVia" {...form.register("bookVia")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userBook">User Book</Label>
                  <Input id="userBook" {...form.register("userBook")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 12: Tempat Tinggal */}
        <TabsContent value="tinggal">
          <Card>
            <CardHeader>
              <CardTitle>Tempat Tinggal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tinggalBersama">Tinggal Bersama</Label>
                  <Input id="tinggalBersama" {...form.register("tinggalBersama")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaTinggal">Nama Tinggal</Label>
                  <Input id="namaTinggal" {...form.register("namaTinggal")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ketTinggal">Keterangan Tinggal</Label>
                <Textarea id="ketTinggal" {...form.register("ketTinggal")} rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="penghasilanTinggal">Penghasilan Tinggal</Label>
                  <Input 
                    id="penghasilanTinggal" 
                    type="number" 
                    {...form.register("penghasilanTinggal", { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === "" ? undefined : Number(v)
                    })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pekerjaanTinggal">Pekerjaan Tinggal</Label>
                  <Input id="pekerjaanTinggal" {...form.register("pekerjaanTinggal")} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="tidakSerumahOrtu" {...form.register("tidakSerumahOrtu")} />
                  <Label htmlFor="tidakSerumahOrtu">Tidak Serumah dengan Orang Tua</Label>
                </div>
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
