"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredUser, StoredUser, addressesAPI, AddressItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";

export const MobileProfileView: React.FC = () => {
  const router = useRouter();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  const [user, setUser] = useState<StoredUser | null>(() => {
    if (typeof window !== "undefined") {
      return getStoredUser();
    }
    return null;
  });
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const syncUser = () => {
      const current = authUser || getStoredUser();
      setUser(current);
    };
    syncUser();

    const loadAddresses = async () => {
      try {
        const list = await addressesAPI.list();
        setAddresses(list || []);
      } catch { }
    };
    loadAddresses();

    if (typeof window !== "undefined") {
      window.addEventListener("pharmalink_user_updated", syncUser);
      window.addEventListener("storage", syncUser);
      return () => {
        window.removeEventListener("pharmalink_user_updated", syncUser);
        window.removeEventListener("storage", syncUser);
      };
    }
  }, [authUser]);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    router.push("/login/");
  };

  const effectiveUser = user || authUser;
  const isGuest = !effectiveUser && !isAuthenticated;
  const fullName = effectiveUser?.full_name || (isGuest ? "Guest User" : "Arun Bhairi");
  const userEmail = effectiveUser?.email || (isGuest ? "Sign in for orders & invoices" : "arunbhairi@example.com");
  const roleName = effectiveUser?.role || (isGuest ? "Guest" : "Customer");
  const avatarLetter = (fullName[0] || (isGuest ? "G" : "A")).toUpperCase();

  const menuItems = [
    ...(!isGuest
      ? [
          {
            title: "Customer Dashboard",
            icon: (
              <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            ),
            action: () => router.push("/customer/dashboard/"),
          },
        ]
      : []),
    {
      title: "My Orders",
      icon: (
        <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      action: () => router.push("/customer/orders/"),
    },
    {
      title: "Saved Products",
      icon: (
        <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      action: () => router.push("/products/"),
    },
    {
      title: "Addresses",
      icon: (
        <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      action: () => setShowAddressSheet(true),
    },
    {
      title: "Notifications",
      icon: (
        <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      action: () => {
        setToastMsg("All notifications are up to date");
        setTimeout(() => setToastMsg(null), 2000);
      },
    },
    {
      title: "Help & Support",
      icon: (
        <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => router.push("/contact/"),
    },
    {
      title: "About EVVAI Pharma",
      icon: (
        <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => router.push("/about/"),
    },
  ];

  return (
    <MobileAppShell
      headerTitle="My Account"
      showBack={false}
      activeTab="account"
      rightAction={
        <button
          onClick={() => {
            setToastMsg("Account settings are synced");
            setTimeout(() => setToastMsg(null), 2000);
          }}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#0B2545] hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Settings"
          title="Account Settings"
        >
          <svg className="w-6 h-6 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      }
    >
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0B2545] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg text-center">
            {toastMsg}
          </div>
        </div>
      )}

      <div className="px-5 py-4 space-y-5">
        {/* 1. User Profile Header Info */}
        <div className="flex items-center space-x-4 py-2">
          {/* Avatar Circle */}
          <div className="w-16 h-16 rounded-full bg-[#7E38B7] text-white text-2xl font-bold flex items-center justify-center shadow-sm shrink-0">
            {avatarLetter}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#0B2545] truncate leading-tight">
              {fullName}
            </h2>
            <p className="text-xs text-slate-400 truncate mt-1">
              {userEmail}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {roleName}
            </p>
          </div>
        </div>

        {isGuest && (
          <div className="p-3 rounded-2xl bg-pink-50/80 border border-pink-100">
            <Link
              href="/login/"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C00065] to-[#A71380] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>Sign In / Register</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {/* 2. Menu Items Card */}
        <div className="bg-white rounded-3xl border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-slate-100">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={item.action}
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-slate-50 active:bg-slate-100/70 transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="text-[13px] font-semibold text-[#0B2545]">
                  {item.title}
                </span>
              </div>
              <svg className="w-4 h-4 text-slate-400 group-hover:text-[#0B2545] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}

          {/* Logout or Sign In */}
          {!isGuest ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-rose-50/40 active:bg-rose-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-6 h-6 flex items-center justify-center shrink-0 text-[#C00065]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-[13px] font-bold text-[#C00065]">
                  Logout
                </span>
              </div>
              <svg className="w-4 h-4 text-[#C00065]/50 group-hover:text-[#C00065] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => router.push("/login/")}
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-pink-50/40 active:bg-pink-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-6 h-6 flex items-center justify-center shrink-0 text-[#C00065]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-[13px] font-bold text-[#C00065]">
                  Sign In / Login
                </span>
              </div>
              <svg className="w-4 h-4 text-[#C00065]/50 group-hover:text-[#C00065] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* 3. WHO-GMP Quality Verification Stamp */}
        <div className="rounded-2xl bg-slate-100/70 p-3.5 flex items-center justify-center space-x-2 text-center text-[10px] text-slate-500 font-semibold">
          <span>🛡️</span>
          <span>EVVAI Pharmaceuticals Pvt Ltd • WHO-GMP Certified</span>
        </div>
      </div>

      {/* Address Book Sheet */}
      {showAddressSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowAddressSheet(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,20px)] space-y-4">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#0B2545]">
                Saved Addresses ({addresses.length})
              </h3>
              <button
                onClick={() => setShowAddressSheet(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {addresses.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No saved addresses found.</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">{addr.recipient_name}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {addr.address_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      {addr.street_address}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-[11px] text-slate-500">Phone: {addr.phone}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C00065] flex items-center justify-center text-xl mx-auto">
              🚪
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Sign Out?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to sign out of EVVAI Pharma?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 rounded-xl bg-[#C00065] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileAppShell>
  );
};
