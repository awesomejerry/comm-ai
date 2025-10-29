/**
 * Unit Tests: AdminRoute Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminRoute } from '../AdminRoute';
import * as adminRoleService from '../../services/adminRoleService';

// Mock the admin role service
vi.mock('../../services/adminRoleService');

// Mock the auth hook
vi.mock('../AuthProvider', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../AuthProvider';

describe('AdminRoute', () => {
  const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
  const mockCheckIsAdmin = vi.mocked(adminRoleService.checkIsAdmin);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAdminRoute = (children: React.ReactNode = <div>Protected Content</div>) => {
    return render(
      <BrowserRouter>
        <AdminRoute>{children}</AdminRoute>
      </BrowserRouter>
    );
  };

  it('should show loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      logout: vi.fn(),
    });

    renderAdminRoute();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      logout: vi.fn(),
    });

    renderAdminRoute();

    // Should not render protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show loading state while verifying admin role', async () => {
    const mockUser = { email: 'test@example.com' } as any;
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: {} as any,
      loading: false,
      logout: vi.fn(),
    });

    // Delay the admin check
    mockCheckIsAdmin.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
    );

    renderAdminRoute();

    // Should show loading while checking admin role
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render children for admin users', async () => {
    const mockUser = { email: 'admin@example.com' } as any;
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: {} as any,
      loading: false,
      logout: vi.fn(),
    });

    mockCheckIsAdmin.mockResolvedValue(true);

    renderAdminRoute();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('should redirect to unauthorized page for non-admin users', async () => {
    const mockUser = { email: 'user@example.com' } as any;
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: {} as any,
      loading: false,
      logout: vi.fn(),
    });

    mockCheckIsAdmin.mockResolvedValue(false);

    renderAdminRoute();

    await waitFor(() => {
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('should show error state when role check fails', async () => {
    const mockUser = { email: 'test@example.com' } as any;
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: {} as any,
      loading: false,
      logout: vi.fn(),
    });

    mockCheckIsAdmin.mockRejectedValue(new Error('Network error'));

    renderAdminRoute();

    await waitFor(() => {
      expect(screen.getByText(/Error Verifying Access/i)).toBeInTheDocument();
    });
  });

  it('should allow retry when role check fails', async () => {
    const mockUser = { email: 'test@example.com' } as any;
    mockUseAuth.mockReturnValue({
      user: mockUser,
      session: {} as any,
      loading: false,
      logout: vi.fn(),
    });

    // First call fails, second succeeds
    mockCheckIsAdmin.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(true);

    renderAdminRoute();

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/Error Verifying Access/i)).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    retryButton.click();

    // Should show loading then success
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});
