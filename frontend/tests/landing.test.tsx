import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n from 'i18next';
import LandingPage from '@/pages/landing/LandingPage';
import { useAuthStore } from '@/store/auth.store';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import api from '@/lib/axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

describe('Landing Page (M11)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    useAuthStore.setState({ account: null, user: null, status: 'unauthenticated' });
    await i18n.changeLanguage('en');
  });

  it('renders landing page with one H1 in English', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBe(1);
    expect(h1s[0]).toHaveTextContent("Your shop's daily money and debt book.");

    expect(screen.getByText('What it does')).toBeInTheDocument();
    expect(screen.getByText('How to use it')).toBeInTheDocument();
    expect(screen.getByText('Made for small shops')).toBeInTheDocument();
  });

  it('renders landing page in Amharic (am)', async () => {
    await act(async () => {
      await i18n.changeLanguage('am');
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('የሱቅዎ የዕለት ገንዘብ እና የብድር መዝገብ።');
    expect(screen.getByText('ምን ይሰራል?')).toBeInTheDocument();
    expect(screen.getByText('አጠቃቀሙ እንዴት ነው?')).toBeInTheDocument();
    expect(screen.getByText('ለአነስተኛ ሱቆች የተሰራ')).toBeInTheDocument();
  });

  it('renders landing page in Tigrigna (ti)', async () => {
    await act(async () => {
      await i18n.changeLanguage('ti');
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('ናይ ድኳንኩም ናይ መዓልቲ ገንዘብን ዕዳን መዝገብ።');
    expect(screen.getByText('እንታይ ይሰርሕ?')).toBeInTheDocument();
    expect(screen.getByText('ከመይ ጌርካ ይጥቀሙሉ?')).toBeInTheDocument();
    expect(screen.getByText('ንደቀቕቲ ድኳናት ዝተሰርሐ')).toBeInTheDocument();
  });

  it('contains links that point to /login and /register', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    const loginLinks = screen.getAllByRole('link', { name: /log in/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(2);
    loginLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/login');
    });

    const registerLinks = screen.getAllByRole('link', { name: /create account/i });
    expect(registerLinks.length).toBeGreaterThanOrEqual(2);
    registerLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register');
    });
  });

  it('switches language using the accessible language switcher radio buttons', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    const amharicRadio = screen.getByRole('radio', { name: 'አማርኛ' });
    expect(amharicRadio).toBeInTheDocument();
    fireEvent.click(amharicRadio);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'የሱቅዎ የዕለት ገንዘብ እና የብድር መዝገብ።'
    );
  });

  it('redirects an authenticated user to /home', () => {
    useAuthStore.setState({
      account: {
        id: 'acc-1',
        phoneNumber: '+251911223344',
        shopName: 'Shop',
        createdAt: '2026-10-26T10:00:00.000Z',
      },
      status: 'authenticated',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<div>Home Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Home Screen')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('ensures an anonymous visit makes NO network request', async () => {
    const postSpy = vi.spyOn(api, 'post');
    useAuthStore.setState({ account: null, user: null, status: 'unknown' });

    // Run bootstrap hook
    renderHook(() => useAuthBootstrap());

    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    // Give microtasks chance to execute
    await act(async () => {
      await Promise.resolve();
    });

    expect(postSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('heading order is semantic (one h1, several h2s, several h3s)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingPage />
      </MemoryRouter>
    );

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s.length).toBe(1);

    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(4);

    const h3s = screen.getAllByRole('heading', { level: 3 });
    expect(h3s.length).toBeGreaterThanOrEqual(7);
  });

  it('verifies public/robots.txt and public/sitemap.xml exist and contain NO placeholder domain', () => {
    const robotsPath = path.join(publicDir, 'robots.txt');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    expect(fs.existsSync(robotsPath)).toBe(true);
    expect(fs.existsSync(sitemapPath)).toBe(true);

    const robots = fs.readFileSync(robotsPath, 'utf8');
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');

    // Verify robots rules
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /home');
    expect(robots).toContain('Disallow: /entries');
    expect(robots).toContain('Disallow: /debts');
    expect(robots).toContain('Disallow: /reports');
    expect(robots).toContain('Disallow: /settings');

    // Verify sitemap contains public pages
    expect(sitemap).toContain('/login');
    expect(sitemap).toContain('/register');

    // Verify no fake placeholder domains
    const forbiddenPlaceholders = [
      'example.com',
      'your-domain',
      'placeholder',
      'mysite.com',
      'my-app.com',
      'domain.com',
    ];

    for (const placeholder of forbiddenPlaceholders) {
      expect(robots.toLowerCase()).not.toContain(placeholder);
      expect(sitemap.toLowerCase()).not.toContain(placeholder);
    }
  });
});
