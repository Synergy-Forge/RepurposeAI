'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 w-full px-[5%] py-5 flex justify-between items-center z-50 bg-black/30 backdrop-blur-md border-b border-white/10 transition-all duration-300">
      <Link href="/" className="flex items-center text-white text-xl lg:text-2xl font-bold no-underline">
        <Play className="mr-2 w-6 h-6 lg:w-8 lg:h-8" />
        <span className="hidden sm:inline">Repurpose</span>
      </Link>
      
      <nav className={`${isMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row absolute lg:relative top-20 lg:top-0 left-0 lg:left-auto w-full lg:w-auto bg-black/90 lg:bg-transparent p-5 lg:p-0`}>
        <Link href="#features" className="text-gray-300 hover:text-white transition-colors duration-300 mb-2 lg:mb-0 lg:ml-8 text-center lg:text-left">
          Recursos
        </Link>
        <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors duration-300 mb-2 lg:mb-0 lg:ml-8 text-center lg:text-left">
          Como Funciona
        </Link>
        <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors duration-300 mb-2 lg:mb-0 lg:ml-8 text-center lg:text-left">
          Preços
        </Link>
      </nav>
      
      <div className="hidden lg:flex items-center">
        <Link href="/login" className="text-white no-underline ml-5 px-5 py-2 rounded-lg transition-all duration-300">
          Entrar
        </Link>
        <Link href="/register" className="bg-white text-black font-medium no-underline ml-5 px-5 py-2 rounded-lg transition-all duration-300 hover:bg-gray-200">
          Cadastrar
        </Link>
      </div>
      
      <button 
        className="lg:hidden cursor-pointer"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  );
};

export default Header;