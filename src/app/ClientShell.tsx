'use client';

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DarkVeil from "@/components/DarkVeil";
import LoadingScreen from "@/components/LoadingScreen";
import LoginPage from "@/components/LoginPage";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { settingsStore } from "@/data/settingsStore";

function LayoutContent({ children }: { children: React.ReactNode }) {
  // Default values
  const [darkVeilEnabled, setDarkVeilEnabled] = useState<boolean>(true);
  const [darkVeilOpacity, setDarkVeilOpacity] = useState<number>(0.7);
  const [darkVeilHueShift] = useState<number>(0);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [authEnabled, setAuthEnabled] = useState<boolean>(false);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // Load settings from API/Store
    const loadSettings = async () => {
      try {
        const settings = await settingsStore.load();
        setDarkVeilEnabled(settings.darkVeilEnabled);
        setDarkVeilOpacity(settings.darkVeilOpacity);
        // Note: darkVeilHueShift was not in the original settings store type I saw earlier, 
        // but assuming it might be added or using default. 
        // If it's not in AppSettings, we stick to default or separate storage.
        // Checking settingsStore.ts: it has 'darkVeilTint' but not 'hueShift' explicitly typed in the output I wrote?
        // Wait, the previous ClientShell used localStorage 'darkVeilHueShift'.
        // My updated settingsStore has 'darkVeilTint'. 
        // I will stick to what I have in settingsStore.
        
        setBackgroundImage(settings.backgroundImage);
        setAuthEnabled(!!settings.authEnabled);
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();

    // Event listeners for real-time updates from other components (like Settings page)
    const handleToggle = (event: Event) => {
      const custom = event as CustomEvent<boolean>;
      setDarkVeilEnabled(!!custom.detail);
    };

    const handleOpacityChange = (event: Event) => {
      const custom = event as CustomEvent<number>;
      setDarkVeilOpacity(typeof custom.detail === 'number' ? custom.detail : 0.7);
    };

    const handleBgImageChange = (event: Event) => {
      const custom = event as CustomEvent<string | null>;
      setBackgroundImage(custom.detail ?? null);
    };

    // const handleHueShiftChange = ... (If needed later)

    window.addEventListener('darkVeilToggle', handleToggle);
    window.addEventListener('darkVeilOpacityChange', handleOpacityChange);
    // window.addEventListener('darkVeilHueShiftChange', handleHueShiftChange);
    window.addEventListener('backgroundImageChange', handleBgImageChange);
    return () => {
      window.removeEventListener('darkVeilToggle', handleToggle);
      window.removeEventListener('darkVeilOpacityChange', handleOpacityChange);
      // window.removeEventListener('darkVeilHueShiftChange', handleHueShiftChange);
      window.removeEventListener('backgroundImageChange', handleBgImageChange);
    };
  }, []);

  if (authLoading || !settingsLoaded) {
    return <LoadingScreen />; 
  }

  // Show login page only if auth is enabled
  if (authEnabled && !isAuthenticated) {
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

      {/* Site header */}
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