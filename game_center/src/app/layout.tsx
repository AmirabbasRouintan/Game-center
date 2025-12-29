'use client';

import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import DarkVeil from "@/components/DarkVeil";
import LoadingScreen from "@/components/LoadingScreen";
import "./globals.css";
import { useEffect, useState } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [darkVeilEnabled, setDarkVeilEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('darkVeilEnabled');
    return saved !== null ? (JSON.parse(saved) as boolean) : true;
  });

  useEffect(() => {
    const handleToggle = (event: Event) => {
      const custom = event as CustomEvent<boolean>;
      setDarkVeilEnabled(!!custom.detail);
    };

    window.addEventListener('darkVeilToggle', handleToggle);
    return () => window.removeEventListener('darkVeilToggle', handleToggle);
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}
      >
        <LanguageProvider>
          <NotificationProvider>
            {/* Loading Screen */}
            <LoadingScreen />
          
          {/* Animated background */}
          {darkVeilEnabled && (
            <div className="fixed inset-0 -z-10">
              <DarkVeil speed={0.3} />
            </div>
          )}
          
          {/* Fallback background when Dark Veil is disabled */}
          {!darkVeilEnabled && (
            <div className="fixed inset-0 -z-10 bg-[oklch(0.1467_0.0041_49.3141)]"></div>
          )}
          
          {/* Site header */}
          <Header />
          {children}
          </NotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
