"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DistributorSidebar } from "@/components/DistributorSidebar";
import { getStoredUser, StoredUser, authAPI, setStoredUser } from "@/lib/api";

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
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
      // Fetch fresh /me from backend to check if admin approved KYC
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
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar Drawer container */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0b2341] animate-in slide-in-from-left duration-200">
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white hover:text-slate-300 font-bold text-lg p-2"
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
        <header className="bg-white border-b border-slate-200/80 py-3 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu button for Mobile view */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-[#0b2341] hover:bg-slate-50 transition-colors"
              aria-label="Open Sidebar Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <span className={`text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded tracking-wider uppercase ${
              isApproved ? "bg-emerald-600" : "bg-amber-600"
            }`}>
              {isApproved ? "B2B Distributor Portal" : "KYC Verification Pending"}
            </span>
            <span className="text-xs text-slate-500 font-semibold hidden lg:inline">
              {isApproved 
                ? "Tiered Wholesale Pricing & GST Invoice Console" 
                : "Drug License & GSTIN Review in Progress by Compliance Admin"}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh KYC verification status from database"
              className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span className="hidden sm:inline">Refresh Status</span>
            </button>

            <button
              onClick={() => {
                if (!isApproved) {
                  alert("Your Drug License & GST are pending Admin approval. Purchase orders are locked until approved.");
                  return;
                }
                router.push("/distributor/catalog");
              }}
              className={`text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-2 ${
                isApproved 
                  ? "bg-[#0b2341] hover:bg-[#12315a] text-white cursor-pointer" 
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              <span>{isApproved ? "+ Quick Bulk PO Order" : "🔒 Orders Locked (Pending KYC)"}</span>
            </button>
          </div>
        </header>

        {/* Pending KYC Notice Banner */}
        {!isApproved && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 md:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⏳</span>
              <div>
                <h4 className="text-xs font-black text-amber-900">
                  Drug License & GSTIN Verification Under Review
                </h4>
                <p className="text-[11px] text-amber-800">
                  Your registration and Drug License documents have been submitted to the Admin for regulatory compliance review. 
                  Once approved, wholesale rates & purchase orders will be unlocked automatically.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/distributor/profile")}
              className="bg-amber-800 hover:bg-amber-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0 cursor-pointer shadow-2xs"
            >
              View KYC Details
            </button>
          </div>
        )}

        <main className="p-4 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

