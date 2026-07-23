"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable, DataColumn } from "@/components/shared/data-table";
import { DetailDrawer, FieldSpec } from "@/components/shared/detail-drawer";
import { ImportExcel } from "@/components/shared/import-excel";
import { SdmActions } from "./sdm-actions";
import { Plus, Download, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SdmTableClientProps {
  data: any[];
  total?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  userRole: number;
  canCreate: boolean;
}

export function SdmTableClient({
  data,
  total = 0,
  page = 1,
  pageSize = 20,
  search = "",
  userRole,
  canCreate,
}: SdmTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [detailRow, setDetailRow] = useState<any | null>(null);
  
  const canEdit = true;
  const canDelete = userRole !== 9;

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/dashboard/sdm?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/dashboard/sdm?${params.toString()}`);
  };

  const columns: DataColumn<any>[] = useMemo(
    () => [
      {
        key: "nik",
        header: "NIK",
        render: (row) => row.nik || "-",
        searchable: (row) => String(row.nik || ""),
      },
      {
        key: "namaLengkap",
        header: "Nama Lengkap",
        render: (row) => row.namaLengkap,
        searchable: (row) => String(row.namaLengkap || ""),
      },
      {
        key: "jenisKelamin",
        header: "L/P",
        render: (row) => (row.jenisKelamin === "l" || row.jenisKelamin === "L" ? "L" : row.jenisKelamin === "p" || row.jenisKelamin === "P" ? "P" : "-"),
      },
      {
        key: "hp",
        header: "No. HP",
        render: (row) => row.hp || "-",
      },
      {
        key: "penugasanKantorId",
        header: "ID Kantor",
        render: (row) => row.penugasanKantorId || "-",
      },
      {
        key: "aktif",
        header: "Status",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              row.aktif === "y" || row.aktif === "Y" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {row.aktif === "y" || row.aktif === "Y" ? "Aktif" : "Nonaktif"}
          </span>
        ),
      },
    ],
    []
  );

  const detailFields: FieldSpec[] = [
    { name: "nik", label: "NIK", type: "text" },
    { name: "namaLengkap", label: "Nama Lengkap", type: "text" },
    { name: "jenisKelamin", label: "Jenis Kelamin (l/p)", type: "text" },
    { name: "alamat", label: "Alamat Lengkap", type: "text" },
    { name: "jenjangPendidikan", label: "Jenjang Pendidikan", type: "text" },
    { name: "hp", label: "No. HP", type: "text" },
    { name: "email", label: "Email", type: "text" },
    { name: "tglBergabung", label: "Tanggal Bergabung", type: "date" },
    { name: "penugasanKantorId", label: "Penugasan Kantor ID", type: "text" },
    { name: "penugasanWilayahId", label: "Penugasan Wilayah ID", type: "text" },
    { name: "penugasanFungsiStruktur", label: "Jabatan / Struktur", type: "text" },
    { name: "aktif", label: "Status Aktif (y/n)", type: "text" },
    { name: "keterangan", label: "Keterangan", type: "text" },
  ];

  const handleImport = async (rows: Record<string, unknown>[]) => {
    console.log("Importing rows:", rows);
    alert(`Mensimulasikan import ${rows.length} data SDM...`);
  };

  const handleExport = () => {
    const headers = ['ID', 'NIK', 'Nama Lengkap', 'Jenis Kelamin', 'No HP', 'Email', 'ID Kantor', 'ID Wilayah', 'Jabatan', 'Status'];
    const csvContent = [
      headers.join(','),
      ...data.map(sdm => [
        sdm.id,
        `"${sdm.nik || ''}"`,
        `"${sdm.namaLengkap || ''}"`,
        `"${sdm.jenisKelamin === 'l' ? 'Laki-laki' : 'Perempuan'}"`,
        `"${sdm.hp || ''}"`,
        `"${sdm.email || ''}"`,
        `"${sdm.penugasanKantorId || ''}"`,
        `"${sdm.penugasanWilayahId || ''}"`,
        `"${sdm.penugasanFungsiStruktur || ''}"`,
        `"${sdm.aktif === 'y' ? 'Aktif' : 'Nonaktif'}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sdm-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data SDM berhasil diexport');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari SDM berdasarkan nama atau NIK..."
              defaultValue={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <ImportExcel
            slice="SDM"
            title="Data SDM/Fasilitator"
            fields={detailFields}
            onImport={handleImport}
          />
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

      </div>

      <DataTable
        columns={columns}
        data={data}
        pageSize={pageSize}
        labelSingular="SDM"
        tableId="sdm"
        rowActions={(row) => (
          <SdmActions id={Number(row.id)} canEdit={canEdit} canDelete={canDelete} />
        )}
        onView={(row) => setDetailRow(row)}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} ({total} total data)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}

      <DetailDrawer
        open={!!detailRow}
        onOpenChange={(op) => !op && setDetailRow(null)}
        title="Detail Data SDM"
        row={detailRow}
        fields={detailFields}
      />
    </div>
  );
}
