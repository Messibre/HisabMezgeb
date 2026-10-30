import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, ScrollRestoration } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function RootLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const isFirstRender = useRef(true);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Skip route focus shift on first render so we don't disrupt initial page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Give page time to mount
    const timer = setTimeout(() => {
      // Find the main h1 heading or the #main landmark
      const mainHeading = document.querySelector<HTMLElement>('main h1, h1, #main');
      if (mainHeading) {
        if (!mainHeading.hasAttribute('tabIndex')) {
          mainHeading.setAttribute('tabIndex', '-1');
        }
        mainHeading.focus({ preventScroll: true });

        const headingText = mainHeading.textContent?.trim();
        if (headingText) {
          setAnnouncement(`${headingText} page loaded`);
        }
      } else {
        const title = document.title || 'Page loaded';
        setAnnouncement(title);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {/* WCAG 2.4.1 Skip Link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-primary focus:text-on-primary focus:font-semibold focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {t('common.skipToContent', 'Skip to main content')}
      </a>

      {/* Screen-reader polite route announcer */}
      <div
        id="route-announcer"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="route-announcer"
      >
        {announcement}
      </div>

      <ScrollRestoration />
      <Outlet />
    </>
  );
}
