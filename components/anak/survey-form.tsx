"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, ClipboardList, Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface SurveyFormProps {
  anakId: string | number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess?: () => void;
}

export function SurveyForm({ anakId, open, onOpenChange, onSubmitSuccess }: SurveyFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // In a real app, we'd use react-hook-form and zod, and submit to a server action.
  // This is a minimal interactive UI for the prototype based on ajis_survey schema.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // Simulate server action
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSuccess(true);
    
    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
    
    setTimeout(() => {
      setSuccess(false);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-extrabold">
            <ClipboardList className="h-5 w-5 text-primary" /> 
            Isi Survey Kelayakan Anak
          </DialogTitle>
          <DialogDescription>
            Masukkan data hasil survey lapangan untuk mengevaluasi status kelayakan anak (ID: {anakId}).
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-green-800">Survey Berhasil Disimpan</h3>
            <p className="text-sm text-muted-foreground mt-1">Data kelayakan telah diperbarui di sistem.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            
            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Informasi Umum</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tglSurvey">Tanggal Survey</Label>
                  <Input type="date" id="tglSurvey" name="tglSurvey" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petugasSurvey">Petugas Survey</Label>
                  <Input type="text" id="petugasSurvey" name="petugasSurvey" required placeholder="Nama Fasilitator..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asnaf">Asnaf Kelayakan</Label>
                  <select 
                    id="asnaf" 
                    name="asnaf" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="yatim">Yatim</option>
                    <option value="piatu">Piatu</option>
                    <option value="yatim_piatu">Yatim Piatu</option>
                    <option value="dhuafa">Dhuafa</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusAnak">Status Anak</Label>
                  <Input type="text" id="statusAnak" name="statusAnak" placeholder="Misal: Sekolah SD..." />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Kondisi Ekonomi & Rumah</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kepemilikanRumah">Kepemilikan Rumah</Label>
                  <Input type="text" id="kepemilikanRumah" name="kepemilikanRumah" placeholder="Milik Sendiri / Sewa / Numpang..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kondisiDindingRumah">Kondisi Dinding</Label>
                  <Input type="text" id="kondisiDindingRumah" name="kondisiDindingRumah" placeholder="Tembok / Kayu / Bambu..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rataRataPenghasilan">Penghasilan Rata-rata per Bulan</Label>
                  <Input type="text" id="rataRataPenghasilan" name="rataRataPenghasilan" placeholder="Misal: Rp 1.500.000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pekerjaanKepalaKeluarga">Pekerjaan Kepala Keluarga</Label>
                  <Input type="text" id="pekerjaanKepalaKeluarga" name="pekerjaanKepalaKeluarga" placeholder="Buruh Harian Lepas..." />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Kesimpulan</h4>
              <div className="space-y-2">
                <Label htmlFor="hasilKesimpulan">Hasil Kesimpulan Survey</Label>
                <Input type="text" id="hasilKesimpulan" name="hasilKesimpulan" placeholder="Sangat Layak / Layak / Dipertimbangkan..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resumeDeskriptif">Resume Deskriptif</Label>
                <Textarea 
                  id="resumeDeskriptif" 
                  name="resumeDeskriptif" 
                  placeholder="Catatan tambahan fasilitator mengenai kondisi ril di lapangan..." 
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Simpan Survey
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
