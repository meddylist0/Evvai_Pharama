"use client";

import React from "react";
import Link from "next/link";

export const AboutCompanySection: React.FC = () => {
  const pillars = [
    {
      title: "Hospitals & Healthcare Networks",
      desc: "Emergency injectables, critical care antibiotics, and ICU formulations with verified digital COA dossiers.",
      iconSvg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: "Retail Pharmacy & Wholesalers",
      desc: "High-volume branded generics, oral solid dosages, and OTC formulations at regulated wholesale margins.",
      iconSvg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      title: "Contract Manufacturing",
      desc: "Custom formulation development, batch scaling, and CTD regulatory dossier filings for brand owners.",
      iconSvg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      title: "Global Export & Tenders",
      desc: "International supply compliance supporting healthcare tenders across global export destinations.",
      iconSvg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7a2 2 0 00-2-2h-1.5a.5.5 0 01-.5-.5V3.935" />
        </svg>
      ),
    },
  ];

  return (
    <section id="about" className="my-16 relative z-10 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* ── LEFT: Text Block ─────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-widest bg-[#F8EAF4] px-3.5 py-1 rounded-full border border-[#F3D0E9] inline-block">
            Who We Are
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight leading-tight">
            Building Trust Through{" "}
            <span className="text-[#A71380]">Scientific Excellence</span>
          </h2>

          <p className="text-sm text-[#475569] leading-relaxed">
            <strong className="text-[#0B2545]">EVVAI Pharmaceuticals</strong> is a WHO-GMP certified and ISO accredited manufacturing corporation. Operating automated cleanroom facilities, we specialise in high-potency oral solid dosages, sterile injectables, and therapeutic formulations.
          </p>

          <div className="border-l-4 border-[#A71380] pl-4 py-1.5 bg-[#F8EAF4]/60 rounded-r-xl">
            <p className="text-xs font-semibold text-[#0B2545] italic">
              &quot;Your Cure is Our Medicine&quot; — combining advanced analytical GLP testing with automated compounding.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/products"
              className="inline-block bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="inline-block border border-[#0B2545]/60 text-[#0B2545] hover:bg-[#0B2545] hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* ── MIDDLE: Image ───────────────────────────────── */}
        <div className="lg:col-span-4 relative">
          <div className="w-full rounded-3xl overflow-hidden shadow-xl border border-[#E2E8F0] min-h-[440px]">
            <img
              src="/syntalab_research_tubes.jpg"
              alt="EVVAI Pharmaceutical Research Laboratory"
              className="w-full h-full object-cover object-center min-h-[440px]"
            />
          </div>
          {/* Floating WHO-GMP pill */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap bg-[#A71380]/90 backdrop-blur-md border border-[#F3D0E9]/35 rounded-full px-4 py-2 shadow-[0_4px_18px_rgba(167,19,128,0.28)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F8EAF4] inline-block" />
            <span className="text-white text-[10px] font-extrabold tracking-[0.12em] uppercase">
              WHO-GMP Certified Facility
            </span>
          </div>
        </div>

        {/* ── RIGHT: 4 Stacked Cards ──────────────────────── */}
        <div className="lg:col-span-4 space-y-3">
          {pillars.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 bg-white border border-[#E2E8F0] hover:border-[#A71380]/50 rounded-2xl px-4 py-3.5 transition-all duration-200 hover:shadow-md group cursor-pointer"
            >
              <div className="shrink-0 w-9 h-9 rounded-xl bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] flex items-center justify-center group-hover:bg-[#A71380] group-hover:text-white transition-colors">
                {item.iconSvg}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-snug mb-0.5">
                  {item.title}
                </div>
                <div className="text-[11px] text-[#475569] leading-relaxed">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

