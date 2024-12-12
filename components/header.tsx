"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Fuel, FileLock2 } from 'lucide-react';

const Header: React.FC = () => {
  const [activeLink, setActiveLink] = useState<string>('/');

  return (
    <header className="fixed top-4 left-0 w-full text-white text-center py-1 z-50 backdrop-blur-md bg-opacity-30 flex justify-start items-center space-x-8">
      <div className="cursor-pointer ml-4" onClick={() => window.open('https://www.certaik.xyz', '_blank', 'noopener,noreferrer')}>
        <img src="/logo.svg" alt="Logo" className="h-16 w-auto" />
      </div>
      <nav className="flex space-x-16">
        <Link href="/" className={`flex items-center space-x-2 ${activeLink === '/' ? 'text-white font-bold' : 'text-white hover:underline'}`} onClick={() => setActiveLink('/')}>
          <FileLock2 className="text-white" />
          <span>Security Audit</span>
        </Link>
        <Link href="/gas-optimizer" className={`flex items-center space-x-2 ${activeLink === '/gas-optimizer' ? 'text-white font-bold' : 'text-white hover:underline'}`} onClick={() => setActiveLink('/gas-optimizer')}>
          <Fuel className="text-white" />
          <span>Gas Audit</span>
        </Link>
      </nav>
    </header>
  );
};

export default Header;
