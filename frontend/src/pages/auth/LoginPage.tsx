import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AuthShell from '@/components/common/AuthShell';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import PasswordInput from '@/components/common/PasswordInput';
import { createPhoneSchema } from '@/lib/validation';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { ROUTES } from '@/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function LoginPage() {
  const { t } = useTranslation();
  useDocumentMeta({ titleKey: 'auth.loginTitle', noindex: false });
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const loginSchema = z.object({
    phoneNumber: createPhoneSchema(t('auth.errorPhoneRequired', 'Enter a valid phone number')),
    password: z.string().min(1, t('auth.errorPasswordRequired', 'Password is required')),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login({
        phoneNumber: data.phoneNumber.trim(),
        password: data.password,
      });
    } catch (err: unknown) {
      // Clear password and focus it, keeping the phone number
      setValue('password', '');
      setFocus('password');

      const errKey = getAuthErrorMessage(err, 'login');
      setServerError(t(errKey, 'Incorrect phone number or password'));
    }
  };

  return (
    <AuthShell subtitle={t('auth.loginSubtitle', 'Sign in to your digital ledger')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <FormField
          htmlFor="login-phone"
          label={t('auth.phoneNumberLabel', 'Phone Number')}
          error={errors.phoneNumber?.message}
        >
          <PillInput
            id="login-phone"
            type="tel"
            inputMode="tel"
            autoComplete="username"
            placeholder={t('auth.phoneNumberPlaceholderExample', '09XX XXX XXX')}
            leadingIcon={<Phone className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />}
            hasError={Boolean(errors.phoneNumber)}
            {...register('phoneNumber')}
          />
        </FormField>

        <FormField
          htmlFor="login-password"
          label={t('auth.passwordLabel', 'Password')}
          error={errors.password?.message}
        >
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder={t('auth.passwordPlaceholder', 'Password')}
            hasError={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>

        {serverError && (
          <div
            role="alert"
            className="p-3 text-center text-sm font-medium rounded-xl bg-[var(--money-out)]/10 text-[var(--money-out)] border border-[var(--money-out)]/20"
          >
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="flex h-[52px] w-full items-center justify-center rounded-full bg-primary px-6 text-base font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              <span>{t('auth.loginButtonLoading', 'Logging in…')}</span>
            </>
          ) : (
            <>
              <span>{t('auth.loginButton', 'Log In')}</span>
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>

        <div className="pt-2 text-center text-sm text-on-surface-variant">
          <span>{t('auth.noAccountPrompt', "Don't have an account?")} </span>
          <Link
            to={ROUTES.REGISTER}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {t('auth.registerLink', 'Register')}
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
