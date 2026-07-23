"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createSdmAction, updateSdmAction } from "@/app/actions/sdm";
import { toast } from "sonner";

interface SdmFormProps {
  initialData?: any;
}

export function SdmForm({ initialData }: SdmFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      let result;
      if (isEditing) {
        result = await updateSdmAction(initialData.id, formData);
      } else {
        result = await createSdmAction(formData);
      }

      if (result.success) {
        toast.success(`Data SDM berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}`);
        router.push("/dashboard/sdm");
      } else {
        toast.error(result.error || "Terjadi kesalahan saat menyimpan data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kolom Kiri: Informasi Pribadi */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">Informasi Pribadi</h3>
          
          <div className="space-y-2">
            <Label htmlFor="nik">NIK KTP <span className="text-red-500">*</span></Label>
            <Input id="nik" name="nik" defaultValue={initialData?.nik} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-red-500">*</span></Label>
            <Input id="namaLengkap" name="namaLengkap" defaultValue={initialData?.namaLengkap} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
            <Select name="jenisKelamin" defaultValue={initialData?.jenisKelamin || "l"}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jenis Kelamin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="l">Laki-laki</SelectItem>
                <SelectItem value="p">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jenjangPendidikan">Jenjang Pendidikan</Label>
            <Select name="jenjangPendidikan" defaultValue={initialData?.jenjangPendidikan || "S1"}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jenjang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SMA">SMA/SMK</SelectItem>
                <SelectItem value="D3">D3</SelectItem>
                <SelectItem value="S1">S1</SelectItem>
                <SelectItem value="S2">S2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alamat">Alamat Lengkap</Label>
            <Textarea id="alamat" name="alamat" defaultValue={initialData?.alamat} rows={3} />
          </div>
        </div>

        {/* Kolom Kanan: Kontak & Penugasan */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">Kontak & Penugasan</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hp">No. HP / WhatsApp</Label>
              <Input id="hp" name="hp" defaultValue={initialData?.hp} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telp">No. Telepon</Label>
              <Input id="telp" name="telp" defaultValue={initialData?.telp} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" name="email" defaultValue={initialData?.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="penugasanKantorId">Penugasan Kantor (ID)</Label>
            <Input type="number" id="penugasanKantorId" name="penugasanKantorId" defaultValue={initialData?.penugasanKantorId} placeholder="Contoh: 1" />
            <p className="text-xs text-muted-foreground">Isi dengan ID Kantor pada database referensi.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="penugasanWilayahId">Penugasan Wilayah (ID)</Label>
            <Input type="number" id="penugasanWilayahId" name="penugasanWilayahId" defaultValue={initialData?.penugasanWilayahId} placeholder="Contoh: 5" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="penugasanFungsiStruktur">Fungsi / Jabatan</Label>
            <Input id="penugasanFungsiStruktur" name="penugasanFungsiStruktur" defaultValue={initialData?.penugasanFungsiStruktur} placeholder="Fasilitator / Mentor..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tglBergabung">Tanggal Bergabung</Label>
              <Input type="date" id="tglBergabung" name="tglBergabung" defaultValue={initialData?.tglBergabung ? new Date(initialData.tglBergabung).toISOString().split('T')[0] : ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aktif">Status Aktif</Label>
              <Select name="aktif" defaultValue={initialData?.aktif || "y"}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="y">Aktif</SelectItem>
                  <SelectItem value="t">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isEditing ? 'Simpan Perubahan' : 'Tambah SDM'}
        </Button>
      </div>
    </form>
  );
}
