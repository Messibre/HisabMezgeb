import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';

const mockLogin = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
  }),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('M9 Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders phone and password fields, login button, and register link without forgot-password', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
    expect(screen.queryByText(/forgot password/i)).not.toBeInTheDocument();
  });

  it('validates required phone and password on submit', async () => {
    renderLoginPage();
    const submitBtn = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/enter a valid phone number/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with phone and password payload on valid submit', async () => {
    mockLogin.mockResolvedValueOnce({ id: '1', phoneNumber: '+251911223344' });
    renderLoginPage();

    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitBtn = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(phoneInput, { target: { value: '0911223344' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        phoneNumber: '0911223344',
        password: 'secret123',
      });
    });
  });

  it('displays generic error message for 401 error, keeps phone and clears password', async () => {
    const error401 = {
      response: { status: 401, data: { message: 'Unauthorized' } },
    };
    mockLogin.mockRejectedValueOnce(error401);
    renderLoginPage();

    const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(phoneInput, { target: { value: '0911223344' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect phone number or password/i);
    expect(phoneInput.value).toBe('0911223344');
    expect(passwordInput.value).toBe('');
  });

  it('displays rate limit message on 429 response', async () => {
    const error429 = {
      response: { status: 429, data: { message: 'Too many requests' } },
    };
    mockLogin.mockRejectedValueOnce(error429);
    renderLoginPage();

    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitBtn = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(phoneInput, { target: { value: '0911223344' } });
    fireEvent.change(passwordInput, { target: { value: 'pass12345' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByRole('alert')).toHaveTextContent(/too many tries/i);
  });

  it('disables submit button and shows loading state while submitting', async () => {
    let resolvePromise: (val?: unknown) => void = () => {};
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockLogin.mockReturnValueOnce(pendingPromise);

    renderLoginPage();

    const phoneInput = screen.getByLabelText(/phone number/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitBtn = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(phoneInput, { target: { value: '0911223344' } });
    fireEvent.change(passwordInput, { target: { value: 'pass12345' } });
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
