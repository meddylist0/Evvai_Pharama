"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";

interface PartnerItem {
  id: string;
  name: string;
  categoryFilter: "all" | "hospitals" | "retail" | "distributors" | "digital";
  categoryLabel: string;
  tierBadge: string;
  brandColor: string;
  brandBg: string;
  logoIconSvg: React.ReactNode;
  logoImgUrl?: string;
  description: string;
  networkReach: string;
  keyProductsSupplied: string[];
  partnershipYear: string;
  verificationBadges: string[];
  annualVolume: string;
  contactEmail: string;
}

export const PartnersPageView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all" | "hospitals" | "retail" | "distributors" | "digital">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const partners: PartnerItem[] = [
    {
      id: "part-apollo",
      name: "Apollo Hospitals & Pharmacies",
      categoryFilter: "hospitals",
      categoryLabel: "Hospital Chains & Retail Network",
      tierBadge: "Hospital Partner",
      brandColor: "#0F4C81",
      brandBg: "bg-[#0F4C81]",
      logoImgUrl: "https://upload.wikimedia.org/wikipedia/en/c/c5/Apollo_Hospitals_Logo.svg?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=original",
      logoIconSvg: (
        <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#0F4C81" />
          <path d="M32 10C22.0589 10 14 18.0589 14 28C14 36.5 19.3 43.8 26.8 45.4L32 54L37.2 45.4C44.7 43.8 50 36.5 50 28C50 18.0589 41.941 10 32 10Z" fill="#0B375D" />
          <circle cx="32" cy="28" r="9" fill="#F5A623" />
          <path d="M32 14V17M32 39V42M18 28H21M43 28H46M22.1 18.1L24.2 20.2M39.8 35.8L41.9 37.9M22.1 37.9L24.2 35.8M39.8 20.2L41.9 18.1" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 48L32 54L38 48" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      description: "Pan-India institutional partnership providing high-purity solid orals and sterile injectables across 70+ hospitals and 5,000+ retail outlets.",
      networkReach: "70+ Hospitals • 5,000+ Outlets",
      keyProductsSupplied: ["Zene Melatonin Spray", "NXTNERve B12 1500mcg"],
      partnershipYear: "Partner since 2018",
      verificationBadges: ["WHO-GMP Certified", "Direct Supply", "24/7 Cold-Chain"],
      annualVolume: "2.5M+ Units / Year",
      contactEmail: "institutional@evvaipharma.com",
    },
    {
      id: "part-medplus",
      name: "MedPlus Health Services",
      categoryFilter: "retail",
      categoryLabel: "Omnichannel Pharmacy Retail Chain",
      tierBadge: "Retail Partner",
      brandColor: "#D32F2F",
      brandBg: "bg-[#D32F2F]",
      logoImgUrl: "https://www.tvscapital.in/wp-content/uploads/2023/07/medplus-65800ccda6dc4.webp",
      logoIconSvg: (
        <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#D32F2F" />
          <circle cx="32" cy="32" r="22" fill="#B71C1C" />
          <path d="M32 18V46M18 32H46" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      description: "Strategic supply chain integration delivering OTC and prescription formulations across 4,000+ retail stores.",
      networkReach: "4,000+ Stores Across 10 States",
      keyProductsSupplied: ["NXTLife-600 Glutathione", "EvD3 Nano Shots"],
      partnershipYear: "Partner since 2019",
      verificationBadges: ["Pan-India Logistics", "FEFO Traceable", "100% COA Cleared"],
      annualVolume: "1.8M+ Units / Year",
      contactEmail: "retail@evvaipharma.com",
    },
    {
      id: "part-kims",
      name: "KIMS Hospitals",
      categoryFilter: "hospitals",
      categoryLabel: "Quaternary Care Tertiary Network",
      tierBadge: "Hospital Partner",
      brandColor: "#00695C",
      brandBg: "bg-[#00695C]",
      logoImgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXRddckXR9cadtI7v3j5vqszTMDONHqTnlf4P_FQtBEg&s",
      logoIconSvg: (
        <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#00695C" />
          <path d="M32 48C32 48 16 36 16 25.5C16 19.5 20.8 15 26.5 15C29.8 15 32 16.8 32 16.8C32 16.8 34.2 15 37.5 15C43.2 15 48 19.5 48 25.5C48 36 32 48 32 48Z" fill="#10B981" />
          <path d="M32 20V42M25 28C25 25 39 25 39 28C39 31 25 31 25 34C25 37 39 37 39 34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
      description: "Direct formulary supplier for specialized therapeutics across multiple hospital units.",
      networkReach: "6 Multi-Specialty Hospitals",
      keyProductsSupplied: ["Sterile Ampoules", "Critical Care"],
      partnershipYear: "Partner since 2020",
      verificationBadges: ["WHO-GMP Certified", "Priority Supply", "Dedicated Support"],
      annualVolume: "850K+ Ampoules / Year",
      contactEmail: "formulary@evvaipharma.com",
    },
    {
      id: "part-jd",
      name: "JD Pharma Distributors",
      categoryFilter: "distributors",
      categoryLabel: "Pan-India Distribution Network",
      tierBadge: "Distributor Partner",
      brandColor: "#0F172A",
      brandBg: "bg-[#0F172A]",
      logoImgUrl: "https://images.jdmagicbox.com/v2/comp/hyderabad/m5/040pxx40.xx40.110330112835.l9m5/catalogue/j-d-pharma-chanda-nagar-hyderabad-pharmaceutical-distributors-3djmymi-250.jpg",
      logoIconSvg: (
        <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#0F172A" />
          <text x="32" y="38" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">JD</text>
        </svg>
      ),
      description: "Our long-term distribution partner ensuring Evvai products reach pharmacies across India.",
      networkReach: "28 States • 200+ Distributors",
      keyProductsSupplied: ["Complete EVVAI Range"],
      partnershipYear: "Partner since 2017",
      verificationBadges: ["Wide Distribution", "Real-time Tracking", "Dedicated Team"],
      annualVolume: "4.5M+ Units / Year",
      contactEmail: "jdpharma@evvaipharma.com",
    },
    {
      id: "part-1mg",
      name: "Tata 1mg",
      categoryFilter: "digital",
      categoryLabel: "Leading Digital Healthcare Platform",
      tierBadge: "Digital Partner",
      brandColor: "#EA580C",
      brandBg: "bg-[#EA580C]",
      logoImgUrl: "https://play-lh.googleusercontent.com/htk__Y4oUSoGEAMY5tCM5ITRlt5apuavnFZ7zZya7_ml415YMb52C6ICFubZEzHuaYa1P0gFsElGGYSkO23-Qw",
      logoIconSvg: (
        <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#EA580C" />
          <text x="32" y="38" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">1mg</text>
        </svg>
      ),
      description: "Partnering to make Evvai products accessible to millions of customers through India's trusted digital platform.",
      networkReach: "Pan-India Online Reach",
      keyProductsSupplied: ["Zene Sprays", "OTC Supplements"],
      partnershipYear: "Partner since 2021",
      verificationBadges: ["Authentic Products", "Fast Delivery", "Verified Listings"],
      annualVolume: "3.2M+ Orders / Year",
      contactEmail: "1mg@evvaipharma.com",
    },
    {
      id: "part-netmeds",
      name: "Netmeds",
      categoryFilter: "digital",
      categoryLabel: "India's Trusted Online Pharmacy",
      tierBadge: "Retail Partner",
      brandColor: "#16A34A",
      brandBg: "bg-[#16A34A]",
      logoImgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYV6eE_oG_tPHB2BRc7aEzNytCC8TaCgjNI7zwPtbt0g&s=10",
      logoIconSvg: (
        <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#16A34A" />
          <path d="M22 32h10m-5-5v10" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <text x="42" y="38" fontSize="16" fontWeight="bold" fill="white" textAnchor="middle">N</text>
        </svg>
      ),
      description: "Strategic e-pharmacy partner ensuring easy access to Evvai's healthcare products across India.",
      networkReach: "Pan-India Online Reach",
      keyProductsSupplied: ["EvD3", "NXTNERve", "NXTLife-600"],
      partnershipYear: "Partner since 2021",
      verificationBadges: ["Wide Product Range", "Secure Delivery", "Customer Support"],
      annualVolume: "2.1M+ Orders / Year",
      contactEmail: "netmeds@evvaipharma.com",
    },
    {
      id: "part-yashoda",
      name: "Yashoda Hospitals",
      categoryFilter: "hospitals",
      categoryLabel: "Multi-Specialty Hospital Network",
      tierBadge: "Hospital Partner",
      brandColor: "#0B2545",
      brandBg: "bg-[#0B2545]",
      logoImgUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPyfyJYpwO_eRBesGCmp38kcxSaCnEIKNLF2lrgN2Ed76hXbgNBV6xmu4&s=10",
      logoIconSvg: (
        <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#0B2545" />
          <path d="M32 12L46 18V32C46 41.5 39.8 49.5 32 52C24.2 49.5 18 41.5 18 32V18L32 12Z" fill="#0284C7" stroke="#38BDF8" strokeWidth="2" />
          <path d="M26 31L30 35L38 25" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      description: "Trusted partner for critical care and specialty segment formulations across hospital units.",
      networkReach: "10+ Hospitals Across South India",
      keyProductsSupplied: ["Bilevia UDCA 300mg", "Specialty Tablets"],
      partnershipYear: "Partner since 2020",
      verificationBadges: ["Formulary Listed", "Consistent Supply", "Quality Assured"],
      annualVolume: "600K+ Units / Year",
      contactEmail: "yashoda@evvaipharma.com",
    },
    {
      id: "part-akshaya",
      name: "Akshaya Healthcare",
      categoryFilter: "distributors",
      categoryLabel: "Regional Distribution Partner",
      tierBadge: "Distributor Partner",
      brandColor: "#65A30D",
      brandBg: "bg-[#65A30D]",
      logoImgUrl: "https://akshayahealthcare.in/wp-content/uploads/sites/15/2025/02/Akshaya_Logo_250103_133258_page-0001__1_-scaled-e1741094082841.jpg",
      logoIconSvg: (
        <svg className="w-12 h-12" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="16" fill="#65A30D" />
          <path d="M32 18L44 38H20L32 18Z" fill="white" />
        </svg>
      ),
      description: "Strong regional distribution network covering South India with reliable supply chain support.",
      networkReach: "5 States • 100+ Distributors",
      keyProductsSupplied: ["Solid Oral Range", "Syrups"],
      partnershipYear: "Partner since 2018",
      verificationBadges: ["On-time Delivery", "Cold-Chain Support", "Dedicated Team"],
      annualVolume: "1.2M+ Units / Year",
      contactEmail: "akshaya@evvaipharma.com",
    },
  ];

  const filteredPartners = partners.filter((p) => {
    const matchesTab = activeTab === "all" || p.categoryFilter === activeTab;
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getTabCount = (tab: string) => {
    if (tab === "all") return partners.length;
    return partners.filter((p) => p.categoryFilter === tab).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-[#A71380] selection:text-white">
      <Header />

      <main className="flex-1 w-full space-y-12 relative z-10 pb-16">

        {/* HERO SECTION MATCHING DESIGN */}
        <div className="relative bg-[#F8FAFC] overflow-hidden min-h-[380px] md:min-h-[460px] flex items-center border-b border-[#E2E8F0]">
          <div className="absolute inset-0 z-0">
            <img src="/images/partnershero.png" alt="Partnerships" className="w-full h-full object-cover object-center" />
          </div>

          <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl space-y-3 pt-12 pb-12 w-full lg:w-[65%]">

              {/* BREADCRUMB MOVED INSIDE HERO */}
              <nav className="flex items-center space-x-2 text-[11px] sm:text-sm text-slate-500 font-medium mb-6">
                <Link href="/" className="hover:text-[#A71380] transition-colors flex items-center space-x-1">
                  <span>Home</span>
                </Link>
                <span className="text-slate-300">&gt;</span>
                <span className="text-[#0B2545] font-bold">Partners</span>
              </nav>

              <span className="text-xs font-black text-[#A71380] uppercase tracking-widest inline-block mb-1">
                OUR PARTNERS
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-[#0B2545] leading-[1.1] tracking-tight mb-4">
                Stronger Partnerships<br />
                <span className="text-[#A71380]">for a Healthier Tomorrow</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-lg mb-8">
                We collaborate with leading hospitals, pharmacy chains, distributors and healthcare organizations to make quality medicines accessible across India.
              </p>

              <div className="flex flex-wrap gap-4 sm:gap-6 lg:gap-8 pt-4">
                <div className="flex items-center space-x-3">
                  <span className="text-[#A71380] bg-[#F8EAF4] p-2 rounded-full border border-[#F3D0E9] shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B2545] leading-snug">Trusted<br />Network</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[#A71380] bg-[#F8EAF4] p-2 rounded-full border border-[#F3D0E9] shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B2545] leading-snug">Pan-India<br />Reach</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[#A71380] bg-[#F8EAF4] p-2 rounded-full border border-[#F3D0E9] shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B2545] leading-snug">Quality<br />Assured</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[#A71380] bg-[#F8EAF4] p-2 rounded-full border border-[#F3D0E9] shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-[#0B2545] leading-snug">Growing<br />Together</span>
                </div>
              </div>
            </div>

            {/* Cursive Text (Replacing Floating Card) */}
            <div className="hidden lg:flex flex-col items-start transform -rotate-6 -translate-y-28 mr-20 opacity-90 z-20">
              <span className="text-4xl lg:text-6xl text-[#0B2545] font-bold tracking-wide font-[cursive]">
                Partners
              </span>
              <div className="flex flex-col items-start ml-16">
                <span className="text-4xl lg:text-6xl text-[#0B2545] font-bold tracking-wide font-[cursive]">
                  in Better Health
                </span>
                <div className="w-full h-[4px] bg-[#A71380] mt-1.5 rounded-full opacity-80 transform -rotate-1"></div>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="border-b border-[#E2E8F0] bg-white sticky top-0 z-30 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto scrollbar-hide pb-2 lg:pb-0">
              {[
                { id: "all", label: "All Partners", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
                { id: "hospitals", label: "Hospitals", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
                { id: "retail", label: "Retail Chains", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
                { id: "distributors", label: "Distributors", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
                { id: "digital", label: "Digital Partners", icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors border ${activeTab === tab.id
                    ? "bg-[#A71380] text-white border-[#A71380]"
                    : "bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50"
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab.id ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                    {getTabCount(tab.id)}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & View Toggle */}
            <div className="flex items-center w-full lg:w-auto gap-3">
              <div className="relative flex-1 lg:w-64">
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-full text-xs font-medium focus:outline-none focus:border-[#A71380] bg-slate-50"
                />
              </div>
              <div className="flex items-center border border-[#E2E8F0] rounded-full overflow-hidden bg-slate-50 shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 flex items-center space-x-1.5 px-3 transition-colors ${viewMode === 'grid' ? 'bg-[#F8EAF4] text-[#A71380]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" /></svg>
                  <span className="text-xs font-bold">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 flex items-center space-x-1.5 px-3 transition-colors ${viewMode === 'list' ? 'bg-[#F8EAF4] text-[#A71380]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" /></svg>
                  <span className="text-xs font-bold">List</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CARDS GRID MATCHING MOCKUP */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPartners.map((partner) => {
              // Determine Tier Badge Style based on category
              let tierStyle = "text-slate-600 bg-slate-100";
              if (partner.categoryFilter === "hospitals" || partner.categoryFilter === "digital") {
                tierStyle = "text-[#3B82F6] bg-[#EFF6FF]"; // Blue
              } else if (partner.categoryFilter === "retail") {
                tierStyle = "text-[#EF4444] bg-[#FEF2F2]"; // Red
              } else if (partner.categoryFilter === "distributors") {
                tierStyle = "text-[#D97706] bg-[#FFFBEB]"; // Yellow/Orange
              }

              return (
                <div key={partner.id} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col p-5 group">
                  
                  {/* Top Header: Logo and Badge side-by-side */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 max-w-[60%] flex items-center justify-start">
                      {partner.logoImgUrl ? (
                        <img
                          src={partner.logoImgUrl}
                          alt={partner.name}
                          className="max-h-12 w-auto object-contain mix-blend-multiply"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : null}
                      <div className={partner.logoImgUrl ? "hidden w-full" : "w-full flex justify-start"}>
                        {partner.logoIconSvg}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${tierStyle}`}>
                      {partner.tierBadge}
                    </span>
                  </div>

                  {/* Name and Category */}
                  <div className="space-y-1 mb-4 flex-1">
                    <h3 className="text-[15px] font-bold text-[#0B2545] leading-tight">{partner.name}</h3>
                    <p className="text-[12px] text-slate-500">{partner.categoryLabel}</p>
                  </div>

                  {/* Icons (Reach and Year) */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-slate-600">
                      <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      <span className="text-[12px] font-medium">{partner.networkReach}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[12px] font-medium">{partner.partnershipYear}</span>
                    </div>
                  </div>

                  {/* Verification Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {partner.verificationBadges.map((badge, idx) => {
                      const isGreen = badge === "WHO-GMP Certified";
                      return (
                        <span key={idx} className={`text-[10px] font-medium px-2 py-0.5 rounded border ${isGreen ? 'text-[#10B981] bg-[#ECFDF5] border-[#D1FAE5]' : 'text-[#3B82F6] bg-[#EFF6FF] border-[#DBEAFE]'}`}>
                          {badge}
                        </span>
                      );
                    })}
                  </div>

                  {/* View Details Button */}
                  <div className="pt-3 border-t border-slate-100 flex justify-center w-full mt-auto">
                    <button className="text-[#059669] hover:text-[#047857] text-[13px] font-bold flex items-center space-x-1 group/btn transition-colors">
                      <span>View Details</span>
                      <span className="group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* METRICS & QUOTE STRIP */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-12">
          <div className="bg-[#FCF5FA] rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 flex-1 w-full">
              {/* Metric 1 */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center bg-[#F8EAF4] rounded-full text-[#A71380] shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div>
                  <span className="block text-2xl font-black text-[#A71380]">500+</span>
                  <span className="block text-[13px] font-medium text-slate-500">Partner Network</span>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center bg-[#F8EAF4] rounded-full text-[#A71380] shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <span className="block text-2xl font-black text-[#A71380]">28</span>
                  <span className="block text-[13px] font-medium text-slate-500">States Coverage</span>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center bg-[#F8EAF4] rounded-full text-[#A71380] shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                  <span className="block text-2xl font-black text-[#A71380]">10,000+</span>
                  <span className="block text-[13px] font-medium text-slate-500">Retail Touchpoints</span>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 flex items-center justify-center bg-[#F8EAF4] rounded-full text-[#A71380] shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <span className="block text-2xl font-black text-[#A71380]">5M+</span>
                  <span className="block text-[13px] font-medium text-slate-500">Patients Reached</span>
                </div>
              </div>
            </div>

            {/* Vertical Divider (desktop) */}
            <div className="hidden lg:block w-px h-16 bg-[#F3D0E9] mx-4 shrink-0"></div>

            {/* Quote */}
            <div className="border-t border-[#F3D0E9] lg:border-t-0 pt-6 lg:pt-0 flex lg:w-[420px] shrink-0 space-x-4">
              <svg className="w-12 h-12 text-[#A71380] shrink-0 transform -translate-y-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              <div>
                <p className="text-[14px] font-semibold text-[#0B2545] italic leading-relaxed mb-3">
                  "Our partners are an integral part of our mission to make quality healthcare accessible to every Indian."
                </p>
                <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  &mdash; EVVAI PHARMA
                </span>
              </div>
            </div>
            
          </div>
        </div>

        {/* BOTTOM CTA */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-8">
          <div className="bg-[#A71380] rounded-xl overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-lg relative h-auto md:h-[110px]">
            
            {/* Background SVG Leaves */}
            <div className="absolute inset-0 z-0 opacity-15 pointer-events-none overflow-hidden flex justify-between">
              {/* Left Leaf Cluster */}
              <svg className="h-[150%] w-auto text-white transform -translate-x-1/4 -translate-y-1/4 -rotate-12" viewBox="0 0 200 200" fill="currentColor">
                <path d="M100,180 C60,110 20,60 80,10 C140,60 120,130 100,180 Z" />
                <path d="M90,160 C30,130 -10,70 10,20 C60,40 70,110 90,160 Z" />
                <path d="M110,160 C170,130 210,70 190,20 C140,40 130,110 110,160 Z" />
              </svg>
              {/* Middle Right Leaf Cluster */}
              <svg className="hidden md:block h-[180%] w-auto text-white transform translate-x-12 translate-y-8 rotate-45" viewBox="0 0 200 200" fill="currentColor">
                <path d="M100,180 C60,110 20,60 80,10 C140,60 120,130 100,180 Z" />
                <path d="M90,160 C30,130 -10,70 10,20 C60,40 70,110 90,160 Z" />
              </svg>
            </div>

            {/* Text Section */}
            <div className="p-6 md:py-0 md:pl-10 md:pr-6 flex-1 w-full relative z-10 flex flex-col justify-center">
              <span className="text-white/80 text-[11px] font-medium tracking-wide">Let's Build a Healthier Tomorrow</span>
              <h2 className="text-[22px] font-bold text-white mt-0.5 mb-0.5 tracking-tight">Partner with EVVAI Pharma</h2>
              <p className="text-white/80 text-[13px]">Join hands with us to bring trusted medicines to more people across India.</p>
            </div>

            {/* Button Section */}
            <div className="px-6 pb-6 md:p-0 md:pr-8 relative z-10 shrink-0 w-full md:w-auto flex justify-start md:justify-center">
              <Link href="/contact" className="inline-flex bg-white text-[#A71380] px-5 py-2.5 rounded-lg font-bold text-[13px] items-center space-x-2 hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap">
                <span>Become a Partner</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Image Section */}
            <div className="w-full md:w-[360px] h-32 md:h-full relative z-0 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-[#A71380] via-[#A71380]/60 to-transparent hidden md:block z-10 w-24" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#A71380] to-transparent block md:hidden z-10 h-20 bottom-0 top-auto" />
              <img src="/images/partner_cta_warehouse.jpg" alt="Partner with EVVAI" className="w-full h-full object-cover object-center" />
            </div>

          </div>
        </div>

      </main>

      <FooterSection />
    </div>
  );
};
