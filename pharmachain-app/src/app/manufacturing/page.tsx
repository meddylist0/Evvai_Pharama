"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";

export default function ManufacturingPage() {
  const processSteps = [
    {
      step: "01",
      title: "API Quarantine & Spectrographic Testing",
      desc: "Every raw active pharmaceutical ingredient (API) undergoes HPLC purity verification and spectrographic quarantine before cleanroom release.",
    },
    {
      step: "02",
      title: "Cleanroom Compounding & Granulation",
      desc: "Formulations are compounded in 316L stainless steel vessels operating under positive pressure HVAC and ISO Class 7 air filtration.",
    },
    {
      step: "03",
      title: "High-Speed Compression & Aseptic Filling",
      desc: "Automated rotary presses compress tablets up to 250M units/year, while sterile vials are filled inside ISO Class 5 isolator cleanrooms.",
    },
    {
      step: "04",
      title: "Online Laser Inspection & Blister Packing",
      desc: "100% optical camera inspection and online laser weight checking ensure zero empty pockets or defective sealings in blister strips.",
    },
    {
      step: "05",
      title: "COA Release & Cold-Chain Dispatch",
      desc: "Final QC batch release generates a verified Certificate of Analysis (COA) for temperature-monitored global shipment.",
    },
  ];

  const capabilities = [
    {
      title: "Solid Oral Dosage (Tablets)",
      capacity: "250 Million Units / Year",
      desc: "Bilayer tablet compression, sublingual delivery, and film/enteric coating lines operating under positive HVAC pressure.",
      badge: "High-Volume Tablet Press",
    },
    {
      title: "Encapsulation (Gelatin & HPMC)",
      capacity: "120 Million Capsules / Year",
      desc: "Precision capsule filling for powder, pellet, and liquid-filled hard gelatin and vegetarian HPMC capsules.",
      badge: "Capsule Filling Line",
    },
    {
      title: "Liquid Orals & Syrups",
      capacity: "80 Million Bottles / Year",
      desc: "Automated compounding tanks, sterile filtration, volumetric liquid filling, measuring cap placement, and induction sealing.",
      badge: "Bottling & Liquid Line",
    },
    {
      title: "Sterile Injectable Vials & Ampoules",
      capacity: "50 Million Vials / Year",
      desc: "ISO Class 5 isolator cleanrooms for liquid injectables, lyophilized powders, and pre-filled syringes.",
      badge: "Sterile Cleanroom Line",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        {/* Page Hero Banner */}
        <div className="bg-[#0b2341] text-white rounded-3xl p-8 md:p-14 space-y-4 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="inline-block bg-blue-500/30 text-blue-200 text-xs font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full border border-blue-400/30">
              Manufacturing Philosophy & Infrastructure
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Why & How We Manufacture Essential Formulations
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
              Our purpose is simple: to manufacture zero-defect essential medicines at scale with unyielding WHO-GMP quality compliance, supplying hospitals, stockists, and global health networks.
            </p>
          </div>
        </div>

        {/* Why Partner With PharmaChain Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Purpose & Quality Assurance
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0b2341] tracking-tight">
              State-of-the-Art Cleanroom Automation (150,000 Sq. Ft.)
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
              Pharmaceutical manufacturing requires absolute precision. We operate 150,000 sq. ft. of cleanroom space featuring positive HVAC air pressure differentials, continuous HEPA particle monitoring, and 316L stainless steel piping to eliminate cross-contamination risks.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2 text-xs font-bold text-[#0b2341]">
              <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-4">
                <span className="text-xl font-black text-[#0b2341] block">ISO Class 5 & 7</span>
                <span className="text-[11px] text-slate-500 font-semibold">Aseptic Environments</span>
              </div>
              <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-4">
                <span className="text-xl font-black text-emerald-700 block">0.00%</span>
                <span className="text-[11px] text-slate-500 font-semibold">Cross-Contamination Rate</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xs h-80 lg:h-96 relative bg-slate-100">
            <img
              src="/images/pharma_cleanroom_exact.jpg"
              alt="Pharma Cleanroom Robotic Line"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 5-Step Manufacturing Process Timeline */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-8 space-y-6">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider">Quality Process Pipeline</span>
            <h2 className="text-xl font-black text-[#0b2341] tracking-tight">Our 5-Step Automated Production Pipeline</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {processSteps.map((ps, idx) => (
              <div key={idx} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-2xl font-black text-blue-600 block font-mono">{ps.step}</span>
                  <h4 className="text-xs font-bold text-[#0b2341]">{ps.title}</h4>
                  <p className="text-[11px] text-slate-500 font-normal leading-relaxed">{ps.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Dosage Form Capacities */}
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-black text-[#0b2341] tracking-tight">Production Line Capacities</h2>
            <p className="text-xs text-slate-500">Dedicated cleanrooms for high-potency molecules, capsules, liquid orals, and injectables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((cap, idx) => (
              <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#0b2341] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      {cap.badge}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">{cap.capacity}</span>
                  </div>

                  <h3 className="text-lg font-black text-[#0b2341]">{cap.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Manufacturing CTA Strip */}
        <div className="bg-[#0b2341] text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Require Third-Party Contract Manufacturing or Custom Formulations?</h3>
            <p className="text-xs text-slate-300">Partner with EVVAI Pharmaceuticals for formulation development, packaging, and regulatory filing support.</p>
          </div>
          <Link
            href="/contact"
            className="bg-white hover:bg-slate-100 text-[#0b2341] px-6 py-3 rounded-xl font-extrabold text-xs transition-all shadow-xs shrink-0"
          >
            Request Manufacturing Quote &rarr;
          </Link>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
