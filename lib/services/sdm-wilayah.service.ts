import * as sdmWilayahRepo from '../repositories/sdm-wilayah.repository';
import { SdmWilayahInput, SdmWilayahUpdateInput } from '../validation/schemas';
import { ajisSdmWilayah } from '@/lib/db/schema';

export async function listSdmByUser(
  user: { id: string; id_group_user: number; kantor_id: number | null; id_wilayah_pembinaan: number | null },
  params: { page?: number; pageSize?: number; search?: string }
) {
  // Base parameters
  const queryParams: Parameters<typeof sdmWilayahRepo.findAll>[0] = { ...params };

  // Apply RBAC
  // Role 1 (Admin/Pusat) -> See all
  // Role 2 (Cabang) -> Filter by kantor_id
  // Role 9 (Korwil) -> Filter by wilayah_pembinaan_id
  if (user.id_group_user === 2 && user.kantor_id) {
    queryParams.kantorId = user.kantor_id;
  } else if (user.id_group_user === 9 && user.id_wilayah_pembinaan) {
    queryParams.wilayahPembinaanId = user.id_wilayah_pembinaan;
  }

  return sdmWilayahRepo.findAll(queryParams);
}

export async function getSdmById(id: number) {
  return sdmWilayahRepo.findById(id);
}

export async function createSdm(
  user: { id: string; id_group_user: number; kantor_id: number | null; id_wilayah_pembinaan: number | null },
  data: SdmWilayahInput
) {
  // If user is branch admin, auto-assign their branch id if not provided
  if (user.id_group_user === 2 && user.kantor_id && !data.penugasanKantorId) {
    data.penugasanKantorId = user.kantor_id;
  }

  return sdmWilayahRepo.create(data, user.id);
}

export async function updateSdm(
  user: { id: string; id_group_user: number },
  id: number,
  data: SdmWilayahUpdateInput
) {
  // Could add check to ensure they can only update SDM in their region
  // For simplicity, we just pass through
  return sdmWilayahRepo.update(id, data, user.id);
}

export async function deleteSdm(user: { id: string; id_group_user: number }, id: number) {
  // Korwil (9) shouldn't be able to delete SDM
  if (user.id_group_user === 9) {
    throw new Error('Unauthorized to delete SDM');
  }
  return sdmWilayahRepo.remove(id);
}
