import React from "react";

export const AboutCompanySection: React.FC = () => {
  const targetAudience = [
    {
      title: "Hospitals & Medical Networks",
      icon: (
        <svg className="w-5 h-5 text-[#0b2341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
        </svg>
      ),
      desc: "Bulk emergency injectables, oral solids, and ICU essentials with verified COA.",
      badge: "Hospital Supply",
    },
    {
      title: "Pharmacy Chains & Retailers",
      icon: (
        <svg className="w-5 h-5 text-[#0b2341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 11h14l1 12H4L5 11z" />
        </svg>
      ),
      desc: "Fast-moving generic formulations & blister tablets at regulated wholesale margins.",
      badge: "Retail Distribution",
    },
    {
      title: "Contract & White Label Partners",
      icon: (
        <svg className="w-5 h-5 text-[#0b2341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      desc: "End-to-end third-party custom formulation & dossier regulatory filings.",
      badge: "Contract Mfg W007",
    },
    {
      title: "Global B2B Exporters & Stockists",
      icon: (
        <svg className="w-5 h-5 text-[#0b2341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 001.944-1.423" />
        </svg>
      ),
      desc: "International supply chain compliance supporting 50+ export nations.",
      badge: "Global Exporters",
    },
  ];

  return (
    <section id="about" className="space-y-8 my-14">
      {/* 2-Column Split Layout: Left Content & 2x2 Grid, Right Quality Lab Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Heading, Subcopy & 2x2 Business Grid */}
        <div className="lg:col-span-7 bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-8 md:p-10 flex flex-col justify-between space-y-6">
          {/* Header Title */}
          <div className="space-y-3">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
              About EVVAI PHARMA • Healthcare Solutions
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#0b2341] tracking-tight leading-tight">
              Trusted medicines for safe and effective care
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
              Evvai Pharmaceuticals is a leading provider of safe, effective, and high-quality medicines and healthcare products committed to patient care and better health. We deliver trusted medicines for better health outcomes.
            </p>
          </div>

          {/* 2x2 Grid (2 Top, 2 Bottom) for the 4 Business Ecosystem Pillars */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-[#0b2341] uppercase tracking-widest border-b border-slate-300/60 pb-2">
              Who We Serve & Supply (Our Business Ecosystem)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {targetAudience.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2 hover:border-[#0b2341]/40 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-[#f7f6f4] rounded-xl border border-slate-200/80">
                      {item.icon}
                    </div>
                    <span className="text-[9px] font-extrabold text-[#0b2341] bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300/60">
                      {item.badge}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#0b2341] tracking-tight">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: High-Class Quality Assurance Lab Image */}
        <div className="lg:col-span-5 relative group overflow-hidden rounded-3xl border border-[#e8e6e2] bg-[#0b2341] min-h-[360px] flex flex-col justify-end shadow-2xs">
          <img
            src="/images/pharma_qa_lab.jpg"
            alt="Pharmaceutical QA Lab Inspection"
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          {/* Gradient Overlay & High Class Badge */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b2341] via-[#0b2341]/30 to-transparent"></div>

          <div className="relative p-6 space-y-2 text-white z-10">
            <span className="inline-block bg-emerald-500/90 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-xs border border-emerald-400">
              ✓ WHO-GMP Cleanroom QA Inspection Line
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              100% Zero-Defect Batch QA Testing
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              State-of-the-art automated blister packaging lines and analytical HPLC quality control labs.
            </p>
          </div>
        </div>
      </div>

      {/* Formulation Portfolio Strip CTA */}
      <div className="bg-[#0b2341] text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">Full-Spectrum Therapeutic Categories</h4>
          <p className="text-xs text-slate-300">
            Cardiology • Respiratory • Diabetology • Sterile Injectables • Dermatology • Gastroenterology
          </p>
        </div>
        <a
          href="/catalog"
          className="bg-white hover:bg-slate-100 text-[#0b2341] px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-xs shrink-0"
        >
          Explore Product Catalog &rarr;
        </a>
      </div>
    </section>
  );
};
