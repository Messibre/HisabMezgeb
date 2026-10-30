import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';

import LoginPage from '@/pages/auth/LoginPage';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { PeriodPicker, type PeriodType } from '@/components/common/PeriodPicker';
import RootLayout from '@/components/layouts/RootLayout';
import { focusFirstInvalidField } from '@/lib/a11y';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isAuthenticated: false,
  }),
}));

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

function DialogTestWrapper() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        data-testid="trigger-btn"
        type="button"
        onClick={() => setOpen(true)}
      >
        Open Dialog
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Item"
        message="Are you sure you want to delete this record?"
        onConfirm={vi.fn()}
      />
    </div>
  );
}

function PeriodPickerWrapper() {
  const [period, setPeriod] = useState<PeriodType>('today');
  return <PeriodPicker value={period} onChange={setPeriod} />;
}

describe('Keyboard Walk-through & Interaction Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('renders login form inputs in predictable logical DOM order', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const inputs = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLAnchorElement>(
        'input, button, a'
      )
    );

    const phoneInput = container.querySelector<HTMLInputElement>('#login-phone');
    const passwordInput = container.querySelector<HTMLInputElement>('#login-password');
    const submitBtn = container.querySelector<HTMLButtonElement>('button[type="submit"]');
    const registerLink = container.querySelector<HTMLAnchorElement>('a[href="/register"]');

    expect(phoneInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(submitBtn).not.toBeNull();
    expect(registerLink).not.toBeNull();

    // Verify order in DOM tab sequence
    const phoneIdx = inputs.indexOf(phoneInput!);
    const passIdx = inputs.indexOf(passwordInput!);
    const submitIdx = inputs.indexOf(submitBtn!);
    const registerIdx = inputs.indexOf(registerLink!);

    expect(phoneIdx).toBeLessThan(passIdx);
    expect(passIdx).toBeLessThan(submitIdx);
    expect(submitIdx).toBeLessThan(registerIdx);
  });

  it('closes ConfirmDialog on Escape and returns focus to trigger element', async () => {
    const { container } = render(<DialogTestWrapper />);

    const triggerBtn = container.querySelector('[data-testid="trigger-btn"]') as HTMLButtonElement;
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    // Open dialog
    act(() => {
      triggerBtn.click();
    });

    const dialog = document.querySelector('[role="alertdialog"]');
    expect(dialog).not.toBeNull();

    // Cancel button receives initial focus
    await vi.waitFor(() => {
      const cancelBtn = dialog?.querySelector('button');
      expect(document.activeElement).toBe(cancelBtn);
    });

    // Press Escape to dismiss
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(document.activeElement).toBe(triggerBtn);
  });

  it('navigates PeriodPicker options with Left/Right and Up/Down arrow keys', () => {
    const { container } = render(<PeriodPickerWrapper />);

    const radios = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]'));
    expect(radios).toHaveLength(4);

    // 'today' is initially selected (tabIndex 0)
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
    radios[0].focus();

    // Arrow Right moves to 'week'
    act(() => {
      radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radios[1]);

    // Arrow Down moves to 'month'
    act(() => {
      radios[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radios[2]);

    // Arrow Left moves back to 'week'
    act(() => {
      radios[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radios[1]);

    // Arrow Up moves back to 'today'
    act(() => {
      radios[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    });
    expect(radios[0].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radios[0]);

    // Arrow Left wraps around to 'custom' (last option)
    act(() => {
      radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(radios[3].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radios[3]);
  });

  it('renders skip link in RootLayout and targets #main', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <RootLayout />,
      },
    ]);

    const { container } = render(<RouterProvider router={router} />);

    const skipLink = container.querySelector('a[href="#main"]');
    expect(skipLink).not.toBeNull();
    expect(skipLink?.textContent).toContain('Skip to main content');
    expect(skipLink).toHaveClass('sr-only');
  });

  it('focusFirstInvalidField finds and focuses the first invalid element', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <form>
        <input id="field1" type="text" value="valid" />
        <input id="field2" type="text" aria-invalid="true" />
        <input id="field3" type="text" aria-invalid="true" />
      </form>
    `;
    document.body.appendChild(container);

    const field2 = container.querySelector('#field2') as HTMLElement;
    field2.scrollIntoView = vi.fn();

    const focused = focusFirstInvalidField(container);
    expect(focused).toBe(true);
    expect(document.activeElement).toBe(field2);
    expect(field2.scrollIntoView).toHaveBeenCalled();

    document.body.removeChild(container);
  });
});
