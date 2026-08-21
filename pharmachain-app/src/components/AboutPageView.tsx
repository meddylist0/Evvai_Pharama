"use client";

import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";

export const AboutPageView: React.FC = () => {
  const milestones = [
    { year: "2012", title: "Foundation & Cleanroom Commissioning", desc: "Established state-of-the-art solid oral dosage facility in Hyderabad." },
    { year: "2016", title: "WHO-GMP & ISO 9001 Certification", desc: "Achieved international accreditation for zero-defect batch production." },
    { year: "2020", title: "Injectable & Sterile Liquid Line Expansion", desc: "Commissioned high-speed robotic aseptic vial & ampoule filling lines." },
    { year: "2026", title: "Digital Supply Chain & Global B2B Integration", desc: "Launched automated GST billing, distributor credit tracking, and export dossier portal." },
  ];

  const pillars = [
    {
      title: "Cleanroom Excellence",
      icon: "🔬",
      desc: "ISO Class 5 & 7 aseptic cleanrooms equipped with positive pressure HVAC, HEPA filtration, and automated particle monitoring.",
    },
    {
      title: "Regulatory Compliance",
      icon: "📜",
      desc: "Full CTD & eCTD regulatory dossier support for international health authority filings across 50+ export destinations.",
    },
    {
      title: "Analytical QA/QC",
      icon: "🧪",
      desc: "In-house GLP accredited analytical labs featuring HPLC, GC-MS, and real-time stability testing chambers.",
    },
    {
      title: "Cold-Chain Logistics",
      icon: "❄️",
      desc: "Temperature-controlled automated packaging and real-time IoT thermal logging for sensitive injectables & syrups.",
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
              About EVVAI Pharmaceuticals
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Pioneering Quality & Care in Pharmaceutical Solutions
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
              Evvai Pharmaceuticals is a leading provider of safe, effective, and high-quality medicines and healthcare products committed to patient care and better health.
            </p>
          </div>
        </div>

        {/* Company Overview & Mission Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Our Vision & Mission
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0b2341] tracking-tight">
              Your Cure is Our Medicine
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
              Founded with the commitment to deliver trusted medicines with uncompromised quality, EVVAI Pharmaceuticals operates modern facilities ensuring safety, purity, and product effectiveness.
            </p>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
              We serve hospital networks, retail pharmacy chains, contract manufacturing partners, and global government health tenders across 50+ countries with unyielding adherence to WHO-GMP and US-FDA standards.
            </p>

            <div className="pt-2 flex items-center space-x-4 text-xs font-bold text-[#0b2341]">
              <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-4 text-center flex-1">
                <span className="text-2xl font-black text-[#0b2341] block">500M+</span>
                <span className="text-[11px] text-slate-500 font-semibold">Annual Doses</span>
              </div>
              <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-4 text-center flex-1">
                <span className="text-2xl font-black text-emerald-700 block">50+</span>
                <span className="text-[11px] text-slate-500 font-semibold">Export Nations</span>
              </div>
              <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-4 text-center flex-1">
                <span className="text-2xl font-black text-blue-600 block">100%</span>
                <span className="text-[11px] text-slate-500 font-semibold">WHO-GMP Compliant</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-slate-200 shadow-2xs">
            <img
              src="/images/pharma_qa_lab.jpg"
              alt="PharmaChain QA Facility"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 4 Pillars of Excellence */}
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-black text-[#0b2341] tracking-tight">Our Core Manufacturing Pillars</h2>
            <p className="text-xs text-slate-500">Built upon strict quality assurance and continuous technology upgrades.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pil, idx) => (
              <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-3 shadow-2xs hover:shadow-xs transition-all">
                <div className="text-3xl">{pil.icon}</div>
                <h3 className="text-base font-bold text-[#0b2341]">{pil.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{pil.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones & History Timeline */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-black text-[#0b2341] tracking-tight">Enterprise Growth Milestones</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((ms, idx) => (
              <div key={idx} className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-2">
                <span className="text-xl font-black text-blue-600 block">{ms.year}</span>
                <h4 className="text-xs font-bold text-[#0b2341]">{ms.title}</h4>
                <p className="text-[11px] text-slate-500 font-normal leading-relaxed">{ms.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Strip */}
        <div className="bg-[#0b2341] text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">Interested in Contract Manufacturing or Bulk B2B Orders?</h3>
            <p className="text-xs text-slate-300">Submit your formulation inquiry to our commercial technical desk.</p>
          </div>
          <Link
            href="/contact"
            className="bg-white hover:bg-slate-100 text-[#0b2341] px-6 py-3 rounded-xl font-extrabold text-xs transition-all shadow-xs shrink-0"
          >
            Contact Commercial Desk &rarr;
          </Link>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};
