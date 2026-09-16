"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { CustomerSidebar } from "@/components/b2b/CustomerSidebar";
import { getStoredUser, StoredUser, authAPI } from "@/lib/api";
import { usePlatform } from "@/lib/platform";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const platform = usePlatform();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // In mobile viewports and native apps, let dedicated mobile views render their own native MobileAppShell
  if (platform.isNative || platform.isMobile) {
    return <>{children}</>;
  }

  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar (Fixed/Sticky on Desktop) */}
      <div className="hidden md:block w-64 shrink-0 sticky top-0 h-screen z-30">
        <CustomerSidebar cartCount={cartCount} />
      </div>

      {/* Mobile Drawer Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0b2341] animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:text-slate-300 font-bold text-lg p-2 cursor-pointer"
                aria-label="Close Sidebar"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <CustomerSidebar cartCount={cartCount} />
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 py-3.5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-[#0b2341] hover:bg-slate-50 transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className="bg-[#0b2341] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase">
              PharmaChain Customer Portal
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● Live Connected
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Global Search Box in Header */}
            <div className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Search formulations, orders, COA..."
                onChange={(e) => {
                  const q = e.target.value;
                  window.dispatchEvent(new CustomEvent("pharmalink_customer_search", { detail: q }));
                }}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl pl-9 pr-4 py-2 w-64 focus:outline-none focus:bg-white focus:border-blue-600 transition-all font-medium"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Cart Pill Quick Action */}
            <Link
              href="/customer/checkout"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-2xs flex items-center space-x-2 cursor-pointer"
            >
              <span>🛒 Cart</span>
              {cartCount > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile Pill in Header */}
            <div className="flex items-center space-x-3">
              <Link
                href="/customer/profile"
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-all cursor-pointer"
                title="Click to view & edit Profile"
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-300 bg-blue-100 flex items-center justify-center shrink-0">
                  <img
                    src={user?.avatar || defaultAvatar}
                    alt={user?.full_name || "Customer"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultAvatar;
                    }}
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-[#0b2341] leading-tight max-w-[140px] truncate">
                    {user?.full_name || "Valued Customer"}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 leading-none">
                    {user?.role || "CUSTOMER"}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-y-auto min-w-0 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
