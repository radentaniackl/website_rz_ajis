"use client";

import { useMemo, useState } from "react";
import { DataTable, DataColumn } from "@/components/shared/data-table";
import { DetailDrawer, FieldSpec } from "@/components/shared/detail-drawer";
import { ImportExcel } from "@/components/shared/import-excel";
import { AnakActions } from "./anak-actions";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AnakTableClientProps {
  data: any[];
  userRole: number;
  canCreate: boolean;
}

export function AnakTableClient({ data, userRole, canCreate }: AnakTableClientProps) {
  const [detailRow, setDetailRow] = useState<any | null>(null);
  
  const canEdit = userRole !== 9;
  const canDelete = userRole !== 9;

  const columns: DataColumn<any>[] = useMemo(
    () => [
      {
        key: "kodeAnak",
        header: "Kode Anak",
        render: (row) => row.kodeAnak,
        searchable: (row) => String(row.kodeAnak || ""),
      },
      {
        key: "nik",
        header: "NIK",
        render: (row) => row.nik,
        searchable: (row) => String(row.nik || ""),
      },
      {
        key: "namaLengkap",
        header: "Nama Lengkap",
        render: (row) => row.namaLengkap,
        searchable: (row) => String(row.namaLengkap || ""),
      },
      {
        key: "jnsKel",
        header: "J.Kelamin",
        render: (row) => (row.jnsKel === "L" || row.jnsKel === "l" ? "Laki-laki" : "Perempuan"),
      },
      {
        key: "tglLahir",
        header: "Tanggal Lahir",
        render: (row) => (row.tglLahir ? new Date(row.tglLahir).toLocaleDateString("id-ID") : "-"),
      },
      {
        key: "aktif",
        header: "Status",
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              row.aktif === "y" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {row.aktif === "y" ? "Aktif" : "Nonaktif"}
          </span>
        ),
      },
    ],
    []
  );

  const detailFields: FieldSpec[] = [
    { name: "kodeAnak", label: "Kode Anak", type: "text" },
    { name: "nik", label: "NIK", type: "text" },
    { name: "namaLengkap", label: "Nama Lengkap", type: "text" },
    { name: "tempatLahir", label: "Tempat Lahir", type: "text" },
    { name: "tglLahir", label: "Tanggal Lahir", type: "date" },
    { name: "jnsKel", label: "Jenis Kelamin", type: "text" },
    { name: "alamat", label: "Alamat Lengkap", type: "text" },
    { name: "hobi", label: "Hobi", type: "text" },
    { name: "citaCita", label: "Cita-cita", type: "text" },
    { name: "aktif", label: "Status Aktif", type: "text" },
  ];

  const handleImport = async (rows: Record<string, unknown>[]) => {
    // In a real application, you would send this to a server action for bulk insert
    console.log("Importing rows:", rows);
    alert(`Mensimulasikan import ${rows.length} data anak...`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <ImportExcel
          slice="Anak"
          title="Data Anak"
          fields={detailFields}
          onImport={handleImport}
        />
        {canCreate && (
          <Link href="/dashboard/anak/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Anak
            </Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        pageSize={10}
        labelSingular="anak"
        rowActions={(row) => (
          <AnakActions id={Number(row.id)} canEdit={canEdit} canDelete={canDelete} />
        )}
        onView={(row) => setDetailRow(row)}
      />

      <DetailDrawer
        open={!!detailRow}
        onOpenChange={(op) => !op && setDetailRow(null)}
        title="Detail Data Anak"
        row={detailRow}
        fields={detailFields}
      />
    </div>
  );
}
