import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FormField from '@/components/common/FormField';
import PillInput from '@/components/common/PillInput';
import PasswordInput from '@/components/common/PasswordInput';
import AmountInput from '@/components/common/AmountInput';
import SegmentedControl from '@/components/common/SegmentedControl';

describe('Form components (M5)', () => {
  it('FormField renders label, optional badge, helper text, and error alert', () => {
    const { rerender } = render(
      <FormField label="Shop Name" htmlFor="shopName" optional helperText="Displayed on receipts">
        <input id="shopName" />
      </FormField>
    );

    expect(screen.getByText('Shop Name')).toBeInTheDocument();
    expect(screen.getByText('(optional)')).toBeInTheDocument();
    expect(screen.getByText('Displayed on receipts')).toBeInTheDocument();

    rerender(
      <FormField label="Shop Name" htmlFor="shopName" error="Name is required">
        <input id="shopName" />
      </FormField>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Name is required');
  });

  it('PillInput renders 48px rounded input and forwards ref', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<PillInput ref={ref} placeholder="Test input" leadingIcon={<span data-testid="icon">@</span>} />);

    const input = screen.getByPlaceholderText('Test input');
    expect(input).toBeInTheDocument();
    expect(ref.current).toBe(input);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(input.className).toContain('rounded-full');
  });

  it('PasswordInput toggles password visibility and updates aria-pressed', () => {
    render(<PasswordInput placeholder="Password" id="password" />);
    const input = screen.getByPlaceholderText('Password') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /password/i });
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggleBtn);
    expect(input.type).toBe('text');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggleBtn);
    expect(input.type).toBe('password');
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('AmountInput blocks letters/negatives and enforces 8 digits + 2 decimals max', () => {
    const onChange = vi.fn();
    render(<AmountInput value="" onChange={onChange} currency="ETB" />);

    const input = screen.getByPlaceholderText('0.00');

    // Valid digits
    fireEvent.change(input, { target: { value: '120.50' } });
    expect(onChange).toHaveBeenCalledWith('120.50');

    // Invalid - letters
    onChange.mockClear();
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onChange).not.toHaveBeenCalled();

    // Invalid - 3 decimals
    onChange.mockClear();
    fireEvent.change(input, { target: { value: '12.345' } });
    expect(onChange).not.toHaveBeenCalled();

    // Invalid - 9 integer digits
    onChange.mockClear();
    fireEvent.change(input, { target: { value: '123456789' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('SegmentedControl renders options and supports keyboard navigation', () => {
    const onChange = vi.fn();
    const options = [
      { value: 'income', label: 'Income' },
      { value: 'expense', label: 'Expense' },
      { value: 'funding', label: 'Funding' },
    ];

    render(<SegmentedControl options={options} value="income" onChange={onChange} />);

    const incomeBtn = screen.getByRole('tab', { name: 'Income' });
    const expenseBtn = screen.getByRole('tab', { name: 'Expense' });

    expect(incomeBtn).toHaveAttribute('aria-selected', 'true');
    expect(expenseBtn).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(expenseBtn);
    expect(onChange).toHaveBeenCalledWith('expense');

    // Arrow Right key navigation
    fireEvent.keyDown(incomeBtn, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('expense');
  });
});
