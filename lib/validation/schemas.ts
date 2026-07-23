import { z } from 'zod';
import { cleanAnakFormValues } from '@/lib/validation/anak-helpers';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Referensi Propinsi Schemas
export const refPropinsiSchema = z.object({
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .max(4, 'Kode maksimal 4 karakter')
    .regex(/^[0-9]+$/, 'Kode harus berupa angka'),
  nama: z
    .string()
    .min(1, 'Nama wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  ibukota: z
    .string()
    .max(100, 'Ibukota maksimal 100 karakter')
    .optional(),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
});

export const refPropinsiUpdateSchema = refPropinsiSchema.partial();

export const refKabupatenSchema = z.object({
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .max(4, 'Kode maksimal 4 karakter')
    .regex(/^[0-9]+$/, 'Kode harus berupa angka'),
  propinsiId: z.number().int().positive('Propinsi wajib dipilih'),
  nama: z
    .string()
    .min(1, 'Nama wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  isKota: z.boolean().default(false),
  ibukota: z
    .string()
    .max(100, 'Ibukota maksimal 100 karakter')
    .optional(),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
});

export const refKabupatenUpdateSchema = refKabupatenSchema.partial();

export const refKecamatanSchema = z.object({
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .max(10, 'Kode maksimal 10 karakter')
    .regex(/^[0-9]+$/, 'Kode harus berupa angka'),
  kabupatenId: z.number().int().positive('Kabupaten wajib dipilih'),
  nama: z
    .string()
    .min(1, 'Nama wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  kodepos: z
    .string()
    .max(10, 'Kodepos maksimal 10 karakter')
    .optional(),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
});

export const refKecamatanUpdateSchema = refKecamatanSchema.partial();

export const refDesaSchema = z.object({
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .max(10, 'Kode maksimal 10 karakter')
    .regex(/^[0-9]+$/, 'Kode harus berupa angka'),
  kecamatanId: z.number().int().positive('Kecamatan wajib dipilih'),
  nama: z
    .string()
    .min(1, 'Nama wajib diisi')
    .max(100, 'Nama maksimal 100 karakter'),
  isKelurahan: z.boolean().default(false),
  nomorIndukDesa: z
    .string()
    .max(50, 'Nomor induk desa maksimal 50 karakter')
    .optional(),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
});

export const refDesaUpdateSchema = refDesaSchema.partial();

// Anak Schemas (simplified for MVP - focusing on essential fields)
const anakObjectSchema = z.object({
  kodeAnak: z
    .string()
    .min(1, 'Kode anak wajib diisi')
    .max(25, 'Kode anak maksimal 25 karakter'),
  nik: z
    .string()
    .min(16, 'NIK harus 16 digit')
    .max(16, 'NIK harus 16 digit')
    .regex(/^[0-9]+$/, 'NIK harus berupa angka'),
  namaLengkap: z
    .string()
    .min(1, 'Nama lengkap wajib diisi'),
  namaPanggilan: z
    .string()
    .max(50, 'Nama panggilan maksimal 50 karakter')
    .optional(),
  agama: z
    .string()
    .max(50, 'Agama maksimal 50 karakter')
    .optional(),
  jnsKel: z
    .enum(['L', 'P'], {
      errorMap: () => ({ message: 'Jenis kelamin harus L atau P' }),
    }),
  tempatLahir: z
    .string()
    .max(50, 'Tempat lahir maksimal 50 karakter')
    .optional(),
  tglLahir: z
    .string()
    .min(1, 'Tanggal lahir wajib diisi')
    .refine((val) => !isNaN(Date.parse(val)), 'Format tanggal tidak valid'),
  anakKe: z
    .number()
    .int()
    .min(0, 'Anak ke tidak boleh negatif')
    .max(32767, 'Anak ke maksimal 32767')
    .optional()
    .nullable(),
  dariSaudara: z
    .number()
    .int()
    .min(0, 'Dari saudara tidak boleh negatif')
    .max(32767, 'Dari saudara maksimal 32767')
    .optional()
    .nullable(),
  alamat: z
    .string()
    .max(150, 'Alamat maksimal 150 karakter')
    .optional(),
  desaId: z
    .number()
    .int()
    .positive('Desa ID harus positif')
    .optional(),
  jenjangPendidikan: z
    .string()
    .max(10, 'Jenjang pendidikan maksimal 10 karakter')
    .optional(),
  kelas: z
    .string()
    .max(50, 'Kelas maksimal 50 karakter')
    .optional(),
  namaSekolah: z
    .string()
    .optional(),
  alamatSekolah: z
    .string()
    .optional(),
  jurusan: z
    .string()
    .max(50, 'Jurusan maksimal 50 karakter')
    .optional(),
  semester: z
    .number()
    .int()
    .min(1, 'Semester minimal 1')
    .max(14, 'Semester maksimal 14')
    .optional(),
  namaPt: z
    .string()
    .optional(),
  alamatPt: z
    .string()
    .optional(),
  noRekening: z
    .string()
    .min(10, 'No rekening minimal 10 digit')
    .max(16, 'No rekening maksimal 16 digit')
    .regex(/^[0-9]+$/, 'No rekening harus berupa angka')
    .optional(),
  pemilikRekening: z
    .string()
    .max(50, 'Pemilik rekening maksimal 50 karakter')
    .optional(),
  namaBank: z
    .string()
    .max(50, 'Nama bank maksimal 50 karakter')
    .optional(),
  foto: z
    .string()
    .optional(),
  nilai: z
    .enum(['A', 'B', 'C', 'D', 'F'], {
      errorMap: () => ({ message: 'Nilai harus A, B, C, D, atau F' }),
    })
    .optional(),
  pelajaranFavorit: z
    .string()
    .max(50, 'Pelajaran favorit maksimal 50 karakter')
    .optional(),
  jarakRumah: z
    .string()
    .max(50, 'Jarak rumah maksimal 50 karakter')
    .optional(),
  alatTransportasi: z
    .string()
    .max(50, 'Alat transportasi maksimal 50 karakter')
    .optional(),
  hobi: z
    .string()
    .optional(),
  prestasi: z
    .string()
    .optional(),
  noKartuKeluarga: z
    .string()
    .min(16, 'No Kartu Keluarga harus 16 digit')
    .max(16, 'No Kartu Keluarga harus 16 digit')
    .regex(/^[0-9]+$/, 'No Kartu Keluarga harus berupa angka')
    .optional(),
  asnaf: z
    .string()
    .max(50, 'Asnaf maksimal 50 karakter')
    .optional(),
  statusOrtu: z
    .string()
    .max(50, 'Status ortu maksimal 50 karakter')
    .optional(),
  statusSurvey: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status survey harus y atau n' }),
    })
    .default('n'),
  statusKelayakan: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status kelayakan harus y atau n' }),
    })
    .default('n'),
  statusAnakJuara: z
    .string()
    .max(3, 'Status anak juara maksimal 3 karakter')
    .optional(),
  statusTersantuni: z
    .string()
    .max(2, 'Status tersantuni maksimal 2 karakter')
    .optional(),
  statusPinjam: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status pinjam harus y atau n' }),
    })
    .default('n'),
  statusMentor: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status mentor harus y atau n' }),
    })
    .default('n'),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
  alumniJuara: z
    .string()
    .max(1, 'Alumni juara maksimal 1 karakter')
    .optional(),
  juara: z
    .string()
    .max(10, 'Juara maksimal 10 karakter')
    .optional(),
  wilayahPembinaanId: z
    .number()
    .int()
    .positive('Wilayah pembinaan ID harus positif')
    .optional(),
  kantorId: z
    .number()
    .int()
    .positive('Kantor ID harus positif')
    .optional(),
  sdmWilayahId: z
    .number()
    .int()
    .positive('SDM wilayah ID harus positif')
    .optional(),
  namaMentorManual: z
    .string()
    .max(100, 'Nama mentor manual maksimal 100 karakter')
    .optional(),
  tglTerdaftar: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Format tanggal tidak valid')
    .optional(),
  tglPengajuan: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Format tanggal tidak valid')
    .optional(),
  namaLengkapAyah: z
    .string()
    .max(100, 'Nama lengkap ayah maksimal 100 karakter')
    .optional(),
  alamatAyah: z
    .string()
    .max(150, 'Alamat ayah maksimal 150 karakter')
    .optional(),
  desaAyahId: z
    .number()
    .int()
    .positive('Desa ayah ID harus positif')
    .optional(),
  pekerjaanAyah: z
    .string()
    .optional(),
  penghasilanAyah: z
    .string()
    .refine((val) => !val || !isNaN(parseFloat(val)), 'Penghasilan ayah harus berupa angka')
    .optional(),
  tglKematianAyah: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Format tanggal tidak valid')
    .optional(),
  penyebabKematianAyah: z
    .string()
    .max(150, 'Penyebab kematian ayah maksimal 150 karakter')
    .optional(),
  namaLengkapIbu: z
    .string()
    .max(100, 'Nama lengkap ibu maksimal 100 karakter')
    .optional(),
  alamatIbu: z
    .string()
    .max(150, 'Alamat ibu maksimal 150 karakter')
    .optional(),
  desaIbuId: z
    .number()
    .int()
    .positive('Desa ibu ID harus positif')
    .optional(),
  pekerjaanIbu: z
    .string()
    .optional(),
  penghasilanIbu: z
    .string()
    .refine((val) => !val || !isNaN(parseFloat(val)), 'Penghasilan ibu harus berupa angka')
    .optional(),
  tglKematianIbu: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Format tanggal tidak valid')
    .optional(),
  penyebabKematianIbu: z
    .string()
    .max(150, 'Penyebab kematian ibu maksimal 150 karakter')
    .optional(),
  namaLengkapWali: z
    .string()
    .max(100, 'Nama lengkap wali maksimal 100 karakter')
    .optional(),
  alamatWali: z
    .string()
    .max(150, 'Alamat wali maksimal 150 karakter')
    .optional(),
  desaWaliId: z
    .number()
    .int()
    .positive('Desa wali ID harus positif')
    .optional(),
  pekerjaanWali: z
    .string()
    .optional(),
  penghasilanWali: z
    .string()
    .refine((val) => !val || !isNaN(parseFloat(val)), 'Penghasilan wali harus berupa angka')
    .optional(),
  telpDihubungi: z
    .string()
    .min(10, 'No telepon minimal 10 digit')
    .max(14, 'No telepon maksimal 14 digit')
    .regex(/^[0-9]+$/, 'No telepon harus berupa angka')
    .optional(),
  atasNama: z
    .string()
    .max(50, 'Atas nama maksimal 50 karakter')
    .optional(),
  hubunganKerabat: z
    .string()
    .max(30, 'Hubungan kerabat maksimal 30 karakter')
    .optional(),
  viaInput: z
    .string()
    .max(100, 'Via input maksimal 100 karakter')
    .optional(),
  approvalIjf: z
    .string()
    .max(50, 'Approval IJF maksimal 50 karakter')
    .optional(),
  kodeProgramRz: z
    .string()
    .optional(),
  niaRfoBook: z
    .string()
    .max(50, 'NIA RFO Book maksimal 50 karakter')
    .optional(),
  namaRfoBook: z
    .string()
    .max(100, 'Nama RFO Book maksimal 100 karakter')
    .optional(),
  tglPeminjaman: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Format tanggal tidak valid')
    .optional(),
  tglExpired: z
    .string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Format tanggal tidak valid')
    .optional(),
  bookVia: z
    .string()
    .max(50, 'Book via maksimal 50 karakter')
    .optional(),
  userBook: z
    .string()
    .max(50, 'User book maksimal 50 karakter')
    .optional(),
  tinggalBersama: z
    .string()
    .optional(),
  namaTinggal: z
    .string()
    .optional(),
  ketTinggal: z
    .string()
    .optional(),
  penghasilanTinggal: z
    .string()
    .optional(),
  pekerjaanTinggal: z
    .string()
    .optional(),
  tidakSerumahOrtu: z
    .string()
    .max(50, 'Tidak serumah ortu maksimal 50 karakter')
    .optional(),
  kodeKantorLegacy: z
    .string()
    .max(10, 'Kode kantor legacy maksimal 10 karakter')
    .optional(),
  kodeIjgsAnak: z
    .string()
    .max(50, 'Kode IJGS anak maksimal 50 karakter')
    .optional(),
  uploadGdrive: z
    .string()
    .max(50, 'Upload GDrive maksimal 50 karakter')
    .optional(),
});

