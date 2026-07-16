import { relations } from "drizzle-orm/relations";
import { refPropinsi, refKabupaten, refKecamatan, refDesa, ajisKantor, ajisWilayahPembinaan, ajisUser, ajisGroupUser, ajisSdmWilayah, ajisSdmWilayahRiwayat, ajisAnak, donatur, ajisSurvey, program, pemasangan, donasiTransaksi, penyaluran, opnameSaldo, pengajuanPergantianAnak, transaksi, ajisSemester, ajisSemesterTemplate, pembinaan, pembinaanDokumentasi, hafalanAnak, itemHafalan, itemPenilaian, penilaianAnak, materiPembinaan, laporanSemester, peminjamanAjisAnak, laporanSemesterPembinaan, laporanPrestasi, prestasiAnak, ajisUserWilayahPembinaan } from "./schema";

export const refKabupatenRelations = relations(refKabupaten, ({one, many}) => ({
	refPropinsi: one(refPropinsi, {
		fields: [refKabupaten.propinsiId],
		references: [refPropinsi.id]
	}),
	refKecamatans: many(refKecamatan),
}));

export const refPropinsiRelations = relations(refPropinsi, ({many}) => ({
	refKabupatens: many(refKabupaten),
}));

export const refKecamatanRelations = relations(refKecamatan, ({one, many}) => ({
	refKabupaten: one(refKabupaten, {
		fields: [refKecamatan.kabupatenId],
		references: [refKabupaten.id]
	}),
	refDesas: many(refDesa),
	donaturs_kecamatanDomisiliId: many(donatur, {
		relationName: "donatur_kecamatanDomisiliId_refKecamatan_id"
	}),
	donaturs_kecamatanSilaturahmiId: many(donatur, {
		relationName: "donatur_kecamatanSilaturahmiId_refKecamatan_id"
	}),
}));

export const refDesaRelations = relations(refDesa, ({one, many}) => ({
	refKecamatan: one(refKecamatan, {
		fields: [refDesa.kecamatanId],
		references: [refKecamatan.id]
	}),
	ajisWilayahPembinaans: many(ajisWilayahPembinaan),
	ajisSdmWilayahs: many(ajisSdmWilayah),
	ajisAnaks_desaId: many(ajisAnak, {
		relationName: "ajisAnak_desaId_refDesa_id"
	}),
	ajisAnaks_desaAyahId: many(ajisAnak, {
		relationName: "ajisAnak_desaAyahId_refDesa_id"
	}),
	ajisAnaks_desaIbuId: many(ajisAnak, {
		relationName: "ajisAnak_desaIbuId_refDesa_id"
	}),
	ajisAnaks_desaWaliId: many(ajisAnak, {
		relationName: "ajisAnak_desaWaliId_refDesa_id"
	}),
}));

export const ajisKantorRelations = relations(ajisKantor, ({one, many}) => ({
	ajisKantor_parentId: one(ajisKantor, {
		fields: [ajisKantor.parentId],
		references: [ajisKantor.id],
		relationName: "ajisKantor_parentId_ajisKantor_id"
	}),
	ajisKantors_parentId: many(ajisKantor, {
		relationName: "ajisKantor_parentId_ajisKantor_id"
	}),
	ajisKantor_parentSecondId: one(ajisKantor, {
		fields: [ajisKantor.parentSecondId],
		references: [ajisKantor.id],
		relationName: "ajisKantor_parentSecondId_ajisKantor_id"
	}),
	ajisKantors_parentSecondId: many(ajisKantor, {
		relationName: "ajisKantor_parentSecondId_ajisKantor_id"
	}),
	ajisWilayahPembinaans: many(ajisWilayahPembinaan),
	ajisUsers: many(ajisUser),
	ajisSdmWilayahs: many(ajisSdmWilayah),
	ajisSdmWilayahRiwayats: many(ajisSdmWilayahRiwayat),
	ajisAnaks: many(ajisAnak),
	donaturs: many(donatur),
	ajisSurveys: many(ajisSurvey),
	pemasangans: many(pemasangan),
	donasiTransaksis: many(donasiTransaksi),
	penyalurans: many(penyaluran),
	pengajuanPergantianAnaks_kantorId: many(pengajuanPergantianAnak, {
		relationName: "pengajuanPergantianAnak_kantorId_ajisKantor_id"
	}),
	pengajuanPergantianAnaks_kantorDonaturId: many(pengajuanPergantianAnak, {
		relationName: "pengajuanPergantianAnak_kantorDonaturId_ajisKantor_id"
	}),
	transaksis_kantorTransaksiId: many(transaksi, {
		relationName: "transaksi_kantorTransaksiId_ajisKantor_id"
	}),
	transaksis_kantorDonaturId: many(transaksi, {
		relationName: "transaksi_kantorDonaturId_ajisKantor_id"
	}),
	transaksis_kantorIjisId: many(transaksi, {
		relationName: "transaksi_kantorIjisId_ajisKantor_id"
	}),
	pembinaans: many(pembinaan),
	pembinaanDokumentasis: many(pembinaanDokumentasi),
	penilaianAnaks: many(penilaianAnak),
	materiPembinaans: many(materiPembinaan),
	laporanSemesters: many(laporanSemester),
	peminjamanAjisAnaks: many(peminjamanAjisAnak),
	laporanPrestasis: many(laporanPrestasi),
}));

