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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Registration attempt:', formData);
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
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">
            Register
          </h1>
          <p className="text-gray-400 mb-8">
            It is quick and easy.
          </p>

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
                className="w-full py-3 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white font-['Space_Grotesk'] text-base transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
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
                className="w-full py-3 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white font-['Space_Grotesk'] text-base transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
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
                className="w-full py-3 px-4 bg-gray-800 border border-gray-600 rounded-lg text-white font-['Space_Grotesk'] text-base transition-all duration-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-4 border-none rounded-lg text-base font-bold cursor-pointer transition-all duration-300 text-center flex justify-center items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white mb-5 hover:opacity-90 hover:shadow-lg hover:shadow-purple-500/50"
            >
              Sign-up
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center text-center text-gray-500 my-6">
            <div className="flex-1 border-b border-gray-600"></div>
            <span className="px-2">ou</span>
            <div className="flex-1 border-b border-gray-600"></div>
          </div>

          <button
            onClick={handleGoogleRegister}
            className="w-full py-4 border border-gray-600 rounded-lg text-base font-bold cursor-pointer transition-all duration-300 text-center flex justify-center items-center gap-3 bg-gray-800 text-white hover:bg-gray-700"
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
            <Link href="/login" className="text-purple-500 no-underline transition-colors duration-300 hover:text-pink-500 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}