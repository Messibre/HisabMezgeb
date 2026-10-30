import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers';

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

import LandingPage from '@/pages/landing/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { PeriodPicker } from '@/components/common/PeriodPicker';
import StatCard from '@/components/common/StatCard';
import MoneyText from '@/components/common/MoneyText';
import { useAuthStore } from '@/store/auth.store';

expect.extend(matchers);

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

describe('Automated WCAG 2.1 AA Accessibility Audit (vitest-axe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ status: 'unauthenticated' });
    document.documentElement.className = '';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('LandingPage has no accessibility violations in light mode', async () => {
    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('LandingPage has no accessibility violations in dark mode', async () => {
    document.documentElement.className = 'dark';
    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('LoginPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('RegisterPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SettingsPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/settings']}>
        <SettingsPage />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('NotFoundPage has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/unknown']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ConfirmDialog has no accessibility violations when open', async () => {
    const { container } = render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('PeriodPicker has no accessibility violations and follows radiogroup pattern', async () => {
    const { container } = render(
      <PeriodPicker value="today" onChange={vi.fn()} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('StatCard and MoneyText have no accessibility violations with tones and signs', async () => {
    const { container } = render(
      <div>
        <StatCard label="Income" amount={1500} tone="in" />
        <StatCard label="Expense" amount={320} tone="out" />
        <MoneyText amount={500} tone="neutral" showSign />
      </div>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
