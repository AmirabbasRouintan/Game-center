'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { settingsStore } from '@/data/settingsStore';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isFirstTime: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isFirstTime, setIsFirstTime] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      try {
        // Check session (client-side only)
        const sessionToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('authToken') : null;
        if (sessionToken === 'authenticated') {
          setIsAuthenticated(true);
        }

        // Check if admin is set up
        const settings = await settingsStore.load();
        const hasUser = !!settings.adminUsername;
        const hasPass = !!settings.adminPassword;
        setIsFirstTime(!hasUser || !hasPass);
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const settings = await settingsStore.load();
      const savedUsername = settings.adminUsername;
      const savedPasswordHash = settings.adminPassword;

      // If first time, save credentials and authenticate
      if (isFirstTime) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        
        await settingsStore.savePartial({
          adminUsername: username,
          adminPassword: hash
        });
        
        sessionStorage.setItem('authToken', 'authenticated');
        setIsFirstTime(false);
        setIsAuthenticated(true);
        return true;
      }
      
      // Verify credentials
      if (username === savedUsername && savedPasswordHash) {
        const isPasswordValid = bcrypt.compareSync(password, savedPasswordHash);
        if (isPasswordValid) {
          sessionStorage.setItem('authToken', 'authenticated');
          setIsAuthenticated(true);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null; // Or return a simple loading spinner here if preferred
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isFirstTime, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}