export const ajisWilayahPembinaanRelations = relations(ajisWilayahPembinaan, ({one, many}) => ({
	ajisKantor: one(ajisKantor, {
		fields: [ajisWilayahPembinaan.kantorId],
		references: [ajisKantor.id]
	}),
	refDesa: one(refDesa, {
		fields: [ajisWilayahPembinaan.desaId],
		references: [refDesa.id]
	}),
	ajisSdmWilayahs: many(ajisSdmWilayah),
	ajisSdmWilayahRiwayats: many(ajisSdmWilayahRiwayat),
	ajisAnaks: many(ajisAnak),
	ajisSurveys: many(ajisSurvey),
	pemasangans: many(pemasangan),
	donasiTransaksis: many(donasiTransaksi),
	penyalurans: many(penyaluran),
	pengajuanPergantianAnaks: many(pengajuanPergantianAnak),
	pembinaans: many(pembinaan),
	pembinaanDokumentasis: many(pembinaanDokumentasi),
	penilaianAnaks: many(penilaianAnak),
	materiPembinaans: many(materiPembinaan),
	laporanSemesters: many(laporanSemester),
	peminjamanAjisAnaks: many(peminjamanAjisAnak),
	laporanPrestasis: many(laporanPrestasi),
	ajisUserWilayahPembinaans: many(ajisUserWilayahPembinaan),
}));

export const ajisUserRelations = relations(ajisUser, ({one, many}) => ({
	ajisKantor: one(ajisKantor, {
		fields: [ajisUser.kantorId],
		references: [ajisKantor.id]
	}),
	ajisGroupUser: one(ajisGroupUser, {
		fields: [ajisUser.groupUserId],
		references: [ajisGroupUser.id]
	}),
	ajisUserWilayahPembinaans: many(ajisUserWilayahPembinaan),
}));

export const ajisGroupUserRelations = relations(ajisGroupUser, ({many}) => ({
	ajisUsers: many(ajisUser),
}));

