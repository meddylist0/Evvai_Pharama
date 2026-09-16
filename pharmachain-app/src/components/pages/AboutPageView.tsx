"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";

export const AboutPageView: React.FC = () => {
  const journeyRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const certsRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const milestones = [
    {
      year: "2012",
      title: "Foundation & Cleanroom Commissioning",
      desc: "Established modern solid oral dosage plant with positive-pressure cleanroom suites.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H7m4 0v4m0 0h4m-4 0H7" />
        </svg>
      ),
    },
    {
      year: "2016",
      title: "WHO-GMP & ISO Accreditation",
      desc: "Achieved international WHO-GMP accreditation for zero-defect batch production.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      year: "2020",
      title: "Sterile Injectables & Aseptic Expansion",
      desc: "Commissioned high-speed robotic aseptic isolator vial & ampoule filling lines.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2.25c-3.75 5.25-7.5 9-7.5 12.75a7.5 7.5 0 1015 0c0-3.75-3.75-7.5-7.5-12.75z" />
        </svg>
      ),
    },
    {
      year: "2026",
      title: "Digital Supply Chain & B2B Integration",
      desc: "Implemented batch-level FEFO traceability and digital COA clearance.",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  const companyValues = [
    {
      title: "Uncompromised Quality",
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      bg: "bg-emerald-50 border-emerald-100",
      desc: "100% analytical testing and WHO-GMP quality inspection before batch release.",
    },
    {
      title: "Patient-Centric Health",
      icon: (
        <svg className="w-6 h-6 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      bg: "bg-[#F8EAF4] border-[#F3D0E9]",
      desc: "Making reliable, high-purity medicines accessible to everyone.",
    },
    {
      title: "Regulatory Integrity",
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      bg: "bg-amber-50 border-amber-100",
      desc: "Adherence to IP/BP/USP standards with digital COA clearance.",
    },
    {
      title: "Advanced Machinery & Automation",
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bg: "bg-blue-50 border-blue-100",
      desc: "ISO Class 5 & 7 aseptic isolators, robotic filling lines and high-speed packaging.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] relative overflow-x-clip font-sans">
      <Header />

      <main className="flex-1 w-full relative z-10 pb-16">

        {/* 1. HERO SECTION (REBUILT IN HTML/CSS TO MATCH MOCKUP) */}
        <div className="relative bg-gradient-to-br from-white via-[#F4F7FA] to-[#E8F0F8] overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center">

          {/* Background Building Image (Right side) */}
          <div className="absolute top-0 right-0 w-full md:w-[60%] h-[85%] z-0 rounded-bl-[100px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F4F7FA] via-transparent to-transparent z-10" />
            <img src="/images/about-hero.png" alt="EVVAI Facility" className="w-full h-full object-cover object-right opacity-90" />
          </div>

          <div className="relative z-20 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-10 pt-8 md:pt-12 pb-32">

            {/* Left Content */}
            <div className="max-w-2xl space-y-4 md:space-y-5 w-full lg:w-[55%] mt-4 md:mt-8">


              <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest inline-block">
                TRUSTED PHARMACEUTICAL MANUFACTURER
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-[52px] font-black text-[#0B2545] leading-[1.1] tracking-tight">
                Delivering Trusted<br />
                Medicines &amp; Healthcare<br />
                Excellence <span className="text-[#A71380]">Every Day</span>
              </h1>

              <p className="text-sm md:text-[15px] text-slate-600 leading-relaxed font-normal max-w-[480px]">
                EVVAI Pharma is dedicated to producing safe, high-quality, certified healthcare products and medicines that doctors trust and patients depend on across India.
              </p>

              {/* 4 Badges */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                  <span className="text-[#A71380] bg-[#F8EAF4] p-1.5 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                  <span className="text-[10px] font-black text-[#0B2545] leading-tight">WHO-GMP<br />Certified</span>
                </div>
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                  <span className="text-teal-600 bg-teal-50 p-1.5 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></span>
                  <span className="text-[10px] font-black text-[#0B2545] leading-tight">100% Quality<br />Tested</span>
                </div>
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                  <span className="text-blue-600 bg-blue-50 p-1.5 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></span>
                  <span className="text-[10px] font-black text-[#0B2545] leading-tight">Pan-India<br />Supply</span>
                </div>
                <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                  <span className="text-pink-500 bg-pink-50 p-1.5 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></span>
                  <span className="text-[10px] font-black text-[#0B2545] leading-tight">Better Health<br />For All</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 flex flex-wrap items-center gap-6">
                <button onClick={() => scrollToSection(journeyRef)} className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-7 py-3 rounded-xl font-bold text-[13px] transition-all shadow-md hover:shadow-lg flex items-center space-x-2 cursor-pointer">
                  <span>Our Journey</span>
                  <span className="text-lg leading-none font-normal">&rarr;</span>
                </button>

                <Link href="/products" className="text-[#0B2545] hover:text-[#A71380] font-bold text-[13px] transition-colors flex items-center space-x-2 cursor-pointer group">
                  <span>Explore Our Products</span>
                  <span className="text-slate-400 group-hover:text-[#A71380] text-lg leading-none font-normal transition-colors">&rarr;</span>
                </Link>
              </div>

            </div>
          </div>

          {/* Bottom Curved Stats Bar Container (Redesigned to match mockup) */}
          <div className="absolute bottom-0 left-0 w-full z-30 flex items-end justify-between pointer-events-none">

            {/* Left side text */}
            <div className="hidden lg:flex w-[35%] pb-8 pl-4 sm:pl-6 lg:pl-10 items-center space-x-3 pointer-events-auto">
              <div className="w-8 h-[2px] bg-[#A71380]"></div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 opacity-80">Making Quality Care Accessible</span>
            </div>

            {/* Right side Pink Stats Bar */}
            <div className="w-full lg:w-[65%] flex flex-col justify-end pointer-events-auto">
              {/* Curve specifically for the right side */}
              <svg viewBox="0 0 1000 120" className="w-full h-auto text-[#A71380] fill-current drop-shadow-2xl translate-y-1" preserveAspectRatio="none">
                <path d="M0,120 C 300,120 400,10 1000,0 L1000,120 Z" />
              </svg>
              <div className="bg-[#A71380] w-full pt-1 pb-6 md:pb-8">
                <div className="flex flex-wrap items-center justify-center lg:justify-end gap-8 md:gap-16 text-white pr-4 sm:pr-6 lg:pr-10">
                  <div className="flex items-center space-x-3">
                    <svg className="w-7 h-7 md:w-8 md:h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <div>
                      <span className="font-black text-xl md:text-2xl block leading-none">500+</span>
                      <span className="text-[10px] md:text-[11px] font-medium opacity-80">Products</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-7 h-7 md:w-8 md:h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <div>
                      <span className="font-black text-xl md:text-2xl block leading-none">1,000+</span>
                      <span className="text-[10px] md:text-[11px] font-medium opacity-80">Healthcare Partners</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-7 h-7 md:w-8 md:h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <span className="font-black text-xl md:text-2xl block leading-none">13+</span>
                      <span className="text-[10px] md:text-[11px] font-medium opacity-80">Years of Trust</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Constrain subsequent sections */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-12 space-y-16">
          {/* 2. OUR STORY SECTION */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Story Text (No card background) */}
              <div className="lg:col-span-4 py-2 flex flex-col justify-center space-y-5">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#A71380] uppercase tracking-widest">
                    OUR STORY
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-[#0B2545] tracking-tight leading-[1.15]">
                    A Stronger, Healthier Tomorrow
                  </h2>
                  <p className="text-[13px] text-slate-600 leading-relaxed pt-1">
                    Founded with a vision to make high-quality medicines accessible to everyone, EVVAI Pharma has grown into a trusted pharmaceutical company, serving doctors, pharmacies and patients across India.
                  </p>
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    From essential generics to specialized formulations, we manufacture and supply medicines that meet global quality standards, helping build a healthier tomorrow.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => scrollToSection(valuesRef)}
                    className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-2 w-max"
                  >
                    <span>More About Us</span>
                    <span className="text-lg leading-none font-normal">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* Middle 3 Mission / Vision / Purpose Cards (Horizontal Layout) */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
                {/* Mission Card */}
                <div className="bg-white rounded-md p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(167,19,128,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#F8EAF4] text-[#A71380] flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="6" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-[#0B2545]">Our Mission</h3>
                    <p className="text-[11px] text-[#475569] leading-relaxed mt-2 font-medium">
                      To improve lives by providing safe, effective and affordable medicines.
                    </p>
                  </div>
                </div>

                {/* Vision Card */}
                <div className="bg-white rounded-md p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(167,19,128,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#F8EAF4] text-[#A71380] flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-[#0B2545]">Our Vision</h3>
                    <p className="text-[11px] text-[#475569] leading-relaxed mt-2 font-medium">
                      To be a globally respected company, known for quality, trust and innovation.
                    </p>
                  </div>
                </div>

                {/* Purpose Card */}
                <div className="bg-white rounded-md p-5 md:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(167,19,128,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#F8EAF4] text-[#A71380] flex items-center justify-center shrink-0">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-black text-[#0B2545]">Our Purpose</h3>
                    <p className="text-[11px] text-[#475569] leading-relaxed mt-2 font-medium">
                      Better health for individuals, stronger communities and a healthier tomorrow.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Quote Showcase Card */}
              <div className="lg:col-span-3 bg-[#F8EAF4] rounded-md p-6 sm:p-8 border border-[#F3D0E9] flex flex-col justify-center text-[#0B2545] relative overflow-hidden">
                <span className="text-6xl text-[#A71380]/30 font-serif leading-none absolute top-6 left-6 pointer-events-none">&ldquo;</span>
                <div className="space-y-4 relative z-10 pt-8 flex-1 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-[#0B2545] leading-snug italic">
                    &quot;Quality medicines today for a healthier tomorrow.&quot;
                  </h3>
                </div>
                <div className="pt-6 relative z-10">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-[2px] bg-[#A71380]"></div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-[#A71380]">
                      EVVAI PHARMA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. OUR VALUES SECTION */}
          <div ref={valuesRef} className="py-16 sm:py-20 bg-white">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
              {/* Section Header */}
              <div className="mb-8">
                <span className="text-[10px] font-extrabold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2.5 py-0.5 rounded border border-[#F3D0E9]">
                  OUR VALUES
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B2545] tracking-tight mt-3">
                  What Drives Us
                </h2>
                <p className="text-sm text-[#475569] mt-2 max-w-xl leading-relaxed">
                  Our core values guide everything we do, from manufacturing to delivery, ensuring better healthcare outcomes for all.
                </p>
              </div>

              {/* Content Row: 4 Cards (Left) + Image Card (Right) */}
              <div className="flex flex-col lg:flex-row gap-5 items-stretch">

                {/* Left 4 Values Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:w-[72%]">
                  {companyValues.map((val, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2E8F0] shadow-2xs hover:border-[#A71380]/40 hover:shadow-lg transition-all duration-300 space-y-4 group cursor-pointer flex flex-col"
                    >
                      <div className={`w-12 h-12 rounded-2xl ${val.bg} flex items-center justify-center shrink-0`}>
                        {val.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-[15px] font-black text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-tight">
                          {val.title}
                        </h3>
                        <p className="text-[13px] text-[#475569] leading-relaxed font-normal">
                          {val.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Image Block (Scientist Card) */}
                <div className="lg:w-[28%] relative rounded-3xl overflow-hidden shadow-sm border border-[#E2E8F0] min-h-[320px] lg:min-h-full group">
                  <img
                    src="/images/pharma_scientist_microscope.jpg"
                    alt="Science for Better Lives"
                    className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B2545]/90 via-[#0B2545]/30 to-transparent opacity-90" />

                  <div className="absolute bottom-6 left-6 right-6 text-white z-10 flex flex-col justify-end">
                    <span className="text-2xl sm:text-3xl font-black tracking-tight leading-tight drop-shadow-md">
                      Science for<br />Better Lives
                    </span>
                    <div className="w-12 h-1 bg-white rounded-full mt-4 drop-shadow-sm opacity-80" />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* 4. OUR JOURNEY & KEY MILESTONES */}
          <div ref={journeyRef} className="space-y-6">
            <div className="border-b border-[#E2E8F0] pb-3">
              <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2.5 py-0.5 rounded">
                OUR JOURNEY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight mt-1">
                Key Milestones
              </h2>
              <p className="text-xs text-[#475569]">
                A journey of trust, innovation and continuous growth.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Timeline Cards Grid */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-2xs hover:border-[#A71380] transition-all space-y-3 relative group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] flex items-center justify-center font-bold">
                      {m.icon}
                    </div>
                    <div className="text-xl font-black text-[#A71380] font-mono">{m.year}</div>
                    <h3 className="text-xs font-black text-[#0B2545] leading-snug group-hover:text-[#A71380] transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-[11px] text-[#475569] leading-relaxed font-normal">
                      {m.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right Facilities Banner Card */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-2xs space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-100 mb-3">
                    <img
                      src="/images/pharma_cleanroom_exact.jpg"
                      alt="EVVAI Cleanroom Manufacturing Facilities"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-base font-black text-[#0B2545]">
                    Modern Facilities. Global Standards.
                  </h3>
                  <p className="text-xs text-[#475569] leading-relaxed">
                    Equipped with positive pressure cleanrooms and robotic aseptic liquid filling suites.
                  </p>
                </div>

                <button
                  onClick={() => scrollToSection(certsRef)}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer w-full"
                >
                  <span>Our Facilities</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. OUR CERTIFICATIONS SECTION (MATCHING REFERENCE IMAGE 100% EXACTLY) */}
          <div ref={certsRef} className="bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Header Info */}
              <div className="lg:col-span-4 space-y-2">
                <span className="text-[10px] font-extrabold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2.5 py-0.5 rounded-md border border-[#F3D0E9] inline-block">
                  OUR CERTIFICATIONS
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight leading-snug">
                  Globally Recognized. <br className="hidden sm:inline" />Always Compliant.
                </h2>
                <p className="text-xs text-[#475569] leading-relaxed">
                  We adhere strictly to international quality and pharmaceutical manufacturing standards.
                </p>
              </div>

              {/* Right 5 Authentic Certification Logo Cards Grid */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
                {/* 1. WHO-GMP */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center space-y-3 hover:border-[#A71380] hover:shadow-md transition-all group cursor-pointer min-h-[145px]">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg className="w-11 h-11 text-[#0066B2] group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none">
                      <path d="M20 44C16 40 14 34 14 28C14 22 17 17 21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M17 38C13 34 12 28 14 24" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M44 44C48 40 50 34 50 28C50 22 47 17 43 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M47 38C51 34 52 28 50 24" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="32" cy="28" r="12" stroke="currentColor" strokeWidth="2" />
                      <ellipse cx="32" cy="28" rx="6" ry="12" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="1.5" />
                      <line x1="32" y1="12" x2="32" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M29 18C33 19 35 22 32 25C29 28 35 31 32 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-[#A71380] transition-colors leading-tight">WHO-GMP</span>
                    <span className="text-[11px] font-medium text-slate-500 block leading-tight mt-0.5">Certified</span>
                  </div>
                </div>

                {/* 2. ISO Certified */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center space-y-3 hover:border-[#A71380] hover:shadow-md transition-all group cursor-pointer min-h-[145px]">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg className="w-11 h-11 text-[#00529B] group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2" />
                      <circle cx="32" cy="32" r="19" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
                      <text x="32" y="37" textAnchor="middle" fill="currentColor" fontWeight="900" fontSize="15" fontFamily="sans-serif" letterSpacing="0.5">ISO</text>
                      <path d="M14 32H18M46 32H50" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-[#A71380] transition-colors leading-tight">ISO</span>
                    <span className="text-[11px] font-medium text-slate-500 block leading-tight mt-0.5">Certified</span>
                  </div>
                </div>

                {/* 3. GMP Certified */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center space-y-3 hover:border-[#A71380] hover:shadow-md transition-all group cursor-pointer min-h-[145px]">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg className="w-11 h-11 text-[#003B73] group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none">
                      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="32" cy="32" r="17" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="32" cy="32" r="12" fill="currentColor" opacity="0.08" />
                      <text x="32" y="37" textAnchor="middle" fill="currentColor" fontWeight="900" fontSize="13" fontFamily="sans-serif">GMP</text>
                      <path d="M19 23C22 20 26 19 32 19C38 19 42 20 45 23" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M19 41C22 44 26 45 32 45C38 45 42 44 45 41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-[#A71380] transition-colors leading-tight">GMP</span>
                    <span className="text-[11px] font-medium text-slate-500 block leading-tight mt-0.5">Certified</span>
                  </div>
                </div>

                {/* 4. CDSCO Compliant */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center space-y-3 hover:border-[#A71380] hover:shadow-md transition-all group cursor-pointer min-h-[145px]">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg className="w-11 h-11 text-[#223344] group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none">
                      <path d="M25 14C25 12 28 10 32 10C36 10 39 12 39 14C41 16 41 19 39 21L37 25H27L25 21C23 19 23 16 25 14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      <circle cx="32" cy="16" r="2" fill="currentColor" />
                      <path d="M20 22C18 20 16 21 16 23C16 26 19 28 22 28H27" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M44 22C46 20 48 21 48 23C48 26 45 28 42 28H37" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="22" y="28" width="20" height="4" rx="1" fill="currentColor" opacity="0.8" />
                      <circle cx="32" cy="38" r="5" stroke="currentColor" strokeWidth="2" />
                      <path d="M32 33V43M27 38H37M28.5 34.5L35.5 41.5M35.5 34.5L28.5 41.5" stroke="currentColor" strokeWidth="1" />
                      <path d="M16 45H48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-[#A71380] transition-colors leading-tight">CDSCO</span>
                    <span className="text-[11px] font-medium text-slate-500 block leading-tight mt-0.5">Compliant</span>
                  </div>
                </div>

                {/* 5. 100% Batch Traceability */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center space-y-3 hover:border-[#A71380] hover:shadow-md transition-all group cursor-pointer min-h-[145px] col-span-2 sm:col-span-1">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg className="w-11 h-11 text-[#0F2850] group-hover:scale-110 transition-transform" viewBox="0 0 64 64" fill="none">
                      <rect x="12" y="16" width="40" height="32" rx="6" stroke="currentColor" strokeWidth="2.5" />
                      <rect x="18" y="22" width="3" height="20" rx="1" fill="currentColor" />
                      <rect x="23" y="22" width="1.5" height="20" rx="0.5" fill="currentColor" />
                      <rect x="26.5" y="22" width="4" height="20" rx="1" fill="currentColor" />
                      <rect x="32" y="22" width="2" height="20" rx="1" fill="currentColor" />
                      <rect x="36" y="22" width="1.5" height="20" rx="0.5" fill="currentColor" />
                      <rect x="39" y="22" width="3.5" height="20" rx="1" fill="currentColor" />
                      <rect x="44" y="22" width="2" height="20" rx="1" fill="currentColor" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-[#0B2545] block group-hover:text-[#A71380] transition-colors leading-tight">100% Batch</span>
                    <span className="text-[11px] font-medium text-slate-500 block leading-tight mt-0.5">Traceability</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. BOTTOM CALL TO ACTION BANNER (MATCHING REFERENCE MOCKUP) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B2545] via-[#133C6D] to-[#A71380] text-white p-8 sm:p-12 shadow-xl border border-slate-700/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-2xl relative z-10">
              <span className="text-[10px] font-extrabold text-pink-200 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">
                LET&apos;S BUILD A HEALTHIER TOMORROW
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
                Partner with EVVAI Pharma
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed">
                Join hands with us to bring trusted medicines to more people across India.
              </p>
            </div>

            <div className="relative z-10 shrink-0">
              <Link
                href="/contact"
                className="bg-white hover:bg-slate-100 text-[#0B2545] font-black text-xs px-8 py-3.5 rounded-2xl transition-all shadow-md hover:scale-105 uppercase tracking-wider flex items-center space-x-2 border border-white/40 cursor-pointer"
              >
                <span>Get in Touch</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  );
};
