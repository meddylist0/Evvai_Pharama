"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";

interface ServiceItem {
  id: string;
  title: string;
  category: "manufacturing" | "logistics" | "quality" | "rd" | "clinical" | "cmo";
  categoryLabel: string;
  badge: string;
  tag: string;
  desc: string;
  features: string[];
  icon: React.ReactNode;
  themeColor: string;
  bgPastel: string;
}

export const MobileServicesView: React.FC = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const categories = [
    { id: "all", label: "All Services" },
    { id: "manufacturing", label: "Manufacturing" },
    { id: "logistics", label: "Cold-Chain" },
    { id: "quality", label: "Quality Lab" },
    { id: "rd", label: "R&D Formulation" },
    { id: "clinical", label: "Clinical Trials" },
    { id: "cmo", label: "Third-Party CMO" },
  ];

  const services: ServiceItem[] = [
    {
      id: "srv-mfg",
      title: "Cleanroom Formulation & Compounding",
      category: "manufacturing",
      categoryLabel: "Pharmaceutical Manufacturing",
      badge: "Cleanroom Compounding",
      tag: "WHO-GMP Verified",
      desc: "WHO-GMP accredited cleanroom production of high-potency solid oral dosages (tablets, vegetarian capsules), sterile injectables, and respiratory liquid syrups.",
      features: [
        "Positive-pressure ISO Class 5 & 7 cleanroom suites",
        "High-speed automated blistering, strip & bottle packaging",
        "Aseptic vial & ampoule filling lines with particulate tracking",
      ],
      themeColor: "#A71380",
      bgPastel: "bg-[#FFF0F6] border-[#FFE0ED]",
      icon: (
        <svg className="w-5 h-5 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      id: "srv-logistics",
      title: "Cold-Chain Logistics & B2B Distribution",
      category: "logistics",
      categoryLabel: "Cold-Chain Logistics",
      badge: "B2B Logistics",
      tag: "Cold-Chain Monitored",
      desc: "End-to-end temperature-controlled pharmaceutical distribution supporting hospital networks, retail pharmacy chains, and institutional healthcare tenders.",
      features: [
        "Temperature-controlled cold-chain preservation (2°C - 8°C & 15°C - 25°C)",
        "Real-time thermal data logging with FEFO batch traceability",
        "Rapid emergency dispatch for critical care ICU formulations",
      ],
      themeColor: "#0D9488",
      bgPastel: "bg-[#F0FDF4] border-[#DCFCE7]",
      icon: (
        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
        </svg>
      ),
    },
    {
      id: "srv-qa",
      title: "GLP Quality Assurance & Assay Testing",
      category: "quality",
      categoryLabel: "Quality Testing",
      badge: "GLP Laboratory",
      tag: "Digital COA",
      desc: "In-house GLP accredited analytical laboratories providing comprehensive batch clearance, raw material assays, and 100% verifiable digital COA documentation.",
      features: [
        "HPLC spectrographic assay and chromatographic validation",
        "In-vitro dissolution, stability chamber & disintegration testing",
        "Automated cleanroom optical particle counter logging",
      ],
      themeColor: "#0284C7",
      bgPastel: "bg-[#E0F2FE] border-[#BAE6FD]",
      icon: (
        <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2M12 19v2M3 12h2M19 12h2" />
        </svg>
      ),
    },
    {
      id: "srv-rd",
      title: "Therapeutic R&D & Formulation Design",
      category: "rd",
      categoryLabel: "R&D Formulation",
      badge: "R&D Synthesis",
      tag: "Therapeutic R&D",
      desc: "Advanced therapeutic formulation design focusing on active drug substance stability, sustained-release mechanisms, and bioavailability optimization.",
      features: [
        "Custom delivery systems (enteric, sustained release, effervescent)",
        "Excipient compatibility screening & stability profile validation",
        "Pilot batch development and seamless technology transfer",
      ],
      themeColor: "#7C3AED",
      bgPastel: "bg-[#F3E8FF] border-[#E9D5FF]",
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.5" strokeWidth="2" fill="currentColor" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" strokeWidth="2" transform="rotate(35 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.8" strokeWidth="2" transform="rotate(-35 12 12)" />
        </svg>
      ),
    },
    {
      id: "srv-clinical",
      title: "Clinical Safety Profiling & Trials",
      category: "clinical",
      categoryLabel: "Clinical Trials",
      badge: "Clinical Trials",
      tag: "GCP Aligned",
      desc: "Regulatory-compliant therapeutic safety validation and pharmacokinetic profiling aligned with international Good Clinical Practice (GCP) standards.",
      features: [
        "Phase-aligned pharmacokinetic (PK) and pharmacodynamic (PD) profiling",
        "Bioequivalence evaluation and clinical safety dossier preparation",
        "Regulatory dossier advisory for international tender qualifications",
      ],
      themeColor: "#EA580C",
      bgPastel: "bg-[#FFF7ED] border-[#FFEDD5]",
      icon: (
        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: "srv-cmo",
      title: "Turnkey CMO & Third-Party Manufacturing",
      category: "cmo",
      categoryLabel: "Third-Party CMO",
      badge: "Private Label",
      tag: "CMO Scalable",
      desc: "Custom formulation scaling, private label production, and turnkey regulatory filing support for domestic and global pharmaceutical brand owners.",
      features: [
        "Turnkey formulation compounding and custom blister packaging",
        "Flexible batch capacity ranging from pilot batches to bulk commercial volume",
        "Complete CTD / eCTD dossier filings for global marketing approvals",
      ],
      themeColor: "#0B2545",
      bgPastel: "bg-[#F1F5F9] border-[#CBD5E1]",
      icon: (
        <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="8" width="12" height="12" rx="3" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 4h6a1 1 0 011 1v3H8V5a1 1 0 011-1zM12 11v6M9 14h6" />
        </svg>
      ),
    },
  ];

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      if (selectedCategory !== "all" && srv.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          srv.title.toLowerCase().includes(q) ||
          srv.desc.toLowerCase().includes(q) ||
          srv.features.some((f) => f.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [services, selectedCategory, searchTerm]);

  return (
    <MobileAppShell
      headerTitle="Services & Capabilities"
      showBack={true}
      activeTab="services"
      rightAction={
        <button
          onClick={() => router.push("/contact/")}
          className="px-3 py-1 rounded-xl bg-[#F8EAF4] text-[#A71380] text-xs font-bold active:scale-95 transition-all cursor-pointer"
        >
          Inquire
        </button>
      }
    >
      {/* Toast Alert */}
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
            placeholder="Search pharmaceutical capabilities..."
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
        {/* 1. Header Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0B2545] via-[#133E68] to-[#1E4A7A] text-white p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#A71380]/25 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f1a4dc] bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
              WHO-GMP Certified Infrastructure
            </span>
            <h2 className="text-lg font-black text-white leading-snug tracking-tight">
              Integrated Pharmaceutical Manufacturing &amp; Supply
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Serving hospitals, distributor chains, and global healthcare institutions with guaranteed purity &amp; batch traceability.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3.5 border-t border-white/15 text-center">
            <div className="p-1.5 rounded-xl bg-white/10">
              <span className="text-xs font-black text-white block">ISO 5/7</span>
              <span className="text-[9px] text-slate-300">Cleanroom</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white/10">
              <span className="text-xs font-black text-emerald-300 block">2°C-8°C</span>
              <span className="text-[9px] text-slate-300">Cold-Chain</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white/10">
              <span className="text-xs font-black text-[#f1a4dc] block">100%</span>
              <span className="text-[9px] text-slate-300">Digital COA</span>
            </div>
            <div className="p-1.5 rounded-xl bg-white/10">
              <span className="text-xs font-black text-white block">CTD</span>
              <span className="text-[9px] text-slate-300">Dossiers</span>
            </div>
          </div>
        </div>

        {/* 2. Services List Cards */}
        <div className="space-y-3">
          {filteredServices.length > 0 ? (
            filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3 active:scale-[0.99] transition-all"
              >
                {/* Header Row: Icon + Title + Tag */}
                <div className="flex items-start justify-between space-x-3">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${srv.bgPastel}`}>
                    {srv.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A71380] bg-[#F8EAF4] px-2 py-0.5 rounded-md">
                        {srv.tag}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {srv.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-[#0B2545] leading-snug mt-1">
                      {srv.title}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {srv.desc}
                </p>

                {/* Feature Bullet Points */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1.5">
                  {srv.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] text-slate-700">
                      <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      setToastMsg(`Inquiry initiated for ${srv.title}`);
                      setTimeout(() => {
                        setToastMsg(null);
                        router.push("/contact/");
                      }, 1200);
                    }}
                    className="flex-1 h-9 rounded-xl bg-[#0B2545] hover:bg-[#07192f] text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Request Technical Dossier</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
              <div className="text-2xl">🔍</div>
              <h4 className="text-sm font-bold text-slate-800">No Services Found</h4>
              <p className="text-xs text-slate-500">
                No pharmaceutical capabilities matched your search &ldquo;{searchTerm}&rdquo;.
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

        {/* 3. Institutional Supply Inquiry Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-pink-50 via-[#F8EAF4] to-purple-50 border border-pink-200/80 p-4 flex flex-col space-y-3 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-xl text-[#A71380] shrink-0">
              🤝
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Commercial Partnerships
              </span>
              <span className="text-sm font-black text-[#0B2545] leading-tight block mt-0.5">
                Hospital Network &amp; CMO Inquiries
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-snug">
            Need large-scale hospital supply, private label formulations, or emergency cold-chain distribution? Contact our medical desk directly.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="tel:+914023456789"
              className="h-9 rounded-xl bg-white border border-slate-200 text-[#0B2545] text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
            >
              <span>📞</span>
              <span>Call Direct</span>
            </a>
            <button
              onClick={() => router.push("/contact/")}
              className="h-9 rounded-xl bg-[#A71380] hover:bg-[#8e0f6c] text-white text-xs font-extrabold flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span>Contact Desk</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </MobileAppShell>
  );
};
