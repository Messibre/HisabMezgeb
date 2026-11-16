import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useAuthStore } from '@/store/auth.store';

const ACCOUNT = { id: 'a1', phoneNumber: '0911000000', shopName: null, createdAt: '' };

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<p>home page</p>} />
        </Route>
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  afterEach(() => useAuthStore.setState({ account: null, status: 'unknown' }));

  it('renders the page while the session check runs when this device has a saved account', () => {
    useAuthStore.setState({ account: ACCOUNT, status: 'unknown' });
    renderAt();
    expect(screen.getByText('home page')).toBeInTheDocument();
  });

  it('shows a spinner (no page, no data requests) when there is no saved account yet', () => {
    useAuthStore.setState({ account: null, status: 'unknown' });
    renderAt();
    expect(screen.queryByText('home page')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to login once the session is known to be gone', () => {
    useAuthStore.setState({ account: null, status: 'unauthenticated' });
    renderAt();
    expect(screen.getByText('login page')).toBeInTheDocument();
  });
});
