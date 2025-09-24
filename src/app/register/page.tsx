'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from "next-auth/react";

interface FormData {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  // Password validator
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long.";
    }
    if (!hasUpper) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!hasLower) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!hasNumber) {
      return "Password must contain at least one number.";
    }
    if (!hasSpecial) {
      return "Password must contain at least one special character.";
    }

    return null; // valid
  };

  // Strength meter (Weak, Medium, Strong)
  const checkPasswordStrength = (password: string): string => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return "Weak";
    if (score === 3 || score === 4) return "Medium";
    if (score === 5) return "Strong";
    return "Weak";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check before sending
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', password: '' });
        setPasswordStrength(null);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    console.log('Google registration attempt');
    signIn("google");
  };

  return (
    <div className="font-['Space_Grotesk'] min-h-screen bg-black text-white overflow-y-auto">
      {/* Background */}
      <div 
        className="fixed top-0 left-0 w-full h-screen bg-cover bg-center -z-20"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')"
        }}
      />
      <div className="fixed top-0 left-0 w-full h-full bg-black/75 -z-10" />

      {/* Main Content */}
      <div className="flex justify-center items-center min-h-screen py-10 px-5">
        <div className="bg-gray-900/85 backdrop-blur-md border border-white/10 rounded-2xl p-10 w-full max-w-md text-center shadow-2xl">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">Register</h1>
          <p className="text-gray-400 mb-8">It is quick and easy.</p>

          {/* Success */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-500/50 rounded-lg text-left">
              <p className="text-green-200 text-sm font-medium">
                Account created successfully! A confirmation email should arrive soon.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-left">
              <p className="text-red-200 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5 text-left">
              <label htmlFor="name" className="block mb-2 text-gray-300 font-medium">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full py-3 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base transition-all focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div className="mb-5 text-left">
              <label htmlFor="email" className="block mb-2 text-gray-300 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full py-3 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base transition-all focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div className="mb-6 text-left">
              <label htmlFor="password" className="block mb-2 text-gray-300 font-medium">
                Create a Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full py-3 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white text-base transition-all focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
              />
              {/* Password Strength */}
              {passwordStrength && (
                <p className={`mt-2 text-sm font-medium
                  ${passwordStrength === "Weak" ? "text-red-400" : ""}
                  ${passwordStrength === "Medium" ? "text-yellow-400" : ""}
                  ${passwordStrength === "Strong" ? "text-green-400" : ""}
                `}>
                  Password strength: {passwordStrength}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg text-base font-bold flex justify-center items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-5 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                'Sign-up'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center text-gray-500 my-6">
            <div className="flex-1 border-b border-gray-600"></div>
            <span className="px-2">or</span>
            <div className="flex-1 border-b border-gray-600"></div>
          </div>

          <button
            onClick={handleGoogleRegister}
            className="w-full py-4 border border-gray-600 rounded-lg text-base font-bold flex justify-center items-center gap-3 bg-gray-800 text-white hover:bg-gray-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.901,35.637,44,28.718,44,20C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            Sign-up with Google
          </button>

          <div className="mt-5 text-sm">
            <span className="text-gray-400">Already have an account? </span>
            <Link href="/login" className="text-purple-500 hover:text-pink-500 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
