import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormErrorSummary from '@/components/common/FormErrorSummary';
import { toUserError } from '@/lib/errors';

// Test form component representing mutation form
function SampleExpenseForm({ onSubmitMutation }: { onSubmitMutation: (data: any) => Promise<void> }) {
  const [amount, setAmount] = useState('1500');
  const [note, setNote] = useState('Shop sugar purchase');
  const [serverError, setServerError] = useState<{ message: string; requestId?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);

    try {
      await onSubmitMutation({ amount, note });
    } catch (err) {
      const userErr = toUserError(err);
      setServerError({
        message: userErr.kind === 'conflict' ? 'Duplicate entry for today' : 'Failed to save',
        requestId: userErr.requestId,
      });
      // CRITICAL: We NEVER clear amount or note! User input is preserved.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormErrorSummary
        message={serverError?.message}
        title={serverError?.requestId ? `Ref: ${serverError.requestId}` : undefined}
      />

      <div>
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="note">Note</label>
        <input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        Save Expense
      </button>
    </form>
  );
}

describe('Form Error State and Value Persistence', () => {
  it('preserves user input values and renders error with role="alert" after mutation failure', async () => {
    const mockMutation = vi.fn().mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          code: 'DUPLICATE_EXPENSE_ENTRY',
          requestId: 'req-dup-888',
        },
      },
    });

    render(<SampleExpenseForm onSubmitMutation={mockMutation} />);

    const amountInput = screen.getByLabelText('Amount') as HTMLInputElement;
    const noteInput = screen.getByLabelText('Note') as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /save expense/i });

    // Change input
    fireEvent.change(amountInput, { target: { value: '2500' } });
    fireEvent.change(noteInput, { target: { value: 'Oil and Teff' } });

    // Submit form
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutation).toHaveBeenCalledWith({ amount: '2500', note: 'Oil and Teff' });
    });

    // Alert should appear
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Duplicate entry for today');
    expect(alert).toHaveTextContent('req-dup-888');

    // Values MUST be preserved
    expect(amountInput.value).toBe('2500');
    expect(noteInput.value).toBe('Oil and Teff');
  });
});
