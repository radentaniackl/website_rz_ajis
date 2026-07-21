import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  UserSquare2,
  Briefcase,
  Globe2,
  Landmark,
  Map,
  Home,
  Baby,
  ClipboardCheck,
  CalendarCheck2,
  BookOpen,
  GraduationCap,
  Vote,
  Users,
  ShieldCheck,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

import { Route as R_index } from "@/routes/dashboard.index";
import { Route as R_kantor } from "@/routes/dashboard.kantor";
import { Route as R_wilayah } from "@/routes/dashboard.wilayah";
import { Route as R_sdm } from "@/routes/dashboard.sdm";
import { Route as R_jabatan } from "@/routes/dashboard.jabatan";
import { Route as R_propinsi } from "@/routes/dashboard.propinsi";
import { Route as R_kabupaten } from "@/routes/dashboard.kabupaten";
import { Route as R_kecamatan } from "@/routes/dashboard.kecamatan";
import { Route as R_desa } from "@/routes/dashboard.desa";
import { Route as R_anak } from "@/routes/dashboard.anak";
import { Route as R_kelayakan } from "@/routes/dashboard.survey-kelayakan";
import { Route as R_sesi } from "@/routes/dashboard.sesi";
import { Route as R_hafalan } from "@/routes/dashboard.hafalan";
import { Route as R_evaluasi } from "@/routes/dashboard.evaluasi";
import { Route as R_survey } from "@/routes/dashboard.survey";
import { Route as R_users } from "@/routes/dashboard.users";
import { Route as R_groupUser } from "@/routes/dashboard.group-user";
import { Route as R_laporan } from "@/routes/dashboard.laporan";
import { Route as R_statistik } from "@/routes/dashboard.statistik";
import { Route as R_settings } from "@/routes/dashboard.settings";

export interface PageMeta {
  label: string;
  icon: LucideIcon;
  Component: ComponentType;
}

function comp(route: { options: { component?: unknown } }): ComponentType {
  return (route.options.component as ComponentType) ?? (() => null);
}

export const PAGE_REGISTRY: Record<string, PageMeta> = {
  "/dashboard": { label: "Dashboard", icon: LayoutDashboard, Component: comp(R_index) },
  "/dashboard/kantor": { label: "Kantor", icon: Building2, Component: comp(R_kantor) },
  "/dashboard/wilayah": { label: "Wilayah Pembinaan", icon: MapPin, Component: comp(R_wilayah) },
  "/dashboard/sdm": { label: "SDM", icon: UserSquare2, Component: comp(R_sdm) },
  "/dashboard/jabatan": { label: "Jabatan SDM", icon: Briefcase, Component: comp(R_jabatan) },
  "/dashboard/propinsi": { label: "Propinsi", icon: Globe2, Component: comp(R_propinsi) },
  "/dashboard/kabupaten": { label: "Kabupaten", icon: Landmark, Component: comp(R_kabupaten) },
  "/dashboard/kecamatan": { label: "Kecamatan", icon: Map, Component: comp(R_kecamatan) },
  "/dashboard/desa": { label: "Desa", icon: Home, Component: comp(R_desa) },
  "/dashboard/anak": { label: "Data Anak", icon: Baby, Component: comp(R_anak) },
  "/dashboard/survey-kelayakan": { label: "Survey Kelayakan", icon: ClipboardCheck, Component: comp(R_kelayakan) },
  "/dashboard/sesi": { label: "Sesi", icon: CalendarCheck2, Component: comp(R_sesi) },
  "/dashboard/hafalan": { label: "Hafalan", icon: BookOpen, Component: comp(R_hafalan) },
  "/dashboard/evaluasi": { label: "Evaluasi", icon: GraduationCap, Component: comp(R_evaluasi) },
  "/dashboard/survey": { label: "Jajak Pendapat", icon: Vote, Component: comp(R_survey) },
  "/dashboard/users": { label: "Users", icon: Users, Component: comp(R_users) },
  "/dashboard/group-user": { label: "Group User", icon: ShieldCheck, Component: comp(R_groupUser) },
  "/dashboard/laporan": { label: "Laporan Semester", icon: FileText, Component: comp(R_laporan) },
  "/dashboard/statistik": { label: "Statistik", icon: BarChart3, Component: comp(R_statistik) },
  "/dashboard/settings": { label: "Settings", icon: Settings, Component: comp(R_settings) },
};