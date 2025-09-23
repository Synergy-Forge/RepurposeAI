"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export function Navigation() {
  const { status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full px-[5%] py-5 flex justify-between items-center z-50 bg-black/30 backdrop-blur-lg border-b border-white/10 transition-colors duration-300">
      <Link href="#home" className="text-2xl font-bold text-white flex items-center no-underline">
        <svg className="w-8 h-8 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
        Repurpose
      </Link>

      <nav className={`transition-all duration-300 ${
        isMenuOpen
          ? "flex flex-col absolute top-full left-0 w-full bg-black/95 p-5 gap-4 md:relative md:flex-row md:bg-transparent md:p-0"
          : "hidden md:flex md:items-center"
      }`}>
        <Link href="#features" className="ml-0 md:ml-8 text-gray-300 hover:text-white transition-colors">
          Features
        </Link>
        <Link href="#how it works" className="text-gray-300 hover:text-white transition-colors">
          How It Works
        </Link>
        <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
          Pricing
        </Link>
      </nav>

      <div className={`transition-all duration-300 ${
        isMenuOpen
          ? "flex flex-col gap-4 absolute top-[calc(100%+200px)] left-0 w-full bg-black/95 p-5 md:relative md:flex-row md:bg-transparent md:p-0 md:top-0"
          : "hidden md:flex md:items-center"
      }`}>
        {status === "authenticated" ? (
          <>
            <Link href="/dashboard" className="px-5 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition-colors">
              Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="px-5 py-2 text-white hover:text-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => signIn()}
              className="px-5 py-2 text-white hover:text-gray-300 transition-colors"
            >
              Sign In
            </button>
            <Link href="/register" className="px-5 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition-colors">
              Sign Up
            </Link>
          </>
        )}
      </div>

      <button
        className="block md:hidden"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </header>
  );
}

export default Navigation;