export const anakSchema = z.preprocess(cleanAnakFormValues, anakObjectSchema);
export const anakUpdateSchema = z.preprocess(cleanAnakFormValues, anakObjectSchema.partial());

// Pembinaan (Sesi Pembinaan) Schemas
const pembinaanObjectSchema = z.object({
  kodePembinaan: z.string().max(100, 'Kode pembinaan maksimal 100 karakter').optional(),
  tglPembinaan: z.string().min(1, 'Tanggal pembinaan wajib diisi'),
  semesterId: z.number().int().positive('Semester ID harus positif').optional(),
  bulan: z.number().int().min(1).max(12).optional(),
  tahun: z.number().int().min(2000).max(2100).optional(),
  jenisPembinaan: z.string().max(255, 'Jenis pembinaan maksimal 255 karakter').optional(),
  p3a: z.string().max(255, 'P3A maksimal 255 karakter').optional(),
  judulMateri: z.string().max(255, 'Judul materi maksimal 255 karakter').optional(),
  anakId: z.number().int().positive('Anak ID harus positif'),
  kehadiran: z.string().max(15, 'Kehadiran maksimal 15 karakter').optional(),
  keterangan: z.string().max(50, 'Keterangan maksimal 50 karakter').optional(),
  wilayahPembinaanId: z.number().int().positive('Wilayah pembinaan ID harus positif').optional(),
  kantorId: z.number().int().positive('Kantor ID harus positif').optional(),
  pemateri: z.string().max(255, 'Pemateri maksimal 255 karakter').optional(),
  pemateriPersonal: z.string().max(255, 'Pemateri personal maksimal 255 karakter').optional(),
  ortuHadir: z.string().max(50, 'Ortu hadir maksimal 50 karakter').optional(),
  donaturId: z.number().int().positive('Donatur ID harus positif').optional(),
  programDonasi: z.string().max(50, 'Program donasi maksimal 50 karakter').optional(),
  tampil: z.enum(['y', 'n']).default('y'),
  viaInput: z.string().max(50, 'Via input maksimal 50 karakter').optional(),
  image: z.string().max(500, 'URL gambar maksimal 500 karakter').optional(),
  uploadGdrive: z.string().max(500, 'URL Google Drive maksimal 500 karakter').optional(),
  capaianTilawah: z.string().max(50, 'Capaian tilawah maksimal 50 karakter').optional(),
  capaianTahfidz: z.string().max(50, 'Capaian tahfidz maksimal 50 karakter').optional(),
  capaianTahfidzHalaman: z.string().max(50, 'Capaian tahfidz halaman maksimal 50 karakter').optional(),
  pembiasaanShalatWajib: z.number().int().min(1).max(5).optional(),
  pembiasaanTilawah: z.number().int().min(1).max(5).optional(),
  pembiasaanSedekah: z.number().int().min(1).max(5).optional(),
  membantuOrtu: z.number().int().min(1).max(5).optional(),
});

