"use client";

import React from "react";

export const CertificationsTrustStrip: React.FC = () => {
  const certifications = [
    {
      id: "CERT-001",
      title: "WHO-GMP Certified",
      subtitle: "World Health Organization",
      desc: "Zero-defect Good Manufacturing Practices certification for cleanrooms & oral dosage lines.",
      badge: "WHO-GMP",
      validity: "Valid through 2028",
      accentBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: (
        <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: "CERT-002",
      title: "ISO 9001:2015",
      subtitle: "Quality Management System",
      desc: "Internationally audited quality assurance & batch traceability process controls.",
      badge: "ISO 9001",
      validity: "Certified QMS",
      accentBg: "bg-blue-50 text-blue-800 border-blue-200",
      icon: (
        <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 13C10.832 21 8.868 20.313 7 19.345M12 21c1.168 0 3.132-.687 5-1.655M7 19.345A19.986 19.986 0 014.28 17.5M7 19.345A17.96 17.96 0 0012 21m5-1.655a19.986 19.986 0 002.72-1.845M17 19.345A17.96 17.96 0 0112 21" />
        </svg>
      ),
    },
    {
      id: "CERT-003",
      title: "US-FDA Compliant",
      subtitle: "Regulatory Standard",
      desc: "Advanced equipment validation, electronic batch records & aseptic cleanroom compliance.",
      badge: "FDA Line",
      validity: "Audited Line",
      accentBg: "bg-[#0b2341] text-white border-slate-700",
      icon: (
        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      id: "CERT-004",
      title: "GLP Accredited Labs",
      subtitle: "Good Laboratory Practice",
      desc: "In-house analytical chemistry, HPLC testing & microbiology QA/QC testing.",
      badge: "GLP Lab",
      validity: "NABL Compliant",
      accentBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
      icon: (
        <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: "CERT-005",
      title: "Halal & Purity Verified",
      subtitle: "Global Product Standard",
      desc: "Verified gelatin capsule capsule sourcing & ingredient purity assurance.",
      badge: "Halal",
      validity: "Global Verified",
      accentBg: "bg-teal-50 text-teal-800 border-teal-200",
      icon: (
        <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="certifications" className="space-y-5 my-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Quality Compliance & Regulatory Standards
          </span>
          <h2 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Accreditations & Regulatory Certifications
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Our facilities strictly adhere to international health authority guidelines, ensuring unyielding batch quality and global export readiness.
          </p>
        </div>

        <a
          href="#contact"
          className="text-xs font-bold text-[#0b2341] hover:text-blue-700 transition-colors flex items-center space-x-1 shrink-0"
        >
          <span>Request Quality Dossier / COA</span>
          <span>&rarr;</span>
        </a>
      </div>

      {/* Grid of 5 Premium Pharmaceutical Certificate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="bg-[#f7f6f4] border border-[#e8e6e2] hover:border-slate-300 rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all group cursor-pointer"
          >
            {/* Top Seal Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-white rounded-2xl shadow-2xs border border-slate-200/70 group-hover:scale-105 transition-transform">
                  {cert.icon}
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${cert.accentBg}`}>
                  {cert.badge}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0b2341] tracking-tight group-hover:text-blue-600 transition-colors">
                  {cert.title}
                </h3>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  {cert.subtitle}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                {cert.desc}
              </p>
            </div>

            {/* Bottom Footer Audit Info */}
            <div className="border-t border-slate-200/70 pt-3 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>{cert.validity}</span>
              </span>
              <span className="text-slate-400 group-hover:text-[#0b2341] font-bold transition-colors">
                View &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