export const ajisSdmWilayahRelations = relations(ajisSdmWilayah, ({one, many}) => ({
	refDesa: one(refDesa, {
		fields: [ajisSdmWilayah.desaId],
		references: [refDesa.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [ajisSdmWilayah.penugasanWilayahId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [ajisSdmWilayah.penugasanKantorId],
		references: [ajisKantor.id]
	}),
	ajisSdmWilayahRiwayats: many(ajisSdmWilayahRiwayat),
	ajisAnaks: many(ajisAnak),
	pemasangans: many(pemasangan),
	penyalurans: many(penyaluran),
}));

export const ajisSdmWilayahRiwayatRelations = relations(ajisSdmWilayahRiwayat, ({one}) => ({
	ajisSdmWilayah: one(ajisSdmWilayah, {
		fields: [ajisSdmWilayahRiwayat.sdmWilayahId],
		references: [ajisSdmWilayah.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [ajisSdmWilayahRiwayat.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [ajisSdmWilayahRiwayat.kantorId],
		references: [ajisKantor.id]
	}),
}));

export const ajisAnakRelations = relations(ajisAnak, ({one, many}) => ({
	refDesa_desaId: one(refDesa, {
		fields: [ajisAnak.desaId],
		references: [refDesa.id],
		relationName: "ajisAnak_desaId_refDesa_id"
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [ajisAnak.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [ajisAnak.kantorId],
		references: [ajisKantor.id]
	}),
	ajisSdmWilayah: one(ajisSdmWilayah, {
		fields: [ajisAnak.sdmWilayahId],
		references: [ajisSdmWilayah.id]
	}),
	refDesa_desaAyahId: one(refDesa, {
		fields: [ajisAnak.desaAyahId],
		references: [refDesa.id],
		relationName: "ajisAnak_desaAyahId_refDesa_id"
	}),
	refDesa_desaIbuId: one(refDesa, {
		fields: [ajisAnak.desaIbuId],
		references: [refDesa.id],
		relationName: "ajisAnak_desaIbuId_refDesa_id"
	}),
	refDesa_desaWaliId: one(refDesa, {
		fields: [ajisAnak.desaWaliId],
		references: [refDesa.id],
		relationName: "ajisAnak_desaWaliId_refDesa_id"
	}),
	ajisSurveys: many(ajisSurvey),
	pemasangans: many(pemasangan),
	donasiTransaksis: many(donasiTransaksi),
	penyalurans: many(penyaluran),
	pengajuanPergantianAnaks_anakAsalId: many(pengajuanPergantianAnak, {
		relationName: "pengajuanPergantianAnak_anakAsalId_ajisAnak_id"
	}),
	pengajuanPergantianAnaks_anakPenggantiId: many(pengajuanPergantianAnak, {
		relationName: "pengajuanPergantianAnak_anakPenggantiId_ajisAnak_id"
	}),
	pembinaans: many(pembinaan),
	hafalanAnaks: many(hafalanAnak),
	penilaianAnaks: many(penilaianAnak),
	laporanSemesters: many(laporanSemester),
	peminjamanAjisAnaks: many(peminjamanAjisAnak),
	laporanSemesterPembinaans: many(laporanSemesterPembinaan),
	laporanPrestasis: many(laporanPrestasi),
	prestasiAnaks: many(prestasiAnak),
}));

export const donaturRelations = relations(donatur, ({one, many}) => ({
	refKecamatan_kecamatanDomisiliId: one(refKecamatan, {
		fields: [donatur.kecamatanDomisiliId],
		references: [refKecamatan.id],
		relationName: "donatur_kecamatanDomisiliId_refKecamatan_id"
	}),
	refKecamatan_kecamatanSilaturahmiId: one(refKecamatan, {
		fields: [donatur.kecamatanSilaturahmiId],
		references: [refKecamatan.id],
		relationName: "donatur_kecamatanSilaturahmiId_refKecamatan_id"
	}),
	ajisKantor: one(ajisKantor, {
		fields: [donatur.kantorDonaturId],
		references: [ajisKantor.id]
	}),
	pemasangans: many(pemasangan),
	donasiTransaksis: many(donasiTransaksi),
	penyalurans: many(penyaluran),
	pengajuanPergantianAnaks: many(pengajuanPergantianAnak),
	transaksis: many(transaksi),
	pembinaans: many(pembinaan),
	laporanSemesters: many(laporanSemester),
}));

export const ajisSurveyRelations = relations(ajisSurvey, ({one}) => ({
	ajisAnak: one(ajisAnak, {
		fields: [ajisSurvey.anakId],
		references: [ajisAnak.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [ajisSurvey.kantorId],
		references: [ajisKantor.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [ajisSurvey.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
}));

export const programRelations = relations(program, ({one, many}) => ({
	program: one(program, {
		fields: [program.parentId],
		references: [program.id],
		relationName: "program_parentId_program_id"
	}),
	programs: many(program, {
		relationName: "program_parentId_program_id"
	}),
	pemasangans: many(pemasangan),
	donasiTransaksis: many(donasiTransaksi),
	penyalurans: many(penyaluran),
	transaksis: many(transaksi),
}));

export const pemasanganRelations = relations(pemasangan, ({one, many}) => ({
	ajisSdmWilayah: one(ajisSdmWilayah, {
		fields: [pemasangan.sdmWilayahId],
		references: [ajisSdmWilayah.id]
	}),
	donatur: one(donatur, {
		fields: [pemasangan.donaturId],
		references: [donatur.id]
	}),
	ajisAnak: one(ajisAnak, {
		fields: [pemasangan.anakId],
		references: [ajisAnak.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [pemasangan.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [pemasangan.kantorId],
		references: [ajisKantor.id]
	}),
	program: one(program, {
		fields: [pemasangan.programId],
		references: [program.id]
	}),
	donasiTransaksis: many(donasiTransaksi),
	penyalurans: many(penyaluran),
	opnameSaldos: many(opnameSaldo),
	pengajuanPergantianAnaks: many(pengajuanPergantianAnak),
	laporanSemesters: many(laporanSemester),
}));

export const donasiTransaksiRelations = relations(donasiTransaksi, ({one, many}) => ({
	pemasangan: one(pemasangan, {
		fields: [donasiTransaksi.pemasanganId],
		references: [pemasangan.id]
	}),
	ajisAnak: one(ajisAnak, {
		fields: [donasiTransaksi.anakId],
		references: [ajisAnak.id]
	}),
	donatur: one(donatur, {
		fields: [donasiTransaksi.donaturId],
		references: [donatur.id]
	}),
	program: one(program, {
		fields: [donasiTransaksi.programId],
		references: [program.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [donasiTransaksi.kantorId],
		references: [ajisKantor.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [donasiTransaksi.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	penyalurans: many(penyaluran),
}));

export const penyaluranRelations = relations(penyaluran, ({one}) => ({
	pemasangan: one(pemasangan, {
		fields: [penyaluran.pemasanganId],
		references: [pemasangan.id]
	}),
	ajisAnak: one(ajisAnak, {
		fields: [penyaluran.anakId],
		references: [ajisAnak.id]
	}),
	donatur: one(donatur, {
		fields: [penyaluran.donaturId],
		references: [donatur.id]
	}),
	ajisSdmWilayah: one(ajisSdmWilayah, {
		fields: [penyaluran.sdmWilayahId],
		references: [ajisSdmWilayah.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [penyaluran.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [penyaluran.kantorId],
		references: [ajisKantor.id]
	}),
	program: one(program, {
		fields: [penyaluran.programId],
		references: [program.id]
	}),
	donasiTransaksi: one(donasiTransaksi, {
		fields: [penyaluran.donasiTransaksiId],
		references: [donasiTransaksi.id]
	}),
}));

export const opnameSaldoRelations = relations(opnameSaldo, ({one}) => ({
	pemasangan: one(pemasangan, {
		fields: [opnameSaldo.pemasanganId],
		references: [pemasangan.id]
	}),
}));

export const pengajuanPergantianAnakRelations = relations(pengajuanPergantianAnak, ({one}) => ({
	ajisKantor_kantorId: one(ajisKantor, {
		fields: [pengajuanPergantianAnak.kantorId],
		references: [ajisKantor.id],
		relationName: "pengajuanPergantianAnak_kantorId_ajisKantor_id"
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [pengajuanPergantianAnak.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	donatur: one(donatur, {
		fields: [pengajuanPergantianAnak.donaturId],
		references: [donatur.id]
	}),
	ajisKantor_kantorDonaturId: one(ajisKantor, {
		fields: [pengajuanPergantianAnak.kantorDonaturId],
		references: [ajisKantor.id],
		relationName: "pengajuanPergantianAnak_kantorDonaturId_ajisKantor_id"
	}),
	ajisAnak_anakAsalId: one(ajisAnak, {
		fields: [pengajuanPergantianAnak.anakAsalId],
		references: [ajisAnak.id],
		relationName: "pengajuanPergantianAnak_anakAsalId_ajisAnak_id"
	}),
	ajisAnak_anakPenggantiId: one(ajisAnak, {
		fields: [pengajuanPergantianAnak.anakPenggantiId],
		references: [ajisAnak.id],
		relationName: "pengajuanPergantianAnak_anakPenggantiId_ajisAnak_id"
	}),
	pemasangan: one(pemasangan, {
		fields: [pengajuanPergantianAnak.pemasanganId],
		references: [pemasangan.id]
	}),
}));

export const transaksiRelations = relations(transaksi, ({one}) => ({
	donatur: one(donatur, {
		fields: [transaksi.donaturId],
		references: [donatur.id]
	}),
	program: one(program, {
		fields: [transaksi.programId],
		references: [program.id]
	}),
	ajisKantor_kantorTransaksiId: one(ajisKantor, {
		fields: [transaksi.kantorTransaksiId],
		references: [ajisKantor.id],
		relationName: "transaksi_kantorTransaksiId_ajisKantor_id"
	}),
	ajisKantor_kantorDonaturId: one(ajisKantor, {
		fields: [transaksi.kantorDonaturId],
		references: [ajisKantor.id],
		relationName: "transaksi_kantorDonaturId_ajisKantor_id"
	}),
	ajisKantor_kantorIjisId: one(ajisKantor, {
		fields: [transaksi.kantorIjisId],
		references: [ajisKantor.id],
		relationName: "transaksi_kantorIjisId_ajisKantor_id"
	}),
}));

export const ajisSemesterTemplateRelations = relations(ajisSemesterTemplate, ({one}) => ({
	ajisSemester: one(ajisSemester, {
		fields: [ajisSemesterTemplate.semesterId],
		references: [ajisSemester.id]
	}),
}));

export const ajisSemesterRelations = relations(ajisSemester, ({many}) => ({
	ajisSemesterTemplates: many(ajisSemesterTemplate),
	pembinaans: many(pembinaan),
	pembinaanDokumentasis: many(pembinaanDokumentasi),
	hafalanAnaks: many(hafalanAnak),
	penilaianAnaks: many(penilaianAnak),
	materiPembinaans: many(materiPembinaan),
	laporanSemesters: many(laporanSemester),
	laporanSemesterPembinaans: many(laporanSemesterPembinaan),
	prestasiAnaks: many(prestasiAnak),
}));

export const pembinaanRelations = relations(pembinaan, ({one}) => ({
	donatur: one(donatur, {
		fields: [pembinaan.donaturId],
		references: [donatur.id]
	}),
	ajisSemester: one(ajisSemester, {
		fields: [pembinaan.semesterId],
		references: [ajisSemester.id]
	}),
	ajisAnak: one(ajisAnak, {
		fields: [pembinaan.anakId],
		references: [ajisAnak.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [pembinaan.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [pembinaan.kantorId],
		references: [ajisKantor.id]
	}),
}));

export const pembinaanDokumentasiRelations = relations(pembinaanDokumentasi, ({one}) => ({
	ajisSemester: one(ajisSemester, {
		fields: [pembinaanDokumentasi.semesterId],
		references: [ajisSemester.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [pembinaanDokumentasi.kantorId],
		references: [ajisKantor.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [pembinaanDokumentasi.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
}));

export const hafalanAnakRelations = relations(hafalanAnak, ({one}) => ({
	ajisAnak: one(ajisAnak, {
		fields: [hafalanAnak.anakId],
		references: [ajisAnak.id]
	}),
	itemHafalan: one(itemHafalan, {
		fields: [hafalanAnak.itemHafalanId],
		references: [itemHafalan.id]
	}),
	ajisSemester: one(ajisSemester, {
		fields: [hafalanAnak.semesterId],
		references: [ajisSemester.id]
	}),
}));

export const itemHafalanRelations = relations(itemHafalan, ({many}) => ({
	hafalanAnaks: many(hafalanAnak),
}));

export const itemPenilaianRelations = relations(itemPenilaian, ({one, many}) => ({
	itemPenilaian: one(itemPenilaian, {
		fields: [itemPenilaian.parentId],
		references: [itemPenilaian.id],
		relationName: "itemPenilaian_parentId_itemPenilaian_id"
	}),
	itemPenilaians: many(itemPenilaian, {
		relationName: "itemPenilaian_parentId_itemPenilaian_id"
	}),
	penilaianAnaks: many(penilaianAnak),
}));

export const penilaianAnakRelations = relations(penilaianAnak, ({one}) => ({
	ajisAnak: one(ajisAnak, {
		fields: [penilaianAnak.anakId],
		references: [ajisAnak.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [penilaianAnak.kantorId],
		references: [ajisKantor.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [penilaianAnak.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisSemester: one(ajisSemester, {
		fields: [penilaianAnak.semesterId],
		references: [ajisSemester.id]
	}),
	itemPenilaian: one(itemPenilaian, {
		fields: [penilaianAnak.itemPenilaianId],
		references: [itemPenilaian.id]
	}),
}));

export const materiPembinaanRelations = relations(materiPembinaan, ({one}) => ({
	ajisSemester: one(ajisSemester, {
		fields: [materiPembinaan.semesterId],
		references: [ajisSemester.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [materiPembinaan.kantorId],
		references: [ajisKantor.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [materiPembinaan.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
}));

export const laporanSemesterRelations = relations(laporanSemester, ({one, many}) => ({
	donatur: one(donatur, {
		fields: [laporanSemester.donaturId],
		references: [donatur.id]
	}),
	ajisAnak: one(ajisAnak, {
		fields: [laporanSemester.anakId],
		references: [ajisAnak.id]
	}),
	pemasangan: one(pemasangan, {
		fields: [laporanSemester.pemasanganId],
		references: [pemasangan.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [laporanSemester.kantorId],
		references: [ajisKantor.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [laporanSemester.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisSemester: one(ajisSemester, {
		fields: [laporanSemester.semesterId],
		references: [ajisSemester.id]
	}),
	laporanSemesterPembinaans: many(laporanSemesterPembinaan),
	prestasiAnaks: many(prestasiAnak),
}));

export const peminjamanAjisAnakRelations = relations(peminjamanAjisAnak, ({one}) => ({
	ajisAnak: one(ajisAnak, {
		fields: [peminjamanAjisAnak.anakId],
		references: [ajisAnak.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [peminjamanAjisAnak.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [peminjamanAjisAnak.kantorId],
		references: [ajisKantor.id]
	}),
}));

export const laporanSemesterPembinaanRelations = relations(laporanSemesterPembinaan, ({one}) => ({
	laporanSemester: one(laporanSemester, {
		fields: [laporanSemesterPembinaan.laporanSemesterId],
		references: [laporanSemester.id]
	}),
	ajisAnak: one(ajisAnak, {
		fields: [laporanSemesterPembinaan.anakId],
		references: [ajisAnak.id]
	}),
	ajisSemester: one(ajisSemester, {
		fields: [laporanSemesterPembinaan.semesterId],
		references: [ajisSemester.id]
	}),
}));

export const laporanPrestasiRelations = relations(laporanPrestasi, ({one}) => ({
	ajisAnak: one(ajisAnak, {
		fields: [laporanPrestasi.anakId],
		references: [ajisAnak.id]
	}),
	ajisKantor: one(ajisKantor, {
		fields: [laporanPrestasi.kantorId],
		references: [ajisKantor.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [laporanPrestasi.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
}));

export const prestasiAnakRelations = relations(prestasiAnak, ({one}) => ({
	ajisAnak: one(ajisAnak, {
		fields: [prestasiAnak.anakId],
		references: [ajisAnak.id]
	}),
	ajisSemester: one(ajisSemester, {
		fields: [prestasiAnak.semesterId],
		references: [ajisSemester.id]
	}),
	laporanSemester: one(laporanSemester, {
		fields: [prestasiAnak.laporanSemesterId],
		references: [laporanSemester.id]
	}),
}));

export const ajisUserWilayahPembinaanRelations = relations(ajisUserWilayahPembinaan, ({one}) => ({
	ajisUser: one(ajisUser, {
		fields: [ajisUserWilayahPembinaan.userId],
		references: [ajisUser.id]
	}),
	ajisWilayahPembinaan: one(ajisWilayahPembinaan, {
		fields: [ajisUserWilayahPembinaan.wilayahPembinaanId],
		references: [ajisWilayahPembinaan.id]
	}),
}));