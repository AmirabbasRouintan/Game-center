'use client';

import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [gameCenterName, setGameCenterName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('gameCenterName') ?? '';
  });

  useEffect(() => {

    // Listen for name changes
    const handleNameChange = (event: Event) => {
      const custom = event as CustomEvent<string | null | undefined>;
      const newName = custom.detail ?? window.localStorage.getItem('gameCenterName');
      if (newName) {
        setGameCenterName(newName);
      } else {
        setGameCenterName('');
      }
    };

    window.addEventListener('gameCenterNameChange', handleNameChange);
    return () => window.removeEventListener('gameCenterNameChange', handleNameChange);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[80%] z-50 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="bg-white/10 dark:bg-black/20 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-6 py-2.5">
          <Link href="/" className="flex items-center gap-3 transition-transform duration-300 hover:scale-105">
            <Image 
              src="/icon.png" 
              alt="Game Center Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-semibold text-white">{gameCenterName || t('nav.gameCenter')}</span>
          </Link>
          
          <div className="flex gap-6 items-center">
            <nav className="flex gap-6 items-center text-sm text-white">
              <Link href="/competitions" className="hover:underline transition-all duration-300 hover:text-primary">{t('nav.competitions')}</Link>
              <Link href="/settings" className="hover:underline transition-all duration-300 hover:text-primary">{t('nav.settings')}</Link>
            </nav>
            
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="text-white hover:text-white/80 transition-all duration-300 hover:scale-110"
              title={language === 'en' ? 'فارسی' : 'English'}
            >
              <Languages className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
