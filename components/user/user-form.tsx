"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, userUpdateSchema, type UserInput, type UserUpdateInput } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createUserAction, updateUserAction } from '@/app/actions/user';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    kodeLama: number | null;
    username: string;
    email: string | null;
    nik: string | null;
    kantorId: number | null;
    groupUserId: number | null;
    aktif: string;
    mustResetPassword: boolean;
  };
}

export function UserForm({ mode, initialData }: UserFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UserInput>({
    resolver: zodResolver(mode === 'create' ? userSchema : userUpdateSchema),
    defaultValues: initialData
      ? {
          kodeLama: initialData.kodeLama || undefined,
          username: initialData.username,
          email: initialData.email || '',
          nik: initialData.nik || '',
          kantorId: initialData.kantorId || undefined,
          groupUserId: initialData.groupUserId || undefined,
          aktif: initialData.aktif as 'y' | 'n',
          mustResetPassword: initialData.mustResetPassword,
          passwordHash: '', // Don't pre-fill password hash
        }
      : {
          kodeLama: undefined,
          username: '',
          email: '',
          nik: '',
          kantorId: undefined,
          groupUserId: undefined,
          aktif: 'y',
          mustResetPassword: true,
          passwordHash: '',
        },
  });

  const onSubmit = async (data: UserInput) => {
    setIsSubmitting(true);
    try {
      let result;
      if (mode === 'create') {
        // For create, passwordHash is required
        if (!data.passwordHash) {
          toast.error('Password hash wajib diisi untuk user baru');
          setIsSubmitting(false);
          return;
        }
        result = await createUserAction(data);
      } else {
        // For edit, only update non-password fields
        const updateData: UserUpdateInput = {
          kodeLama: data.kodeLama,
          username: data.username,
          email: data.email,
          nik: data.nik,
          kantorId: data.kantorId,
          groupUserId: data.groupUserId,
          aktif: data.aktif,
          mustResetPassword: data.mustResetPassword,
        };
        result = await updateUserAction(initialData!.id, updateData);
      }

      if (result.success) {
        toast.success(
          mode === 'create' ? 'User berhasil ditambahkan' : 'User berhasil diubah'
        );
        router.push('/dashboard/users');
      } else {
        toast.error(result.error || 'Gagal menyimpan data user');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="kodeLama">Kode Lama</Label>
          <Input
            id="kodeLama"
            type="number"
            placeholder="Contoh: 1"
            {...register('kodeLama', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.kodeLama && (
            <p className="text-sm text-destructive">{errors.kodeLama.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">
            Username <span className="text-destructive">*</span>
          </Label>
          <Input
            id="username"
            placeholder="Contoh: johndoe"
            {...register('username')}
            disabled={isSubmitting}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Contoh: john@example.com"
            {...register('email')}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nik">NIK</Label>
          <Input
            id="nik"
            placeholder="NIK"
            {...register('nik')}
            disabled={isSubmitting}
          />
          {errors.nik && (
            <p className="text-sm text-destructive">{errors.nik.message}</p>
          )}
        </div>

        {mode === 'create' && (
          <div className="space-y-2">
            <Label htmlFor="passwordHash">
              Password Hash <span className="text-destructive">*</span>
            </Label>
            <Input
              id="passwordHash"
              type="text"
              placeholder="Password hash (bcrypt)"
              {...register('passwordHash')}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Gunakan bcrypt hash untuk password. Untuk development, gunakan tool untuk generate hash.
            </p>
            {errors.passwordHash && (
              <p className="text-sm text-destructive">{errors.passwordHash.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="kantorId">Kantor ID</Label>
          <Input
            id="kantorId"
            type="number"
            placeholder="Kantor ID"
            {...register('kantorId', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.kantorId && (
            <p className="text-sm text-destructive">{errors.kantorId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="groupUserId">Group User ID</Label>
          <Input
            id="groupUserId"
            type="number"
            placeholder="Group User ID (1=Super Admin, 2=Branch Admin, 9=Korwil)"
            {...register('groupUserId', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            1 = Super Admin, 2 = Branch Admin, 9 = Korwil
          </p>
          {errors.groupUserId && (
            <p className="text-sm text-destructive">{errors.groupUserId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="aktif">Status</Label>
            <Select
              defaultValue={initialData?.aktif === 'y' ? 'aktif' : 'nonaktif'}
              onValueChange={(value: string) => setValue('aktif', value === 'aktif' ? 'y' : 'n')}
              disabled={isSubmitting}
            >
              <SelectTrigger id="aktif">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          {errors.aktif && (
            <p className="text-sm text-destructive">{errors.aktif.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="mustResetPassword"
            checked={initialData?.mustResetPassword ?? true}
            onChange={(e) => setValue('mustResetPassword', e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4"
          />
          <Label htmlFor="mustResetPassword">Wajib Reset Password</Label>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Menyimpan...'
            : mode === 'create'
              ? 'Tambah User'
              : 'Simpan Perubahan'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/users')}
          disabled={isSubmitting}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