export const pembinaanSchema = pembinaanObjectSchema;
// For update schema, allow null for optional fields and convert to undefined
export const pembinaanUpdateSchema = pembinaanObjectSchema
  .partial()
  .transform((data: any) => {
    // Transform null values to undefined for optional fields
    const transformed: any = {};
    Object.keys(data).forEach((key: string) => {
      transformed[key] = data[key] === null ? undefined : data[key];
    });
    return transformed;
  });

// Base schema without anakId for form (both create and edit)
export const pembinaanFormSchema = pembinaanObjectSchema.omit({ anakId: true });
export const pembinaanFormUpdateSchema = pembinaanObjectSchema
  .omit({ anakId: true })
  .partial()
  .transform((data: any) => {
    // Transform null values to undefined for optional fields
    const transformed: any = {};
    Object.keys(data).forEach((key: string) => {
      transformed[key] = data[key] === null ? undefined : data[key];
    });
    return transformed;
  });

export type PembinaanInput = z.infer<typeof pembinaanSchema>;
export type PembinaanUpdateInput = z.infer<typeof pembinaanUpdateSchema>;

// Semester Schemas
const semesterObjectSchema = z.object({
  kodeLama: z.string().max(50, 'Kode lama maksimal 50 karakter').optional(),
  nama: z.string().min(1, 'Nama semester wajib diisi').max(100, 'Nama semester maksimal 100 karakter'),
  tglAwal: z.string().optional(),
  tglAkhir: z.string().optional(),
  onprogress: z.enum(['y', 'n']).default('n'),
  tglAwalDonasi: z.string().optional(),
  tglAkhirDonasi: z.string().optional(),
  tglAwalSaldo: z.string().optional(),
  tglAkhirSaldo: z.string().optional(),
  jenis: z.string().max(10, 'Jenis semester maksimal 10 karakter').optional(),
  tahun: z.number().int().min(2000).max(2100).optional(),
  lapsem: z.enum(['y', 'n']).default('y'),
});

