// src/components/LoginForm.tsx
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { requestMagicLink } from '../services/authService';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Simple client-side rate limiting for testing
    if (requestCount >= 3) {
      setError('Too many requests');
      setLoading(false);
      return;
    }

    setRequestCount((prev) => prev + 1);
    const result = await requestMagicLink(email, redirectTo);
    setLoading(false);
    if (result.success) {
      setMessage(
        "Check your email for the login link. If you don't see it, check your spam folder or try again."
      );
    } else if (result.rateLimited) {
      setError('Too many requests');
    } else {
      setMessage(
        "Check your email for the login link. If you don't see it, check your spam folder or try again."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-10">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="w-full px-4 py-2 border rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Magic Link'}
      </button>
      {message && <div className="text-green-600">{message}</div>}
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
};
