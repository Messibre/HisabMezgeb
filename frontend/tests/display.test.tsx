import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MoneyText from '@/components/common/MoneyText';
import StatCard from '@/components/common/StatCard';
import { SkeletonRow, SkeletonBlock } from '@/components/common/SkeletonRow';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';

describe('M6 Display & State Components', () => {
  describe('MoneyText', () => {
    it('renders formatted money with currency label first', () => {
      render(<MoneyText amount="1200" />);
      expect(screen.getByText('1,200')).toBeInTheDocument();
      expect(screen.getByText('ETB')).toBeInTheDocument();
    });

    it('applies tone colors and uses strong variant for small size', () => {
      const { container: c1 } = render(<MoneyText amount="500" tone="in" size="sm" />);
      const el1 = c1.firstChild as HTMLElement;
      expect(el1.className).toContain('text-[var(--money-in-strong)]');

      const { container: c2 } = render(<MoneyText amount="500" tone="in" size="lg" />);
      const el2 = c2.firstChild as HTMLElement;
      expect(el2.className).toContain('text-[var(--money-in)]');
    });

    it('omits currency when showCurrency is false', () => {
      render(<MoneyText amount="350" showCurrency={false} />);
      expect(screen.getByText('350')).toBeInTheDocument();
      expect(screen.queryByText('ETB')).not.toBeInTheDocument();
    });
  });

  describe('StatCard', () => {
    it('renders label, money amount, and optional accent bar', () => {
      render(
        <StatCard
          label="This Week's Income"
          amount="12500"
          tone="in"
          accentBarColor="var(--money-in)"
        />
      );
      expect(screen.getByText("This Week's Income")).toBeInTheDocument();
      expect(screen.getByText(/12,500/)).toBeInTheDocument();
      expect(screen.getByTestId('stat-accent-bar')).toBeInTheDocument();
    });

    it('handles onClick as an accessible interactive card', () => {
      const handleClick = vi.fn();
      render(
        <StatCard
          label="Customer Debts"
          amount="4500"
          tone="out"
          onClick={handleClick}
        />
      );
      const card = screen.getByRole('button');
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('SkeletonRow and SkeletonBlock', () => {
    it('renders SkeletonRow with avatar circle, text lines, and pill', () => {
      const { container } = render(<SkeletonRow />);
      expect(container.querySelector('[data-testid="skeleton-circle"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="skeleton-lines"]')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="skeleton-pill"]')).toBeInTheDocument();
    });

    it('renders SkeletonBlock with pulse animation', () => {
      const { container } = render(<SkeletonBlock className="h-12 w-full" />);
      const block = container.firstChild as HTMLElement;
      expect(block.className).toContain('animate-pulse');
      expect(block.className).toContain('h-12');
    });
  });

  describe('EmptyState & ErrorState', () => {
    it('renders EmptyState with icon, title, description, and action button', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          icon={<span data-testid="empty-icon">Icon</span>}
          title="No customers yet"
          description="Add your first customer to track credit"
          actionLabel="Add Customer"
          onAction={onAction}
        />
      );
      expect(screen.getByText('No customers yet')).toBeInTheDocument();
      expect(screen.getByText('Add your first customer to track credit')).toBeInTheDocument();
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: 'Add Customer' });
      fireEvent.click(btn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('renders ErrorState with alert role, message, and retry button', () => {
      const onRetry = vi.fn();
      render(
        <ErrorState
          message="Failed to load ledger data"
          onRetry={onRetry}
        />
      );
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Failed to load ledger data');
      const retryBtn = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
