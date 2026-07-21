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
import { pembinaanSchema, type PembinaanInput } from '@/lib/validation/schemas';
import { createPembinaanAction, updatePembinaanAction } from '@/app/actions/pembinaan';
import { getAnakList } from '@/app/actions/anak';
import { getSemesterOptions } from '@/app/actions/dropdown-data';
import { ImageUpload } from '@/components/shared/image-upload';

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

  useEffect(() => {
    async function fetchDropdownData() {
      const [anak, semester] = await Promise.all([
        getAnakList({ page: 1, pageSize: 1000 }),
        getSemesterOptions(),
      ]);
      if (anak.success) {
        setAnakOptions(anak.data.data.map((a: any) => ({ 
          value: a.id, 
          label: `${a.namaLengkap} (${a.kodeAnak})`,
          data: a
        })));
      }
      if (semester.success) {
        setSemesterOptions(semester.data);
      }
    }
    fetchDropdownData();
  }, []);

  const form = useForm<z.infer<typeof pembinaanSchema>>({
    resolver: zodResolver(pembinaanSchema),
    defaultValues: initialData as z.infer<typeof pembinaanSchema> || {
      tglPembinaan: new Date().toISOString().split('T')[0],
      bulan: new Date().getMonth() + 1,
      tahun: new Date().getFullYear(),
      tampil: 'y',
    },
  });

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

  const handleSubmit = async (data: z.infer<typeof pembinaanSchema>) => {
    setIsSubmitting(true);
    try {
      // Create pembinaan records for each attended child
      const attendedRecords = attendanceRecords.filter((r) => r.kehadiran);
      
      if (attendedRecords.length === 0) {
        toast.error("Pilih minimal satu anak yang hadir");
        setIsSubmitting(false);
        return;
      }

      for (const record of attendedRecords) {
        const pembinaanData = {
          ...data,
          anakId: record.anakId,
          kehadiran: record.kehadiran,
          keterangan: record.keterangan,
          pembiasaanShalatWajib: record.pembiasaanShalatWajib,
          pembiasaanTilawah: record.pembiasaanTilawah,
          pembiasaanSedekah: record.pembiasaanSedekah,
          membantuOrtu: record.membantuOrtu,
        };

        let result;
        if (isEdit && pembinaanId) {
          result = await updatePembinaanAction(pembinaanId, pembinaanData);
        } else {
          result = await createPembinaanAction(pembinaanData);
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

          <div className="space-y-2">
            <Label htmlFor="pemateri">Pemateri</Label>
            <Input id="pemateri" {...form.register("pemateri")} placeholder="Ketik nama pemateri..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="judulMateri">Tema Materi</Label>
            <Textarea id="judulMateri" {...form.register("judulMateri")} rows={2} placeholder="Masukkan materi/pembahasan utama..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Dokumentasi (Foto)</Label>
            <ImageUpload
              value={imageData}
              onChange={setImageData}
              onRemove={() => setImageData(undefined)}
              disabled={isSubmitting}
              accept="image/*"
              maxSize={5}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Daftar Kehadiran Anak Juara</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sumber Data Anak:</span>
                <span className="font-medium">Data Anak (ajis_anak)</span>
              </div>
              
              <Button type="button" onClick={handleShowAttendance} variant="outline">
                Tampilkan Data Anak
              </Button>

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
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4 mt-6">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Pembinaan"}
        </Button>
      </div>
    </form>
  );
}
