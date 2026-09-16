"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";

interface PartnerItem {
  id: string;
  name: string;
  categoryFilter: "all" | "hospitals" | "retail" | "distributors" | "digital";
  categoryLabel: string;
  tierBadge: string;
  brandColor: string;
  brandBg: string;
  description: string;
  networkReach: string;
  keyProductsSupplied: string[];
  partnershipYear: string;
  verificationBadges: string[];
  annualVolume: string;
  iconLetter: string;
}

export const MobilePartnersView: React.FC = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Partners" },
    { id: "hospitals", label: "Hospitals" },
    { id: "retail", label: "Retail Chains" },
    { id: "distributors", label: "Distributors" },
    { id: "digital", label: "Digital Healthcare" },
  ];

  const partners: PartnerItem[] = [
    {
      id: "part-apollo",
      name: "Apollo Hospitals & Pharmacies",
      categoryFilter: "hospitals",
      categoryLabel: "Hospital Chains & Retail Network",
      tierBadge: "Hospital Partner",
      brandColor: "#0F4C81",
      brandBg: "bg-[#0F4C81]",
      description: "Pan-India institutional supply providing high-purity solid orals and sterile injectables across 70+ hospitals and 5,000+ retail outlets.",
      networkReach: "70+ Hospitals • 5,000+ Outlets",
      keyProductsSupplied: ["Zene Melatonin Spray", "NXTNERve B12 1500mcg"],
      partnershipYear: "Partner since 2018",
      verificationBadges: ["WHO-GMP Certified", "Direct Supply", "24/7 Cold-Chain"],
      annualVolume: "2.5M+ Units / Year",
      iconLetter: "A",
    },
    {
      id: "part-medplus",
      name: "MedPlus Health Services",
      categoryFilter: "retail",
      categoryLabel: "Omnichannel Pharmacy Retail Chain",
      tierBadge: "Retail Partner",
      brandColor: "#D32F2F",
      brandBg: "bg-[#D32F2F]",
      description: "Strategic supply chain integration delivering OTC and prescription formulations across 4,000+ retail stores.",
      networkReach: "4,000+ Stores Across 10 States",
      keyProductsSupplied: ["NXTLife-600 Glutathione", "EvD3 Nano Shots"],
      partnershipYear: "Partner since 2019",
      verificationBadges: ["Pan-India Logistics", "FEFO Traceable", "100% COA Cleared"],
      annualVolume: "1.8M+ Units / Year",
      iconLetter: "M",
    },
    {
      id: "part-kims",
      name: "KIMS Hospitals",
      categoryFilter: "hospitals",
      categoryLabel: "Quaternary Care Tertiary Network",
      tierBadge: "Hospital Partner",
      brandColor: "#00695C",
      brandBg: "bg-[#00695C]",
      description: "Direct formulary supplier for specialized therapeutics and critical care injectable formulations across multi-specialty units.",
      networkReach: "6 Multi-Specialty Hospitals",
      keyProductsSupplied: ["Sterile Ampoules", "Critical Care"],
      partnershipYear: "Partner since 2020",
      verificationBadges: ["WHO-GMP Certified", "Priority Supply", "Dedicated Support"],
      annualVolume: "850K+ Ampoules / Year",
      iconLetter: "K",
    },
    {
      id: "part-jd",
      name: "JD Pharma Distributors",
      categoryFilter: "distributors",
      categoryLabel: "Pan-India Distribution Network",
      tierBadge: "Distributor Partner",
      brandColor: "#0F172A",
      brandBg: "bg-[#0F172A]",
      description: "Long-term regional and state distribution partner ensuring EVVAI therapeutic formulations reach pharmacies nationwide.",
      networkReach: "28 States • 200+ Regional Depots",
      keyProductsSupplied: ["Complete EVVAI Range"],
      partnershipYear: "Partner since 2017",
      verificationBadges: ["Wide Distribution", "Real-time Tracking", "Dedicated Team"],
      annualVolume: "4.5M+ Units / Year",
      iconLetter: "JD",
    },
    {
      id: "part-1mg",
      name: "Tata 1mg",
      categoryFilter: "digital",
      categoryLabel: "Leading Digital Healthcare Platform",
      tierBadge: "Digital Partner",
      brandColor: "#EA580C",
      brandBg: "bg-[#EA580C]",
      description: "Direct verified digital storefront integration delivering certified formulations with end-to-end temperature validation.",
      networkReach: "Pan-India Home Delivery (1,800+ Cities)",
      keyProductsSupplied: ["Zene Sleep Spray", "EvD3 Nano Shots"],
      partnershipYear: "Partner since 2021",
      verificationBadges: ["Digital Integration", "Express Delivery", "Batch Verified"],
      annualVolume: "1.2M+ Units / Year",
      iconLetter: "1M",
    },
    {
      id: "part-yashoda",
      name: "Yashoda Hospitals",
      categoryFilter: "hospitals",
      categoryLabel: "Tertiary Healthcare Network",
      tierBadge: "Hospital Partner",
      brandColor: "#1E3A8A",
      brandBg: "bg-[#1E3A8A]",
      description: "Institutional formulary partner supplying specialized neurology and post-operative therapeutic formulations.",
      networkReach: "4 Super-Specialty Centres",
      keyProductsSupplied: ["NXTNERve B12 Injection", "Specialized Injectables"],
      partnershipYear: "Partner since 2019",
      verificationBadges: ["WHO-GMP Certified", "Emergency Supply", "Direct Dispatch"],
      annualVolume: "650K+ Units / Year",
      iconLetter: "Y",
    },
    {
      id: "part-pharmeasy",
      name: "PharmEasy Health",
      categoryFilter: "digital",
      categoryLabel: "Omnichannel Digital Pharmacy",
      tierBadge: "Digital Partner",
      brandColor: "#0D9488",
      brandBg: "bg-[#0D9488]",
      description: "Technology-driven distribution partner providing verified prescription medicines directly to patient doorsteps.",
      networkReach: "22,000+ Pincodes Nationwide",
      keyProductsSupplied: ["Oral Tablets & Syrups", "Wellness Range"],
      partnershipYear: "Partner since 2022",
      verificationBadges: ["Doorstep Delivery", "Genuine Guarantee", "100% Digital"],
      annualVolume: "950K+ Units / Year",
      iconLetter: "P",
    },
  ];

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      if (selectedCategory !== "all" && p.categoryFilter !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.networkReach.toLowerCase().includes(q) ||
          p.keyProductsSupplied.some((k) => k.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [partners, selectedCategory, searchTerm]);

  return (
    <MobileAppShell
      headerTitle="Partners & Supply"
      showBack={true}
      activeTab="partners"
      rightAction={
        <button
          onClick={() => router.push("/contact/")}
          className="px-3 py-1 rounded-xl bg-[#F8EAF4] text-[#A71380] text-xs font-bold active:scale-95 transition-all cursor-pointer"
        >
          Join
        </button>
      }
    >
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#0B2545] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg text-center">
            {toastMsg}
          </div>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 space-y-2.5 sticky top-14 z-30 shadow-2xs">
        <div className="relative flex items-center">
          <svg
            className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search hospitals, retail chains, platforms..."
            className="w-full h-11 pl-10 pr-9 bg-[#F1F5F9]/80 border border-slate-200/80 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#A71380] transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="w-5 h-5 absolute right-3 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full"
            >
              ✕
            </button>
          )}
        </div>

        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-[#580B43] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-[#0B2545]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-3 space-y-4">
        {/* 1. Network Highlight Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#133E68] to-[#1E4A7A] text-white p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#A71380]/25 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f1a4dc] bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
              Healthcare Supply Network
            </span>
            <h2 className="text-lg font-black text-white leading-snug tracking-tight">
              Trusted by Premier Hospitals &amp; Retail Chains
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Supplying verified WHO-GMP medicines to over 10,000+ pharmacies, top hospital groups, and digital healthcare networks across India.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/15 text-center">
            <div className="p-1.5 rounded-xl bg-white/10">
              <span className="text-xs font-black text-white block">10,000+</span>
              <span className="text-[9px] text-slate-300">Outlets</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white/10">
              <span className="text-xs font-black text-emerald-300 block">70+</span>
              <span className="text-[9px] text-slate-300">Hospitals</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white/10">
              <span className="text-xs font-black text-[#f1a4dc] block">10M+</span>
              <span className="text-[9px] text-slate-300">Units / Year</span>
            </div>
          </div>
        </div>

        {/* 2. Partners List */}
        <div className="space-y-3">
          {filteredPartners.length > 0 ? (
            filteredPartners.map((part) => (
              <div
                key={part.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3 active:scale-[0.99] transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between space-x-3">
                  <div
                    className="w-11 h-11 rounded-2xl text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: part.brandColor }}
                  >
                    {part.iconLetter}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {part.tierBadge}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {part.partnershipYear}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-[#0B2545] leading-snug mt-1 truncate">
                      {part.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {part.description}
                </p>

                {/* Key Supply Highlights */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] font-medium">Network Reach:</span>
                    <span className="font-bold text-[#0B2545] text-[11px]">{part.networkReach}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[11px] font-medium">Annual Supply:</span>
                    <span className="font-bold text-[#A71380] text-[11px]">{part.annualVolume}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 flex-wrap pt-1 gap-1">
                    {part.verificationBadges.map((badge, bIdx) => (
                      <span
                        key={bIdx}
                        className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md"
                      >
                        ✓ {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      setToastMsg(`Connecting to EVVAI Institutional Desk for ${part.name}`);
                      setTimeout(() => {
                        setToastMsg(null);
                        router.push("/contact/");
                      }, 1200);
                    }}
                    className="flex-1 h-9 rounded-xl bg-[#0B2545] hover:bg-[#07192f] text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Inquire Formulary Supply</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
              <div className="text-2xl">🔍</div>
              <h4 className="text-sm font-bold text-slate-800">No Partners Found</h4>
              <p className="text-xs text-slate-500">
                No healthcare partners matched your query &ldquo;{searchTerm}&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 bg-[#0B2545] text-white rounded-xl text-xs font-bold"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* 3. Become a Partner CTA Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-50 via-[#E6FFFA] to-blue-50 border border-teal-200/80 p-4 flex flex-col space-y-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-xl text-teal-700 shrink-0">
              🏥
            </div>
            <div>
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                Hospital &amp; Distributor Network
              </span>
              <span className="text-sm font-black text-[#0B2545] leading-tight block mt-0.5">
                Join EVVAI Partner Ecosystem
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-snug">
            Partner with EVVAI Pharmaceuticals for institutional hospital formulary contracts, regional distribution rights, or cold-chain logistics integration.
          </p>

          <button
            onClick={() => router.push("/contact/")}
            className="w-full h-10 rounded-xl bg-[#0B2545] hover:bg-[#07192f] text-white text-xs font-extrabold flex items-center justify-center space-x-2 active:scale-98 transition-all shadow-xs cursor-pointer"
          >
            <span>Apply For Partnership</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </MobileAppShell>
  );
};
