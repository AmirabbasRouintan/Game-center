'use client';

import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [gameCenterName, setGameCenterName] = useState('');

  useEffect(() => {
    // Load custom game center name from localStorage
    const savedName = localStorage.getItem('gameCenterName');
    if (savedName) {
      setGameCenterName(savedName);
    }

    // Listen for name changes
    const handleNameChange = (event: any) => {
      const newName = event.detail || localStorage.getItem('gameCenterName');
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
          <a href="/" className="flex items-center gap-3 transition-transform duration-300 hover:scale-105">
            <Image 
              src="/icon.png" 
              alt="Game Center Logo" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-semibold text-white">{gameCenterName || t('nav.gameCenter')}</span>
          </a>
          
          <div className="flex gap-6 items-center">
            <nav className="flex gap-6 items-center text-sm text-white">
              <a href="/competitions" className="hover:underline transition-all duration-300 hover:text-primary">{t('nav.competitions')}</a>
              <a href="/settings" className="hover:underline transition-all duration-300 hover:text-primary">{t('nav.settings')}</a>
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
