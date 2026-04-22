'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = trpc.user.resetPassword.useMutation({
    onSuccess: () => router.push('/login?reset=1'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirm) {
      setValidationError('Passwords do not match');
      return;
    }

    if (!token) {
      setValidationError('Missing reset token — please use the link from your email');
      return;
    }

    mutation.mutate({ token, password });
  };

  const errorMessage = validationError ?? mutation.error?.message;

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center p-4">
      <div className="bg-gray-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 w-full max-w-md text-center shadow-2xl">
        <h1 className="text-3xl font-bold mb-3">Set new password</h1>
        <p className="text-gray-400 mb-8">Choose a new password for your account.</p>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-left">
            <p className="text-red-200 text-sm font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              placeholder="New password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors duration-300"
          >
            {mutation.isPending ? 'Saving…' : 'Reset password'}
          </button>
        </form>

        <div className="mt-6 text-sm">
          <Link
            href="/login"
            className="text-purple-400 font-medium hover:text-purple-300 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex justify-center items-center p-4">
          <div className="bg-gray-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 w-full max-w-md text-center shadow-2xl">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading…</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
