"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav, NavTabKey } from "./MobileBottomNav";

interface MobileAppShellProps {
  children: React.ReactNode;
  headerTitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  searchValue?: string;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
  activeTab?: NavTabKey;
  rightAction?: React.ReactNode;
  className?: string;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  children,
  headerTitle,
  showBack = false,
  onBack,
  showSearch = false,
  searchPlaceholder,
  onSearch,
  searchValue,
  hideHeader = false,
  hideBottomNav = false,
  activeTab,
  rightAction,
  className = "",
}) => {
  const router = useRouter();

  // Android hardware back button handling inside Capacitor
  useEffect(() => {
    let backListenerHandle: any = null;

    const setupBackButton = async () => {
      if (typeof window !== "undefined" && (window as any).Capacitor?.Plugins?.App) {
        try {
          const { App } = (window as any).Capacitor.Plugins;
          backListenerHandle = await App.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
            if (onBack) {
              onBack();
            } else if (canGoBack) {
              router.back();
            } else {
              // On root screen, let standard Android behavior or app minimize happen
              App.minimizeApp?.();
            }
          });
        } catch (err) {
          console.warn("Capacitor App backButton listener not initialized:", err);
        }
      }
    };

    setupBackButton();

    return () => {
      if (backListenerHandle && typeof backListenerHandle.remove === "function") {
        backListenerHandle.remove();
      }
    };
  }, [onBack, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col relative selection:bg-[#A71380] selection:text-white antialiased overflow-x-hidden">
      {/* Mobile Top App Bar */}
      {!hideHeader && (
        <MobileHeader
          title={headerTitle}
          showBack={showBack}
          onBack={onBack}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          searchValue={searchValue}
          rightAction={rightAction}
        />
      )}

      {/* Main Page Content (with bottom padding for navigation bar) */}
      <main
        className={`flex-1 w-full max-w-lg mx-auto ${
          hideBottomNav ? "pb-[env(safe-area-inset-bottom,16px)]" : "pb-24"
        } ${className}`}
      >
        {children}
      </main>

      {/* Sticky Native Bottom Navigation */}
      {!hideBottomNav && <MobileBottomNav activeTabOverride={activeTab} />}
    </div>
  );
};
