"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { EvvaiLogo } from "@/components/EvvaiLogo";
import { getStoredUser, StoredUser, authAPI } from "@/lib/api";

interface DistributorSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const DistributorSidebar: React.FC<DistributorSidebarProps> = ({ activeTab, onSelectTab }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [poCartCount, setPoCartCount] = useState<number>(0);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Sync user info and PO cart count
  const syncSidebar = async () => {
    const stored = getStoredUser();
    setUser(stored);

    // Sync draft PO cart count from localStorage
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

    // Fetch live /me to get company details & drug license info
    try {
      const me = await authAPI.getMe();
      if (me) setProfileData(me);
    } catch (e) {
      // fallback
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

  const handleNavigate = (path: string, tabId: string) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    } else {
      router.push(path);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    router.push("/login");
  };

  const isApproved = user?.kyc_status === "APPROVED";
  const distProfile = profileData?.distributor_profile;

  const currentTab = activeTab || (pathname.includes("/orders/new") ? "orders/new" : pathname.split("/")[2] || "dashboard");

  const navGroups = [
    {
      groupLabel: "OPERATIONS & CATALOG",
      items: [
        {
          id: "dashboard",
          path: "/distributor/dashboard",
          label: "Dashboard Overview",
          icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
          color: "blue",
        },
        {
          id: "catalog",
          path: "/distributor/catalog",
          label: "Wholesale Catalog",
          icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.072a2 2 0 00-1.874 1.258l-.19.476a2 2 0 001.258 2.531l2.387.955a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.955a2 2 0 002.531-1.258l.19-.476z",
          tag: "WHO-GMP",
          color: "violet",
        },
        {
          id: "orders/new",
          path: "/distributor/orders/new",
          label: "Create Bulk PO",
          icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
          badge: poCartCount > 0 ? `${poCartCount} items` : undefined,
          highlight: poCartCount > 0,
          color: "emerald",
        },
      ],
    },
    {
      groupLabel: "ORDERS & COMMERCIAL",
      items: [
        {
          id: "orders",
          path: "/distributor/orders",
          label: "Purchase Orders",
          icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
          color: "cyan",
        },
        {
          id: "invoices",
          path: "/distributor/invoices",
          label: "GST Tax Invoices",
          icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
          color: "amber",
        },
      ],
    },
    {
      groupLabel: "REGULATORY & ACCOUNT",
      items: [
        {
          id: "profile",
          path: "/distributor/profile",
          label: "KYC & Drug License",
          icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
          tag: isApproved ? "Verified" : "Pending",
          color: "emerald",
        },
      ],
    },
  ];

  const companyName = distProfile?.company_name || user?.company_name || user?.full_name || "Pharma Distribution Partner";
  const initials = companyName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0] || "")
    .join("")
    .toUpperCase();

  return (
    <>
      <style>{`
        @keyframes dist-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes dist-spin { to{transform:rotate(360deg)} }
        @keyframes dist-fadein { from{opacity:0} to{opacity:1} }
        @keyframes dist-slideup { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .dist-sb {
          width:260px; flex-shrink:0; height:100%;
          background:linear-gradient(170deg,#06101f 0%,#08172b 50%,#050d1b 100%);
          border-right:1px solid rgba(148,163,184,0.07);
          display:flex; flex-direction:column;
          overflow-y:auto; overflow-x:hidden; position:relative;
        }
        .dist-sb::before {
          content:''; position:absolute; top:0;left:0;right:0; height:280px;
          background:radial-gradient(ellipse at 50% -10%,rgba(59,130,246,0.16) 0%,transparent 68%);
          pointer-events:none; z-index:0;
        }
        .dist-sb::-webkit-scrollbar{width:3px}
        .dist-sb::-webkit-scrollbar-thumb{background:rgba(148,163,184,0.12);border-radius:99px}
        .dist-sb>*{position:relative;z-index:1}
        .dsb-id-card {
          background:linear-gradient(135deg,rgba(29,55,120,0.3) 0%,rgba(15,23,42,0.55) 100%);
          border:1px solid rgba(99,102,241,0.16);
          border-radius:18px; padding:14px 14px 12px; overflow:hidden; position:relative;
        }
        .dsb-id-card::after {
          content:''; position:absolute; top:-50px;right:-40px;
          width:120px;height:120px;
          background:radial-gradient(circle,rgba(99,102,241,0.2),transparent 65%);
          pointer-events:none;
        }
        .dsb-avatar {
          width:40px;height:40px;border-radius:13px;flex-shrink:0;
          background:linear-gradient(135deg,#3b82f6,#6366f1);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:900;color:white;letter-spacing:.5px;
          box-shadow:0 4px 14px rgba(99,102,241,0.4);
        }
        .dsb-po-banner {
          background:linear-gradient(135deg,rgba(4,47,24,0.7),rgba(6,78,59,0.45));
          border:1px solid rgba(52,211,153,0.22); border-radius:14px;
          padding:11px 13px; cursor:pointer;
          display:flex;align-items:center;justify-content:space-between;
          transition:all .2s cubic-bezier(.4,0,.2,1);
        }
        .dsb-po-banner:hover {
          border-color:rgba(52,211,153,0.45);
          background:linear-gradient(135deg,rgba(6,78,59,0.75),rgba(5,150,105,0.3));
          transform:translateY(-1px);
          box-shadow:0 6px 20px rgba(16,185,129,0.14);
        }
        .dsb-grp-label {
          font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
          color:rgba(148,163,184,0.42); padding:10px 10px 5px 10px;
          display:flex; align-items:center; gap:7px;
        }
        .dsb-grp-label::after {
          content:''; flex:1; height:1px; background:rgba(148,163,184,0.07);
        }
        .dsb-nav-item {
          width:100%;display:flex;align-items:center;justify-content:space-between;
          padding:9px 10px; border-radius:12px; border:1px solid transparent;
          font-size:12px; font-weight:600; cursor:pointer; text-align:left;
          background:transparent; color:rgba(148,163,184,0.72);
          transition:all .18s cubic-bezier(.4,0,.2,1); position:relative; overflow:hidden;
        }
        .dsb-nav-item:hover:not(.dsb-active){
          background:rgba(30,41,59,0.65); color:white;
          border-color:rgba(148,163,184,0.07);
        }
        .dsb-active {
          background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(99,102,241,0.13));
          border-color:rgba(99,102,241,0.2); color:white; font-weight:700;
          box-shadow:0 3px 14px rgba(59,130,246,0.18);
        }
        .dsb-active::before {
          content:''; position:absolute; left:0;top:20%;bottom:20%;
          width:3px; border-radius:0 3px 3px 0;
          background:linear-gradient(to bottom,#60a5fa,#818cf8);
        }
        .dsb-icon-wrap {
          width:32px;height:32px;border-radius:9px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          transition:all .18s;
        }
        .dsb-active .dsb-icon-wrap {
          background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(59,130,246,0.2));
        }
        .dsb-nav-item:hover:not(.dsb-active) .dsb-icon-wrap {
          background:rgba(255,255,255,0.05);
        }
        .dsb-footer {
          padding:14px; border-top:1px solid rgba(148,163,184,0.07);
          background:rgba(3,8,18,0.65); backdrop-filter:blur(10px);
          display:flex; flex-direction:column; gap:6px;
        }
        .dsb-support {
          display:flex;align-items:center;justify-content:space-between;
          background:rgba(15,23,42,0.7);border:1px solid rgba(148,163,184,0.07);
          border-radius:11px;padding:9px 11px;
        }
        .dsb-storefront-link {
          display:flex;align-items:center;gap:8px;
          padding:9px 11px;border-radius:11px;font-size:11px;
          color:rgba(148,163,184,0.65);border:1px solid transparent;
          transition:all .18s;text-decoration:none;
        }
        .dsb-storefront-link:hover{
          background:rgba(30,41,59,0.6);color:white;
          border-color:rgba(148,163,184,0.08);
        }
        .dsb-logout-btn {
          width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
          padding:10px 14px;border-radius:12px;font-size:12px;font-weight:700;
          cursor:pointer;transition:all .2s;
          background:rgba(220,38,38,0.09);
          border:1px solid rgba(248,113,113,0.18);
          color:rgba(252,165,165,0.88);
        }
        .dsb-logout-btn:hover{
          background:rgba(220,38,38,0.18);
          border-color:rgba(248,113,113,0.38);
          color:#fca5a5;
          box-shadow:0 4px 14px rgba(220,38,38,0.14);
        }
        .dsb-overlay {
          position:fixed;inset:0;z-index:50;
          display:flex;align-items:center;justify-content:center;
          background:rgba(2,6,23,0.78);backdrop-filter:blur(10px);padding:16px;
          animation:dist-fadein .15s ease;
        }
        .dsb-modal {
          background:linear-gradient(145deg,#0d1b2e,#1a2e4a);
          border:1px solid rgba(148,163,184,0.11);
          border-radius:24px;padding:28px;
          max-width:360px;width:100%;
          box-shadow:0 28px 70px rgba(0,0,0,0.65);
          animation:dist-slideup .2s cubic-bezier(.4,0,.2,1);
          color:white;
        }
      `}</style>

      <aside className="dist-sb">
        {/* Logo */}
        <div style={{ padding: "20px 18px 0", position: "relative", zIndex: 1 }}>
          <Link href="/" style={{ display: "flex", flexDirection: "column", gap: "5px", textDecoration: "none" }}>
            <EvvaiLogo className="h-8" variant="light" />
            <div style={{ display: "flex", alignItems: "center", gap: "7px", paddingLeft: "2px", marginTop: "3px" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: ".1em", color: "rgba(96,165,250,0.9)", textTransform: "uppercase" }}>
                B2B Distributor Portal
              </span>
              <span style={{
                fontSize: "8px", fontWeight: 800, letterSpacing: ".05em",
                background: "linear-gradient(90deg,rgba(59,130,246,0.22),rgba(99,102,241,0.22))",
                border: "1px solid rgba(99,102,241,0.28)", color: "rgba(196,181,253,0.88)",
                padding: "1px 7px", borderRadius: "99px"
              }}>Enterprise</span>
            </div>
          </Link>
        </div>

        {/* Main scrollable body */}
        <div style={{ padding: "16px 14px", flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>

          {/* Identity Card */}
          <div className="dsb-id-card" style={{ marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div className="dsb-avatar">{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: "4px" }}>
                  <span style={{
                    fontSize: "8.5px", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase",
                    padding: "2px 8px", borderRadius: "99px", display: "inline-flex", alignItems: "center", gap: "4px",
                    background: isApproved ? "rgba(16,185,129,0.14)" : user?.kyc_status === "REJECTED" ? "rgba(239,68,68,0.14)" : "rgba(245,158,11,0.14)",
                    border: `1px solid ${isApproved ? "rgba(16,185,129,0.32)" : user?.kyc_status === "REJECTED" ? "rgba(239,68,68,0.32)" : "rgba(245,158,11,0.32)"}`,
                    color: isApproved ? "#6ee7b7" : user?.kyc_status === "REJECTED" ? "#fca5a5" : "#fcd34d",
                  }}>
                    {isApproved ? (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : user?.kyc_status === "REJECTED" ? (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ animation: "dist-spin 1.5s linear infinite" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {isApproved ? "Approved" : user?.kyc_status === "REJECTED" ? "Rejected" : "In Review"}
                  </span>
                </div>
                <h4 style={{ fontSize: "12.5px", fontWeight: 800, color: "white", lineHeight: 1.3, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "155px" }}>
                  {companyName}
                </h4>
                <span style={{ fontSize: "10px", color: "rgba(148,163,184,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "160px" }}>
                  {user?.email || "distributor@pharmalink.com"}
                </span>
              </div>
            </div>
            {distProfile?.drug_license_no && (
              <div style={{
                marginTop: "11px", paddingTop: "11px",
                borderTop: "1px solid rgba(148,163,184,0.09)",
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <span style={{ fontSize: "9px", color: "rgba(148,163,184,0.45)", fontFamily: "monospace", letterSpacing: ".06em", textTransform: "uppercase" }}>DL No.</span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#93c5fd", fontFamily: "monospace" }}>
                  {distProfile.drug_license_no}
                </span>
              </div>
            )}
          </div>

          {/* Active PO Draft Banner */}
          {poCartCount > 0 && (
            <button className="dsb-po-banner" onClick={() => handleNavigate("/distributor/orders/new", "orders/new")} style={{ marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "34px", height: "34px", borderRadius: "10px", flexShrink: 0,
                  background: "linear-gradient(135deg,rgba(16,185,129,0.28),rgba(5,150,105,0.18))",
                  border: "1px solid rgba(52,211,153,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "white", display: "block" }}>Active PO Draft</span>
                  <span style={{ fontSize: "10px", color: "#6ee7b7" }}>{poCartCount} Formulation{poCartCount > 1 ? "s" : ""} Ready</span>
                </div>
              </div>
              <div style={{
                width: "24px", height: "24px", borderRadius: "8px",
                background: "rgba(52,211,153,0.14)", border: "1px solid rgba(52,211,153,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34d399">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )}

          {/* Navigation */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {navGroups.map((grp) => (
              <div key={grp.groupLabel}>
                <div className="dsb-grp-label">{grp.groupLabel}</div>
                {grp.items.map((item) => {
                  const isActive = currentTab === item.id || pathname === item.path;
                  const iconColor = isActive ? "white" : "rgba(148,163,184,0.6)";
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path, item.id)}
                      className={`dsb-nav-item${isActive ? " dsb-active" : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="dsb-icon-wrap">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={iconColor} style={{ transition: "stroke .18s" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={item.icon} />
                          </svg>
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {(item as any).badge && (
                          <span style={{
                            fontSize: "9px", fontWeight: 900, padding: "2px 8px", borderRadius: "99px",
                            background: (item as any).highlight ? "linear-gradient(90deg,#10b981,#059669)" : "rgba(30,41,59,0.85)",
                            color: (item as any).highlight ? "white" : "rgba(148,163,184,0.7)",
                            border: (item as any).highlight ? "none" : "1px solid rgba(148,163,184,0.1)",
                            animation: (item as any).highlight ? "dist-pulse 2s infinite" : "none",
                          }}>
                            {(item as any).badge}
                          </span>
                        )}
                        {(item as any).tag && !(item as any).badge && (
                          <span style={{
                            fontSize: "8.5px", fontWeight: 800, padding: "2px 7px", borderRadius: "99px",
                            background: ((item as any).tag === "Verified" || (item as any).tag === "Approved")
                              ? "rgba(16,185,129,0.14)"
                              : (item as any).tag === "WHO-GMP"
                                ? "rgba(139,92,246,0.14)"
                                : "rgba(245,158,11,0.14)",
                            border: `1px solid ${((item as any).tag === "Verified" || (item as any).tag === "Approved")
                              ? "rgba(16,185,129,0.28)"
                              : (item as any).tag === "WHO-GMP"
                                ? "rgba(139,92,246,0.28)"
                                : "rgba(245,158,11,0.28)"}`,
                            color: ((item as any).tag === "Verified" || (item as any).tag === "Approved")
                              ? "#6ee7b7"
                              : (item as any).tag === "WHO-GMP"
                                ? "#c4b5fd"
                                : "#fcd34d",
                          }}>
                            {(item as any).tag}
                          </span>
                        )}
                        {isActive && (
                          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(147,197,253,0.65)", flexShrink: 0 }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="dsb-footer">
          {/* Support pill */}
          <div className="dsb-support">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(148,163,184,0.45)", letterSpacing: ".07em", textTransform: "uppercase" }}>B2B Support</div>
                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "rgba(148,163,184,0.8)" }}>1800-PHARMA</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "block", animation: "dist-pulse 2s infinite" }} />
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#6ee7b7", letterSpacing: ".04em" }}>24/7</span>
            </div>
          </div>

          {/* Storefront link */}
          <Link href="/" className="dsb-storefront-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ flexShrink: 0, opacity: .6 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Return to Main Storefront</span>
          </Link>

          {/* Logout */}
          <button type="button" className="dsb-logout-btn" onClick={() => setShowLogoutModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-[#0b2341]">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black">Sign Out of Distributor Portal?</h3>
              <p className="text-xs text-slate-500">
                You will be signed out from your wholesale distributor session. Any submitted purchase orders remain active.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
