"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { EvvaiLogo } from "@/components/shared/EvvaiLogo";
import { authAPI, getStoredUser, StoredUser } from "@/lib/api";

interface RetailerSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const RetailerSidebar: React.FC<RetailerSidebarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);

  const syncSidebar = () => {
    setUser(getStoredUser());
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_retailer_cart");
        if (raw) {
          const cart = JSON.parse(raw);
          setCartCount(Array.isArray(cart) ? cart.length : 0);
        } else {
          setCartCount(0);
        }
      } catch (e) {
        setCartCount(0);
      }
    }
  };

  useEffect(() => {
    syncSidebar();
    window.addEventListener("pharmalink_user_updated", syncSidebar);
    window.addEventListener("storage", syncSidebar);
    return () => {
      window.removeEventListener("pharmalink_user_updated", syncSidebar);
      window.removeEventListener("storage", syncSidebar);
    };
  }, []);

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out of the Retailer Portal?")) {
      authAPI.logout();
      router.push("/login");
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      href: "/retailer/dashboard",
      label: "Pharmacy Dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      id: "catalog",
      href: "/retailer/products",
      label: "Products",
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.072a2 2 0 00-1.874 1.258l-.19.476a2 2 0 001.258 2.531l2.387.955a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.955a2 2 0 002.531-1.258l.19-.476z",
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      id: "orders",
      href: "/retailer/orders",
      label: "Shop Orders & Supply",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      id: "invoices",
      href: "/retailer/invoices",
      label: "GST Bills & Invoices",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      id: "profile",
      href: "/retailer/profile",
      label: "Shop Profile & Drug License",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  return (
    <aside className="w-64 bg-[#0b2341] text-white flex flex-col justify-between p-4 h-full border-r border-slate-800 shrink-0 overflow-y-auto scrollbar-thin">
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="px-2 py-2 border-b border-slate-700/60 pb-4">
          <Link href="/" className="flex items-center space-x-2">
            <EvvaiLogo className="h-7" variant="light" />
          </Link>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F3D0E9] bg-[#A71380]/40 border border-[#A71380]/70 px-2 py-0.5 rounded">
              🏪 Pharmacy Retailer
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Trade Portal Connected" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isExact = pathname === item.href;
            const isSub = item.id !== "dashboard" && pathname.startsWith(item.href);
            const isSelected = activeTab ? activeTab === item.id : isExact || isSub;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => {
                  if (onSelectTab) {
                    onSelectTab(item.id);
                  }
                }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isSelected
                  ? "bg-[#A71380] text-white shadow-md shadow-[#A71380]/20 translate-x-1"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <svg className="w-4 h-4 shrink-0 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-2xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="pt-4 border-t border-slate-700/60 space-y-3">
        <div className="flex items-center space-x-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#A71380] to-pink-500 flex items-center justify-center font-black text-white text-xs shadow-xs shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "R"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.full_name || "Retail Pharmacist"}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{user?.shop_name || user?.email || "Pharmacy Shop"}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-700/40 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
