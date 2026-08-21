import React from "react";
import Link from "next/link";

export const PortalGatewaySection: React.FC = () => {
  const portals = [
    {
      title: "B2B Wholesale Distributor Portal",
      subtitle: "For Registered Pharma Stockists & Wholesalers",
      badge: "B2B Wholesale Access",
      badgeBg: "bg-blue-100 text-[#0b2341] border-blue-200",
      desc: "Access tier-discounted wholesale prices, bulk MOQ rates, GST tax invoices (PDF), and batch credit limit tracking.",
      link: "/distributor",
      btnText: "Enter B2B Distributor Portal",
      btnStyle: "bg-[#0b2341] hover:bg-[#12315a] text-white",
      icon: (
        <svg className="w-6 h-6 text-[#0b2341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Direct Customer Ordering Portal",
      subtitle: "For Hospitals, Clinics & Direct Buyers",
      badge: "Direct Retail Access",
      badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-200",
      desc: "Browse WHO-GMP certified generic formulations, track order shipment status, save items to wishlist, and view order receipts.",
      link: "/customer/dashboard",
      btnText: "Go to Customer Dashboard",
      btnStyle: "bg-white hover:bg-slate-50 border border-[#0b2341]/30 text-[#0b2341]",
      icon: (
        <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 11h14l1 12H4L5 11z" />
        </svg>
      ),
    },
    {
      title: "Enterprise Operations & Admin Panel",
      subtitle: "For EVVAI Corporate Management",
      badge: "Executive Admin Access",
      badgeBg: "bg-purple-100 text-purple-900 border-purple-200",
      desc: "Manage product formulations, set multi-tier pricing rules, approve B2B distributor KYC requests, and monitor batch stock levels.",
      link: "/admin/dashboard",
      btnText: "Open Admin Console",
      btnStyle: "bg-white hover:bg-slate-50 border border-[#0b2341]/30 text-[#0b2341]",
      icon: (
        <svg className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="portals" className="space-y-6 my-14">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Digital Commerce Platform
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-[#0b2341] tracking-tight mt-1">
            Role-Based Digital Procurement Portals
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            Tailored digital interfaces for B2B distributors, hospital procurement teams, and corporate operations.
          </p>
        </div>

        <Link
          href="/login"
          className="text-xs font-bold text-[#0b2341] hover:text-blue-700 transition-colors flex items-center space-x-1 shrink-0"
        >
          <span>Account Login Center</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* 3 Portal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {portals.map((portal, idx) => (
          <div
            key={idx}
            className="bg-[#f7f6f4] border border-[#e8e6e2] hover:border-[#0b2341]/40 rounded-3xl p-6 flex flex-col justify-between space-y-6 hover:shadow-md transition-all group"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs group-hover:scale-105 transition-transform">
                  {portal.icon}
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${portal.badgeBg}`}>
                  {portal.badge}
                </span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-[#0b2341] tracking-tight group-hover:text-blue-700 transition-colors">
                  {portal.title}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                  {portal.subtitle}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {portal.desc}
              </p>
            </div>

            <Link
              href={portal.link}
              className={`inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-2xs w-full text-center ${portal.btnStyle}`}
            >
              <span>{portal.btnText}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};
