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
    'home.addNewCard': 'Add New Client',
    'client.firstName': 'First Name',
    'client.lastName': 'Last Name',
    'client.phone': 'Phone Number',
    'client.generateCode': 'Generate Code',
    'client.code': 'Client Code',
    'client.codeInstructions': 'Give this code to the user to check their stats.',
    'client.saveAndStart': 'Save & Start Session',
    'home.untitledGame': 'Untitled Game',
    'home.doubleClick': 'Double-click to edit',
    'home.start': 'Start',
    'home.stop': 'Stop',
    'home.editGameCard': 'Edit Game Card',
    'home.enterTitle': 'Enter the title for your game card.',
    'home.gameTitle': 'Enter game title',
    'home.cancel': 'Cancel',
    'home.save': 'Save',
    'home.searchPlaceholder': 'Enter client code...',
    'home.search': 'Search',
    'home.clientNotFound': 'Client not found!',
    
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
    'comp.tournaments': 'Tournament History',
    'comp.noTournaments': 'No tournaments yet. Create your first tournament!',
    'comp.entryPrice': 'Entry Price',
    'comp.enterEntryPrice': 'Enter entry price (optional)',
    'comp.winner': 'Winner',
    'comp.inProgress': 'In Progress',
    'comp.tournamentCreated': 'Tournament Created',
    'comp.tournamentDeleted': 'Tournament Deleted',
    
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
    'settings.displayDesc': 'Customize appearance and background',
    'settings.backgroundImage': 'Background Image',
    'settings.dragDropImage': 'Drag and drop image here',
    'settings.orClickUpload': 'or click to upload',
    'settings.importJson': 'Import JSON',
    'settings.exportJson': 'Export JSON',
    'settings.importExcel': 'Import Excel',
    'settings.exportExcel': 'Export Excel',
    'settings.about': 'About',
    'settings.version': 'Game Center Version 1.0.0',
    'settings.builtWith': 'Built with Next.js and Tailwind CSS',
    'settings.copyright': '© 2025 Game Center. All rights reserved.',
    'settings.language': 'Language',
    'settings.costPerHour': 'Cost Per Hour (Toman)',
    'settings.costPerHourDesc': 'Set the hourly rate for game center usage in Toman',
    'settings.enterCost': 'Enter cost in Toman (e.g., 10)',
    'settings.adminSettings': 'Admin Settings',
    'settings.adminDesc': 'Manage administrator credentials and game center name',
    'settings.username': 'Username',
    'settings.password': 'Password',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.changeCredentials': 'Change Credentials',
    'settings.credentialsUpdated': 'Credentials updated successfully!',
    'settings.gameCenterName': 'Game Center Name',
    'settings.enterGameCenterName': 'Enter custom name',
    'settings.updateName': 'Update Name',
    'settings.nameUpdated': 'Name updated successfully!',
    'settings.clearDataConfirm': 'Are you sure you want to clear all data?',
    'settings.clearDataDesc': 'This action cannot be undone. All game cards, tournaments, and settings will be permanently deleted.',
    'settings.confirmDelete': 'Yes, Delete Everything',
    'settings.cancelDelete': 'Cancel',
    
    // Login Page
    'login.welcome': 'Welcome to Game Center',
    'login.welcomeBack': 'Welcome Back',
    'login.setupAccount': 'Set up your admin account to get started',
    'login.signInToContinue': 'Sign in to continue to Game Center',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.usernamePlaceholder': 'Enter username',
    'login.passwordPlaceholder': 'Enter password',
    'login.createAccount': 'Create Account',
    'login.signIn': 'Sign In',
    'login.fillBoth': 'Please fill in both username and password',
    'login.invalidCredentials': 'Invalid username or password',
    'login.firstTimeInfo': 'This will be your admin account. Remember these credentials!',
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
    'home.addNewCard': 'افزودن مشتری جدید',
    'client.firstName': 'نام',
    'client.lastName': 'نام خانوادگی',
    'client.phone': 'شماره تلفن',
    'client.generateCode': 'تولید کد',
    'client.code': 'کد مشتری',
    'client.codeInstructions': 'این کد را به مشتری بدهید تا آمار خود را مشاهده کند.',
    'client.saveAndStart': 'ذخیره و شروع نشست',
    'home.untitledGame': 'بازی بدون عنوان',
    'home.doubleClick': 'دوبار کلیک کنید برای ویرایش',
    'home.start': 'شروع',
    'home.stop': 'توقف',
    'home.editGameCard': 'ویرایش کارت بازی',
    'home.enterTitle': 'عنوان کارت بازی خود را وارد کنید.',
    'home.gameTitle': 'عنوان بازی را وارد کنید',
    'home.cancel': 'لغو',
    'home.save': 'ذخیره',
    'home.searchPlaceholder': 'کد مشتری را وارد کنید...',
    'home.search': 'جستجو',
    'home.clientNotFound': 'مشتری پیدا نشد!',
    
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
    'comp.tournaments': 'تاریخچه تورنمنت‌ها',
    'comp.noTournaments': 'هنوز تورنمنتی وجود ندارد. اولین تورنمنت خود را ایجاد کنید!',
    'comp.entryPrice': 'هزینه ورودی',
    'comp.enterEntryPrice': 'هزینه ورودی را وارد کنید (اختیاری)',
    'comp.winner': 'برنده',
    'comp.inProgress': 'در حال انجام',
    'comp.tournamentCreated': 'تورنمنت ایجاد شد',
    'comp.tournamentDeleted': 'تورنمنت حذف شد',
    
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
    'settings.displayDesc': 'سفارشی‌سازی ظاهر و پس‌زمینه',
    'settings.backgroundImage': 'تصویر پس‌زمینه',
    'settings.dragDropImage': 'تصویر را اینجا رها کنید',
    'settings.orClickUpload': 'یا کلیک کنید برای آپلود',
    'settings.importJson': 'وارد کردن JSON',
    'settings.exportJson': 'خروجی JSON',
    'settings.importExcel': 'وارد کردن Excel',
    'settings.exportExcel': 'خروجی Excel',
    'settings.about': 'درباره',
    'settings.version': 'مرکز بازی نسخه 1.0.0',
    'settings.builtWith': 'ساخته شده با Next.js و Tailwind CSS',
    'settings.copyright': '© 2025 مرکز بازی. تمام حقوق محفوظ است.',
    'settings.language': 'زبان',
    'settings.costPerHour': 'هزینه هر ساعت (تومان)',
    'settings.costPerHourDesc': 'تعیین نرخ ساعتی برای استفاده از مرکز بازی به تومان',
    'settings.enterCost': 'هزینه را به تومان وارد کنید (مثلا 10)',
    'settings.adminSettings': 'تنظیمات مدیر',
    'settings.adminDesc': 'مدیریت اعتبارنامه مدیر و نام مرکز بازی',
    'settings.username': 'نام کاربری',
    'settings.password': 'رمز عبور',
    'settings.currentPassword': 'رمز عبور فعلی',
    'settings.newPassword': 'رمز عبور جدید',
    'settings.changeCredentials': 'تغییر اعتبارنامه',
    'settings.credentialsUpdated': 'اعتبارنامه با موفقیت به‌روزرسانی شد!',
    'settings.gameCenterName': 'نام مرکز بازی',
    'settings.enterGameCenterName': 'نام سفارشی را وارد کنید',
    'settings.updateName': 'به‌روزرسانی نام',
    'settings.nameUpdated': 'نام با موفقیت به‌روزرسانی شد!',
    'settings.clearDataConfirm': 'آیا مطمئن هستید که می‌خواهید تمام داده‌ها را پاک کنید؟',
    'settings.clearDataDesc': 'این عملیات قابل بازگشت نیست. تمام کارت‌های بازی، تورنمنت‌ها و تنظیمات برای همیشه حذف خواهند شد.',
    'settings.confirmDelete': 'بله، همه چیز را حذف کن',
    'settings.cancelDelete': 'لغو',
    
    // Login Page
    'login.welcome': 'به مرکز بازی خوش آمدید',
    'login.welcomeBack': 'خوش برگشتید',
    'login.setupAccount': 'حساب مدیر خود را برای شروع تنظیم کنید',
    'login.signInToContinue': 'برای ادامه به مرکز بازی وارد شوید',
    'login.username': 'نام کاربری',
    'login.password': 'رمز عبور',
    'login.usernamePlaceholder': 'نام کاربری را وارد کنید',
    'login.passwordPlaceholder': 'رمز عبور را وارد کنید',
    'login.createAccount': 'ایجاد حساب',
    'login.signIn': 'ورود',
    'login.fillBoth': 'لطفا نام کاربری و رمز عبور را پر کنید',
    'login.invalidCredentials': 'نام کاربری یا رمز عبور نامعتبر است',
    'login.firstTimeInfo': 'این حساب مدیر شما خواهد بود. این اطلاعات را به خاطر بسپارید!',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'fa';
    const saved = window.localStorage.getItem('language') as Language;
    return saved && (saved === 'en' || saved === 'fa') ? saved : 'fa';
  });

  useEffect(() => {
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

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
