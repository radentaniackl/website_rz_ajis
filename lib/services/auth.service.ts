import bcrypt from 'bcryptjs';
import * as userRepo from '@/lib/repositories/user.repository';

/**
 * Auth Service
 * Tanggung jawab:
 *   - Logika bisnis autentikasi (verifikasi password, validasi status user)
 *   - Dipanggil oleh NextAuth authorize callback
 *   - Tidak berinteraksi langsung dengan database
 */

export type AuthResult =
  | {
      success: true;
      user: {
        id: number;
        username: string;
        id_group_user: number;
        kantor_id: number | null;
      };
    }
  | { success: false; error: string };

export async function authenticateUser(
  username: string,
  password: string
): Promise<AuthResult> {
  if (!username || !password) {
    return { success: false, error: 'Username dan password wajib diisi.' };
  }

  const user = await userRepo.findUserByUsername(username);

  if (!user) {
    // Hindari information leakage (jangan beri tahu user mana yang tidak ada)
    return { success: false, error: 'Username atau password salah.' };
  }

  if (user.aktif !== 'y') {
    return { success: false, error: 'Akun Anda dinonaktifkan. Hubungi administrator.' };
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return { success: false, error: 'Username atau password salah.' };
  }

  return {
    success: true,
    user: {
      id: Number(user.id),
      username: user.username,
      id_group_user: Number(user.groupUserId),
      kantor_id: user.kantorId ?? null,
    },
  };
}

/**
 * Mengganti password user dengan hash baru.
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = await userRepo.findUserById(userId);
  if (!user) return { success: false, error: 'User tidak ditemukan.' };

  const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValidPassword) {
    return { success: false, error: 'Password saat ini salah.' };
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'Password baru minimal 8 karakter.' };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await userRepo.updateUser(userId, {
    passwordHash: newHash,
    mustResetPassword: false,
  });

  return { success: true };
}
