import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { FieldSpec } from "@/components/ajis/form-modal";

export interface DetailDrawerProps<T extends { id: number }> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  row: T | null;
  fields: FieldSpec[];
}

function renderValue(f: FieldSpec, raw: unknown) {
  if (raw === null || raw === undefined || raw === "") return <span className="text-muted-foreground">—</span>;
  if (f.type === "select" && f.options) {
    const opt = f.options.find((o) => String(o.value) === String(raw));
    return <span>{opt?.label ?? String(raw)}</span>;
  }
  if (Array.isArray(raw)) return <span>{raw.length === 0 ? "—" : raw.join(", ")}</span>;
  return <span className="break-words">{String(raw)}</span>;
}

export function DetailDrawer<T extends { id: number }>({ open, onOpenChange, title, row, fields }: DetailDrawerProps<T>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-lg font-extrabold">{title}</SheetTitle>
          <SheetDescription>ID #{row?.id}</SheetDescription>
        </SheetHeader>
        {row && (
          <div className="mt-6 space-y-4">
            {fields.map((f) => (
              <div key={f.name} className="border-b border-border pb-3 last:border-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{f.label}</div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {renderValue(f, (row as Record<string, unknown>)[f.name])}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}