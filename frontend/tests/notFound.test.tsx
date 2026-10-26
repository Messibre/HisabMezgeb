import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NotFoundPage from '@/pages/NotFoundPage';
import { useAuthStore } from '@/store/auth.store';

describe('NotFound (404) Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.title = 'Hisab Mezgeb';
    useAuthStore.setState({ status: 'unauthenticated' });
  });

  it('renders 404 page, updates document.title, and sets focus to heading', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(document.title).toContain('Page not found');
    expect(document.activeElement).toBe(heading);
  });

  it('does NOT redirect automatically', async () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    // Fast-forward 10 seconds to ensure no timeout-based redirect happens
    vi.advanceTimersByTime(10000);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders Go to Login when unauthenticated', () => {
    useAuthStore.setState({ status: 'unauthenticated' });

    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('renders Go to Home when authenticated', () => {
    useAuthStore.setState({ status: 'authenticated' });

    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('renders inside layout with insideLayout=true without min-h-screen', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <NotFoundPage insideLayout={true} />
      </MemoryRouter>
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass('min-h-[70vh]');
    expect(main).not.toHaveClass('min-h-screen');
  });

  it('renders outside layout with insideLayout=false with min-h-screen', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <NotFoundPage insideLayout={false} />
      </MemoryRouter>
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass('min-h-screen');
  });
});
