"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";

export default function TrustPage() {
  const [dossierType, setDossierType] = useState("COA");
  const [requested, setRequested] = useState(false);

  const certifications = [
    {
      title: "WHO-GMP Certified Line",
      subtitle: "World Health Organization Standard",
      desc: "Zero-defect Good Manufacturing Practices certification for oral solids, syrups, and sterile injectable cleanroom contract lines.",
      badge: "WHO-GMP",
      validity: "Audited & Certified",
      accentBg: "bg-[#E8F6F4]",
      accentText: "text-[#0F766E]",
      accentBorder: "border-[#BDE8E3]",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "ISO 9001:2015",
      subtitle: "Quality Management System",
      desc: "Internationally audited quality management system governing raw material testing, in-process controls, and batch clearance.",
      badge: "ISO 9001",
      validity: "QMS Certified",
      accentBg: "bg-[#F8EAF4]",
      accentText: "text-[#A71380]",
      accentBorder: "border-[#F3D0E9]",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: "US-FDA Compliant Facility",
      subtitle: "Regulatory Equipment Standard",
      desc: "Advanced equipment validation, electronic batch records (21 CFR Part 11), and aseptic cleanroom environmental controls.",
      badge: "FDA Standard",
      validity: "21 CFR Compliant",
      accentBg: "bg-[#F8EAF4]",
      accentText: "text-[#A71380]",
      accentBorder: "border-[#F3D0E9]",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      title: "GLP Accredited Analytical Lab",
      subtitle: "Good Laboratory Practice",
      desc: "In-house analytical chemistry, HPLC, GC-MS testing, stability chambers, and raw material purity verification for every EVVAI batch.",
      badge: "GLP Accredited",
      validity: "GLP Certified",
      accentBg: "bg-[#E8F6F4]",
      accentText: "text-[#0F766E]",
      accentBorder: "border-[#BDE8E3]",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      title: "Halal & Purity Verified",
      subtitle: "Global Product Standard",
      desc: "Strictly verified vegetarian HPMC capsule sourcing and ingredient purity certification for global export markets.",
      badge: "Halal Verified",
      validity: "Global Export Certified",
      accentBg: "bg-[#F8EAF4]",
      accentText: "text-[#A71380]",
      accentBorder: "border-[#F3D0E9]",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V7a2 2 0 00-2-2h-1.5a.5.5 0 01-.5-.5V3.935M16.5 16.5A6.5 6.5 0 1111 4.5" />
        </svg>
      ),
    },
    {
      title: "CTD Regulatory Dossiers",
      subtitle: "Drug Registration Documents",
      desc: "Complete Common Technical Document (CTD) format filings ready for hospital procurement and health authority approvals.",
      badge: "CTD Filing",
      validity: "Dossier Ready",
      accentBg: "bg-[#E8F6F4]",
      accentText: "text-[#0F766E]",
      accentBorder: "border-[#BDE8E3]",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const qualityPillars = [
    {
      title: "100% Digital COA",
      desc: "Spectrographic HPLC testing & Certificate of Analysis issued for every batch.",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: "WHO-GMP Audited",
      desc: "Partner facilities operate under strict cGMP cleanroom environmental controls.",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Serial Lot Traceability",
      desc: "Barcoded blister packaging with trackable serial batch QR codes.",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      title: "24/7 QA Support",
      desc: "Dedicated quality desk for hospital procurement boards and distributors.",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 me-1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FA] text-[#0F172A] font-sans">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1 w-full space-y-10 relative z-10">

        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-2 text-xs text-[#475569] font-medium pt-2">
          <Link href="/" className="hover:text-[#A71380] transition-colors flex items-center space-x-1">
            <svg className="w-3.5 h-3.5 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[#0B2545] font-bold">Quality &amp; Compliance</span>
        </nav>

        {/* PAGE HERO BANNER */}
        <div className="bg-[#0B2545] text-white rounded-3xl p-8 md:p-12 space-y-4 shadow-md relative overflow-hidden animate-fade-up">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-block bg-[#A71380]/30 text-[#F3D0E9] text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full border border-[#A71380]/60 backdrop-blur-xs">
              QUALITY ASSURANCE &amp; COMPLIANCE
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Zero-Defect Quality &amp; Global Accreditations
            </h1>
            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-normal">
              Every EVVAI Pharma formulation batch undergoes rigorous spectrographic testing before receiving a digital Certificate of Analysis (COA) for hospital and B2B dispatch.
            </p>
          </div>
        </div>

        {/* 4 QUICK QA PILLARS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {qualityPillars.map((pil, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E2E8F0] hover:border-[#A71380] rounded-2xl p-5 space-y-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="p-2 bg-[#F8EAF4] rounded-xl border border-[#F3D0E9] text-[#A71380] group-hover:bg-[#A71380] group-hover:text-white transition-colors">
                  {pil.iconSvg}
                </div>
                <span className="text-[10px] font-extrabold text-[#A71380] bg-[#F8EAF4] px-2.5 py-0.5 rounded-full border border-[#F3D0E9]">
                  Verified Standard
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-snug pt-1">
                {pil.title}
              </h3>
              <p className="text-[11px] text-[#475569] leading-relaxed font-normal">
                {pil.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 6 ACCREDITATIONS & CERTIFICATIONS GRID */}
        <div className="space-y-6">
          <div className="border-b border-[#E2E8F0] pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#A71380] uppercase tracking-widest bg-[#F8EAF4] px-3.5 py-1 rounded-full border border-[#F3D0E9] inline-block">
                GLOBAL COMPLIANCE
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2545] tracking-tight mt-2">
                Accreditations &amp; Quality Certifications
              </h2>
            </div>
            <p className="text-xs text-[#475569] max-w-md">
              Certified by international health authorities for commercial distribution and tender supply.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] hover:border-[#A71380] rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${cert.accentBg} ${cert.accentText} ${cert.accentBorder}`}>
                      {cert.badge}
                    </span>
                    <div className="p-2 bg-[#F8EAF4] rounded-xl border border-[#F3D0E9] text-[#A71380] group-hover:bg-[#A71380] group-hover:text-white transition-colors">
                      {cert.iconSvg}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-[#0B2545] group-hover:text-[#A71380] transition-colors">
                      {cert.title}
                    </h3>
                    <span className="text-[10px] font-bold text-[#A71380] block mt-0.5">
                      {cert.subtitle}
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] leading-relaxed font-normal">
                    {cert.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-[#0F766E]">{cert.validity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CLEAN USER-FRIENDLY COA DOSSIER REQUEST FORM */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 md:p-10 space-y-6 shadow-sm">
          <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#A71380] uppercase tracking-widest bg-[#F8EAF4] px-3.5 py-1 rounded-full border border-[#F3D0E9] inline-block">
                DOCUMENTATION DESK
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2545] tracking-tight mt-2">
                Request Quality Audit &amp; COA Dossier
              </h2>
            </div>
            <p className="text-xs text-[#475569] max-w-sm">
              Hospital procurement boards &amp; distributors can request official batch test documents directly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Side: Select Document Type */}
            <div className="lg:col-span-7 space-y-5 text-xs">
              <div className="space-y-2">
                <label className="block font-extrabold text-[#0B2545] uppercase tracking-wider">
                  Select Document Required:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "COA", label: "Certificate of Analysis (COA)", desc: "Batch test report with HPLC purity data" },
                    { id: "GMP", label: "WHO-GMP Audit Certificate", desc: "Cleanroom compliance document" },
                    { id: "CTD", label: "CTD Drug Dossier", desc: "Regulatory dossier for registration" },
                    { id: "STABILITY", label: "Stability Study Data", desc: "Accelerated & real-time stability reports" },
                  ].map((doc) => {
                    const selected = dossierType === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setDossierType(doc.id)}
                        className={`p-3.5 rounded-xl border transition-all text-left space-y-1 cursor-pointer ${selected
                          ? "bg-[#A71380] text-white border-[#A71380] shadow-xs"
                          : "bg-[#F8FAFC] text-[#0B2545] border-[#E2E8F0] hover:border-[#A71380]"
                          }`}
                      >
                        <span className="font-extrabold block text-xs">{doc.label}</span>
                        <span className={`text-[10px] block ${selected ? "text-[#F3D0E9]" : "text-[#475569]"}`}>
                          {doc.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Side: Simple Action Box */}
            <div className="lg:col-span-5 bg-[#F8EAF4]/70 border border-[#F3D0E9] rounded-2xl p-6 space-y-4 text-xs">
              {requested ? (
                <div className="text-center space-y-2 py-3">
                  <div className="w-10 h-10 bg-[#A71380] text-white rounded-full mx-auto flex items-center justify-center font-bold text-base">
                    ✓
                  </div>
                  <h4 className="font-extrabold text-[#0B2545] text-sm">Request Submitted!</h4>
                  <p className="text-slate-600 text-[11px]">
                    Our QA compliance desk will review and email your dossier within 24 hours.
                  </p>
                  <button
                    onClick={() => setRequested(false)}
                    className="text-[11px] font-bold text-[#A71380] hover:underline block mx-auto pt-1 cursor-pointer"
                  >
                    Request another document
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-wider block">
                      QA Desk Direct Dispatch
                    </span>
                    <h4 className="text-base font-extrabold text-[#0B2545]">
                      Request {dossierType} Document File
                    </h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Instant verification for hospitals, clinic networks, and wholesale partners.
                    </p>
                  </div>

                  <Link
                    href={`/contact?subject=Request+${dossierType}+Dossier`}
                    className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wide block text-center shadow-xs transition-all cursor-pointer"
                  >
                    Submit QA Request &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

      </main>

      <FooterSection />
    </div>
  );
}
