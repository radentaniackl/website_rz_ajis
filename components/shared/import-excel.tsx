"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { FieldSpec } from "@/components/shared/detail-drawer";

interface Props {
  slice: string;
  title: string;
  fields: FieldSpec[];
  onImport: (rows: Record<string, unknown>[]) => void;
}

function coerce(f: FieldSpec, raw: unknown): unknown {
  if (raw === undefined || raw === null || raw === "") {
    return f.name.endsWith("_id") ? null : f.type === "number" ? 0 : "";
  }
  if (f.type === "number" || f.name.endsWith("_id")) {
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }
  if (f.type === "date") {
    if (raw instanceof Date) return raw.toISOString().slice(0, 10);
    if (typeof raw === "number") {
      const d = XLSX.SSF.parse_date_code(raw);
      if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
    return String(raw);
  }
  return String(raw);
}

export function ImportExcel({ slice, title, fields, onImport }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");

  const downloadTemplate = () => {
    const header = fields.map((f) => f.name);
    const labelRow = fields.map((f) => f.label);
    const sample: Record<string, unknown> = {};
    fields.forEach((f) => {
      sample[f.name] =
        f.type === "number" || f.name.endsWith("_id")
          ? 1
          : f.type === "date"
            ? new Date().toISOString().slice(0, 10)
            : f.type === "select"
              ? String(f.options?.[0]?.value ?? "")
              : `Contoh ${f.label}`;
    });
    const ws = XLSX.utils.aoa_to_sheet([labelRow, header, header.map((h) => sample[h])]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, slice);
    
    const info = [
      ["Petunjuk Import"],
      [""],
      ["Baris 1 = Label (untuk referensi, JANGAN diubah)"],
      ["Baris 2 = Nama field database (JANGAN diubah)"],
      ["Baris 3+ = Data yang akan diimport"],
      [""],
      ["Kolom", "Field DB", "Tipe", "Wajib", "Contoh Nilai"],
      ...fields.map((f) => [
        f.label,
        f.name,
        f.type + (f.name.endsWith("_id") ? " (ID relasi)" : ""),
        f.required ? "Ya" : "Tidak",
        f.type === "select" ? f.options?.map((o) => o.value).join(" | ") ?? "" : "",
      ]),
    ];
    const infoWs = XLSX.utils.aoa_to_sheet(info);
    XLSX.utils.book_append_sheet(wb, infoWs, "Petunjuk");
    XLSX.writeFile(wb, `template-${slice}.xlsx`);
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1, defval: "" }) as unknown as unknown[][];
        if (rows.length < 3) {
          setErrors(["File kosong. Minimal harus ada baris data setelah header."]);
          setPreview([]);
          return;
        }
        const headerNames = rows[1] as string[];
        const dataRows = rows.slice(2);
        const errs: string[] = [];
        const parsed = dataRows
          .filter((r) => Array.isArray(r) && r.some((c) => c !== "" && c !== null && c !== undefined))
          .map((r, idx) => {
            const obj: Record<string, unknown> = {};
            fields.forEach((f) => {
              const col = headerNames.indexOf(f.name);
              const val = col >= 0 ? (r as unknown[])[col] : "";
              obj[f.name] = coerce(f, val);
              if (f.required && (obj[f.name] === "" || obj[f.name] === null || obj[f.name] === undefined)) {
                errs.push(`Baris ${idx + 3}: kolom "${f.label}" wajib diisi.`);
              }
            });
            return obj;
          });
        setPreview(parsed);
        setErrors(errs);
      } catch (err) {
        setErrors([`Gagal membaca file: ${(err as Error).message}`]);
        setPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const submit = () => {
    if (preview.length === 0) return;
    onImport(preview);
    setOpen(false);
    setPreview([]);
    setErrors([]);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="mr-1.5 h-4 w-4" /> Import
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Import {title} dari Excel</DialogTitle>
            <DialogDescription>
              Unduh template terlebih dahulu, isi datanya, lalu unggah kembali untuk disimpan ke database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">Template Excel</div>
                <div className="text-xs text-muted-foreground">
                  Format sesuai skema database dengan sheet petunjuk pengisian.
                </div>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-1.5 h-4 w-4" /> Download Template
              </Button>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Pilih File Excel (.xlsx)
              </label>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
                className="mt-1.5 block w-full cursor-pointer rounded-md border border-input bg-background p-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-foreground hover:file:bg-primary/90"
              />
              {fileName && <p className="mt-1 text-xs text-muted-foreground">File: {fileName}</p>}
            </div>

            {errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                <div className="font-bold">Ditemukan {errors.length} kesalahan:</div>
                <ul className="mt-1 list-disc pl-4">
                  {errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            {preview.length > 0 && (
              <div className="rounded-md border border-border">
                <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Preview — {preview.length} baris siap diimport
                </div>
                <div className="max-h-56 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/20">
                      <tr>
                        {fields.slice(0, 5).map((f) => (
                          <th key={f.name} className="px-2 py-1.5 text-left font-semibold text-muted-foreground">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 10).map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          {fields.slice(0, 5).map((f) => (
                            <td key={f.name} className="px-2 py-1.5">{String(r[f.name] ?? "—")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={submit} disabled={preview.length === 0 || errors.length > 0}>
              <Upload className="mr-1.5 h-4 w-4" /> Import {preview.length > 0 ? `(${preview.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