export const semesterSchema = z.preprocess(cleanAnakFormValues, semesterObjectSchema);
export const semesterUpdateSchema = z.preprocess(cleanAnakFormValues, semesterObjectSchema.partial());

export type SemesterInput = z.infer<typeof semesterSchema>;
export type SemesterUpdateInput = z.infer<typeof semesterUpdateSchema>;

// Kantor Schemas
export const kantorSchema = z.object({
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .max(10, 'Kode maksimal 10 karakter'),
  nama: z
    .string()
    .min(1, 'Nama wajib diisi')
    .max(150, 'Nama maksimal 150 karakter'),
  alamat: z
    .string()
    .max(200, 'Alamat maksimal 200 karakter')
    .optional(),
  noTelp: z
    .string()
    .max(20, 'No telepon maksimal 20 karakter')
    .optional(),
  parentId: z
    .number()
    .int()
    .positive('Parent ID harus positif')
    .optional()
    .nullable(),
  parentSecondId: z
    .number()
    .int()
    .positive('Parent Second ID harus positif')
    .optional()
    .nullable(),
  kodeProgramRz: z
    .string()
    .max(50, 'Kode program RZ maksimal 50 karakter')
    .optional(),
  jenis: z
    .string()
    .max(50, 'Jenis maksimal 50 karakter')
    .optional(),
  kodeKantorLegacy: z
    .string()
    .max(20, 'Kode kantor legacy maksimal 20 karakter')
    .optional(),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
});

