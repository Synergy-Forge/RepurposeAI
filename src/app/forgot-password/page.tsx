'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = trpc.user.requestPasswordReset.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center p-4">
      <div className="bg-gray-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 w-full max-w-md text-center shadow-2xl">
        {submitted ? (
          <>
            <h1 className="text-3xl font-bold mb-3">Check your email</h1>
            <p className="text-gray-400 mb-8">
              If an account exists for <strong className="text-white">{email}</strong>,
              you&apos;ll receive a password reset link shortly. The link expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="text-purple-400 font-medium hover:text-purple-300 hover:underline"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-3">Forgot password?</h1>
            <p className="text-gray-400 mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {mutation.error && (
              <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-left">
                <p className="text-red-200 text-sm font-medium">
                  {mutation.error.message}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors duration-300"
              >
                {mutation.isPending ? 'Sending…' : 'Send reset link'}
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
          </>
        )}
      </div>
    </div>
  );
}
