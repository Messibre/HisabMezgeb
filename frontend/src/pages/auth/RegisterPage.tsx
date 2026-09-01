import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerAccount } = useAuth();

  const registerSchema = z.object({
    phoneNumber: z.string().min(9, t('auth.errorPhoneRequired')),
    password: z.string().min(8, t('auth.errorPasswordMin')),
    shopName: z.string().optional(),
  });
  type RegisterFormValues = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerAccount(data);
    } catch {
      setError('root', {
        message: t('auth.errorRegisterFailed'),
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">{t('auth.registerTitle')}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <input
              type="tel"
              inputMode="tel"
              placeholder={t('auth.phoneNumberPlaceholder')}
              className="w-full rounded-md border border-input px-3 py-3 text-base bg-background"
              {...register('phoneNumber')}
            />
            {errors.phoneNumber && (
              <p className="text-destructive text-xs mt-1">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder={t('auth.passwordMinPlaceholder')}
              className="w-full rounded-md border border-input px-3 py-3 text-base bg-background"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <input
              type="text"
              placeholder={t('auth.shopNamePlaceholder')}
              className="w-full rounded-md border border-input px-3 py-3 text-base bg-background"
              {...register('shopName')}
            />
          </div>

          {errors.root && <p className="text-destructive text-xs">{errors.root.message}</p>}

          <Button type="submit" disabled={isSubmitting} className="h-12 text-base">
            {isSubmitting ? t('auth.registerButtonLoading') : t('auth.registerButton')}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          {t('auth.haveAccountPrompt')}{' '}
          <Link to={ROUTES.LOGIN} className="text-foreground underline">
            {t('auth.loginLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
