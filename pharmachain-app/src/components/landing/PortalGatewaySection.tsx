"use client";

import React from "react";
import Link from "next/link";

export const PortalGatewaySection: React.FC = () => {
  return (
    <section id="b2b-partnership" className="my-12 relative z-10">
      {/* Sleek Compact B2B Access Banner */}
      <div className="bg-[#0B2545] rounded-2xl p-6 sm:p-8 text-white border border-[#0B2545] shadow-md flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Left Side Compact Title & Subtitle */}
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-block">
            <span className="text-[10px] font-extrabold text-[#F3D0E9] uppercase tracking-widest bg-[#A71380]/30 px-3 py-0.5 rounded-full border border-[#A71380]/60">
              PARTNER &amp; ACCOUNT ACCESS
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Partner Portals &amp; B2B Ordering
          </h3>
          <p className="text-xs text-slate-200 font-normal max-w-lg">
            Direct account portals for hospitals, pharmacy buyers, and regional distributors.
          </p>
        </div>

        {/* Right Side Compact Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <Link
            href="/register?role=retailer"
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-5 py-3 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all shadow-md shadow-[#A71380]/30 flex items-center space-x-1.5"
          >
            <span>🏪 Pharmacy Retailer Portal</span>
            <span>&rarr;</span>
          </Link>

          <Link
            href="/register?role=distributor"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-5 py-3 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all shadow-2xs backdrop-blur-xs flex items-center space-x-1.5"
          >
            <span>📦 B2B Distributor Portal</span>
            <span>&rarr;</span>
          </Link>
        </div>

      </div>
    </section>
  );
};
