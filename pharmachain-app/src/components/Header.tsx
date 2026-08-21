"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EvvaiLogo } from "@/components/EvvaiLogo";
import { useAuth } from "@/context/AuthContext";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const getDashboardUrl = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "DISTRIBUTOR":
        return "/distributor/dashboard";
      case "CUSTOMER":
        return "/customer/dashboard";
      default:
        return "/catalog";
    }
  };

  const getRoleBadgeStyle = () => {
    switch (user?.role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DISTRIBUTOR":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CUSTOMER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="w-full bg-white border-b border-slate-100 py-3.5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full">
        {/* Brand Logo Symbol & Tagline */}
        <Link href="/" className="flex items-center group">
          <EvvaiLogo className="h-11 md:h-12" variant="dark" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <Link href="/about" className="hover:text-[#0b2341] transition-colors">About Us</Link>
          <Link href="/manufacturing" className="hover:text-[#0b2341] transition-colors">Manufacturing</Link>
          <Link href="/catalog" className="hover:text-[#0b2341] transition-colors">Catalog</Link>
          <Link href="/trust" className="hover:text-[#0b2341] transition-colors">Quality & Trust</Link>
          <Link href="/contact" className="hover:text-[#0b2341] transition-colors">Contact</Link>
        </nav>

        {/* Right Desktop Auth / Login Button */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center space-x-3">
              {/* User Profile info & Role badge */}
              <Link
                href={getDashboardUrl()}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#0b2341] text-white flex items-center justify-center text-xs font-bold overflow-hidden border border-slate-200 shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0) || "U"
                  )}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">
                    {user.full_name}
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border inline-block ${getRoleBadgeStyle()}`}>
                    {user.role}
                  </span>
                </div>
              </Link>

              {/* Portal link */}
              <Link
                href={getDashboardUrl()}
                className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all shadow-xs"
              >
                Portal &rarr;
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl items-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              <span>Sign In</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 text-[#0b2341] hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 font-bold text-sm text-slate-700">
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-slate-100 hover:text-[#0b2341]"
            >
              About EVVAI Pharma
            </Link>
            <Link
              href="/manufacturing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-slate-100 hover:text-[#0b2341]"
            >
              Manufacturing Facilities
            </Link>
            <Link
              href="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-slate-100 hover:text-[#0b2341]"
            >
              Formulation Catalog
            </Link>
            <Link
              href="/trust"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-slate-100 hover:text-[#0b2341]"
            >
              Quality & Certifications
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 border-b border-slate-100 hover:text-[#0b2341]"
            >
              Contact & Inquiry
            </Link>
          </nav>

          <div className="pt-2 space-y-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-[#0b2341] text-white font-extrabold text-xs py-3 rounded-xl block text-center shadow-xs"
                >
                  Go to {user.role} Dashboard ({user.full_name?.split(" ")[0]}) &rarr;
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-rose-50 text-rose-700 font-extrabold text-xs py-2.5 rounded-xl block text-center border border-rose-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-[#0b2341] text-white font-extrabold text-xs py-3 rounded-xl block text-center shadow-xs"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
