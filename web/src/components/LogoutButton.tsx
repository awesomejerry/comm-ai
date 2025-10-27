import React from 'react';
import { useAuth } from './AuthProvider';

const LogoutButton: React.FC = () => {
  const { logout, user } = useAuth();
  if (!user) return null;
  return (
    <button onClick={logout} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm">
      Log out
    </button>
  );
};

export default LogoutButton;
