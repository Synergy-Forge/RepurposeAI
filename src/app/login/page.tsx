'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from "next-auth/react";
import { useSearchParams } from 'next/navigation';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback: 'Error during authentication with your provider. Please try again.',
  OAuthSignin: 'Error trying to sign in with your provider.',
  OAuthAccountNotLinked: 'This email is already associated with another provider. Please sign in using the original method.',
  EmailSignin: 'Failed to send sign-in email.',
  CredentialsSignin: 'Sign in failed. Check the details you provided.',
  Default: 'An unexpected error occurred during authentication.'
};

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  // Effect to read and display any authentication errors from the URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(AUTH_ERROR_MESSAGES[errorParam] || AUTH_ERROR_MESSAGES.Default);
    }
  }, [searchParams]);

  // Simplified Google Login handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    // Let NextAuth handle the entire redirect flow.
    await signIn('google');
  };

  const dismissError = () => setError(null);

  return (
    // Main container with dark theme
    <div className="min-h-screen bg-black text-white flex justify-center items-center p-4">
      
      {/* Central login card with the dark, modern style */}
      <div className="bg-gray-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-8 sm:p-10 w-full max-w-md text-center shadow-2xl">
        <h1 className="text-3xl lg:text-4xl font-bold mb-3">
          Welcome Back
        </h1>
        <p className="text-gray-400 mb-8">
          Sign in to continue to your dashboard.
        </p>

        {/* Error Message Component */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-left">
            <p className="text-red-200 text-sm font-medium">{error}</p>
            <button
              onClick={dismissError}
              className="mt-2 text-xs text-red-300/70 hover:text-red-200 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Sign-in with Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 border border-gray-600 rounded-lg text-base font-bold cursor-pointer transition-all duration-300 text-center flex justify-center items-center gap-3 bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Signing in...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,35.637,44,28.718,44,20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {/* Link to the register page */}
        <div className="mt-6 text-sm">
          <span className="text-gray-400">Don&apos;t have an account? </span>
          <Link href="/register" className="text-purple-400 font-medium no-underline transition-colors duration-300 hover:text-purple-300 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

