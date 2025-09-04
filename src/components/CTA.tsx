import React from 'react';
import Link from 'next/link';

const CTA: React.FC = () => (
  <section 
    className="min-h-screen bg-cover bg-center bg-fixed flex justify-center items-center relative text-center"
    style={{
      backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')"
    }}
  >
    <div className="absolute inset-0 bg-black/60 z-0"></div>
    
    <div className="relative z-10">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-8 px-5 text-shadow-lg">
        Ready to create something awesome?
      </h1>
      <Link 
        href="/register"
        className="inline-block bg-white text-black font-medium text-lg lg:text-xl px-8 py-4 rounded-lg transition-all duration-300 hover:bg-gray-200 no-underline"
      >
        Start Your Free Trial and Create Now
      </Link>
    </div>
  </section>
);

const Footer: React.FC = () => (
  <footer className="bg-black py-10 px-[5%] text-center border-t border-white/10">
    <p className="text-gray-400">
      &copy; 2025 Repurpose AI. All rights reserved.
    </p>
  </footer>
);

export { CTA, Footer };