'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock, User } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const { login, isFirstTime } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError(t('login.fillBoth') || 'Please fill both fields');
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const success = await login(username, password);
      if (!success) {
        setError(t('login.invalidCredentials') || 'Invalid credentials');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[oklch(0.1467_0.0041_49.3141)]">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 animate-pulse"></div>
      </div>
      
      <div className="w-full max-w-md px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8">
          {/* Logo and Title */}
          <div className="flex flex-col items-center mb-8">
            <Image 
              src="/icon.png" 
              alt="Game Center Logo" 
              width={64} 
              height={64}
              className="rounded-lg mb-4"
            />
            <h1 className="text-2xl font-bold text-white mb-2">
              {isFirstTime ? t('login.welcome') : t('login.welcomeBack')}
            </h1>
            <p className="text-zinc-400 text-sm text-center">
              {isFirstTime ? t('login.setupAccount') : t('login.signInToContinue')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t('login.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                  placeholder={t('login.usernamePlaceholder')}
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                  placeholder={t('login.passwordPlaceholder')}
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold transition-all duration-300 hover:scale-105"
              size="lg"
              disabled={isLoggingIn}
            >
              {isLoggingIn 
                ? (t('common.loading') || 'Loading...') 
                : (isFirstTime ? t('login.createAccount') : t('login.signIn'))
              }
            </Button>
          </form>

          {/* Info Message for First Time */}
          {isFirstTime && (
            <div className="mt-6 bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-blue-200 text-xs">
              {t('login.firstTimeInfo')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}