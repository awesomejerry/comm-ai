import React from 'react';
import { useAuth } from './AuthProvider';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthenticatedRouterProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Wrap routes/components that require authentication.
 * Redirects to login if not authenticated, or shows loading fallback if loading.
 */
export const AuthenticatedRouter: React.FC<AuthenticatedRouterProps> = ({
  children,
  loadingFallback = <div>Loading...</div>,
  redirectTo = '/login',
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <>{loadingFallback}</>;
  if (!user) {
    const loginUrl = `${redirectTo}?redirectTo=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={loginUrl} replace />;
  }
  return <>{children}</>;
};
