'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isFirstTime: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if credentials exist
    const savedUsername = localStorage.getItem('adminUsername');
    const savedPasswordHash = localStorage.getItem('adminPasswordHash');
    const authToken = sessionStorage.getItem('authToken');
    
    // If no credentials set, it's first time
    if (!savedUsername || !savedPasswordHash) {
      setIsFirstTime(true);
      setIsLoading(false);
      return;
    }
    
    setIsFirstTime(false);
    
    // Check if already authenticated in this session
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    const savedUsername = localStorage.getItem('adminUsername');
    const savedPasswordHash = localStorage.getItem('adminPasswordHash');
    
    // If first time, save credentials and authenticate
    if (isFirstTime) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      
      localStorage.setItem('adminUsername', username);
      localStorage.setItem('adminPasswordHash', hash);
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
  };

  const logout = () => {
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isFirstTime }}>
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
