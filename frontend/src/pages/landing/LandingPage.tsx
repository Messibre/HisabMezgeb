import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Receipt,
  Users,
  BarChart3,
  Globe,
  Smartphone,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { ROUTES } from '@/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import ThemeToggle from '@/components/common/ThemeToggle';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardDescription } from '@/components/ui/card';

export default function LandingPage() {
  const { t } = useTranslation();
  useDocumentMeta({
    titleKey: 'landing.documentTitle',
    fallbackTitle: "Hisab Mezgeb - Your shop's daily money and debt book",
    descriptionKey: 'landing.metaDescription',
  });

  const status = useAuthStore((s) => s.status);

  // Authenticated users are redirected to app Home
  if (status === 'authenticated') {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-on-primary">
      {/* Accessible skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-md focus:outline-none"
      >
        {t('landing.skipToContent', 'Skip to main content')}
      </a>

      {/* Header */}
      <header
        role="banner"
        className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-md transition-colors"
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          {/* Logo & Brand */}
          <Link
            to={ROUTES.LANDING}
            className="flex items-center gap-2.5 font-bold text-foreground text-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1 -m-1"
            aria-label="Hisab Mezgeb"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="h-8 w-8 text-primary shrink-0"
              aria-hidden="true"
            >
              <circle cx="256" cy="256" r="256" fill="currentColor" />
              <g
                transform="translate(136, 136) scale(10)"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
              </g>
            </svg>
            <span className="tracking-tight text-base sm:text-lg">Hisab Mezgeb</span>
          </Link>

          {/* Navigation & Controls */}
          <nav aria-label="Main Navigation" className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle className="h-11 w-11" />
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-11 min-h-[44px] px-3.5 text-sm font-semibold rounded-lg border-border/60 hover:bg-muted"
            >
              <Link to={ROUTES.LOGIN}>{t('landing.header.login', 'Log in')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* Hero Section */}
        <section
          aria-labelledby="hero-heading"
          className="relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28"
        >
          <div className="mx-auto max-w-3xl text-center">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-6">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
              <span>Hisab Mezgeb</span>
            </div>

            {/* ONE H1 */}
            <h1
              id="hero-heading"
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-tight lg:text-6xl"
            >
              {t('landing.hero.title', "Your shop's daily money and debt book.")}
            </h1>

            <p className="mt-5 text-base text-muted-foreground sm:text-lg sm:max-w-xl sm:mx-auto">
              {t(
                'landing.hero.subtitle',
                'Record daily cash, track customer debts, and see how your shop is doing every week.'
              )}
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-xs sm:max-w-md mx-auto">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 min-h-[48px] px-6 text-base font-semibold shadow-sm rounded-xl"
              >
                <Link to={ROUTES.REGISTER}>
                  {t('landing.hero.ctaCreateAccount', 'Create account')}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 min-h-[48px] px-6 text-base font-medium rounded-xl border-border/80"
              >
                <Link to={ROUTES.LOGIN}>{t('landing.hero.ctaLogin', 'Log in')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* What it does */}
        <section
          aria-labelledby="features-heading"
          className="border-t border-border/40 bg-surface-container-low/40 px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2
                id="features-heading"
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                {t('landing.features.title', 'What it does')}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
              {/* Card 1 */}
              <Card className="rounded-2xl border-border/60 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="p-6">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"
                    aria-hidden="true"
                  >
                    <Receipt className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {t('landing.features.card1.title', 'Daily income and expenses')}
                  </h3>
                  <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {t(
                      'landing.features.card1.description',
                      "Write down each day's income and expenses."
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Card 2 */}
              <Card className="rounded-2xl border-border/60 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="p-6">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"
                    aria-hidden="true"
                  >
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {t('landing.features.card2.title', 'Customer debt ledger')}
                  </h3>
                  <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {t(
                      'landing.features.card2.description',
                      'Keep a clear list of who owes you and how much.'
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Card 3 */}
              <Card className="rounded-2xl border-border/60 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="p-6">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"
                    aria-hidden="true"
                  >
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {t('landing.features.card3.title', 'Weekly and monthly reports')}
                  </h3>
                  <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {t(
                      'landing.features.card3.description',
                      'See simple reports for any week or month.'
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Card 4 */}
              <Card className="rounded-2xl border-border/60 bg-card hover:border-primary/40 transition-colors shadow-xs">
                <CardHeader className="p-6">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4"
                    aria-hidden="true"
                  >
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {t('landing.features.card4.title', 'Three languages')}
                  </h3>
                  <CardDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {t(
                      'landing.features.card4.description',
                      'Works in Amharic, Tigrigna and English.'
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How to use it */}
        <section
          aria-labelledby="how-it-works-heading"
          className="px-4 py-14 sm:px-6 sm:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-4xl">
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <h2
                id="how-it-works-heading"
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                {t('landing.howItWorks.title', 'How to use it')}
              </h2>
            </div>

            <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3 list-none p-0 m-0">
              {/* Step 1 */}
              <li className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-xs">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 shadow-xs"
                  aria-hidden="true"
                >
                  1
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {t('landing.howItWorks.step1.title', 'Create an account')}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(
                    'landing.howItWorks.step1.description',
                    'Create an account with your phone number.'
                  )}
                </p>
              </li>

              {/* Step 2 */}
              <li className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-xs">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 shadow-xs"
                  aria-hidden="true"
                >
                  2
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {t('landing.howItWorks.step2.title', 'Write down each night')}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(
                    'landing.howItWorks.step2.description',
                    "Each night, write the day's income and expenses."
                  )}
                </p>
              </li>

              {/* Step 3 */}
              <li className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-xs">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4 shadow-xs"
                  aria-hidden="true"
                >
                  3
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {t('landing.howItWorks.step3.title', 'Track credit and reports')}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t(
                    'landing.howItWorks.step3.description',
                    'When a customer takes goods or pays, add it to their page. Then look at Reports.'
                  )}
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* Made for small shops */}
        <section
          aria-labelledby="small-shops-heading"
          className="border-t border-border/40 bg-surface-container-low/40 px-4 py-14 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-4xl">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <h2
                id="small-shops-heading"
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                {t('landing.smallShops.title', 'Made for small shops')}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="p-5 rounded-2xl bg-card border border-border/60 flex flex-col items-center text-center">
                <div
                  className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3"
                  aria-hidden="true"
                >
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('landing.smallShops.point1.title', 'Phone and password login')}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'landing.smallShops.point1.description',
                    'Sign in securely with your phone number and password.'
                  )}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/60 flex flex-col items-center text-center">
                <div
                  className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3"
                  aria-hidden="true"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('landing.smallShops.point2.title', 'Works on a phone')}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'landing.smallShops.point2.description',
                    'Designed for small screens with clear, readable buttons.'
                  )}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border/60 flex flex-col items-center text-center">
                <div
                  className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3"
                  aria-hidden="true"
                >
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('landing.smallShops.point3.title', 'Private to your account')}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'landing.smallShops.point3.description',
                    'Your records are private to your account.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section
          aria-labelledby="bottom-cta-heading"
          className="border-t border-border/40 px-4 py-16 sm:px-6 sm:py-20 text-center"
        >
          <div className="mx-auto max-w-2xl">
            <h2
              id="bottom-cta-heading"
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              {t('landing.bottomCta.title', "Ready to track your shop's money?")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t('landing.bottomCta.subtitle', 'Start your digital ledger in seconds.')}
            </p>
            <div className="mt-6 flex justify-center">
              <Button
                asChild
                size="lg"
                className="h-12 min-h-[48px] px-8 text-base font-semibold shadow-sm rounded-xl"
              >
                <Link to={ROUTES.REGISTER}>
                  {t('landing.bottomCta.button', 'Create account')}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-border/40 bg-card/60 py-8 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="h-6 w-6 text-primary shrink-0"
              aria-hidden="true"
            >
              <circle cx="256" cy="256" r="256" fill="currentColor" />
              <g
                transform="translate(136, 136) scale(10)"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
              </g>
            </svg>
            <span className="font-semibold text-foreground text-sm">Hisab Mezgeb</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">—</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {t('landing.footer.tagline', "Your shop's daily money and debt book.")}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link
              to={ROUTES.LOGIN}
              className="min-h-[44px] flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('landing.footer.login', 'Log in')}
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="min-h-[44px] flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('landing.footer.register', 'Create account')}
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Hisab Mezgeb.{' '}
            {t('landing.footer.rights', 'All rights reserved.')}
          </p>
        </div>
      </footer>
    </div>
  );
}
