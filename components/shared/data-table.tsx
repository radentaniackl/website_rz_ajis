"use client";

import { useMemo, useState, ReactNode } from "react";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Columns3,
  Check,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DataColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  searchable?: (row: T) => string;
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
  pageSize?: number;
  searchPlaceholder?: string;
  emptyMessage?: string;
  rowActions?: (row: T) => ReactNode;
  showDefaultActions?: boolean;
  labelSingular?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  extraRowActions?: (row: T) => ReactNode;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  pageSize = 10,
  searchPlaceholder = "Cari…",
  emptyMessage = "Tidak ada data",
  rowActions,
  showDefaultActions = true,
  labelSingular = "data",
  onEdit,
  onDelete,
  onView,
  extraRowActions,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState<number>(pageSize);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const visibleColumns = useMemo(() => columns.filter((c) => !hidden.has(c.key)), [columns, hidden]);
  const toggleCol = (key: string) =>
    setHidden((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  const filtered = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((row) =>
      columns.some((c) => {
        const val = c.searchable ? c.searchable(row) : String((row as Record<string, unknown>)[c.key] ?? "");
        return val.toLowerCase().includes(q);
      }),
    );
  }, [query, data, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * size;
  const pageRows = filtered.slice(startIdx, startIdx + size);
  const hasActions = !!rowActions || showDefaultActions;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-9 pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Columns3 className="h-4 w-4" /> Kolom
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider">
                Tampilkan kolom
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((c) => {
                const on = !hidden.has(c.key);
                return (
                  <DropdownMenuItem
                    key={c.key}
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleCol(c.key);
                    }}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{c.header}</span>
                    {on && <Check className="h-4 w-4 text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Baris</span>
            <Select
              value={String(size)}
              onValueChange={(v) => {
                setSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="font-semibold text-foreground">{filtered.length === 0 ? 0 : startIdx + 1}</span>
            –<span className="font-semibold text-foreground">{Math.min(startIdx + size, filtered.length)}</span> dari{" "}
            <span className="font-semibold text-foreground">{filtered.length}</span> {labelSingular}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-16">No</TableHead>
              {visibleColumns.map((c) => (
                <TableHead
                  key={c.key}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    c.className,
                  )}
                >
                  {c.header}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="w-24 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Aksi
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length + (hasActions ? 2 : 1)}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row, index) => (
                <TableRow key={String(row.id)} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{startIdx + index + 1}</TableCell>
                  {visibleColumns.map((c) => (
                    <TableCell key={c.key} className={cn("py-3 text-sm", c.className)}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="text-right">
                      {rowActions ? (
                        rowActions(row)
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() => onView(row)}
                              title="Lihat detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {onView && (
                                <DropdownMenuItem onClick={() => onView(row)}>
                                  <Eye className="mr-2 h-4 w-4" /> Lihat detail
                                </DropdownMenuItem>
                              )}
                              {extraRowActions?.(row)}
                              <DropdownMenuItem onClick={() => onEdit?.(row)} disabled={!onEdit}>
                                <Pencil className="mr-2 h-4 w-4" /> Ubah
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDelete?.(row)}
                                disabled={!onDelete}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-border p-3 text-sm">
          <span className="text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setPage(1)} title="Pertama">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} title="Sebelumnya">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {currentPage}
            </span>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} title="Berikutnya">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)} title="Terakhir">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
    </div>
  );
}
