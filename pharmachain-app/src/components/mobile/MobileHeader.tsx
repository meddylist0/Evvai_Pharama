"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { MobileMenuDrawer } from "./MobileMenuDrawer";

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
  searchValue?: string;
  rightAction?: React.ReactNode;
  showMenuDrawerButton?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  onBack,
  showSearch = false,
  searchPlaceholder = "Search medicines, categories...",
  onSearch,
  searchValue = "",
  rightAction,
  showMenuDrawerButton = false,
}) => {
  const router = useRouter();
  const { cartCount } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (onSearch) {
      onSearch(val);
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("pharmalink_customer_search", { detail: val })
      );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-100/90 shadow-2xs pt-[env(safe-area-inset-top,0px)] transition-all">
        {/* Top App Bar Row */}
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: Back Arrow or Logo + Drawer toggle */}
          <div className="flex items-center space-x-2">
            {showBack ? (
              <button
                onClick={handleBack}
                className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#0B2545] active:scale-90 transition-all cursor-pointer"
                aria-label="Go Back"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : showMenuDrawerButton ? (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-slate-700 hover:text-[#0B2545] active:scale-90 transition-all cursor-pointer"
                aria-label="Open Navigation Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            ) : null}

            {/* Title or Logo */}
            {title ? (
              <h1 className="text-base font-extrabold text-[#0B2545] tracking-tight truncate max-w-[200px]">
                {title}
              </h1>
            ) : (
              <Link href="/" className="flex items-center space-x-2.5 group">
                {/* Official EVVAI Circular Logo Emblem */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden drop-shadow-xs">
                  <img
                    src="/images/evvai_icon.png"
                    alt="EVVAI Logo"
                    className="w-full h-full object-contain select-none"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-black text-[20px] text-[#0B2545] leading-none tracking-tight">
                    EVVAI
                  </span>
                  <span className="text-[8.5px] font-extrabold text-[#0B2545] uppercase tracking-[0.24em] leading-none mt-1">
                    PHARMACEUTICALS
                  </span>
                  <span className="text-[9.5px] font-bold text-[#C00065] leading-none mt-1 tracking-normal">
                    Your Care is our Medicine !
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Right Action Icons (Notifications + Real Shopping Cart with Badge) */}
          <div className="flex items-center space-x-2">
            {rightAction ? (
              rightAction
            ) : (
              <>
                {/* Notification Bell */}
                <Link
                  href="/customer/orders"
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-[#0B2545] hover:text-[#C00065] active:scale-90 transition-all"
                  aria-label="Notifications"
                >
                  <svg className="w-6 h-6 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.9"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </Link>

                {/* Real Shopping Cart Trolley Shortcut with Live Badge */}
                <Link
                  href="/customer/checkout"
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[#0B2545] hover:text-[#C00065] active:scale-90 transition-all"
                  aria-label="Shopping Cart"
                >
                  <svg className="w-6 h-6 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.9"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C00065] text-white text-[10px] font-black flex items-center justify-center shadow-xs ring-2 ring-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Integrated Search Bar (when showSearch is true) */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-11 pl-4 pr-10 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#A71380] focus:ring-1 focus:ring-[#A71380] transition-all font-medium shadow-2xs"
              />
              <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Slide-over navigation drawer */}
      <MobileMenuDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};
