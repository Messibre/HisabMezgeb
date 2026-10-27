import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, type ThemeMode } from '@/store/theme.store';
import { Button } from '@/components/ui/button';
import SegmentedControl from '@/components/common/SegmentedControl';
import { cn } from '@/lib/utils';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const LANGUAGES = [
  { code: 'en', nativeLabel: 'English' },
  { code: 'am', nativeLabel: 'አማርኛ' },
  { code: 'ti', nativeLabel: 'ትግርኛ' },
] as const;

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  useDocumentMeta({ titleKey: 'pages.settings', noindex: true });
  const { logout } = useAuth();
  const { mode, setMode } = useTheme();

  return (
    <div className="p-4 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">{t('pages.settings')}</h1>

      {/* Theme switcher */}
      <div>
        <p className="text-sm font-medium text-foreground mb-1">{t('settings.theme', 'Theme')}</p>
        <p className="text-xs text-muted-foreground mb-3">
          {t('settings.themeHelper', 'Choose light, dark, or follow your device settings')}
        </p>
        <SegmentedControl
          value={mode}
          onChange={(val) => setMode(val as ThemeMode)}
          options={[
            { value: 'light', label: t('settings.themeLight', 'Light') },
            { value: 'dark', label: t('settings.themeDark', 'Dark') },
            { value: 'system', label: t('settings.themeSystem', 'System') },
          ]}
        />
      </div>

      {/* Language switcher */}
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
