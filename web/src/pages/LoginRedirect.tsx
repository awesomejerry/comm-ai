// src/pages/LoginRedirect.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getSession } from '../services/authService';

export const LoginRedirect: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    // If there's an error parameter or invalid token, show error immediately
    if (error || (token && token === 'invalid')) {
      setStatus('error');
      return;
    }

    (async () => {
      const { data } = await getSession();
      if (data?.session) {
        setStatus('success');
        setTimeout(() => navigate(redirectTo, { replace: true }), 1000);
      } else {
        setStatus('error');
      }
    })();
  }, [navigate, redirectTo, token, error]);

  if (status === 'checking') return <div>Checking login...</div>;
  if (status === 'success') return <div>Welcome! Redirecting...</div>;
  return <div>Invalid or expired link</div>;
};
