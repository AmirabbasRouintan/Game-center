'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fa';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navbar
    'nav.gameCenter': 'Game Center',
    'nav.competitions': 'Competitions',
    'nav.settings': 'Settings',
    
    // Home Page
    'home.title': 'Game Center',
    'home.subtitle': 'Discover, track, and play your favorite games in one place. Curate your library, see trending titles, and jump back into your recent sessions.',
    'home.joinCompetitions': 'Join Competitions',
    'home.addNewCard': 'Add new Card',
    'home.untitledGame': 'Untitled Game',
    'home.doubleClick': 'Double-click to edit',
    'home.start': 'Start',
    'home.stop': 'Stop',
    'home.editGameCard': 'Edit Game Card',
    'home.enterTitle': 'Enter the title for your game card.',
    'home.gameTitle': 'Enter game title',
    'home.cancel': 'Cancel',
    'home.save': 'Save',
    
    // Competitions Page
    'comp.title': 'Competitions',
    'comp.subtitle': 'Create tournaments and compete with players',
    'comp.newTournament': 'New Tournament',
    'comp.createNew': 'Create New Tournament',
    'comp.tournamentName': 'Tournament Name',
    'comp.enterTournamentName': 'Enter tournament name',
    'comp.addPlayers': 'Add Players',
    'comp.enterPlayerName': 'Enter player name',
    'comp.players': 'Players',
    'comp.shuffle': 'Shuffle',
    'comp.createBracket': 'Create Tournament Bracket',
    'comp.minPlayers': 'Add at least 2 players to create a tournament',
    'comp.final': 'Final',
    'comp.semiFinals': 'Semi-Finals',
    'comp.quarterFinals': 'Quarter-Finals',
    'comp.round': 'Round',
    'comp.vs': 'vs',
    'comp.tbd': 'TBD',
    'comp.champion': '🏆 Champion 🏆',
    
    // Settings Page
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your preferences and data',
    'settings.bgAnimation': 'Background Animation',
    'settings.bgDesc': 'Toggle the Dark Veil animated background effect',
    'settings.darkVeil': 'Dark Veil Animation',
    'settings.on': 'On',
    'settings.off': 'Off',
    'settings.dataManagement': 'Data Management',
    'settings.dataDesc': 'Export, import, or clear your game center data',
    'settings.exportFormat': 'Export Format',
    'settings.exportData': 'Export Data',
    'settings.exportDesc': 'Download your game cards, tournaments, and settings',
    'settings.importData': 'Import Data',
    'settings.importDesc': 'Restore your data from a previously exported JSON file',
    'settings.clearData': 'Clear All Data',
    'settings.clearWarning': '⚠️ This will permanently delete all your data',
    'settings.display': 'Display',
    'settings.displayDesc': 'Theme and appearance options',
    'settings.theme': 'Theme',
    'settings.system': 'System',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.about': 'About',
    'settings.version': 'Game Center Version 1.0.0',
    'settings.builtWith': 'Built with Next.js and Tailwind CSS',
    'settings.copyright': '© 2025 Game Center. All rights reserved.',
    'settings.language': 'Language',
  },
  fa: {
    // Navbar
    'nav.gameCenter': 'مرکز بازی',
    'nav.competitions': 'مسابقات',
    'nav.settings': 'تنظیمات',
    
    // Home Page
    'home.title': 'مرکز بازی',
    'home.subtitle': 'بازی‌های مورد علاقه خود را کشف، پیگیری و بازی کنید. کتابخانه خود را مدیریت کنید، عناوین پرطرفدار را ببینید و به جلسات اخیر خود بازگردید.',
    'home.joinCompetitions': 'شرکت در مسابقات',
    'home.addNewCard': 'افزودن کارت جدید',
    'home.untitledGame': 'بازی بدون عنوان',
    'home.doubleClick': 'دوبار کلیک کنید برای ویرایش',
    'home.start': 'شروع',
    'home.stop': 'توقف',
    'home.editGameCard': 'ویرایش کارت بازی',
    'home.enterTitle': 'عنوان کارت بازی خود را وارد کنید.',
    'home.gameTitle': 'عنوان بازی را وارد کنید',
    'home.cancel': 'لغو',
    'home.save': 'ذخیره',
    
    // Competitions Page
    'comp.title': 'مسابقات',
    'comp.subtitle': 'تورنمنت ایجاد کنید و با بازیکنان رقابت کنید',
    'comp.newTournament': 'تورنمنت جدید',
    'comp.createNew': 'ایجاد تورنمنت جدید',
    'comp.tournamentName': 'نام تورنمنت',
    'comp.enterTournamentName': 'نام تورنمنت را وارد کنید',
    'comp.addPlayers': 'افزودن بازیکنان',
    'comp.enterPlayerName': 'نام بازیکن را وارد کنید',
    'comp.players': 'بازیکنان',
    'comp.shuffle': 'مخلوط کردن',
    'comp.createBracket': 'ایجاد جدول تورنمنت',
    'comp.minPlayers': 'حداقل 2 بازیکن برای ایجاد تورنمنت اضافه کنید',
    'comp.final': 'فینال',
    'comp.semiFinals': 'نیمه‌نهایی',
    'comp.quarterFinals': 'یک چهارم نهایی',
    'comp.round': 'دور',
    'comp.vs': 'در مقابل',
    'comp.tbd': 'تعیین نشده',
    'comp.champion': '🏆 قهرمان 🏆',
    
    // Settings Page
    'settings.title': 'تنظیمات',
    'settings.subtitle': 'مدیریت تنظیمات و داده‌های خود',
    'settings.bgAnimation': 'انیمیشن پس‌زمینه',
    'settings.bgDesc': 'فعال یا غیرفعال کردن افکت انیمیشن پس‌زمینه',
    'settings.darkVeil': 'انیمیشن  پس‌زمینه',
    'settings.on': 'روشن',
    'settings.off': 'خاموش',
    'settings.dataManagement': 'مدیریت داده‌ها',
    'settings.dataDesc': 'خروجی، ورودی یا پاک کردن داده‌های مرکز بازی',
    'settings.exportFormat': 'فرمت خروجی',
    'settings.exportData': 'خروجی گرفتن از داده‌ها',
    'settings.exportDesc': 'دانلود کارت‌های بازی، تورنمنت‌ها و تنظیمات',
    'settings.importData': 'وارد کردن داده‌ها',
    'settings.importDesc': 'بازیابی داده‌ها از فایل JSON قبلی',
    'settings.clearData': 'پاک کردن تمام داده‌ها',
    'settings.clearWarning': '⚠️ این عملیات تمام داده‌های شما را برای همیشه حذف می‌کند',
    'settings.display': 'نمایش',
    'settings.displayDesc': 'تنظیمات تم و ظاهر',
    'settings.theme': 'تم',
    'settings.system': 'سیستم',
    'settings.light': 'روشن',
    'settings.dark': 'تاریک',
    'settings.about': 'درباره',
    'settings.version': 'مرکز بازی نسخه 1.0.0',
    'settings.builtWith': 'ساخته شده با Next.js و Tailwind CSS',
    'settings.copyright': '© 2025 مرکز بازی. تمام حقوق محفوظ است.',
    'settings.language': 'زبان',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'fa')) {
      setLanguageState(saved);
      document.documentElement.dir = saved === 'fa' ? 'rtl' : 'ltr';
      document.documentElement.lang = saved;
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
