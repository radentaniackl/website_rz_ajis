import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  kantor as seedKantor,
  wilayahPembinaan as seedWilayah,
  jabatanSDM as seedJabatan,
  sdm as seedSdm,
  groupUser as seedGroupUser,
  users as seedUsers,
  anak as seedAnak,
  sesi as seedSesi,
  hafalan as seedHafalan,
  evaluasi as seedEvaluasi,
  survey as seedSurvey,
  surveiKelayakan as seedKelayakan,
  jajakPendapat as seedJajak,
  laporanSemester as seedLaporan,
  propinsi as seedPropinsi,
  kabupaten as seedKabupaten,
  kecamatan as seedKecamatan,
  desa as seedDesa,
} from "./mock-data";

type WithId = { id: number };

export type SliceKey =
  | "kantor"
  | "wilayah"
  | "jabatan"
  | "sdm"
  | "groupUser"
  | "users"
  | "anak"
  | "sesi"
  | "hafalan"
  | "evaluasi"
  | "survey"
  | "surveiKelayakan"
  | "jajakPendapat"
  | "laporan"
  | "propinsi"
  | "kabupaten"
  | "kecamatan"
  | "desa";

type StoreState = Record<SliceKey, WithId[]>;

const SEED: StoreState = {
  kantor: [...seedKantor],
  wilayah: [...seedWilayah],
  jabatan: [...seedJabatan],
  sdm: [...seedSdm],
  groupUser: [...seedGroupUser],
  users: [...seedUsers],
  anak: [...seedAnak],
  sesi: [...seedSesi],
  hafalan: [...seedHafalan],
  evaluasi: [...seedEvaluasi],
  survey: [...seedSurvey],
  surveiKelayakan: [...seedKelayakan],
  jajakPendapat: [...seedJajak],
  laporan: [...seedLaporan],
  propinsi: [...seedPropinsi],
  kabupaten: [...seedKabupaten],
  kecamatan: [...seedKecamatan],
  desa: [...seedDesa],
};

interface Ctx {
  state: StoreState;
  add: (slice: SliceKey, row: Record<string, unknown>) => number;
  update: (slice: SliceKey, row: WithId) => void;
  remove: (slice: SliceKey, id: number) => void;
  reset: (slice: SliceKey) => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => structuredClone(SEED));

  const add: Ctx["add"] = useCallback((slice, row) => {
    let newId = 0;
    setState((s) => {
      const rows = s[slice];
      newId = rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
      return { ...s, [slice]: [{ ...row, id: newId } as WithId, ...rows] };
    });
    return newId;
  }, []);

  const update: Ctx["update"] = useCallback((slice, row) => {
    setState((s) => ({
      ...s,
      [slice]: s[slice].map((r) => (r.id === row.id ? { ...r, ...row } : r)),
    }));
  }, []);

  const remove: Ctx["remove"] = useCallback((slice, id) => {
    setState((s) => ({ ...s, [slice]: s[slice].filter((r) => r.id !== id) }));
  }, []);

  const reset: Ctx["reset"] = useCallback((slice) => {
    setState((s) => ({ ...s, [slice]: [...(SEED[slice] as WithId[])] }));
  }, []);

  const value = useMemo(() => ({ state, add, update, remove, reset }), [state, add, update, remove, reset]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside DataStoreProvider");
  return ctx;
}

export function useSlice<T extends WithId>(slice: SliceKey) {
  const { state, add, update, remove } = useStore();
  return {
    rows: state[slice] as T[],
    add: (row: Omit<T, "id">) => add(slice, row as Record<string, unknown>),
    update: (row: T) => update(slice, row),
    remove: (id: number) => remove(slice, id),
  };
}

import type { Kantor, WilayahPembinaan, JabatanSDM, Anak, GroupUser, Propinsi, Kabupaten, Kecamatan, Desa } from "./mock-data";

export function useLookups() {
  const { state } = useStore();
  const build = <T extends WithId>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));
  return {
    kantor: build(state.kantor as Kantor[]) as Map<number, Kantor>,
    wilayah: build(state.wilayah as WilayahPembinaan[]) as Map<number, WilayahPembinaan>,
    jabatan: build(state.jabatan as JabatanSDM[]) as Map<number, JabatanSDM>,
    anak: build(state.anak as Anak[]) as Map<number, Anak>,
    groupUser: build(state.groupUser as GroupUser[]) as Map<number, GroupUser>,
    propinsi: build(state.propinsi as Propinsi[]) as Map<number, Propinsi>,
    kabupaten: build(state.kabupaten as Kabupaten[]) as Map<number, Kabupaten>,
    kecamatan: build(state.kecamatan as Kecamatan[]) as Map<number, Kecamatan>,
    desa: build(state.desa as Desa[]) as Map<number, Desa>,
  };
}

export function useOptions() {
  const { state } = useStore();
  const opt = <T extends WithId & Record<string, unknown>>(rows: T[], labelKey: string) =>
    rows.map((r) => ({ value: r.id, label: String(r[labelKey] ?? r.id) }));
  return {
    kantor: opt(state.kantor as never, "nama"),
    wilayah: (state.wilayah as never as Array<{ id: number; nama_wilayah: string }>).map((r) => ({ value: r.id, label: r.nama_wilayah })),
    jabatan: opt(state.jabatan as never, "nama"),
    anak: opt(state.anak as never, "nama"),
    groupUser: opt(state.groupUser as never, "nama"),
    propinsi: opt(state.propinsi as never, "nama"),
    kabupaten: opt(state.kabupaten as never, "nama"),
    kecamatan: opt(state.kecamatan as never, "nama"),
    desa: opt(state.desa as never, "nama"),
  };
}