export const kantorUpdateSchema = kantorSchema.partial();

// Wilayah Pembinaan Schemas
export const wilayahSchema = z.object({
  kodeLama: z
    .number()
    .int()
    .positive('Kode lama harus positif')
    .optional(),
  namaWilayah: z
    .string()
    .min(1, 'Nama wilayah wajib diisi')
    .max(150, 'Nama wilayah maksimal 150 karakter'),
  alamatWilayah: z
    .string()
    .max(500, 'Alamat wilayah maksimal 500 karakter')
    .optional(),
  kantorId: z
    .number()
    .int()
    .positive('Kantor ID harus positif')
    .optional()
    .nullable(),
  desaId: z
    .number()
    .int()
    .positive('Desa ID harus positif')
    .optional()
    .nullable(),
  statusApprove: z
    .enum(['y', 't'], {
      errorMap: () => ({ message: 'Status approve harus y atau t' }),
    })
    .optional(),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
  userInsert: z
    .string()
    .max(50, 'User insert maksimal 50 karakter')
    .optional(),
});

export const wilayahUpdateSchema = wilayahSchema.partial();

// User Schemas
export const userSchema = z.object({
  kodeLama: z
    .number()
    .int()
    .positive('Kode lama harus positif')
    .optional(),
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .max(100, 'Username maksimal 100 karakter'),
  email: z
    .string()
    .email('Email tidak valid')
    .max(255, 'Email maksimal 255 karakter')
    .optional(),
  passwordHash: z
    .string()
    .min(1, 'Password hash wajib diisi')
    .max(255, 'Password hash maksimal 255 karakter'),
  mustResetPassword: z
    .boolean()
    .default(true),
  failedLoginAttempts: z
    .number()
    .int()
    .min(0, 'Failed login attempts tidak boleh negatif')
    .default(0),
  lockedUntil: z
    .string()
    .optional(),
  nik: z
    .string()
    .max(20, 'NIK maksimal 20 karakter')
    .optional(),
  kantorId: z
    .number()
    .int()
    .positive('Kantor ID harus positif')
    .optional()
    .nullable(),
  groupUserId: z
    .number()
    .int()
    .positive('Group User ID harus positif')
    .optional()
    .nullable(),
  aktif: z
    .enum(['y', 'n'], {
      errorMap: () => ({ message: 'Status harus Aktif atau Nonaktif' }),
    })
    .default('y'),
  userInsert: z
    .string()
    .max(50, 'User insert maksimal 50 karakter')
    .optional(),
});

