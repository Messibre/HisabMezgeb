import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, Store, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AuthShell from '@/components/common/AuthShell';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import PasswordInput from '@/components/common/PasswordInput';
import { createPhoneSchema } from '@/lib/validation';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { ROUTES } from '@/constants';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerAccount } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const registerSchema = z.object({
    phoneNumber: createPhoneSchema(t('auth.errorPhoneRequired', 'Enter a valid phone number')),
    password: z.string().min(8, t('auth.errorPasswordMin', 'Password must be at least 8 characters')),
    shopName: z.string().optional(),
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    const payload = {
      phoneNumber: data.phoneNumber.trim(),
      password: data.password,
      ...(data.shopName && data.shopName.trim() ? { shopName: data.shopName.trim() } : {}),
    };

    try {
      await registerAccount(payload);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } } };
      const status = errorObj.response?.status;

      if (status === 409) {
        setError('phoneNumber', {
          message: t('auth.errorRegisterFailed', 'This phone number is already registered'),
        });
      } else {
        const errKey = getAuthErrorMessage(err, 'register');
        setServerError(t(errKey, 'An error occurred. Please try again.'));
      }
    }
  };

  return (
    <AuthShell subtitle={t('auth.registerSubtitle', 'Create your digital ledger')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <FormField
          id="register-phone"
          label={t('auth.phoneNumberLabel', 'Phone Number')}
          error={errors.phoneNumber?.message}
        >
          <PillInput
            id="register-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t('auth.phoneNumberPlaceholderExample', '09XX XXX XXX')}
            leadingIcon={<Phone className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />}
            hasError={Boolean(errors.phoneNumber)}
            {...register('phoneNumber')}
          />
        </FormField>

        <FormField
          id="register-password"
          label={t('auth.passwordLabel', 'Password')}
          helperText={t('auth.passwordHelperMin', 'Minimum 8 characters')}
          error={errors.password?.message}
        >
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            placeholder={t('auth.passwordHelperMin', 'Minimum 8 characters')}
            hasError={Boolean(errors.password)}
            {...register('password')}
          />
        </FormField>

        <FormField
          id="register-shop"
          label={t('auth.shopNameLabel', 'Shop or Business Name')}
          optional
          error={errors.shopName?.message}
        >
          <PillInput
            id="register-shop"
            type="text"
            autoComplete="organization"
            placeholder={t('auth.shopNamePlaceholderExample', 'e.g. Abebe Kiosk')}
            leadingIcon={<Store className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />}
            hasError={Boolean(errors.shopName)}
            {...register('shopName')}
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
              <span>{t('auth.registerButtonLoading', 'Creating Account…')}</span>
            </>
          ) : (
            <>
              <span>{t('auth.registerButton', 'Create Account')}</span>
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>

        <div className="pt-2 text-center text-sm text-on-surface-variant">
          <span>{t('auth.haveAccountPrompt', 'Already have an account?')} </span>
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {t('auth.loginLink', 'Log In')}
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
