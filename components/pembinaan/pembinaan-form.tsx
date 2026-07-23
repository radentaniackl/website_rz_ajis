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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { pembinaanSchema, pembinaanUpdateSchema, pembinaanFormSchema, pembinaanFormUpdateSchema, type PembinaanInput, type PembinaanUpdateInput } from '@/lib/validation/schemas';
import { createPembinaanAction, updatePembinaanAction } from '@/app/actions/pembinaan';
import { getAnakList } from '@/app/actions/anak';
import { 
  getSemesterOptions, 
  getKantorOptions, 
  getWilayahOptions, 
  getSdmWilayahOptions 
} from '@/app/actions/dropdown-data';


interface PembinaanFormProps {
  initialData?: Partial<PembinaanInput>;
  isEdit?: boolean;
  pembinaanId?: number;
}

interface AttendanceRecord {
  anakId: number;
  namaLengkap: string;
  kodeAnak: string;
  nik?: string;
  pendidikanTerakhir?: string;
  initials?: string;
  kehadiran: string;
  keterangan: string;
  pembiasaanShalatWajib?: number;
  pembiasaanTilawah?: number;
  pembiasaanSedekah?: number;
  membantuOrtu?: number;
  pembinaanId?: number; // Track existing pembinaan ID for edit mode
}

