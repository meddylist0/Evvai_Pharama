"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { RetailerSidebar } from "@/components/b2b/RetailerSidebar";
import { getStoredUser, StoredUser, authAPI, setStoredUser } from "@/lib/api";

export default function RetailerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sync user and KYC status
  const syncStatus = async () => {
    try {
      const stored = getStoredUser();
      setUser(stored);
      if (stored) {
        const freshUser = await authAPI.getMe();
        if (freshUser) {
          const updatedUser: StoredUser = {
            ...stored,
            full_name: freshUser.full_name,
            kyc_status: freshUser.retailer_profile?.kyc_status || stored.kyc_status,
            shop_name: freshUser.retailer_profile?.shop_name || stored.shop_name,
          };
          setStoredUser(updatedUser);
          setUser(updatedUser);
        }
      }
    } catch (err) {
      console.warn("Failed fetching fresh retailer user data:", err);
    }
  };

  useEffect(() => {
    syncStatus();
    window.addEventListener("pharmalink_user_updated", syncStatus);
    return () => window.removeEventListener("pharmalink_user_updated", syncStatus);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await syncStatus();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Extract active sub-route tab
  const pathParts = pathname.split("/");
  const activeTab = pathParts[2] || "dashboard";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar (Fixed/Sticky on Desktop) */}
      <div className="hidden md:block w-64 shrink-0 sticky top-0 h-screen z-30">
        <RetailerSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => router.push(`/retailer/${tab}`)}
        />
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
              <RetailerSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  router.push(`/retailer/${tab}`);
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0b2341] transition-colors cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb / Title */}
            <div>
              <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400">
                <Link href="/" className="hover:text-[#A71380] transition-colors">EVVAI Pharma</Link>
                <span>/</span>
                <span className="text-[#A71380]">Pharmacy Retailer</span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-[#0b2341] capitalize">
                {activeTab.replace("-", " ")}
              </h1>
            </div>
          </div>

          {/* Right Header Status / Refresh Controls */}
          <div className="flex items-center space-x-3">
            {/* Drug License Verified Pill */}
            <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Verified Drug License</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#0b2341] transition-colors cursor-pointer"
              title="Refresh Pharmacy Data"
            >
              <svg className={`w-4 h-4 ${refreshing ? "animate-spin text-[#A71380]" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* User Avatar */}
            <Link
              href="/retailer/profile"
              className="flex items-center space-x-2 pl-2 border-l border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A71380] to-pink-500 flex items-center justify-center text-white text-xs font-black shadow-xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "R"}
              </div>
              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-[#0b2341] block truncate max-w-[120px]">
                  {user?.full_name || "Pharmacist"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[120px]">
                  {user?.shop_name || "Pharmacy Shop"}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Children Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
