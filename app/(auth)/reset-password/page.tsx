'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '@/lib/validations/auth';
import { resetPasswordAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!session?.user?.username) {
      setError('Sesi tidak valid. Silakan login kembali.');
      return;
    }

    setIsPending(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await resetPasswordAction(session.user.username, data);
      if (result.success) {
        setSuccess('Password berhasil direset! Silakan login kembali dengan password baru.');
        // Sign out the user
        await signOut({ redirect: false });
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(result.error || 'Terjadi kesalahan saat mereset password.');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Terjadi kesalahan jaringan atau server.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Demi keamanan, Anda diwajibkan untuk mengganti password default Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-700 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                disabled={isPending || !!success}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Masukkan ulang password"
                disabled={isPending || !!success}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isPending || !!success}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ganti Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
