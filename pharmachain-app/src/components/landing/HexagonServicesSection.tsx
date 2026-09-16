"use client";

import React from "react";
import Link from "next/link";

export const HexagonServicesSection: React.FC = () => {
  const topRow = [
    {
      title: "Pharmaceutical Manufacturing",
      desc: "WHO-GMP accredited cleanroom production of oral tablets, capsules, injectables, and syrups.",
      badge: "WHO-GMP Cleanroom",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      title: "Pharmaceutical Distribution",
      desc: "Temperature-controlled cold-chain B2B supply, ICU emergency fulfillment, and hospital tenders.",
      badge: "Cold-Chain Supply",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
        </svg>
      ),
    },
    {
      title: "Quality Control & Assurance",
      desc: "In-house GLP accredited analytical labs, HPLC assays, and 100% digital COA batch clearance.",
      badge: "GLP & Digital COA",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2M12 19v2M3 12h2M19 12h2" />
        </svg>
      ),
    },
    {
      title: "Research & Development",
      desc: "Novel formulation design, active drug substance stability, and bioavailability optimization.",
      badge: "R&D Synthesis",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.5" strokeWidth="2" fill="currentColor" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" strokeWidth="2" transform="rotate(35 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" strokeWidth="2" transform="rotate(-35 12 12)" />
        </svg>
      ),
    },
  ];

  const bottomRow = [
    {
      title: "Clinical Research & Trials",
      desc: "Pharmacokinetic data profiling, bioequivalence evaluation, and GCP regulatory dossiers.",
      badge: "GCP Compliance",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Custom Drug Formulation",
      desc: "Contract manufacturing (CMO), private label batch scaling, and turnkey CTD dossier filings.",
      badge: "Contract Mfg & CMO",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="8" width="12" height="12" rx="3" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 4h6a1 1 0 011 1v3H8V5a1 1 0 011-1zM12 11v6M9 14h6" />
        </svg>
      ),
    },
    {
      title: "Global Supply & Tenders",
      desc: "Direct hospital network tender execution and regulatory clearance for international exports.",
      badge: "Global Tenders",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 17h2m4 0h6m4 0h2v-6H16V6H4v11zM16 11h5l-2-5h-3v5z" />
        </svg>
      ),
    },
  ];


  const renderHexagon = (item: { title: string; desc: string; badge: string; icon: React.ReactNode }, index: number) => (
    <Link
      key={index}
      href="/services"
      className="group relative cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:z-20 block w-[235px] h-[265px]"
    >
      {/* Outer Hexagon with Dynamic Drop Shadow */}
      <div className="w-full h-full relative transition-all duration-300 drop-shadow-[0_8px_18px_rgba(11,37,69,0.09)]">
        {/* Hexagon Shape Background & Content */}
        <div className="w-full h-full bg-white group-hover:bg-[#0B2545] transition-all duration-400 flex flex-col items-center justify-center p-5 text-center relative overflow-hidden [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]">
          {/* Subtle Top Gradient Shimmer on Hover */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#A71380]/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Icon Pill */}
          <div className="w-11 h-11 rounded-2xl bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] group-hover:bg-[#A71380] group-hover:text-white group-hover:border-[#A71380] flex items-center justify-center mb-2 transition-all duration-300 shadow-2xs group-hover:scale-110 group-hover:rotate-3">
            {item.icon}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-extrabold text-[#0B2545] group-hover:text-white transition-colors duration-300 leading-snug mb-1 px-1">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-[10px] text-[#475569] group-hover:text-slate-200 transition-colors duration-300 leading-relaxed font-normal px-2 line-clamp-2">
            {item.desc}
          </p>

          {/* Subtle 'Explore →' Affordance on Hover */}
          <div className="mt-2 flex items-center space-x-1 text-[9.5px] font-bold text-[#F3D0E9] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            <span>Explore</span>
            <span className="text-[#A71380] group-hover:text-[#F3D0E9] transition-colors">&rarr;</span>
          </div>
        </div>
      </div>
    </Link>
  );


  return (
    <section id="services" className="my-16 relative z-10 py-6">
      <div className="max-w-[1400px] mx-auto flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center max-w-3xl mb-12 space-y-3">
          <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-widest bg-[#F8EAF4] px-3.5 py-1 rounded-full border border-[#F3D0E9] inline-block shadow-2xs">
            Our Core Services
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0B2545] tracking-tight leading-tight">
            We Deliver Trusted Medicines for <span className="text-[#A71380]">Better Health Outcomes</span>
          </h2>
          <p className="text-sm text-[#475569] leading-relaxed font-normal max-w-2xl mx-auto">
            Explore EVVAI Pharmaceuticals&apos; certified pharmaceutical capabilities spanning cleanroom manufacturing, automated distribution, analytical QA, and custom formulation.
          </p>
        </div>

        {/* Honeycomb Hexagon Grid (4 on Top Row, 3 on Bottom Row Staggered) */}
        <div className="flex flex-col items-center w-full">
          {/* Row 1: 4 Hexagons */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-5">
            {topRow.map((item, idx) => renderHexagon(item, idx))}
          </div>

          {/* Row 2: 3 Hexagons (Staggered offset) */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-5 -mt-6 sm:-mt-8">
            {bottomRow.map((item, idx) => renderHexagon(item, idx + 4))}
          </div>
        </div>

        {/* Bottom CTA Action Strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/services"
            className="inline-block bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
          >
            View Full Services &amp; Dossiers &rarr;
          </Link>
          <Link
            href="/contact"
            className="inline-block border border-[#0B2545]/60 text-[#0B2545] hover:bg-[#0B2545] hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
          >
            Inquire For Commercial Supply
          </Link>
        </div>
      </div>
    </section>
  );
};





