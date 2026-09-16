"use client";

import React, { useState, useEffect } from "react";

let appSplashShownInSession = false;

export const AppSplashScreen: React.FC = () => {
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    if (appSplashShownInSession) return false;
    try {
      const forceSplash = window.location.search.includes("splash=true");
      if (forceSplash) return true;
      const seen = localStorage.getItem("evvai_splash_seen") || sessionStorage.getItem("evvai_splash_seen");
      if (seen) {
        appSplashShownInSession = true;
        return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    if (!showSplash) return;
    appSplashShownInSession = true;
    try {
      localStorage.setItem("evvai_splash_seen", "true");
      sessionStorage.setItem("evvai_splash_seen", "true");
    } catch {}

    // Animate progress bar from 18% to 100%
    const pInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(pInterval);
          return 100;
        }
        return prev + 14;
      });
    }, 110);

    // Fade out after progress reaches 100% (~1.45s)
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1500);

    // Completely dismiss splash screen at ~1.9s
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1900);

    return () => {
      clearInterval(pInterval);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [showSplash]);

  if (!showSplash) return null;

  return (
    <div
      style={{ fontFamily: "'Plus Jakarta Sans', var(--font-plus-jakarta), system-ui, -apple-system, sans-serif" }}
      className={`fixed inset-0 z-[9999] flex flex-col justify-between bg-gradient-to-b from-[#FFFFFF] via-[#FFF9FC] to-[#FDF4FA] transition-opacity duration-400 select-none overflow-hidden pt-[env(safe-area-inset-top,14px)] pb-[env(safe-area-inset-bottom,16px)] ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
      }`}
    >
      {/* Decorative Background Curved Bands (Top-Left & Center-Right) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-left soft circular contour arc */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full border-[38px] border-[#FCE7F3]/45 blur-[1px]" />
        
        {/* Sweeping diagonal pastel pink wave across lower middle */}
        <svg
          viewBox="0 0 400 400"
          fill="none"
          className="absolute top-[32%] -left-10 w-[125%] h-[400px] opacity-40 pointer-events-none"
        >
          <path
            d="M-40,280 C60,320 180,240 440,110 L440,190 C220,310 100,380 -40,340 Z"
            fill="url(#splashWaveGrad)"
          />
          <defs>
            <linearGradient id="splashWaveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FCE7F3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFF0F7" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Center Content: Brand Logo Lockup & Taglines */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-6 text-center">
        {/* EVVAI Logo Circular Icon (Exact Match to Screenshot) */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-4 transition-transform duration-500 animate-in zoom-in-95">
          <img
            src="/images/evvai_icon.png"
            alt="EVVAI Logo Icon"
            className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(192,0,101,0.18)]"
          />
        </div>

        {/* Brand Name Lockup */}
        <h1 className="text-[36px] sm:text-[42px] font-black tracking-[0.09em] text-[#0B2545] leading-none uppercase">
          EVVAI
        </h1>
        <p className="text-[12px] sm:text-[13px] font-extrabold tracking-[0.24em] text-[#0B2545] uppercase mt-1.5">
          PHARMACEUTICALS
        </p>
        <p className="text-[13.5px] sm:text-[14.5px] font-bold text-[#C00065] tracking-tight mt-1.5">
          Your Care is our Medicine !
        </p>

        {/* Tagline: Trusted Medicines. Brighter Tomorrows. */}
        <div className="mt-9 sm:mt-11 text-center space-y-0.5">
          <p className="text-[21px] sm:text-[24px] font-medium text-[#0B2545] leading-snug tracking-tight">
            Trusted Medicines.
          </p>
          <p className="text-[21px] sm:text-[24px] font-medium text-[#0B2545] leading-snug tracking-tight">
            Brighter Tomorrows.
          </p>
        </div>

        {/* Botanical Lotus / Crystal Petals (Exact Match to Screenshot) */}
        <div className="w-56 h-44 sm:w-64 sm:h-48 my-2 sm:my-3 relative flex items-center justify-center pointer-events-none select-none">
          <svg
            viewBox="0 0 280 240"
            fill="none"
            className="w-full h-full drop-shadow-[0_8px_20px_rgba(192,0,101,0.10)]"
          >
            {/* Leftmost Petal: Soft Translucent Lilac-Pink */}
            <path
              d="M175,215 C100,195 55,145 65,85 C95,115 140,155 175,215 Z"
              fill="url(#lotusLeftGrad)"
              opacity="0.60"
            />

            {/* Middle Petal: Translucent Rose-Violet */}
            <path
              d="M175,215 C120,165 110,95 138,40 C165,85 185,140 175,215 Z"
              fill="url(#lotusMidGrad)"
              opacity="0.75"
            />

            {/* Rightmost Petal: Saturated Vibrant Magenta (Sharp Blooming Edge) */}
            <path
              d="M175,215 C180,140 205,80 252,42 C262,110 230,175 175,215 Z"
              fill="url(#lotusRightGrad)"
              opacity="0.96"
            />

            <defs>
              <linearGradient id="lotusLeftGrad" x1="65" y1="85" x2="175" y2="215" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FBCFE8" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>

              <linearGradient id="lotusMidGrad" x1="138" y1="40" x2="175" y2="215" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E879F9" />
                <stop offset="50%" stopColor="#DB2777" />
                <stop offset="100%" stopColor="#BE185D" />
              </linearGradient>

              <linearGradient id="lotusRightGrad" x1="252" y1="42" x2="175" y2="215" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="40%" stopColor="#BE0B67" />
                <stop offset="100%" stopColor="#9E0059" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Sleek Magenta Progress Bar */}
        <div className="w-56 sm:w-64 mt-1 flex flex-col items-center">
          <div className="w-full h-1.5 bg-[#FCE7F3] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#C00065] rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[12px] text-[#64748B] font-normal mt-2 tracking-wide">
            Loading a healthier tomorrow...
          </span>
        </div>
      </div>

      {/* Footer Assurance Banner & iOS Indicator */}
      <div className="relative z-10 w-full text-center pb-2 pt-1">
        <p className="text-[9.5px] sm:text-[10px] tracking-[0.16em] text-[#64748B] font-medium uppercase">
          QUALITY &nbsp;|&nbsp; SAFETY &nbsp;|&nbsp; AFFORDABILITY &nbsp;|&nbsp; FOR A HEALTHIER INDIA
        </p>
        <div className="w-28 h-1 bg-slate-300/80 rounded-full mx-auto mt-3" />
      </div>
    </div>
  );
};
