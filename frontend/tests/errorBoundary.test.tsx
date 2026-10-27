import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Component crashed during render!');
  }
  return <div>Component rendered successfully</div>;
};

describe('ErrorBoundary with a throwing component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Silence error output in console during test
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
  });

  it('catches render crash, shows friendly screen with role="alert" and action buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to home/i })).toBeInTheDocument();
  });

  it('resets error state when Try Again is clicked', () => {
    let shouldThrow = true;
    const StatefulThrower = () => {
      if (shouldThrow) {
        throw new Error('Crash!');
      }
      return <div>Recovered!</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <StatefulThrower />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix condition and click retry
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    rerender(
      <ErrorBoundary>
        <StatefulThrower />
      </ErrorBoundary>
    );
    expect(screen.getByText('Recovered!')).toBeInTheDocument();
  });
});