export const userUpdateSchema = userSchema
  .partial()
  .omit({
    passwordHash: true,
    failedLoginAttempts: true,
    lockedUntil: true,
    userInsert: true,
    dateInsert: true,
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type RefPropinsiInput = z.infer<typeof refPropinsiSchema>;
export type RefPropinsiUpdateInput = z.infer<typeof refPropinsiUpdateSchema>;
export type RefKabupatenInput = z.infer<typeof refKabupatenSchema>;
export type RefKabupatenUpdateInput = z.infer<typeof refKabupatenUpdateSchema>;
export type RefKecamatanInput = z.infer<typeof refKecamatanSchema>;
export type RefKecamatanUpdateInput = z.infer<typeof refKecamatanUpdateSchema>;
export type RefDesaInput = z.infer<typeof refDesaSchema>;
export type RefDesaUpdateInput = z.infer<typeof refDesaUpdateSchema>;
export type AnakInput = z.infer<typeof anakSchema>;
export type AnakUpdateInput = z.infer<typeof anakUpdateSchema>;
export type KantorInput = z.infer<typeof kantorSchema>;
export type KantorUpdateInput = z.infer<typeof kantorUpdateSchema>;
export type WilayahInput = z.infer<typeof wilayahSchema>;
export type WilayahUpdateInput = z.infer<typeof wilayahUpdateSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

// Donatur Schemas
const STATUS_DONATUR_VALUES = [
  'individu', 'corporate', 'komunitas', 'lembaga', 'masjid',
  'sekolah', 'yayasan', 'instansi', 'organisasi', 'media', 'lainnya',
] as const;

const donaturObjectSchema = z.object({
  kodeLama: z.string().max(30, 'Kode lama maksimal 30 karakter').optional(),
  namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi').max(100, 'Nama lengkap maksimal 100 karakter'),
  namaPublikasi: z.string().max(100, 'Nama publikasi maksimal 100 karakter').optional(),
  tglLahir: z.string().optional(),
  jenisKelamin: z.enum(['l', 'p', 't'], {
    errorMap: () => ({ message: 'Jenis kelamin harus L, P, atau T (tidak diketahui)' }),
  }).optional(),
  alamatLengkap: z.string().max(500, 'Alamat lengkap maksimal 500 karakter').optional(),
  alamatSilaturahmi: z.string().max(500, 'Alamat silaturahmi maksimal 500 karakter').optional(),
  kecamatanDomisiliId: z.number().int().positive('Kecamatan domisili ID harus positif').optional().nullable(),
  kecamatanSilaturahmiId: z.number().int().positive('Kecamatan silaturahmi ID harus positif').optional().nullable(),
  statusDonatur: z.string().min(1, 'Status donatur wajib dipilih').max(10, 'Status donatur maksimal 10 karakter'),
  tglRegistrasi: z.string().optional(),
  aktif: z.enum(['y', 'n', 'p'], {
    errorMap: () => ({ message: 'Status harus Aktif (y), Nonaktif (n), atau Pending (p)' }),
  }).default('y'),
  kirimSms: z.enum(['y', 'n'], {
    errorMap: () => ({ message: 'Kirim SMS harus Ya atau Tidak' }),
  }).default('n'),
  telp: z.string().max(30, 'Telepon maksimal 30 karakter').optional(),
  fax: z.string().max(15, 'Fax maksimal 15 karakter').optional(),
  hp: z.string().max(30, 'HP maksimal 30 karakter').optional(),
  email: z.string().email('Email tidak valid').max(100, 'Email maksimal 100 karakter').or(z.literal('')).optional(),
  website: z.string().max(100, 'Website maksimal 100 karakter').optional(),
  namaKontak: z.string().max(50, 'Nama kontak maksimal 50 karakter').optional(),
  telpKontak: z.string().max(30, 'Telepon kontak maksimal 30 karakter').optional(),
  emailKontak: z.string().email('Email kontak tidak valid').max(100, 'Email kontak maksimal 100 karakter').or(z.literal('')).optional(),
  jabatanKontak: z.string().max(50, 'Jabatan kontak maksimal 50 karakter').optional(),
  namaBank: z.string().max(50, 'Nama bank maksimal 50 karakter').optional(),
  noRekening: z.string().max(30, 'No rekening maksimal 30 karakter').optional(),
  kantorDonaturId: z.number().int().positive('Kantor donatur ID harus positif').optional().nullable(),
  niaRfo: z.string().max(15, 'NIA RFO maksimal 15 karakter').optional(),
  namaRfo: z.string().max(50, 'Nama RFO maksimal 50 karakter').optional(),
  tipePelayanan: z.string().max(30, 'Tipe pelayanan maksimal 30 karakter').optional(),
  npwp: z.string().max(30, 'NPWP maksimal 30 karakter').optional(),
});

export const donaturSchema = z.preprocess(cleanAnakFormValues, donaturObjectSchema);
export const donaturUpdateSchema = z.preprocess(cleanAnakFormValues, donaturObjectSchema.partial());

export type DonaturInput = z.infer<typeof donaturSchema>;
export type DonaturUpdateInput = z.infer<typeof donaturUpdateSchema>;

// Pembinaan Dokumentasi Schemas
const pembinaanDokumentasiObjectSchema = z.object({
  semesterId: z.number().int().positive('Semester ID harus positif').optional(),
  kantorId: z.number().int().positive('Kantor ID harus positif').optional(),
  wilayahPembinaanId: z.number().int().positive('Wilayah pembinaan ID harus positif').optional(),
  image: z.string().max(500, 'URL gambar maksimal 500 karakter').optional(),
  nama: z.string().min(1, 'Nama dokumentasi wajib diisi').max(100, 'Nama dokumentasi maksimal 100 karakter'),
  uploadGdrive: z.string().max(500, 'URL Google Drive maksimal 500 karakter').optional(),
});

export const pembinaanDokumentasiSchema = pembinaanDokumentasiObjectSchema.refine(
  (data) => data.image || data.uploadGdrive,
  {
    message: 'Dokumentasi wajib memiliki foto atau URL Google Drive',
    path: ['image'],
  }
);

export const pembinaanDokumentasiUpdateSchema = pembinaanDokumentasiObjectSchema.partial().refine(
  (data) => !data.image && !data.uploadGdrive || data.image || data.uploadGdrive,
  {
    message: 'Dokumentasi wajib memiliki foto atau URL Google Drive',
    path: ['image'],
  }
);

export type PembinaanDokumentasiInput = z.infer<typeof pembinaanDokumentasiSchema>;
export type PembinaanDokumentasiUpdateInput = z.infer<typeof pembinaanDokumentasiUpdateSchema>;

// SDM Wilayah Schemas
const sdmWilayahObjectSchema = z.object({
  kodeLama: z.number().int().optional(),
  nik: z.string().max(20, 'NIK maksimal 20 karakter').optional().or(z.literal('')),
  namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi').max(100, 'Maksimal 100 karakter'),
  jenisKelamin: z.string().length(1).optional().or(z.literal('')),
  alamat: z.string().max(200).optional().or(z.literal('')),
  desaId: z.number().int().positive().optional(),
  jenjangPendidikan: z.string().max(10).optional().or(z.literal('')),
  tglBergabung: z.string().optional().or(z.literal('')),
  tglKeluar: z.string().optional().or(z.literal('')),
  telp: z.string().max(20).optional().or(z.literal('')),
  hp: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Format email tidak valid').max(100).optional().or(z.literal('')),
  keterangan: z.string().max(200).optional().or(z.literal('')),
  keaktifanEdukasi: z.string().length(1).optional().or(z.literal('')),
  foto: z.string().max(200).optional().or(z.literal('')),
  aktif: z.string().max(10).default('y'),
  penugasanWilayahId: z.number().int().positive().optional(),
  penugasanKantorId: z.number().int().positive().optional(),
  penugasanFungsiStruktur: z.string().max(16).optional().or(z.literal('')),
  penugasanKeaktifanEdukasi: z.string().length(1).optional().or(z.literal('')),
});

// Use preprocess if necessary for empty strings turning to null or omitting
export const sdmWilayahSchema = z.preprocess(cleanAnakFormValues, sdmWilayahObjectSchema);
export const sdmWilayahUpdateSchema = z.preprocess(cleanAnakFormValues, sdmWilayahObjectSchema.partial());

export type SdmWilayahInput = z.infer<typeof sdmWilayahSchema>;
export type SdmWilayahUpdateInput = z.infer<typeof sdmWilayahUpdateSchema>;
