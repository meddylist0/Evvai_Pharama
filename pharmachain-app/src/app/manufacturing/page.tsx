"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";

export default function ManufacturingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [dosageForm, setDosageForm] = useState("tablets");
  const [batchVolume, setBatchVolume] = useState(100000);

  const services = [
    {
      id: "wholesale",
      title: "EVVAI Brand B2B Wholesale Supply",
      subtitle: "High-Volume Commercial Distribution",
      badge: "B2B Wholesale Supply",
      capacity: "50+ Branded Formulations",
      imgUrl: "/syntalab_research_tubes.jpg",
      desc: "Direct procurement of EVVAI-branded oral solid tablets, capsules, liquid syrups, and sterile injectables for hospital networks, pharmacy chains, and stockists with guaranteed WHO-GMP quality.",
      specs: [
        "Direct manufacturer wholesale pricing tiers",
        "Digital COA dossier attached to every invoice",
        "Flexible batch size ordering & credit terms",
        "Regulated stock replenishment within 48-72 hours"
      ],
      stats: { label: "Batch Lead Time", value: "< 48 Hours", status: "FAST FULFILLMENT" },
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: "contract",
      title: "Contract Manufacturing & Private Label",
      subtitle: "WHO-GMP Audited Production Lines",
      badge: "Contract Production",
      capacity: "Custom Batch Runs",
      imgUrl: "/images/pharma_cleanroom_exact.jpg",
      desc: "End-to-end contract manufacturing, formulation scaling, custom blister/bottle packaging, and CTD regulatory dossier filings under strict EVVAI Pharma quality governance.",
      specs: [
        "Audited WHO-GMP cleanroom partner facilities",
        "Custom solid oral & liquid compounding runs",
        "Private label blister, strip, and bottle packaging",
        "Complete CTD dossier support for drug registration"
      ],
      stats: { label: "Quality Audit Rating", value: "99.8%", status: "WHO-GMP VERIFIED" },
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: "testing",
      title: "Analytical QA & Batch COA Clearance",
      subtitle: "GLP Purity & Dissolution Testing",
      badge: "Zero-Defect Quality",
      capacity: "100% Batch Clearance",
      imgUrl: "/images/pharma_qa_lab.jpg",
      desc: "Every batch of EVVAI Pharma medicines undergoes spectrographic HPLC testing, dissolution profiling, and digital Certificate of Analysis (COA) verification prior to commercial dispatch.",
      specs: [
        "In-house GLP analytical chemistry laboratory",
        "HPLC & FTIR spectrographic purity clearance",
        "Accelerated stability & bio-burden testing",
        "Downloadable digital COA dossiers"
      ],
      stats: { label: "Batch Defect Rate", value: "0.00%", status: "GLP ACCREDITED" },
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: "logistics",
      title: "Cold-Chain & Institutional Supply",
      subtitle: "Regulated Supply Chain Logistics",
      badge: "Institutional Logistics",
      capacity: "24/7 Priority Dispatch",
      imgUrl: "/syntalab_research_tubes.jpg",
      desc: "Temperature-monitored cold-chain shipping, central warehouse storage, and complete compliance documentation for institutional hospital tenders and export markets.",
      specs: [
        "Continuous 2-8°C cold-chain telemetry tracking",
        "Hospital ICU & critical care priority dispatch",
        "Global export tender documentation support",
        "Central climate-controlled distribution hubs"
      ],
      stats: { label: "On-Time Fulfillment", value: "99.4%", status: "COLD-CHAIN SECURE" },
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  const highlights = [
    {
      value: "50M+ Units",
      label: "Annual Supply Volume",
      desc: "High-potency oral solid tablets, HPMC capsules, and sterile injectables.",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      value: "WHO-GMP & ISO",
      label: "Quality Accredited",
      desc: "Audited manufacturing lines adhering to international WHO-GMP standards.",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      value: "100% Digital COA",
      label: "Batch Traceability",
      desc: "Spectrographic HPLC testing and digital Certificate of Analysis for every run.",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      value: "< 48 Hours",
      label: "Rapid B2B Fulfillment",
      desc: "Direct B2B ordering and batch dispatch tracking for pharmacy networks.",
      iconSvg: (
        <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
  ];

  const workflowSteps = [
    { step: "01", title: "Active API Audit & Sourcing", desc: "Procuring 99.9% pure active ingredients from ISO certified global suppliers.", parameter: "API Purity 99.9%" },
    { step: "02", title: "WHO-GMP Contract Production", desc: "Precision compounding in positive-pressure cleanroom suites under EVVAI governance.", parameter: "cGMP Cleanroom" },
    { step: "03", title: "GLP Spectrographic Clearance", desc: "Comprehensive HPLC, FTIR, and dissolution testing before issuing a digital COA.", parameter: "HPLC Clearance" },
    { step: "04", title: "Serial Barcode Packaging", desc: "Tamper-evident blister packaging with trackable batch QR coding and security seals.", parameter: "Batch QR Code" },
    { step: "05", title: "B2B Commercial Dispatch", desc: "Streamlined logistics fulfillment to healthcare networks, pharmacies, and stockists.", parameter: "Priority Delivery" },
  ];

  const currentService = services[activeTab];

  const getEstimatedLeadTime = () => {
    if (batchVolume <= 50000) return "3 to 5 Business Days";
    if (batchVolume <= 200000) return "7 to 10 Business Days";
    return "12 to 15 Business Days";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FA] text-[#0F172A] font-sans">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1 w-full space-y-12 relative z-10">

        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-2 text-xs text-[#475569] font-medium pt-2">
          <Link href="/" className="hover:text-[#A71380] transition-colors flex items-center space-x-1">
            <svg className="w-3.5 h-3.5 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[#0B2545] font-bold">Services &amp; B2B Supply Network</span>
        </nav>

        {/* PAGE HERO BANNER */}
        <div className="bg-[#0B2545] text-white rounded-3xl p-8 md:p-14 space-y-4 shadow-md relative overflow-hidden animate-fade-up">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-block bg-[#A71380]/30 text-[#F3D0E9] text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full border border-[#A71380]/60 backdrop-blur-xs">
              EVVAI PHARMA • B2B SERVICES &amp; CONTRACT SUPPLY
            </span>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              EVVAI Brand B2B Commercial Supply &amp; Contract Manufacturing Services
            </h1>

            <p className="text-sm md:text-base text-slate-200 leading-relaxed font-normal">
              Combining trusted EVVAI brand formulations with WHO-GMP audited contract manufacturing lines, GLP analytical purity clearance, and direct B2B wholesale distribution for healthcare institutions.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/register?role=distributor"
                className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 flex items-center space-x-2"
              >
                <span>B2B Distributor Portal Access</span>
                <span>&rarr;</span>
              </Link>
              <a
                href="#estimator"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-xs flex items-center space-x-2"
              >
                <span>Quick Lead Time Estimator</span>
                <span>↓</span>
              </a>
            </div>
          </div>
        </div>

        {/* 4 GLOBAL IMPACT HIGHLIGHT STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E2E8F0] hover:border-[#A71380] rounded-2xl p-5 space-y-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#A71380] tracking-tight font-sans uppercase">
                  {item.value}
                </span>
                <div className="p-2 bg-[#F8EAF4] rounded-xl border border-[#F3D0E9] text-[#A71380] group-hover:bg-[#A71380] group-hover:text-white transition-colors">
                  {item.iconSvg}
                </div>
              </div>
              <h4 className="text-xs font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-snug">
                {item.label}
              </h4>
              <p className="text-[11px] text-[#475569] leading-relaxed font-normal">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* CORE CAPABILITIES SECTION */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#A71380] bg-[#F8EAF4] px-3.5 py-1 rounded-md border border-[#F3D0E9]">
                B2B SERVICES &amp; SOLUTIONS
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B2545] tracking-tight mt-3">
                Core EVVAI Brand Services
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] max-w-2xl mt-1">
                Explore our commercial supply, contract manufacturing, and analytical QA services.
              </p>
            </div>

            <Link
              href="/contact"
              className="text-xs font-bold text-[#A71380] hover:text-[#8E0F6D] transition-colors inline-flex items-center space-x-1 shrink-0"
            >
              <span>Inquire Commercial Terms</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Horizontal Interactive Tab Selector */}
          <div className="flex flex-wrap gap-2.5">
            {services.map((srv, index) => {
              const isActive = index === activeTab;
              return (
                <button
                  key={srv.id}
                  onClick={() => setActiveTab(index)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-3 ${
                    isActive
                      ? "bg-[#0B2545] text-white shadow-xs"
                      : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isActive ? "bg-white/15 text-white" : "bg-[#F8EAF4] text-[#A71380]"}`}>
                    {srv.iconSvg}
                  </div>
                  <span>{srv.title.split(" &")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Active Capability Showcase Panel */}
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 md:p-12 shadow-sm relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">

              {/* Left Column: Details & Specs */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <div className="inline-flex items-center space-x-2 bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] px-3.5 py-1 rounded-full text-xs font-bold mb-3">
                    <span>{currentService.badge}</span>
                    <span>•</span>
                    <span className="font-mono text-[#A71380]">{currentService.capacity}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] tracking-tight leading-snug">
                    {currentService.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-[#A71380] mt-1">
                    {currentService.subtitle}
                  </p>
                </div>

                <p className="text-[#475569] text-xs sm:text-sm leading-relaxed">
                  {currentService.desc}
                </p>

                {/* Specs Checklist */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-[#0B2545] uppercase tracking-widest flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-[#A71380] rounded-full" />
                    <span>Quality &amp; Service Deliverables</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentService.specs.map((spec, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#0F172A]"
                      >
                        <svg className="w-4 h-4 text-[#A71380] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Telemetry Performance Card */}
              <div className="lg:col-span-5 bg-[#0B2545] text-white rounded-3xl p-8 space-y-6 shadow-md border border-[#0B2545]">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Service Telemetry</span>
                  <span className="text-[10px] font-mono bg-[#A71380]/30 text-[#F3D0E9] px-2.5 py-0.5 rounded border border-[#A71380]/60">
                    {currentService.stats.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                      {currentService.stats.label}
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#F3D0E9] font-mono mt-1 block">
                      {currentService.stats.value}
                    </span>
                  </div>

                  <div className="bg-[#07192e] p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>Service Compliance Score</span>
                      <span className="text-[#F3D0E9] font-mono">99.9%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#A71380] to-[#F3D0E9] rounded-full w-[99.9%]" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href="/contact"
                    className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl block text-center shadow-xs transition-all cursor-pointer"
                  >
                    Inquire For Custom Batch Run &rarr;
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 5-STEP ZERO DEFECT SUPPLY WORKFLOW */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#A71380] bg-[#F8EAF4] px-3.5 py-1 rounded-md border border-[#F3D0E9]">
                MANUFACTURING WORKFLOW
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B2545] tracking-tight mt-3">
                5-Step Zero-Defect Supply Protocol
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] max-w-2xl mt-1">
                End-to-end quality assurance from raw API audit to batch COA clearance &amp; cold-chain dispatch.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {workflowSteps.map((st, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E2E8F0] hover:border-[#A71380] rounded-2xl p-5 space-y-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm group cursor-pointer relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-[#A71380] bg-[#F8EAF4] px-2.5 py-1 rounded-md border border-[#F3D0E9]">
                    {st.step}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Step {idx + 1}</span>
                </div>

                <h4 className="text-xs font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-snug pt-1">
                  {st.title}
                </h4>

                <p className="text-[11px] text-[#475569] leading-relaxed font-normal">
                  {st.desc}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    ✓ {st.parameter}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CLEAN, SIMPLE & USER-FRIENDLY B2B ORDER ESTIMATOR */}
        <div id="estimator" className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 md:p-10 space-y-6 shadow-sm">
          {/* Header */}
          <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#A71380] uppercase tracking-widest bg-[#F8EAF4] px-3.5 py-1 rounded-full border border-[#F3D0E9] inline-block">
                B2B ORDER ESTIMATOR
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2545] tracking-tight mt-2">
                Estimate Delivery &amp; Batch Lead Time
              </h2>
            </div>
            <p className="text-xs text-[#475569] max-w-sm">
              Select your medicine type and order quantity to see estimated delivery times.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Side: Simple Inputs */}
            <div className="lg:col-span-7 space-y-6">

              {/* 1. Medicine Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-[#0B2545] uppercase tracking-wider">
                  1. Select Medicine Form:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "tablets", label: "Tablets", icon: "💊" },
                    { id: "capsules", label: "Capsules", icon: "💊" },
                    { id: "syrups", label: "Syrups", icon: "🧪" },
                    { id: "injectables", label: "Injectables", icon: "💉" },
                  ].map((df) => {
                    const selected = dosageForm === df.id;
                    return (
                      <button
                        key={df.id}
                        type="button"
                        onClick={() => setDosageForm(df.id)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                          selected
                            ? "bg-[#A71380] text-white border-[#A71380] shadow-xs"
                            : "bg-[#F8FAFC] text-[#0B2545] border-[#E2E8F0] hover:border-[#A71380]"
                        }`}
                      >
                        <span className="text-base">{df.icon}</span>
                        <span>{df.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quantity Selector */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-extrabold text-[#0B2545] uppercase tracking-wider">
                    2. Select Quantity (Units):
                  </label>
                  <span className="font-mono text-sm font-extrabold text-[#A71380] bg-[#F8EAF4] px-3 py-0.5 rounded-lg border border-[#F3D0E9]">
                    {batchVolume.toLocaleString()} Units
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="10000"
                  max="500000"
                  step="10000"
                  value={batchVolume}
                  onChange={(e) => setBatchVolume(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#A71380]"
                />

                {/* Quick Presets */}
                <div className="flex items-center space-x-2 pt-1 text-xs">
                  <span className="text-[11px] text-[#475569] font-medium">Quick Select:</span>
                  {[
                    { label: "10,000", val: 10000 },
                    { label: "100,000", val: 100000 },
                    { label: "500,000", val: 500000 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setBatchVolume(preset.val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        batchVolume === preset.val
                          ? "bg-[#0B2545] text-white border-[#0B2545]"
                          : "bg-white text-[#475569] border-[#E2E8F0] hover:bg-slate-50"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Side: Clean Result Box */}
            <div className="lg:col-span-5 bg-[#F8EAF4]/60 border border-[#F3D0E9] rounded-2xl p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-wider block">
                  Estimated Delivery Lead Time
                </span>
                <span className="text-2xl font-extrabold text-[#0B2545] font-mono block">
                  {getEstimatedLeadTime()}
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#F3D0E9] text-[#0B2545]">
                <div className="flex items-center space-x-2">
                  <span className="text-[#A71380] font-bold">✓</span>
                  <span className="font-semibold">Digital COA Certificate Included</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[#A71380] font-bold">✓</span>
                  <span className="font-semibold">WHO-GMP Compliant Packaging</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[#A71380] font-bold">✓</span>
                  <span className="font-semibold">Direct Dispatch Tracking</span>
                </div>
              </div>

              <Link
                href={`/contact?subject=Bulk+Order+Inquiry+${dosageForm}+${batchVolume}`}
                className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wide block text-center shadow-xs transition-all cursor-pointer"
              >
                Request Price Quote &rarr;
              </Link>
            </div>

          </div>
        </div>

        {/* B2B PORTAL ACCESS BANNER */}
        <div className="bg-[#0B2545] rounded-2xl p-6 sm:p-8 text-white border border-[#0B2545] shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
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

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link
              href="/register?role=customer"
              className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-5 py-3 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all shadow-xs flex items-center space-x-1.5"
            >
              <span>Healthcare Buyer Sign In</span>
              <span>&rarr;</span>
            </Link>

            <Link
              href="/register?role=distributor"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-5 py-3 rounded-xl text-xs font-extrabold tracking-wide uppercase transition-all shadow-2xs backdrop-blur-xs flex items-center space-x-1.5"
            >
              <span>B2B Distributor Portal</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

      </main>

      <FooterSection />
    </div>
  );
}
