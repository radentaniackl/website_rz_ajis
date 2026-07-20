import { useMemo, useState, type ReactNode } from "react";
import { Search, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
} from "@/components/ui/dropdown-menu";
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
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="ajis-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
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
        <div className="text-xs text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{pageRows.length}</span> dari{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span> {labelSingular}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((c) => (
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
              {(rowActions || showDefaultActions) && (
                <TableHead className="w-16 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Aksi
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (rowActions || showDefaultActions ? 1 : 0)}
                  className="h-32 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={String(row.id)} className="hover:bg-muted/30">
                  {columns.map((c) => (
                    <TableCell key={c.key} className={cn("py-3 text-sm", c.className)}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                  {(rowActions || showDefaultActions) && (
                    <TableCell className="text-right">
                      {rowActions ? (
                        rowActions(row)
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => toast.info(`Lihat #${row.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> Lihat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info(`Edit #${row.id}`)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.error(`Hapus #${row.id} — demo tidak menyimpan`)
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border p-4 text-sm">
          <span className="text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}