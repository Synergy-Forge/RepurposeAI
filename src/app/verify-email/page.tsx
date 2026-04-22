'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const hasTriggered = useRef(false);

  const mutation = trpc.user.verifyEmail.useMutation();

  useEffect(() => {
    if (!token || hasTriggered.current) return;
    hasTriggered.current = true;
    mutation.mutate({ token });
  }, [token, mutation]);

  const state: 'missing' | 'pending' | 'success' | 'error' = !token
    ? 'missing'
    : mutation.isSuccess
      ? 'success'
      : mutation.isError
        ? 'error'
        : 'pending';

  return (
    <div className="min-h-screen bg-black text-white flex justify-center items-center p-4">
      <div className="bg-gray-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 w-full max-w-md text-center shadow-2xl">
        {state === 'pending' && (
          <>
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verifying your email…</h1>
            <p className="text-gray-400">This only takes a moment.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className="text-3xl font-bold mb-3">Email verified</h1>
            <p className="text-gray-400 mb-8">
              Thanks — your email address is confirmed.
            </p>
            <Link
              href="/dashboard"
              className="inline-block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors duration-300"
            >
              Go to dashboard
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="text-3xl font-bold mb-3">Verification failed</h1>
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-left">
              <p className="text-red-200 text-sm font-medium">
                {mutation.error?.message ?? 'Something went wrong.'}
              </p>
            </div>
            <Link
              href="/login"
              className="text-purple-400 font-medium hover:text-purple-300 hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}

        {state === 'missing' && (
          <>
            <h1 className="text-3xl font-bold mb-3">Missing token</h1>
            <p className="text-gray-400 mb-6">
              Open the verification link from your email to continue.
            </p>
            <Link
              href="/login"
              className="text-purple-400 font-medium hover:text-purple-300 hover:underline"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex justify-center items-center p-4">
          <div className="bg-gray-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 w-full max-w-md text-center shadow-2xl">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading…</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
