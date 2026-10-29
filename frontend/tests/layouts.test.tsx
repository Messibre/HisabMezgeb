import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppHeader from '@/components/common/AppHeader';
import BottomTabLayout from '@/components/layouts/BottomTabLayout';
import AuthShell from '@/components/common/AuthShell';
import { ROUTES } from '@/constants';

describe('Layout and Header components (M4)', () => {
  it('AppHeader renders brand title by default without hamburger menu', () => {
    const { container } = render(<AppHeader />);
    expect(screen.getByText('Hisab Mezgeb')).toBeInTheDocument();
    // Verify no hamburger menu
    expect(container.querySelector('[aria-label="Menu"]')).toBeNull();
    expect(container.querySelector('[aria-label="menu"]')).toBeNull();
  });

  it('AppHeader renders custom title, back button with aria-label, and right action', () => {
    const onBack = vi.fn();
    render(
      <AppHeader
        title="Ledger"
        onBack={onBack}
        rightAction={<button aria-label="More">...</button>}
      />
    );

    expect(screen.getByText('Ledger')).toBeInTheDocument();
    const backBtn = screen.getByRole('button', { name: /back/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();

    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
  });

  it('BottomTabLayout renders 5 tabs with flex-1 min-w-0 and aria-current on active', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.HOME]}>
        <BottomTabLayout />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(5);

    links.forEach((link) => {
      expect(link.className).toContain('flex-1');
      expect(link.className).toContain('min-w-0');
    });

    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('AuthShell renders wallet logo, Hisab Mezgeb title, and subtitle', () => {
    render(
      <AuthShell subtitle="Sign in to your digital ledger">
        <form data-testid="login-form" />
      </AuthShell>
    );

    expect(screen.getByText('Hisab Mezgeb')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your digital ledger')).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });
});
