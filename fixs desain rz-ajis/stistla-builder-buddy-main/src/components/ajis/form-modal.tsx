import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FieldValue = string | number;

export interface FieldSpec {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: { value: string | number; label: string }[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: FieldValue;
  hint?: string;
  colSpan?: 1 | 2;
}

export interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  fields: FieldSpec[];
  initial?: Record<string, unknown>;
  submitLabel?: string;
  onSubmit: (values: Record<string, FieldValue>) => void;
}

function initValues(fields: FieldSpec[], initial?: Record<string, unknown>): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  fields.forEach((f) => {
    const raw = initial?.[f.name];
    if (raw !== undefined && raw !== null) {
      out[f.name] = f.type === "number" ? Number(raw) : String(raw);
    } else if (f.defaultValue !== undefined) {
      out[f.name] = f.defaultValue;
    } else {
      out[f.name] = f.type === "number" ? 0 : "";
    }
  });
  return out;
}

export function FormModal({ open, onOpenChange, title, description, fields, initial, submitLabel = "Simpan", onSubmit }: FormModalProps) {
  const [values, setValues] = useState<Record<string, FieldValue>>(() => initValues(fields, initial));

  useEffect(() => {
    if (open) setValues(initValues(fields, initial));
  }, [open, fields, initial]);

  const setField = (name: string, v: FieldValue) => setValues((s) => ({ ...s, [name]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form
          className="grid grid-cols-1 gap-4 py-1 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            for (const f of fields) {
              if (f.required && !String(values[f.name] ?? "").trim()) {
                return;
              }
            }
            onSubmit(values);
          }}
        >
          {fields.map((f) => {
            const span = f.colSpan === 1 ? "md:col-span-1" : f.type === "textarea" ? "md:col-span-2" : "md:col-span-1";
            const v = values[f.name] ?? "";
            return (
              <div key={f.name} className={`space-y-1.5 ${span}`}>
                <Label htmlFor={f.name} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </Label>
                {f.type === "select" ? (
                  <Select value={String(v)} onValueChange={(val) => setField(f.name, val)}>
                    <SelectTrigger id={f.name} className="h-10">
                      <SelectValue placeholder={f.placeholder ?? "Pilih…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map((o) => (
                        <SelectItem key={String(o.value)} value={String(o.value)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    value={String(v)}
                    placeholder={f.placeholder}
                    onChange={(e) => setField(f.name, e.target.value)}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={f.name}
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={String(v)}
                    placeholder={f.placeholder}
                    onChange={(e) => setField(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  />
                )}
                {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
              </div>
            );
          })}

          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}