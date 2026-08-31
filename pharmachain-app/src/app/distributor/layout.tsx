"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { DistributorSidebar } from "@/components/DistributorSidebar";
import { getStoredUser, StoredUser, authAPI, setStoredUser } from "@/lib/api";

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

  // Sync user and KYC status
  const syncStatus = async () => {
    try {
      const stored = getStoredUser();
      setUser(stored);
      if (stored) {
        const freshUser = await authAPI.getMe();
        if (freshUser) {
          const freshKyc = freshUser.distributor_profile?.kyc_status;
          const updatedUser: StoredUser = {
            ...stored,
            full_name: freshUser.full_name,
            kyc_status: freshKyc || stored.kyc_status,
          };
          setStoredUser(updatedUser);
          setUser(updatedUser);
        }
      }
    } catch (err) {
      console.warn("Failed fetching fresh user data:", err);
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
  const isApproved = user?.kyc_status === "APPROVED";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar (Fixed/Sticky on Desktop) */}
      <div className="hidden md:block w-64 shrink-0 sticky top-0 h-screen z-30">
        <DistributorSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => router.push(`/distributor/${tab}`)}
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
              <DistributorSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  router.push(`/distributor/${tab}`);
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 py-3.5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu button for Mobile view */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-[#0b2341] hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className={`text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase ${
              isApproved ? "bg-[#0b2341]" : "bg-amber-600"
            }`}>
              {isApproved ? "PharmaChain B2B Distributor" : "KYC Pending Review"}
            </span>

            <span className="text-xs text-slate-500 font-medium hidden lg:inline">
              {isApproved 
                ? "Direct Wholesale Pricing & Batch COA Dispatch Console" 
                : "Drug License & GSTIN Review in Progress by Compliance Admin"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh KYC verification status from database"
              className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span className="hidden sm:inline">Refresh Status</span>
            </button>

            {/* User Profile Pill in Header */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/distributor/profile"
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-all cursor-pointer"
                title="Click to view & edit Distributor Profile"
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-300 bg-blue-100 flex items-center justify-center shrink-0">
                  <img
                    src={user?.avatar || defaultAvatar}
                    alt={user?.full_name || "Distributor"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultAvatar;
                    }}
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-[#0b2341] leading-tight max-w-[140px] truncate">
                    {user?.full_name || "Pharma Distributor"}
                  </div>
                  <div className="text-[10px] font-bold text-blue-700 leading-none">
                    {isApproved ? "DISTRIBUTOR (KYC ✓)" : "DISTRIBUTOR (PENDING)"}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  );
}
