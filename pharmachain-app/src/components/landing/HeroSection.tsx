"use client";

import React from "react";
import Link from "next/link";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#0B2545] min-h-[clamp(580px,82vh,900px)]">
      {/* ── BACKGROUND VIDEO ────────────────────────────────────────── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover object-center"
        aria-hidden="true"
      >
        <source src="/videos/evvai-pharma-hero.mp4" type="video/mp4" />
      </video>

      {/* ── MULTI-LAYER GRADIENT OVERLAY ─────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#0B2545]/90 via-[#0B2545]/70 to-[#0B2545]/30"
        aria-hidden="true"
      />
      {/* Bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none h-[38%] bg-gradient-to-t from-[#0B2545]/70 to-transparent"
        aria-hidden="true"
      />
      {/* Top vignette */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-10 h-[18%] bg-gradient-to-b from-[#0B2545]/55 to-transparent"
        aria-hidden="true"
      />

      {/* ── CONTENT CONTAINER ─────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-[clamp(580px,82vh,900px)] pt-24 sm:pt-28">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 w-full flex flex-col flex-1 justify-center">
          {/* Text lives in left column */}
          <div className="max-w-[620px]">
            {/* Eyebrow */}
            <div className="hero-fade-up inline-block mb-6">
              <span className="inline-block text-[10px] font-extrabold text-white uppercase tracking-[0.16em] bg-[#A71380]/30 border border-[#F3D0E9]/50 rounded-full px-4 py-1.5 backdrop-blur-md">
                EVVAI PHARMA &bull; PHARMACEUTICAL QUALITY &amp; SUPPLY
              </span>
            </div>

            {/* Headline */}
            <h1 className="m-0 leading-[1.07] tracking-[-0.025em] font-black">
              <span className="hero-fade-up block text-[clamp(38px,5.4vw,66px)] text-white">
                Quality Medicines.
              </span>
              <span className="hero-fade-up block text-[clamp(38px,5.4vw,66px)] text-[#A71380]">
                Reliable Supply.
              </span>
              <span className="hero-fade-up block text-[clamp(38px,5.4vw,66px)] text-white/90">
                Better Healthcare.
              </span>
            </h1>

            {/* Supporting copy */}
            <p className="hero-fade-up text-white/80 text-[clamp(15px,1.6vw,18px)] leading-[1.72] max-w-[560px] mt-5 mb-0 font-normal">
              EVVAI Pharma delivers quality pharmaceutical products with reliable supply,
              product traceability, and dependable healthcare partnerships.
            </p>

            {/* CTA Buttons */}
            <div className="hero-fade-up flex flex-wrap items-center gap-4 mt-8">
              {/* Primary — Magenta */}
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-3 rounded-[6px] text-[11px] font-extrabold uppercase tracking-[0.08em] shadow-[0_6px_20px_rgba(167,19,128,0.38)] hover:shadow-[0_8px_26px_rgba(167,19,128,0.50)] transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Explore Products</span>
              </Link>

              {/* Secondary — Glass */}
              <Link
                href="/partners"
                className="inline-block bg-white/10 hover:bg-white/20 border border-white/50 text-white px-6 py-3 rounded-[6px] text-[11px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Partner With Us
              </Link>
            </div>
          </div>
        </div>

        {/* ── TRUST INDICATORS ──────────────────────────────────────── */}
        <div className="hero-fade-up w-full mt-auto pb-6 pt-4">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8 pt-6 border-t border-white/10">
              {/* 1. WHO-GMP Certified */}
              <div className="flex items-center space-x-3.5 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-[#0F766E]/30 text-[#2DD4BF] border border-white/15 group-hover:border-[#2DD4BF]/40 backdrop-blur-md flex items-center justify-center shrink-0 shadow-2xs transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white text-xs sm:text-sm font-extrabold tracking-wide leading-tight group-hover:text-[#2DD4BF] transition-colors">
                    WHO-GMP Certified
                  </div>
                  <div className="text-white/65 text-[11px] font-normal leading-normal mt-0.5">
                    Rigorous Quality Dossiers
                  </div>
                </div>
              </div>

              {/* 2. Reliable Supply */}
              <div className="flex items-center space-x-3.5 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-white/10 group-hover:bg-white/20 text-white border border-white/15 group-hover:border-white/30 backdrop-blur-md flex items-center justify-center shrink-0 shadow-2xs transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <div className="text-white text-xs sm:text-sm font-extrabold tracking-wide leading-tight group-hover:text-slate-100 transition-colors">
                    Reliable Supply
                  </div>
                  <div className="text-white/65 text-[11px] font-normal leading-normal mt-0.5">
                    Dependable Distribution
                  </div>
                </div>
              </div>

              {/* 3. Batch Traceable */}
              <div className="flex items-center space-x-3.5 group cursor-default">
                <div className="w-10 h-10 rounded-xl bg-[#A71380]/25 group-hover:bg-[#A71380]/40 text-[#F3D0E9] border border-[#F3D0E9]/30 group-hover:border-[#F3D0E9]/60 backdrop-blur-md flex items-center justify-center shrink-0 shadow-2xs transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <div className="text-white text-xs sm:text-sm font-extrabold tracking-wide leading-tight group-hover:text-[#F3D0E9] transition-colors">
                    Batch Traceable
                  </div>
                  <div className="text-white/65 text-[11px] font-normal leading-normal mt-0.5">
                    Digital COA Certificate
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