export function PembinaanForm({ initialData, isEdit = false, pembinaanId }: PembinaanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [anakOptions, setAnakOptions] = useState<{ value: number; label: string; data?: any }[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<{ value: number; label: string }[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [showAttendanceTable, setShowAttendanceTable] = useState(false);
  const [dataSource, setDataSource] = useState<'anak' | 'pemasangan'>('anak');
  const [mentorOptions, setMentorOptions] = useState<{ value: number; label: string }[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string>('');
  const [imageData, setImageData] = useState<string | undefined>(initialData?.image);
  const [anakSearch, setAnakSearch] = useState<string>('');
  
  const [kantorOptions, setKantorOptions] = useState<{ value: number; label: string }[]>([]);
  const [wilayahOptions, setWilayahOptions] = useState<{ value: number; label: string }[]>([]);
  const [sdmOptions, setSdmOptions] = useState<{ value: number; label: string }[]>([]);

  // Use different schema based on edit/create mode
  const formSchema = isEdit 
    ? pembinaanFormUpdateSchema
    : pembinaanFormSchema;
  
  // Custom resolver that converts null to undefined before validation
  const customResolver = zodResolver(formSchema);
  
  // Clean null values from initialData for form default values
  const cleanInitialData = initialData ? Object.fromEntries(
    Object.entries(initialData).map(([key, value]) => [key, value === null ? undefined : value])
  ) : {};
  
  const defaultValues = (cleanInitialData as z.infer<typeof formSchema>) || {
    tglPembinaan: new Date().toISOString().split('T')[0],
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    tampil: 'y',
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: async (data, context, options) => {
      // Convert null to undefined before validation
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
      );
      return customResolver(cleanedData, context, options);
    },
    defaultValues,
  });

  const watchKantorId = form.watch("kantorId");
  const watchWilayahId = form.watch("wilayahPembinaanId");

  useEffect(() => {
    async function fetchInitialDropdowns() {
      const [semester, kantor] = await Promise.all([
        getSemesterOptions(),
        getKantorOptions(),
      ]);
      if (semester.success) setSemesterOptions(semester.data);
      if (kantor.success) setKantorOptions(kantor.data);
    }
    fetchInitialDropdowns();
  }, []);

  useEffect(() => {
    async function fetchWilayah() {
      if (watchKantorId) {
        const wilayah = await getWilayahOptions(watchKantorId);
        if (wilayah.success) setWilayahOptions(wilayah.data);
      } else {
        setWilayahOptions([]);
      }
    }
    fetchWilayah();
  }, [watchKantorId]);

  useEffect(() => {
    async function fetchSdm() {
      const sdm = await getSdmWilayahOptions(watchKantorId, watchWilayahId);
      if (sdm.success) setSdmOptions(sdm.data);
    }
    fetchSdm();
  }, [watchKantorId, watchWilayahId]);

  useEffect(() => {
    async function fetchAnakData() {
      // Only fetch if wilayahPembinaanId is selected (for correlation) or if we want to show all by default
      const params: any = { page: 1, pageSize: 1000, search: anakSearch };
      if (watchWilayahId) {
        params.wilayahPembinaanId = watchWilayahId;
      }
      
      const anak = await getAnakList(params);
      if (anak.success) {
        setAnakOptions(anak.data.data.map((a: any) => ({ 
          value: a.id, 
          label: `${a.namaLengkap} (${a.kodeAnak})`,
          data: a
        })));
      }
    }
    fetchAnakData();
  }, [anakSearch, watchWilayahId]);

  // Load existing pembinaan records in edit mode
  useEffect(() => {
    async function loadExistingRecords() {
      if (isEdit && initialData && watchWilayahId) {
        const params: any = { page: 1, pageSize: 1000 };
        if (watchWilayahId) {
          params.wilayahPembinaanId = watchWilayahId;
        }
        
        const anak = await getAnakList(params);
        
        if (anak.success && anak.data?.data) {
          // Fetch existing pembinaan records for this session
          // Filter by multiple fields to get the correct session records
          const { getPembinaanList } = await import('@/app/actions/pembinaan');
          const pembinaanResult = await getPembinaanList({
            page: 1,
            pageSize: 1000,
            semesterId: initialData.semesterId,
          });

          // Check if data is directly in data or in data.data
          const allRecords = Array.isArray(pembinaanResult?.data) 
            ? pembinaanResult.data 
            : Array.isArray(pembinaanResult?.data?.data) 
              ? pembinaanResult.data.data 
              : [];
          
          // Filter records that match the current session (same date, wilayah, kantor, etc.)
          const existingRecords = allRecords.filter((r: any) => {
            return r.tglPembinaan === initialData.tglPembinaan &&
                   r.wilayahPembinaanId === initialData.wilayahPembinaanId &&
                   r.kantorId === initialData.kantorId &&
                   (initialData.jenisPembinaan ? r.jenisPembinaan === initialData.jenisPembinaan : true);
          });

          const records = anak.data.data.map((a: any) => {
            const label = `${a.namaLengkap} (${a.kodeAnak})`;
            const namaLengkap = a.namaLengkap;
            const kodeAnak = a.kodeAnak;
            const nik = a.nik || '';
            const pendidikanTerakhir = a.pendidikanTerakhir || '';
            const initials = namaLengkap.split(' ').map((n: string) => n[0]).join('').toUpperCase();
            
            // Find existing pembinaan record for this anak
            const existing = existingRecords?.find((r: any) => Number(r.anakId) === Number(a.id));
            
            return {
              anakId: a.id,
              namaLengkap,
              kodeAnak,
              nik,
              pendidikanTerakhir,
              initials,
              kehadiran: existing?.kehadiran || '',
              keterangan: existing?.keterangan || '',
              pembiasaanShalatWajib: existing?.pembiasaanShalatWajib,
              pembiasaanTilawah: existing?.pembiasaanTilawah,
              pembiasaanSedekah: existing?.pembiasaanSedekah,
              membantuOrtu: existing?.membantuOrtu,
              pembinaanId: existing?.id,
            };
          });

          setAttendanceRecords(records);
          setShowAttendanceTable(true);
        }
      }
    }
    loadExistingRecords();
  }, [isEdit, initialData, watchWilayahId]);


  const handleShowAttendance = () => {
    const records = anakOptions.map((anak) => {
      const label = anak.label;
      const namaLengkap = label.split(' (')[0];
      const kodeAnak = label.match(/\(([^)]+)\)/)?.[1] || '';
      
      // Get additional data from anak.data
      const anakData = anak.data;
      const nik = anakData?.nik || '';
      const pendidikanTerakhir = anakData?.pendidikanTerakhir || '';
      
      // Generate initials from namaLengkap
      const initials = namaLengkap.split(' ').map((n: string) => n[0]).join('').toUpperCase();
      
      return {
        anakId: anak.value,
        namaLengkap,
        kodeAnak,
        nik,
        pendidikanTerakhir,
        initials,
        kehadiran: '',
        keterangan: '',
      };
    });
    setAttendanceRecords(records);
    setShowAttendanceTable(true);
  };

  const handleAttendanceChange = (anakId: number, field: keyof AttendanceRecord, value: string | number) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.anakId === anakId ? { ...record, [field]: value } : record
      )
    );
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // Include image data in the submission
      const submitData = {
        ...data,
        image: imageData,
      };

      // Process all attendance records
      const recordsToProcess = attendanceRecords.filter((r) => r.kehadiran);
      
      if (recordsToProcess.length === 0 && !isEdit) {
        toast.error("Pilih minimal satu anak yang hadir");
        setIsSubmitting(false);
        return;
      }

      for (const record of attendanceRecords) {
        // Session-level data (applies to all children)
        const sessionData = {
          tglPembinaan: submitData.tglPembinaan,
          semesterId: submitData.semesterId,
          bulan: submitData.bulan,
          tahun: submitData.tahun,
          jenisPembinaan: submitData.jenisPembinaan,
          p3a: submitData.p3a,
          judulMateri: submitData.judulMateri,
          wilayahPembinaanId: submitData.wilayahPembinaanId,
          kantorId: submitData.kantorId,
          pemateri: submitData.pemateri,
          pemateriPersonal: submitData.pemateriPersonal,
          ortuHadir: submitData.ortuHadir,
          donaturId: submitData.donaturId,
          programDonasi: submitData.programDonasi,
          tampil: submitData.tampil,
          viaInput: submitData.viaInput,
          image: submitData.image,
          uploadGdrive: submitData.uploadGdrive,
          capaianTilawah: submitData.capaianTilawah,
          capaianTahfidz: submitData.capaianTahfidz,
          capaianTahfidzHalaman: submitData.capaianTahfidzHalaman,
        };

        // Child-level data (per child)
        const childData = {
          anakId: Number(record.anakId),
          kehadiran: record.kehadiran,
          keterangan: record.keterangan,
          pembiasaanShalatWajib: record.pembiasaanShalatWajib,
          pembiasaanTilawah: record.pembiasaanTilawah,
          pembiasaanSedekah: record.pembiasaanSedekah,
          membantuOrtu: record.membantuOrtu,
        };

        const pembinaanData = {
          ...sessionData,
          ...childData,
        };

        let result;
        if (record.pembinaanId) {
          // Update existing record
          result = await updatePembinaanAction(record.pembinaanId, pembinaanData);
        } else if (record.kehadiran) {
          // Create new record only if child has attendance
          result = await createPembinaanAction(pembinaanData);
        } else {
          // Skip: no attendance and no existing record
          continue;
        }

        if (!result.success) {
          toast.error(result.error || "Terjadi kesalahan");
          setIsSubmitting(false);
          return;
        }
      }

      toast.success(isEdit ? "Sesi pembinaan berhasil diperbarui" : "Sesi pembinaan berhasil ditambahkan");
      router.push("/dashboard/sesi");
      router.refresh();
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
          <CardTitle>{isEdit ? "Edit Sesi Pembinaan" : "Catat Pembinaan Baru"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tglPembinaan">Tanggal Pembinaan *</Label>
              <Input 
                id="tglPembinaan" 
                type="date" 
                {...form.register("tglPembinaan")}
                className={form.formState.errors.tglPembinaan ? "border-red-500" : ""}
              />
              {form.formState.errors.tglPembinaan && (
                <p className="text-sm text-destructive">{form.formState.errors.tglPembinaan.message}</p>
              )}
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenisPembinaan">Jenis Pembinaan</Label>
            <Select 
              onValueChange={(value) => form.setValue("jenisPembinaan", value)} 
              value={form.watch("jenisPembinaan") || ""}
            >
              <SelectTrigger id="jenisPembinaan">
                <SelectValue placeholder="Pilih jenis pembinaan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pembinaan Reguler">Pembinaan Reguler</SelectItem>
                <SelectItem value="P3A">P3A</SelectItem>
                <SelectItem value="Pembinaan Khusus">Pembinaan Khusus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.watch("jenisPembinaan") === "P3A" && (
            <div className="space-y-2">
              <Label htmlFor="p3a">Keterangan P3A</Label>
              <Textarea id="p3a" {...form.register("p3a")} rows={2} placeholder="Isi nama / keterangan kegiatan P3A..." />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kantorId">Kantor Asal</Label>
              <Select 
                onValueChange={(value) => form.setValue("kantorId", Number(value))} 
                value={form.watch("kantorId")?.toString() || ""}
              >
                <SelectTrigger id="kantorId">
                  <SelectValue placeholder="Pilih kantor asal" />
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
                disabled={!watchKantorId}
              >
                <SelectTrigger id="wilayahPembinaanId">
                  <SelectValue placeholder="Pilih wilayah pembinaan" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pemateri">Pemateri (SDM/Fasilitator)</Label>
              <Select 
                onValueChange={(value) => form.setValue("pemateri", value)} 
                value={form.watch("pemateri") || ""}
              >
                <SelectTrigger id="pemateri">
                  <SelectValue placeholder="Pilih pemateri" />
                </SelectTrigger>
                <SelectContent>
                  {sdmOptions.map((option) => (
                    <SelectItem key={option.value} value={option.label}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pemateriPersonal">Pemateri Tambahan (Opsional)</Label>
              <Input id="pemateriPersonal" {...form.register("pemateriPersonal")} placeholder="Ketik nama pemateri lain..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="judulMateri">Tema Materi</Label>
            <Textarea id="judulMateri" {...form.register("judulMateri")} rows={2} placeholder="Masukkan materi/pembahasan utama..." />
          </div>



          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Daftar Kehadiran Anak Juara</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sumber Data Anak:</span>
                <span className="font-medium">Data Anak (ajis_anak)</span>
              </div>
              
              {!isEdit && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Cari anak..."
                    value={anakSearch}
                    onChange={(e) => setAnakSearch(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button type="button" onClick={handleShowAttendance} variant="outline">
                    Tampilkan Data Anak
                  </Button>
                </div>
              )}

              {showAttendanceTable && attendanceRecords.length > 0 && (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Anak Asuh</th>
                        <th className="text-left p-3 font-medium">Kehadiran</th>
                        <th className="text-left p-3 font-medium">Keterangan / Izin</th>
                        <th className="text-center p-3 font-medium" colSpan={4}>Pembiasaan Mandiri (Jika Hadir)</th>
                      </tr>
                      <tr className="border-b bg-muted/30">
                        <th></th>
                        <th></th>
                        <th></th>
                        <th className="text-center p-2 font-medium text-sm">Shalat</th>
                        <th className="text-center p-2 font-medium text-sm">Tilawah</th>
                        <th className="text-center p-2 font-medium text-sm">Sedekah</th>
                        <th className="text-center p-2 font-medium text-sm">Bantu Ortu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            Tidak ada anak asuh di wilayah ini.
                          </td>
                        </tr>
                      ) : (
                        attendanceRecords.map((record) => (
                          <tr key={record.anakId} className="border-b">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                  {record.initials}
                                </div>
                                <div>
                                  <div className="font-medium">{record.namaLengkap}</div>
                                  <div className="text-sm text-muted-foreground">{record.nik} • {record.pendidikanTerakhir}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Select
                                value={record.kehadiran}
                                onValueChange={(value) => handleAttendanceChange(record.anakId, 'kehadiran', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hadir">Hadir</SelectItem>
                                  <SelectItem value="izin">Izin</SelectItem>
                                  <SelectItem value="sakit">Sakit</SelectItem>
                                  <SelectItem value="alpha">Alpha</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3">
                              {record.kehadiran !== 'hadir' ? (
                                <Select
                                  value={record.keterangan}
                                  onValueChange={(value) => handleAttendanceChange(record.anakId, 'keterangan', value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="—" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="alpa">Alpa</SelectItem>
                                    <SelectItem value="izin">Izin</SelectItem>
                                    <SelectItem value="sakit">Sakit</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            {record.kehadiran === 'hadir' ? (
                              <>
                                <td className="p-2 text-center">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={record.pembiasaanShalatWajib || ''}
                                    onChange={(e) => handleAttendanceChange(record.anakId, 'pembiasaanShalatWajib', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-12 text-center"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={record.pembiasaanTilawah || ''}
                                    onChange={(e) => handleAttendanceChange(record.anakId, 'pembiasaanTilawah', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-12 text-center"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={record.pembiasaanSedekah || ''}
                                    onChange={(e) => handleAttendanceChange(record.anakId, 'pembiasaanSedekah', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-12 text-center"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={record.membantuOrtu || ''}
                                    onChange={(e) => handleAttendanceChange(record.anakId, 'membantuOrtu', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-12 text-center"
                                  />
                                </td>
                              </>
                            ) : (
                              <td className="p-2 text-center" colSpan={4}>
                                <span className="text-muted-foreground">—</span>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tampil">Tampil</Label>
            <Select 
              onValueChange={(value) => form.setValue("tampil", value as 'y' | 'n')} 
              value={form.watch("tampil") || "y"}
            >
              <SelectTrigger id="tampil">
                <SelectValue placeholder="Pilih tampil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="y">Ya</SelectItem>
                <SelectItem value="n">Tidak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Dokumentasi (Opsional)</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Upload Foto Dokumentasi</Label>
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error("Ukuran file maksimal 10MB");
                        return;
                      }
                      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                        toast.error("Format file harus JPEG, JPG, atau PNG");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageData(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">Format: JPEG, JPG, PNG. Maksimal: 10MB</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="uploadGdrive">URL Google Drive (Opsional)</Label>
                <Input 
                  id="uploadGdrive" 
                  type="url" 
                  placeholder="https://drive.google.com/..."
                  {...form.register("uploadGdrive")}
                />
                <p className="text-xs text-muted-foreground">Link Google Drive untuk dokumentasi tambahan</p>
              </div>

              {imageData && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Preview Foto:</p>
                  <img
                    src={imageData}
                    alt="Preview dokumentasi"
                    className="w-full max-w-md rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageData(undefined)}
                    className="mt-2"
                  >
                    Hapus Foto
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Pembinaan"}
        </Button>
      </div>
    </form>
  );
}
