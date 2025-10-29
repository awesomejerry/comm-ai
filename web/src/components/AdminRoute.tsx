/**
 * AdminRoute Component
 *
 * Route guard that ensures only authenticated admin users can access protected content.
 * Redirects non-admin users to unauthorized page.
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { checkIsAdmin } from '../services/adminRoleService';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const verifyAdminRole = async (email: string) => {
    setChecking(true);
    setError(null);

    try {
      const adminStatus = await checkIsAdmin(email);
      setIsAdmin(adminStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify admin role');
      setIsAdmin(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.email) {
      verifyAdminRole(user.email);
    }
  }, [user, authLoading]);

  const handleRetry = () => {
    if (user?.email) {
      verifyAdminRole(user.email);
    }
  };

  // Show loading state while auth is initializing or role is being checked
  if (authLoading || checking || (user && isAdmin === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show error state with retry button
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Error Verifying Access</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Redirect to unauthorized page if not admin
  if (isAdmin === false) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render protected content for admin users
  return <>{children}</>;
};
