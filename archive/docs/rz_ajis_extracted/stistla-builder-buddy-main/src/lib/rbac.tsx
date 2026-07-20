import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { users as mockUsers } from "./mock-data";

export type RoleKey = "super_admin" | "branch_admin" | "korwil";

export interface CurrentUser {
  role: RoleKey;
  label: string;
  username: string;
  kantor_id: number;
  wilayah_ids: number[];
}

const ROLE_PRESETS: Record<RoleKey, CurrentUser> = {
  super_admin: {
    role: "super_admin",
    label: "Super Admin",
    username: mockUsers[0].username,
    kantor_id: mockUsers[0].kantor_id,
    wilayah_ids: [],
  },
  branch_admin: {
    role: "branch_admin",
    label: "Branch Admin — Medan",
    username: mockUsers[1].username,
    kantor_id: mockUsers[1].kantor_id,
    wilayah_ids: mockUsers[1].wilayah_ids,
  },
  korwil: {
    role: "korwil",
    label: "Korwil — Jakarta",
    username: mockUsers[7].username,
    kantor_id: mockUsers[7].kantor_id,
    wilayah_ids: mockUsers[7].wilayah_ids,
  },
};

interface RbacCtx {
  user: CurrentUser;
  setRole: (role: RoleKey) => void;
}

const Ctx = createContext<RbacCtx | null>(null);
const STORAGE_KEY = "ajis.role";

export function RbacProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleKey>("super_admin");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && saved in ROLE_PRESETS) setRoleState(saved as RoleKey);
  }, []);

  const setRole = (r: RoleKey) => {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, r);
  };

  return <Ctx.Provider value={{ user: ROLE_PRESETS[role], setRole }}>{children}</Ctx.Provider>;
}

export function useRbac(): RbacCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRbac must be used within RbacProvider");
  return ctx;
}

// Scope filter helpers that mirror PRD §4.2
export function scopeFilter<T extends { kantor_id?: number; wilayah_pembinaan_id?: number }>(
  rows: T[],
  user: CurrentUser,
): T[] {
  if (user.role === "super_admin") return rows;
  if (user.role === "branch_admin") {
    return rows.filter((r) => r.kantor_id === undefined || r.kantor_id === user.kantor_id);
  }
  // korwil
  return rows.filter(
    (r) =>
      r.wilayah_pembinaan_id === undefined ||
      user.wilayah_ids.includes(r.wilayah_pembinaan_id),
  );
}

export const ROLE_OPTIONS: { value: RoleKey; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "branch_admin", label: "Branch Admin — Medan" },
  { value: "korwil", label: "Korwil — Jakarta" },
];