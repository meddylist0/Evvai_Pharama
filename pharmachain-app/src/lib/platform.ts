"use client";

import { Capacitor } from "@capacitor/core";

export type PlatformOS =
  | "Windows"
  | "MacOS"
  | "Linux"
  | "iOS"
  | "Android"
  | "Unknown";

export type PlatformType = {
  os: PlatformOS;
  platform: "native" | "web" | "electron";
  isNative: boolean;
  isWeb: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isElectron: boolean;
  isPWA: boolean;
  isTouchDevice: boolean;
};

const DEFAULT_PLATFORM_INFO: PlatformType = {
  os: "Windows",
  platform: "web",
  isNative: false,
  isWeb: true,
  isAndroid: false,
  isIOS: false,
  isMobile: false,
  isDesktop: true,
  isElectron: false,
  isPWA: false,
  isTouchDevice: false,
};

let cachedPlatform: PlatformType | null = null;

export function getPlatform(): PlatformType {
  if (typeof window === "undefined") {
    return DEFAULT_PLATFORM_INFO;
  }

  let isNative = false;
  let isElectron = false;

  try {
    const isCapacitorAndroidWebView =
      typeof window !== "undefined" &&
      window.location.hostname === "localhost" &&
      (!window.location.port || window.location.port === "80" || window.location.port === "443") &&
      /Android/i.test(navigator.userAgent);

    isNative =
      Capacitor.isNativePlatform() ||
      isCapacitorAndroidWebView ||
      window.location.protocol === "capacitor:" ||
      window.location.protocol === "ionic:" ||
      (window as any).androidBridge !== undefined ||
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      window.location.search.includes("app=true") ||
      window.location.search.includes("mode=native");
  } catch {
    isNative = false;
  }

  try {
    const ua = navigator.userAgent.toLowerCase();
    isElectron = ua.includes("electron") || !!(window as any)?.process?.type;
  } catch {
    isElectron = false;
  }

  let os: PlatformOS = "Unknown";

  try {
    if (Capacitor.isNativePlatform()) {
      const capPlatform = Capacitor.getPlatform();
      if (capPlatform === "android") {
        os = "Android";
      } else if (capPlatform === "ios") {
        os = "iOS";
      }
    }
  } catch {}

  if (os === "Unknown" && typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) {
      os = "Android";
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      os = "iOS";
    } else if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
      os = "iOS";
    } else if (/Win/i.test(ua)) {
      os = "Windows";
    } else if (/Mac/i.test(ua)) {
      os = "MacOS";
    } else if (/Linux/i.test(ua)) {
      os = "Linux";
    }
  }

  const isAndroid = os === "Android";
  const isIOS = os === "iOS";

  // Mobile is true only on native app, Android/iOS device, or screens narrower than 768px
  const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 768;
  const isMobileUA =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const isMobile = isNative || isAndroid || isIOS || isMobileScreen || isMobileUA;
  const isDesktop = !isMobile && (os === "Windows" || os === "MacOS" || os === "Linux");

  const isPWA =
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as any).standalone);

  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  const result: PlatformType = {
    os,
    platform: isElectron ? "electron" : isNative ? "native" : "web",
    isNative,
    isWeb: !isNative,
    isAndroid,
    isIOS,
    isMobile,
    isDesktop,
    isElectron,
    isPWA,
    isTouchDevice,
  };

  cachedPlatform = result;
  return result;
}

export const PLATFORM =
  typeof window !== "undefined" ? getPlatform() : DEFAULT_PLATFORM_INFO;

import { useState, useEffect } from "react";

export function usePlatform(): PlatformType {
  const [platform, setPlatform] = useState<PlatformType>(() => {
    if (typeof window !== "undefined") return getPlatform();
    return DEFAULT_PLATFORM_INFO;
  });

  useEffect(() => {
    const update = () => setPlatform(getPlatform());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return platform;
}
