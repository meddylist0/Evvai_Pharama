"use client";

import React from "react";
import Link from "next/link";

export const GlobalImpactStats: React.FC = () => {
  const highlights = [
    {
      badge: "Formulations & Stock",
      title: "Browse Product Portfolio",
      desc: "Instant search for active formulations, therapeutic salts, packaging & live stock.",
      href: "/products",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      badge: "B2B Distribution",
      title: "Wholesale & Hospital Desk",
      desc: "Direct institutional bulk ordering, distributor volume tiers & live dispatch tracking.",
      href: "/login",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      badge: "Quality Assurance",
      title: "Batch Purity & Digital COA",
      desc: "Lookup analytical HPLC assay tests, batch release certificates & audit dossiers.",
      href: "/trust",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      badge: "Custom CDMO",
      title: "Contract CDMO & Tenders",
      desc: "Request customized formulation compounding, CTD dossiers & institutional tenders.",
      href: "/contact",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-2 relative z-10">
      {/* 4 Clean Compact Cards Array below Hero — Exact Original Height */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {highlights.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className="bg-white border border-[#E2E8F0] hover:border-[#A71380] rounded-[6px] p-5 space-y-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-pointer shadow-xs block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#A71380] tracking-tight font-sans uppercase">
                {item.badge}
              </span>
              <div className="p-2 bg-[#F8EAF4] rounded-[5px] border border-[#F3D0E9] text-[#A71380] group-hover:bg-[#A71380] group-hover:text-white transition-colors">
                {item.iconSvg}
              </div>
            </div>
            <h4 className="text-xs font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-snug">
              {item.title}
            </h4>
            <p className="text-[11px] text-[#475569] leading-relaxed font-normal">
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
};
