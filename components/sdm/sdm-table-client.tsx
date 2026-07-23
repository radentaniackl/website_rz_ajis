"use client";

import { useMemo, useState } from "react";
import { DataTable, DataColumn } from "@/components/shared/data-table";
import { DetailDrawer, FieldSpec } from "@/components/shared/detail-drawer";
import { ImportExcel } from "@/components/shared/import-excel";
import { SdmActions } from "./sdm-actions";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SdmTableClientProps {
  data: any[];
  userRole: number;
  canCreate: boolean;
}

export function SdmTableClient({ data, userRole, canCreate }: SdmTableClientProps) {
  const [detailRow, setDetailRow] = useState<any | null>(null);
  
  // Korwil (9) shouldn't delete SDM usually, but can edit if they are in their region
  const canEdit = true;
  const canDelete = userRole !== 9;

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <ImportExcel
          slice="SDM"
          title="Data SDM/Fasilitator"
          fields={detailFields}
          onImport={handleImport}
        />
        {canCreate && (
          <Link href="/dashboard/sdm/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah SDM
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        pageSize={10}
        labelSingular="SDM"
        rowActions={(row) => (
          <SdmActions id={Number(row.id)} canEdit={canEdit} canDelete={canDelete} />
        )}
        onView={(row) => setDetailRow(row)}
      />

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
