"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export type NavTabKey = "home" | "products" | "services" | "partners" | "account";

interface MobileBottomNavProps {
  activeTabOverride?: NavTabKey;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTabOverride,
}) => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const isUserAuthenticated = Boolean(isAuthenticated || user);

  const getAccountUrl = () => {
    return isUserAuthenticated ? "/customer/profile/" : "/login/";
  };

  const navItems = [
    {
      key: "home",
      label: "Home",
      href: "/",
      isActive:
        activeTabOverride === "home" ||
        pathname === "/" ||
        pathname === "/customer" ||
        pathname === "/customer/" ||
        pathname === "/customer/dashboard" ||
        pathname === "/customer/dashboard/",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      key: "products",
      label: "Products",
      href: "/products/",
      isActive:
        activeTabOverride === "products" ||
        pathname.startsWith("/customer/products") ||
        pathname.startsWith("/products"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      key: "services",
      label: "Services",
      href: "/services/",
      isActive: activeTabOverride === "services" || pathname.startsWith("/services"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
    {
      key: "partners",
      label: "Partners",
      href: "/partners/",
      isActive: activeTabOverride === "partners" || pathname.startsWith("/partners"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      key: "account",
      label: isUserAuthenticated ? "Account" : "Login",
      href: getAccountUrl(),
      isActive:
        activeTabOverride === "account" ||
        pathname.startsWith("/customer/profile") ||
        pathname.startsWith("/customer/orders") ||
        pathname === "/profile" ||
        pathname === "/profile/" ||
        pathname === "/login" ||
        pathname === "/login/",
      icon: isUserAuthenticated ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.9"
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="App Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(11,37,69,0.08)] pb-[env(safe-area-inset-bottom,8px)] pt-1 px-3"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const active = item.isActive;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 active:scale-92 select-none ${
                active ? "text-[#A71380]" : "text-slate-500 hover:text-[#0B2545]"
              }`}
            >
              {/* Icon Container with subtle pill highlight and active dot */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200 ${
                  active ? "bg-[#F8EAF4] text-[#A71380] scale-105" : "text-slate-500"
                }`}
              >
                {item.icon}
                {active && (
                  <span className="absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-[#A71380]" />
                )}
              </div>

              {/* Tab Label */}
              <span
                className={`text-[10px] mt-0.5 font-medium tracking-tight ${
                  active ? "font-bold text-[#A71380]" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
