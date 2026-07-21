import { z } from 'zod';

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
export const anakSchema = z.object({
  kodeAnak: z
    .string()
    .min(1, 'Kode anak wajib diisi')
    .max(25, 'Kode anak maksimal 25 karakter'),
  nik: z
    .string()
    .min(1, 'NIK wajib diisi')
    .max(50, 'NIK maksimal 50 karakter')
    .regex(/^[0-9]+$/, 'NIK harus berupa angka'),
  namaLengkap: z
    .string()
    .min(1, 'Nama lengkap wajib diisi')
    .max(200, 'Nama lengkap maksimal 200 karakter'),
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
    .min(1, 'Anak ke harus minimal 1')
    .optional(),
  dariSaudara: z
    .number()
    .int()
    .min(1, 'Dari saudara harus minimal 1')
    .optional(),
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
    .max(200, 'Nama sekolah maksimal 200 karakter')
    .optional(),
  alamatSekolah: z
    .string()
    .max(200, 'Alamat sekolah maksimal 200 karakter')
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
    .max(200, 'Nama PT maksimal 200 karakter')
    .optional(),
  alamatPt: z
    .string()
    .max(200, 'Alamat PT maksimal 200 karakter')
    .optional(),
  noRekening: z
    .string()
    .max(30, 'No rekening maksimal 30 karakter')
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
    .url('Foto harus berupa URL valid')
    .optional(),
  nilai: z
    .string()
    .max(50, 'Nilai maksimal 50 karakter')
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
    .max(500, 'Hobi maksimal 500 karakter')
    .optional(),
  prestasi: z
    .string()
    .max(500, 'Prestasi maksimal 500 karakter')
    .optional(),
  noKartuKeluarga: z
    .string()
    .max(30, 'No Kartu Keluarga maksimal 30 karakter')
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
    .max(200, 'Pekerjaan ayah maksimal 200 karakter')
    .optional(),
  penghasilanAyah: z
    .number()
    .positive('Penghasilan ayah harus positif')
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
    .max(200, 'Pekerjaan ibu maksimal 200 karakter')
    .optional(),
  penghasilanIbu: z
    .number()
    .positive('Penghasilan ibu harus positif')
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
    .max(200, 'Pekerjaan wali maksimal 200 karakter')
    .optional(),
  penghasilanWali: z
    .number()
    .positive('Penghasilan wali harus positif')
    .optional(),
  telpDihubungi: z
    .string()
    .max(20, 'No telepon maksimal 20 karakter')
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
    .max(50, 'Kode program RZ maksimal 50 karakter')
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
    .max(200, 'Tinggal bersama maksimal 200 karakter')
    .optional(),
  namaTinggal: z
    .string()
    .max(200, 'Nama tinggal maksimal 200 karakter')
    .optional(),
  ketTinggal: z
    .string()
    .max(500, 'Keterangan tinggal maksimal 500 karakter')
    .optional(),
  penghasilanTinggal: z
    .string()
    .max(200, 'Penghasilan tinggal maksimal 200 karakter')
    .optional(),
  pekerjaanTinggal: z
    .string()
    .max(200, 'Pekerjaan tinggal maksimal 200 karakter')
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

export const anakUpdateSchema = anakSchema.partial();

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
