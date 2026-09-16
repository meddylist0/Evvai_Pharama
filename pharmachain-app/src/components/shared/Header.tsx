"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { EvvaiLogo } from "@/components/shared/EvvaiLogo";
import { useAuth } from "@/context/AuthContext";

export const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on click outside or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const getDashboardUrl = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "DISTRIBUTOR":
        return "/distributor/dashboard";
      case "RETAILER":
        return "/retailer/dashboard";
      case "CUSTOMER":
        return "/customer/dashboard";
      default:
        return "/products";
    }
  };

  const getOrdersUrl = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/orders";
      case "DISTRIBUTOR":
        return "/distributor/orders";
      case "RETAILER":
        return "/retailer/orders";
      case "CUSTOMER":
        return "/customer/orders";
      default:
        return "/orders";
    }
  };

  const getProfileUrl = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/settings";
      case "DISTRIBUTOR":
        return "/distributor/profile";
      case "RETAILER":
        return "/retailer/profile";
      case "CUSTOMER":
        return "/customer/profile";
      default:
        return "/profile";
    }
  };

  const getRoleBadgeStyle = () => {
    switch (user?.role) {
      case "ADMIN":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "DISTRIBUTOR":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "RETAILER":
        return "bg-pink-50 text-[#A71380] border-pink-200";
      case "CUSTOMER":
        return "bg-sky-50 text-sky-800 border-sky-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Two visual states:
  // [at top ON HOMEPAGE] → dark navy glass over hero video → white text
  // [scrolled OR ON OTHER PAGES] → white glass over light content → dark navy text
  const isAtTop = isHomePage && !scrolled;
  const logoVariant = isAtTop ? "light" : "dark";

  return (
    <header
      className={`w-full z-50 transition-all duration-300 ${isHomePage ? "fixed top-0 left-0 right-0" : "sticky top-0"
        } ${isAtTop
          ? "bg-transparent border-b border-transparent py-5"
          : "bg-white/95 backdrop-blur-xl border-b border-slate-200/85 shadow-lg shadow-[#0B2545]/5 py-3.5"
        }`}
    >
      <div className="max-w-[1420px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between w-full">
        {/* Corporate Brand Logo — switches light/dark with scroll */}
        <Link href="/" className="flex items-center space-x-3 group">
          <EvvaiLogo
            className="h-9 md:h-10 hover:opacity-90 transition-opacity"
            variant={logoVariant as "light" | "dark"}
          />
        </Link>

        {/* Corporate Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-bold">
          {[
            { label: "Home", href: "/" },
            { label: "About", href: "/about" },
            { label: "Products", href: "/products" },
            { label: "Partners", href: "/partners" },
            { label: "Contact", href: "/contact" },
          ].map((item) => {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`transition-all duration-200 py-1.5 px-3 rounded-lg text-[13px] font-bold ${isAtTop
                  ? "text-white/90 hover:text-[#A71380] hover:bg-white/15"
                  : "text-[#0B2545] hover:text-[#A71380] hover:bg-[#A71380]/5"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons & Authentication Status */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                suppressHydrationWarning
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer select-none group border ${userDropdownOpen
                  ? "border-[#A71380] bg-white shadow-[0_4px_20px_rgba(167,19,128,0.15)]"
                  : isAtTop
                    ? "border-white/25 bg-white/12 hover:bg-white/20"
                    : "border-slate-200/90 bg-slate-50 hover:bg-slate-100"
                  }`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-[#0B2545] text-white flex items-center justify-center text-xs font-black overflow-hidden border border-white/30 shrink-0 shadow-xs">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>

                {/* Name & Role */}
                <div className="text-left">
                  <div
                    className={`text-xs font-extrabold leading-tight max-w-[120px] truncate ${isAtTop && !userDropdownOpen ? "text-white" : "text-slate-900"
                      }`}
                  >
                    {user.full_name}
                  </div>
                </div>

                {/* Chevron icon */}
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${userDropdownOpen
                    ? "rotate-180 text-[#A71380]"
                    : isAtTop
                      ? "text-white/80"
                      : "text-slate-500"
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl border border-slate-200/90 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                  {/* User Header Summary */}
                  <div className="px-4 py-3 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#0B2545] text-white flex items-center justify-center text-sm font-black overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          user.full_name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-[#0B2545] truncate">{user.full_name}</p>
                        <p className="text-[10px] text-slate-400 truncate font-mono">{user.email}</p>
                        {user.role && (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 mt-1.5 ${getRoleBadgeStyle()}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            {user.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1.5 px-1.5 space-y-0.5">
                    <Link
                      href={getDashboardUrl()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-[#A71380] hover:bg-[#F8EAF4]/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-pink-50 text-[#A71380] flex items-center justify-center border border-pink-100 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span>Go to Dashboard</span>
                        <span className="block text-[9px] font-normal text-slate-400">View analytics &amp; tools</span>
                      </div>
                    </Link>

                    <Link
                      href={getOrdersUrl()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-[#0B2545] hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span>Orders &amp; Invoices</span>
                        <span className="block text-[9px] font-normal text-slate-400">Track shipments &amp; history</span>
                      </div>
                    </Link>

                    <Link
                      href={getProfileUrl()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 hover:text-[#0B2545] hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span>Profile &amp; Settings</span>
                        <span className="block text-[9px] font-normal text-slate-400">KYC &amp; account info</span>
                      </div>
                    </Link>
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1 border-t border-slate-100 px-1.5 pb-1">
                    <button
                      suppressHydrationWarning
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-extrabold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span>Sign Out Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Sign In — prominent font size and crisp visible arrow */
            <Link
              href="/login"
              className={`transition-all duration-200 py-1.5 px-3 rounded-[6px] text-[13px] font-extrabold flex items-center space-x-2 group ${isAtTop
                ? "text-white/90 hover:text-[#A71380] hover:bg-white/15"
                : "text-[#0B2545] hover:text-[#A71380] hover:bg-[#A71380]/5"
                }`}
            >
              <span>Sign In</span>
              <div className="w-5 h-5 rounded-[4px] bg-[#A71380]/15 group-hover:bg-[#A71380] text-[#A71380] group-hover:text-white flex items-center justify-center transition-all duration-200 shrink-0">
                <svg className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </Link>
          )}

          {/* Mobile Quick Search Button */}
          <Link
            href="/products"
            className={`md:hidden p-2 rounded-xl transition-colors cursor-pointer border ${isAtTop
              ? "text-white/90 border-white/25 hover:text-[#A71380] hover:bg-white/10"
              : "text-[#0B2545] border-slate-300 hover:text-[#A71380] hover:bg-slate-100"
              }`}
            aria-label="Search Products"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>

          {/* Mobile Hamburger / Quick Menu */}
          <button
            suppressHydrationWarning
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-xl transition-colors cursor-pointer border ${isAtTop
              ? "text-white/90 border-white/25 hover:text-[#A71380] hover:border-[#A71380] hover:bg-white/10"
              : "text-[#0B2545] border-slate-300 hover:text-[#A71380] hover:border-[#A71380] hover:bg-slate-100"
              }`}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-6 py-6 space-y-4 bg-white/95 backdrop-blur-xl border-y border-slate-200/60 shadow-2xl">
          <nav className="flex flex-col space-y-3 font-bold text-sm text-[#0B2545]">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 hover:text-[#A71380]">
              Home
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 hover:text-[#A71380]">
              About EVVAI Pharma
            </Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 hover:text-[#A71380]">
              Product Portfolio
            </Link>
            <Link href="/partners" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 hover:text-[#A71380]">
              Strategic Partners
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-slate-100 hover:text-[#A71380]">
              Partnerships &amp; Contact
            </Link>
          </nav>

          <div className="pt-2 space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-[#A71380] text-white font-extrabold text-xs py-3 rounded-xl block text-center shadow-xs"
                >
                  Go to {user.role} Dashboard ({user.full_name?.split(" ")[0]}) &rarr;
                </Link>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full bg-rose-50 text-rose-700 font-extrabold text-xs py-2.5 rounded-xl block text-center border border-rose-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-[#0B2545] text-white font-extrabold text-xs py-3 rounded-xl block text-center shadow-xs"
              >
                Sign In / Partner Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
