/**
 * Unauthorized Access Page
 *
 * Displayed when a user attempts to access admin-only content without proper permissions.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-md p-8">
        <div className="text-red-600 mb-6">
          <svg className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>

        <p className="text-gray-600 mb-2">You do not have permission to access this page.</p>

        {user && (
          <p className="text-sm text-gray-500 mb-6">
            Signed in as: <span className="font-medium">{user.email}</span>
          </p>
        )}

        <p className="text-gray-600 mb-8">
          This area is restricted to administrators only. If you believe this is an error, please
          contact your system administrator.
        </p>

        <div className="space-x-4">
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
