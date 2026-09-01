import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'en', nativeLabel: 'English' },
  { code: 'am', nativeLabel: 'አማርኛ' },
  { code: 'ti', nativeLabel: 'ትግርኛ' },
] as const;

/**
 * Stub page — see [6. Frontend UI, Pages & Components] section 6.2 for the
 * full spec (shop name, dark mode, notifications, password, categories).
 *
 * The language switcher below is real and functional today, since it only
 * needs i18next (already wired in src/lib/i18n.ts) — it doesn't depend on
 * the backend AppSettings/[5. API Specification] /settings endpoint the way
 * the other rows do. Once that endpoint exists, wire this same switcher to
 * also call useUpdateSettings so the choice persists to the account, not
 * just this device's localStorage (see the note in src/lib/i18n.ts).
 */
export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">{t('pages.settings')}</h1>

      <div>
        <p className="text-sm font-medium text-foreground mb-2">{t('settings.language')}</p>
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => i18n.changeLanguage(lang.code)}
              className={cn(
                'flex-1 rounded-md border px-3 py-3 text-base',
                i18n.language === lang.code
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-foreground'
              )}
            >
              {lang.nativeLabel}
            </button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground text-sm">{t('pages.moreSettingsComingSoon')}</p>

      <Button variant="destructive" onClick={logout} className="mt-8 h-12 text-base">
        {t('auth.logOut')}
      </Button>
    </div>
  );
}
