import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      username: string;
      email: string;
      id_group_user: number;
      kantor_id: number | null;
      id_wilayah_pembinaan: number[];
      aktif: string;
      mustResetPassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    username: string;
    email: string;
    id_group_user: number;
    kantor_id: number | null;
    id_wilayah_pembinaan: number[];
    aktif: string;
    mustResetPassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    username: string;
    email: string;
    id_group_user: number;
    kantor_id: number | null;
    id_wilayah_pembinaan: number[];
    aktif: string;
    mustResetPassword: boolean;
  }
}
