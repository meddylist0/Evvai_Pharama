"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminSidebar } from "@/components/AdminSidebar";
import { getStoredUser, StoredUser, authAPI } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);

  // Load user data
  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };
    syncUser();
    window.addEventListener("pharmalink_user_updated", syncUser);
    return () => window.removeEventListener("pharmalink_user_updated", syncUser);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    window.dispatchEvent(new CustomEvent("pharmalink_admin_search", { detail: val }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      if (pathname === "/admin" || pathname === "/admin/dashboard") {
        router.push("/admin/orders");
      }
    }
  };

  useEffect(() => {
    const handleSync = (e: any) => {
      if (typeof e.detail === "string" && e.detail !== searchQuery) {
        setSearchQuery(e.detail);
      }
    };
    window.addEventListener("pharmalink_admin_search", handleSync);
    return () => window.removeEventListener("pharmalink_admin_search", handleSync);
  }, [searchQuery]);

  // Extract active tab from URL path (e.g., /admin/orders -> "orders")
  const activeTab = pathname.split("/")[2] || "dashboard";

  const defaultAvatar = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80";

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Desktop Sidebar (Fixed/Sticky on Desktop) */}
      <div className="hidden md:block w-64 shrink-0 sticky top-0 h-screen z-30">
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => router.push(`/admin/${tab}`)}
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
                className="text-white hover:text-slate-300 font-bold text-lg p-2 cursor-pointer"
                aria-label="Close Sidebar"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AdminSidebar
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  router.push(`/admin/${tab}`);
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/80 py-3.5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
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

            <span className="bg-[#0b2341] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase">
              PharmaChain Enterprise Admin
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search catalog, batch #, or orders..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl pl-9 pr-8 py-2 w-56 md:w-72 focus:outline-none focus:bg-white focus:border-blue-600 transition-all font-medium"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer p-0.5"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* User Profile Pill in Header */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/admin/settings"
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition-all cursor-pointer"
                title="Click to view & edit Profile"
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-300 bg-blue-100 flex items-center justify-center shrink-0">
                  <img
                    src={user?.avatar || defaultAvatar}
                    alt={user?.full_name || "Admin"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultAvatar;
                    }}
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-black text-[#0b2341] leading-tight max-w-[140px] truncate">
                    {user?.full_name || "Dr. Arun Bhairi"}
                  </div>
                  <div className="text-[10px] font-bold text-blue-700 leading-none">
                    {user?.role || "ADMIN"}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

