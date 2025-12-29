'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);




  useEffect(() => {
    if (!enabled) return;

    // duration can be 0 (close immediately)
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, Math.max(0, durationMs));

    return () => window.clearTimeout(timer);
  }, [enabled, durationMs]);

  if (!enabled || !isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[oklch(0.1467_0.0041_49.3141)] animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6">
        {/* Rotating Logo */}
        <div className="animate-spin">
          <Image 
            src="/icon.png" 
            alt="Loading" 
            width={120} 
            height={120}
            className="rounded-2xl"
            priority
          />
        </div>
        
        {/* Loading Text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Game Center</h2>
          <div className="flex gap-1 justify-center">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}
