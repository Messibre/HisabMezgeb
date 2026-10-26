import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '@/pages/auth/RegisterPage';

const mockRegister = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
    isAuthenticated: false,
  }),
}));

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe('M8 Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all fields, labels, optional badge, and login link', () => {
    renderRegisterPage();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shop or business name/i)).toBeInTheDocument();
    expect(screen.getByText(/\(optional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    const loginLink = screen.getByRole('link', { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  it('shows validation error for invalid phone and short password', async () => {
    renderRegisterPage();
    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/enter a valid phone number/i)).toBeInTheDocument();
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register with exact payload omitting empty shopName', async () => {
    mockRegister.mockResolvedValueOnce({ id: '1', phoneNumber: '+251911223344' });
    renderRegisterPage();

    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(phoneInput, { target: { value: '0911223344' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        phoneNumber: '0911223344',
        password: 'password123',
      });
    });
  });

  it('calls register including shopName when provided', async () => {
    mockRegister.mockResolvedValueOnce({ id: '1', phoneNumber: '+251911223344' });
    renderRegisterPage();

    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const shopInput = screen.getByLabelText(/shop or business name/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(phoneInput, { target: { value: '0911223344' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(shopInput, { target: { value: 'Abebe Kiosk' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        phoneNumber: '0911223344',
        password: 'password123',
        shopName: 'Abebe Kiosk',
      });
    });
  });

  it('maps 409 conflict error to phone field', async () => {
    const error409 = {
      response: { status: 409, data: { message: 'Phone already registered' } },
    };
    mockRegister.mockRejectedValueOnce(error409);
    renderRegisterPage();

    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(phoneInput, { target: { value: '0911223344' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/this phone number is already registered/i)).toBeInTheDocument();
  });

  it('disables submit button and shows loading state while submitting', async () => {
    let resolvePromise: (val?: unknown) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockRegister.mockReturnValueOnce(pendingPromise);

    renderRegisterPage();

    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitBtn = screen.getByRole('button', { name: /create account/i });

    fireEvent.change(phoneInput, { target: { value: '0911223344' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
      expect(submitBtn).toHaveAttribute('aria-busy', 'true');
    });

    await act(async () => {
      resolvePromise();
    });
  });
});
