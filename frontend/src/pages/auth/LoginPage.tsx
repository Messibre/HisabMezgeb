import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/constants';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();

  // Phone number only — no email anywhere in this app, per the spec.
  // Built inside the component so error messages are translated.
  const loginSchema = z.object({
    phoneNumber: z.string().min(9, t('auth.errorPhoneRequired')),
    password: z.string().min(1, t('auth.errorPasswordRequired')),
  });
  type LoginFormValues = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data);
    } catch {
      // Deliberately the same message regardless of which field was wrong —
      // see auth.service's loginAccount spec (section 8): never reveal
      // whether the phone number exists.
      setError('root', {
        message: t('auth.errorLoginFailed'),
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-lg font-semibold mb-4 text-foreground">{t('auth.loginTitle')}</h1>
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
              placeholder={t('auth.passwordPlaceholder')}
              className="w-full rounded-md border border-input px-3 py-3 text-base bg-background"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {errors.root && <p className="text-destructive text-xs">{errors.root.message}</p>}

          <Button type="submit" disabled={isSubmitting} className="h-12 text-base">
            {isSubmitting ? t('auth.loginButtonLoading') : t('auth.loginButton')}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          {t('auth.noAccountPrompt')}{' '}
          <Link to={ROUTES.REGISTER} className="text-foreground underline">
            {t('auth.registerLink')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
