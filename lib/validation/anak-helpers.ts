import type { AnakInput, AnakUpdateInput } from '@/lib/validation/schemas';
import type { NewAnak } from '@/lib/repositories/anak.repository';

const STRIP_FIELDS = ['id', 'createdAt', 'updatedAt'] as const;
const PENGHASILAN_FIELDS = ['penghasilanAyah', 'penghasilanIbu', 'penghasilanWali', 'penghasilanTinggal'] as const;
const FOTO_MARKER = 'FILE_UPLOAD_PENDING';

/** Normalisasi nilai form: kosong/NaN diabaikan, angka penghasilan jadi string. */
export function cleanAnakFormValues(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data;

  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if ((STRIP_FIELDS as readonly string[]).includes(key)) continue;
    
    // Keep foto marker for upload processing
    if (key === 'foto' && value === FOTO_MARKER) {
      cleaned[key] = value;
      continue;
    }
    
    if (value === '' || value === null || value === undefined) continue;
    if (typeof value === 'number' && Number.isNaN(value)) continue;

    if ((PENGHASILAN_FIELDS as readonly string[]).includes(key) && typeof value === 'number') {
      cleaned[key] = String(value);
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

/** Siapkan payload untuk insert/update ke database. */
export function prepareAnakForDb(data: AnakInput | AnakUpdateInput): Partial<NewAnak> {
  const cleaned = cleanAnakFormValues(data) as Partial<NewAnak>;
  return cleaned;
}

/** Map baris database ke nilai default form. */
export function mapAnakToFormValues(anak: Record<string, unknown>) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...rest
  } = anak;

  return {
    ...rest,
    jnsKel: rest.jnsKel as 'L' | 'P',
    tglLahir: rest.tglLahir || '',
    tglTerdaftar: rest.tglTerdaftar || '',
    tglPengajuan: rest.tglPengajuan || '',
    tglKematianAyah: rest.tglKematianAyah || '',
    tglKematianIbu: rest.tglKematianIbu || '',
    tglPeminjaman: rest.tglPeminjaman || '',
    tglExpired: rest.tglExpired || '',
    penghasilanAyah: rest.penghasilanAyah != null ? String(rest.penghasilanAyah) : '',
    penghasilanIbu: rest.penghasilanIbu != null ? String(rest.penghasilanIbu) : '',
    penghasilanWali: rest.penghasilanWali != null ? String(rest.penghasilanWali) : '',
    penghasilanTinggal: rest.penghasilanTinggal != null ? String(rest.penghasilanTinggal) : '',
    desaId: rest.desaId != null ? Number(rest.desaId) : undefined,
    desaAyahId: rest.desaAyahId != null ? Number(rest.desaAyahId) : undefined,
    desaIbuId: rest.desaIbuId != null ? Number(rest.desaIbuId) : undefined,
    desaWaliId: rest.desaWaliId != null ? Number(rest.desaWaliId) : undefined,
    wilayahPembinaanId: rest.wilayahPembinaanId != null ? Number(rest.wilayahPembinaanId) : undefined,
    kantorId: rest.kantorId != null ? Number(rest.kantorId) : undefined,
    sdmWilayahId: rest.sdmWilayahId != null ? Number(rest.sdmWilayahId) : undefined,
    statusSurvey: rest.statusSurvey === 'y' || rest.statusSurvey === 'n' ? rest.statusSurvey : 'n',
    statusKelayakan: rest.statusKelayakan === 'y' || rest.statusKelayakan === 'n' ? rest.statusKelayakan : 'n',
    statusPinjam: rest.statusPinjam === 'y' || rest.statusPinjam === 'n' ? rest.statusPinjam : 'n',
    statusMentor: rest.statusMentor === 'y' || rest.statusMentor === 'n' ? rest.statusMentor : 'n',
    aktif: rest.aktif === 'y' || rest.aktif === 'n' ? rest.aktif : 'y',
  };
}
