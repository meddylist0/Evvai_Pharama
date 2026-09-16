"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";

export const ServicesPageView: React.FC = () => {

  const detailedServices = [
    {
      title: "Pharmaceutical Manufacturing",
      badge: "Cleanroom Compounding",
      tag: "WHO-GMP Verified",
      desc: "WHO-GMP accredited cleanroom production of high-potency solid oral dosages (tablets, vegetarian capsules), sterile injectables, and respiratory liquid syrups.",
      features: [
        "Positive-pressure ISO Class 5 & 7 cleanroom suites",
        "High-speed automated blistering, strip & bottle packaging",
        "Aseptic vial & ampoule filling lines with particulate tracking",
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      title: "Pharmaceutical Distribution & Cold-Chain",
      badge: "B2B Logistics",
      tag: "Cold-Chain Monitored",
      desc: "End-to-end temperature-controlled pharmaceutical distribution supporting hospital networks, retail pharmacy chains, and institutional healthcare tenders.",
      features: [
        "Temperature-controlled cold-chain preservation (2°C - 8°C & 15°C - 25°C)",
        "Real-time thermal data logging with FEFO batch traceability",
        "Rapid emergency dispatch for critical care ICU formulations",
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
        </svg>
      ),
    },
    {
      title: "Quality Assurance & Analytical Testing",
      badge: "GLP Laboratory",
      tag: "Digital COA",
      desc: "In-house GLP accredited analytical laboratories providing comprehensive batch clearance, raw material assays, and 100% verifiable digital COA documentation.",
      features: [
        "HPLC spectrographic assay and chromatographic validation",
        "In-vitro dissolution, stability chamber & disintegration testing",
        "Automated cleanroom optical particle counter logging",
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2M12 19v2M3 12h2M19 12h2" />
        </svg>
      ),
    },
    {
      title: "Research & Formulation Development",
      badge: "R&D Synthesis",
      tag: "Therapeutic R&D",
      desc: "Advanced therapeutic formulation design focusing on active drug substance stability, sustained-release mechanisms, and bioavailability optimization.",
      features: [
        "Custom delivery systems (enteric, sustained release, effervescent)",
        "Excipient compatibility screening & stability profile validation",
        "Pilot batch development and seamless technology transfer",
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.5" strokeWidth="2" fill="currentColor" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" strokeWidth="2" transform="rotate(35 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" strokeWidth="2" transform="rotate(-35 12 12)" />
        </svg>
      ),
    },
    {
      title: "Clinical Research & Safety Validation",
      badge: "Clinical Trials",
      tag: "GCP Aligned",
      desc: "Regulatory-compliant therapeutic safety validation and pharmacokinetic profiling aligned with international Good Clinical Practice (GCP) standards.",
      features: [
        "Phase-aligned pharmacokinetic (PK) and pharmacodynamic (PD) profiling",
        "Bioequivalence evaluation and clinical safety dossier preparation",
        "Regulatory dossier advisory for international tender qualifications",
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "Custom & Third-Party Manufacturing (CMO)",
      badge: "Private Label",
      tag: "CMO Scalable",
      desc: "Custom formulation scaling, private label production, and turnkey regulatory filing support for domestic and global pharmaceutical brand owners.",
      features: [
        "Turnkey formulation compounding and custom blister packaging",
        "Flexible batch capacity ranging from pilot batches to bulk commercial volume",
        "Complete CTD / eCTD dossier filings for global marketing approvals",
      ],
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="8" width="12" height="12" rx="3" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 4h6a1 1 0 011 1v3H8V5a1 1 0 011-1zM12 11v6M9 14h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] relative overflow-x-clip">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 flex-1 w-full space-y-16 relative z-10">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-[#475569] font-medium">
          <Link href="/" className="hover:text-[#A71380] transition-colors flex items-center space-x-1">
            <svg className="w-3.5 h-3.5 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[#0B2545] font-bold">Services &amp; Supply</span>
        </nav>

        {/* Hero Section */}
        <div className="space-y-4 max-w-4xl">
          <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-widest bg-[#F8EAF4] px-3.5 py-1 rounded-full border border-[#F3D0E9] inline-block shadow-2xs">
            EVVAI PHARMA SERVICES &amp; SUPPLY
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0B2545] tracking-tight leading-tight">
            Certified Pharmaceutical Manufacturing, <span className="text-[#A71380]">Cold-Chain Logistics &amp; R&amp;D</span>
          </h1>
          <p className="text-sm md:text-base text-[#475569] leading-relaxed max-w-3xl font-normal">
            EVVAI Pharmaceuticals provides comprehensive end-to-end healthcare infrastructure spanning automated WHO-GMP cleanrooms, cold-chain distribution networks, analytical GLP quality testing, and contract formulation.
          </p>
        </div>

        {/* 4 Quality & Standard Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-1 shadow-xs hover:border-[#A71380]/40 transition-all">
            <span className="text-xl font-extrabold text-[#A71380]">WHO-GMP</span>
            <p className="text-xs font-bold text-[#0B2545]">Cleanroom Certified</p>
            <p className="text-[11px] text-[#475569]">ISO Class 5 &amp; 7 compounding suites</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-1 shadow-xs hover:border-[#A71380]/40 transition-all">
            <span className="text-xl font-extrabold text-[#0F766E]">2°C - 8°C</span>
            <p className="text-xs font-bold text-[#0B2545]">Cold-Chain Monitored</p>
            <p className="text-[11px] text-[#475569]">Real-time thermal data validation</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-1 shadow-xs hover:border-[#A71380]/40 transition-all">
            <span className="text-xl font-extrabold text-[#A71380]">100% Digital</span>
            <p className="text-xs font-bold text-[#0B2545]">COA Batch Clearance</p>
            <p className="text-[11px] text-[#475569]">Verifiable analytical certificates</p>
          </div>
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl space-y-1 shadow-xs hover:border-[#A71380]/40 transition-all">
            <span className="text-xl font-extrabold text-[#0B2545]">CTD / eCTD</span>
            <p className="text-xs font-bold text-[#0B2545]">Regulatory Dossiers</p>
            <p className="text-[11px] text-[#475569]">Global export tender qualification</p>
          </div>
        </div>

        {/* Detailed Service Cards Grid */}
        <div className="space-y-6 pt-2">
          <div className="border-b border-[#E2E8F0] pb-4">
            <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-widest block mb-1">
              Deep-Dive Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] tracking-tight">
              Detailed Scope of Operations &amp; Technology
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {detailedServices.map((srv, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] hover:border-[#A71380]/60 rounded-3xl p-7 space-y-5 shadow-xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Card Header: Icon + Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] flex items-center justify-center group-hover:bg-[#A71380] group-hover:text-white transition-colors duration-300 shadow-2xs">
                      {srv.icon}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A71380] bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
                      {srv.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-snug">
                      {srv.title}
                    </h3>
                    <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-widest block mt-0.5">
                      {srv.badge}
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed font-normal">
                    {srv.desc}
                  </p>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {srv.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start space-x-2 text-[11px] text-slate-600">
                        <svg className="w-3.5 h-3.5 text-[#0F766E] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/contact"
                    className="w-full text-center block text-xs font-bold text-[#0B2545] group-hover:text-[#A71380] bg-[#F8FAFC] group-hover:bg-[#F8EAF4] py-2.5 rounded-xl border border-slate-200 group-hover:border-[#F3D0E9] transition-all"
                  >
                    Inquire For Technical Dossier &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial Inquiry CTA Strip */}
        <div className="bg-[#0B2545] text-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-[#0B2545]">
          <div className="space-y-2 text-center md:text-left max-w-2xl">
            <span className="text-[10px] font-bold text-[#F3D0E9] uppercase tracking-widest bg-[#A71380] px-3 py-0.5 rounded-full border border-[#F3D0E9]/40 inline-block">
              Institutional &amp; Commercial Partnerships
            </span>
            <h3 className="text-xl md:text-3xl font-extrabold text-white">
              Partner With EVVAI Pharmaceuticals Today
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              Whether you require emergency hospital supply, high-volume generic distribution, or private label contract manufacturing, our commercial desk is ready to support your organization.
            </p>
          </div>
          <Link
            href="/contact"
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white text-xs font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-md shrink-0 flex items-center space-x-2 uppercase tracking-wider active:scale-95 border border-[#F3D0E9]/30"
          >
            <span>Inquire For Services &rarr;</span>
          </Link>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};


