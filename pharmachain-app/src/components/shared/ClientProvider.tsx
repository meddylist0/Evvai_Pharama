"use client";

import React, { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { BackToTop } from "@/components/shared/BackToTop";
import { AppSplashScreen } from "@/components/shared/AppSplashScreen";
import { usePlatform } from "@/lib/platform";

import { CartProvider } from "@/context/CartContext";

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const platform = usePlatform();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-platform", platform.platform);
      document.documentElement.setAttribute("data-os", platform.os.toLowerCase());
      if (platform.isNative) {
        document.documentElement.classList.add("is-native");
      }
      if (platform.isMobile) {
        document.documentElement.classList.add("is-mobile");
      }
    }
  }, [platform]);

  return (
    <AuthProvider>
      <CartProvider>
        <AppSplashScreen />
        <div className={(platform.isNative || platform.isMobile) ? "min-h-screen flex flex-col" : "pb-16 md:pb-0 min-h-screen flex flex-col"}>
          {children}
        </div>
        {!platform.isNative && !platform.isMobile && <BackToTop />}
      </CartProvider>
    </AuthProvider>
  );
};
