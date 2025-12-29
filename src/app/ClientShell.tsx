'use client';

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DarkVeil from "@/components/DarkVeil";
import LoadingScreen from "@/components/LoadingScreen";
import LoginPage from "@/components/LoginPage";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const [darkVeilEnabled, setDarkVeilEnabled] = useState(true);
  const [darkVeilOpacity, setDarkVeilOpacity] = useState(0.7);
  const [darkVeilHueShift, setDarkVeilHueShift] = useState<number>(0);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('darkVeilEnabled');
    if (saved !== null) {
      setDarkVeilEnabled(JSON.parse(saved));
    }

    const savedOpacity = localStorage.getItem('darkVeilOpacity');
    if (savedOpacity !== null) {
      setDarkVeilOpacity(JSON.parse(savedOpacity));
    }

    const savedHueShift = localStorage.getItem('darkVeilHueShift');
    if (savedHueShift !== null) {
      setDarkVeilHueShift(parseFloat(savedHueShift));
    }

    // Load background image
    const savedBgImage = localStorage.getItem('backgroundImage');
    if (savedBgImage) {
      setBackgroundImage(savedBgImage);
    }

    // Listen for toggle events
    const handleToggle = (event: any) => {
      setDarkVeilEnabled(event.detail);
    };

    // Listen for opacity changes
    const handleOpacityChange = (event: any) => {
      setDarkVeilOpacity(event.detail);
    };

    // Listen for background image changes
    const handleBgImageChange = (event: any) => {
      setBackgroundImage(event.detail);
    };

    const handleHueShiftChange = (event: any) => {
      setDarkVeilHueShift(event.detail);
    };

    window.addEventListener('darkVeilToggle', handleToggle);
    window.addEventListener('darkVeilOpacityChange', handleOpacityChange);
    window.addEventListener('darkVeilHueShiftChange', handleHueShiftChange);
    window.addEventListener('backgroundImageChange', handleBgImageChange);
    return () => {
      window.removeEventListener('darkVeilToggle', handleToggle);
      window.removeEventListener('darkVeilOpacityChange', handleOpacityChange);
      window.removeEventListener('darkVeilHueShiftChange', handleHueShiftChange);
      window.removeEventListener('backgroundImageChange', handleBgImageChange);
    };
  }, []);

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen />

      {/* Custom background image */}
      {backgroundImage && (
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
      )}

      {/* Animated background (when no custom image) */}
      {!backgroundImage && darkVeilEnabled && (
        <div className="fixed inset-0 -z-10 bg-black">
          <DarkVeil speed={0.3} opacity={darkVeilOpacity} hueShift={darkVeilHueShift} />
        </div>
      )}

      {/* Fallback background when Dark Veil is disabled and no custom image */}
      {!backgroundImage && !darkVeilEnabled && (
        <div className="fixed inset-0 -z-10 bg-black"></div>
      )}

      {/* global site header */}
      <Header />
      {children}
    </>
  );
}

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}
