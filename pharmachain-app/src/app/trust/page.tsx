"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";

export default function TrustPage() {
  const certifications = [
    {
      title: "WHO-GMP Certified",
      subtitle: "World Health Organization",
      desc: "Zero-defect Good Manufacturing Practices certification for oral solids, syrups, and sterile injectable cleanroom lines.",
      badge: "WHO-GMP",
      validity: "Valid through 2028",
      accentBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: "ISO 9001:2015",
      subtitle: "Quality Management System",
      desc: "Internationally audited quality management system governing raw material testing, in-process controls, and batch release.",
      badge: "ISO 9001",
      validity: "Certified QMS",
      accentBg: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: "US-FDA Compliant Line",
      subtitle: "Regulatory Standard",
      desc: "Advanced equipment validation, electronic batch records (21 CFR Part 11), and aseptic cleanroom environmental controls.",
      badge: "FDA Line",
      validity: "Audited Equipment Line",
      accentBg: "bg-[#0b2341] text-white border-slate-700",
    },
    {
      title: "GLP Accredited Analytical Labs",
      subtitle: "Good Laboratory Practice",
      desc: "In-house analytical chemistry, HPLC, GC-MS testing, stability chambers, and raw material purity verification.",
      badge: "GLP Lab",
      validity: "NABL Accredited",
      accentBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    },
    {
      title: "Halal & Purity Verified",
      subtitle: "Global Product Standard",
      desc: "Strictly verified vegetarian HPMC capsule sourcing and ingredient purity certification for global export markets.",
      badge: "Halal",
      validity: "Global Verified",
      accentBg: "bg-teal-50 text-teal-800 border-teal-200",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        {/* Page Hero Banner */}
        <div className="bg-[#0b2341] text-white rounded-3xl p-8 md:p-14 space-y-4 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-block bg-emerald-500/30 text-emerald-200 text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border border-emerald-400/30">
              Quality Assurance & Regulatory Compliance
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Unyielding Batch Quality & Global Regulatory Standards
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
              Every formulation batch undergoes rigorous 3-tier testing before receiving a Certificate of Analysis (COA) for dispatch to hospitals and distributors worldwide.
            </p>
          </div>
        </div>

        {/* Quality Policy & Testing Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Zero-Defect Commitment
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0b2341] tracking-tight">
              Rigorous Analytical Testing & In-Process Quality Controls
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
              Our QA/QC analytical division utilizes state-of-the-art HPLC (High-Performance Liquid Chromatography), FTIR spectroscopy, and bio-burden testing to guarantee molecule purity and dosage uniformity across all batches.
            </p>

            <div className="space-y-2.5 pt-2 text-xs font-bold text-slate-700">
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</div>
                <span>Raw material API quarantine & spectrographic identity testing</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</div>
                <span>In-process weight, hardness, disintegration, and dissolution profiling</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">✓</div>
                <span>Complete CTD regulatory dossier & Certificate of Analysis (COA) generation</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-extrabold text-[#0b2341] border-b border-slate-100 pb-2">
              Request Quality Audit / COA Dossier
            </h3>
            <p className="text-xs text-slate-500">
              Hospital procurement boards and global distributors can request certified batch test records directly.
            </p>
            <Link
              href="/contact"
              className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 block text-center"
            >
              <span>Submit QA Dossier Request</span>
            </Link>
          </div>
        </div>

        {/* 5 Certifications Cards */}
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-black text-[#0b2341] tracking-tight">Accreditations & Regulatory Certifications</h2>
            <p className="text-xs text-slate-500">Certified by international health authorities for global pharmaceutical distribution.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, idx) => (
              <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${cert.accentBg}`}>
                      {cert.badge}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">{cert.validity}</span>
                  </div>

                  <h3 className="text-lg font-black text-[#0b2341]">{cert.title}</h3>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">{cert.subtitle}</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{cert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
