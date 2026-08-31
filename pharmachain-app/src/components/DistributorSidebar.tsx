"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { EvvaiLogo } from "@/components/EvvaiLogo";
import { authAPI, getStoredUser, StoredUser } from "@/lib/api";

interface DistributorSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const DistributorSidebar: React.FC<DistributorSidebarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [poCartCount, setPoCartCount] = useState<number>(0);

  const syncSidebar = () => {
    setUser(getStoredUser());
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_distributor_po_cart");
        if (raw) {
          const cart = JSON.parse(raw);
          setPoCartCount(Array.isArray(cart) ? cart.length : 0);
        } else {
          setPoCartCount(0);
        }
      } catch (e) {
        setPoCartCount(0);
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
    if (confirm("Are you sure you want to sign out of the Distributor Portal?")) {
      authAPI.logout();
      router.push("/login");
    }
  };

  const menuItems = [
    {
      id: "dashboard",
      href: "/distributor/dashboard",
      label: "Dashboard Overview",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      id: "catalog",
      href: "/distributor/catalog",
      label: "Wholesale Catalog",
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.072a2 2 0 00-1.874 1.258l-.19.476a2 2 0 001.258 2.531l2.387.955a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.955a2 2 0 002.531-1.258l.19-.476z",
    },
    {
      id: "orders/new",
      href: "/distributor/orders/new",
      label: "Create Bulk PO",
      icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
      badge: poCartCount,
    },
    {
      id: "orders",
      href: "/distributor/orders",
      label: "Purchase Orders",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      id: "invoices",
      href: "/distributor/invoices",
      label: "GST Tax Invoices",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      id: "profile",
      href: "/distributor/profile",
      label: "Account Profile & KYC",
      icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
  ];

  return (
    <aside className="w-64 bg-[#0b2341] text-white flex flex-col justify-between p-5 h-full border-r border-slate-800 shrink-0 overflow-y-auto scrollbar-thin">
      {/* Brand Header */}
      <div className="space-y-6">
        <Link href="/" className="flex flex-col space-y-1 px-2 cursor-pointer">
          <EvvaiLogo className="h-8" variant="light" />
          <div className="flex items-center space-x-2 pl-1">
            <span className="text-[9px] text-blue-400 font-bold tracking-wide uppercase block">
              Distributor Portal
            </span>
            <span className="text-[8px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30 font-extrabold uppercase">
              B2B
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isCurrent =
              pathname === item.href ||
              (item.id === "dashboard" && pathname === "/distributor");

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onSelectTab && onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isCurrent
                    ? "bg-[#1d4ed8] text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isCurrent
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-2 border-t border-slate-800/80 pt-4">
        <Link
          href="/"
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Corporate Storefront</span>
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/20 transition-all cursor-pointer shadow-2xs"
        >
          <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out / Logout</span>
        </button>
      </div>
    </aside>
  );
};
