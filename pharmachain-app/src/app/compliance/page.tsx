"use client";

import React from "react";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";

export default function RegulatoryCompliancePage() {
  const certifications = [
    { title: "WHO-GMP Certification", issuer: "World Health Organization", scope: "Oral Solid Dosages & Sterile Injectables", status: "Active (Audit Pass 2026)" },
    { title: "ISO 9001:2015", issuer: "TÜV SÜD International", scope: "Quality Management Systems", status: "Certified" },
    { title: "US-FDA Dedicated Line", issuer: "United States FDA", scope: "Class 10,000 Cleanroom Robotics", status: "Compliant" },
    { title: "GLP Laboratory", issuer: "CDSCO National Testing Lab", scope: "HPLC & Mass Spectrometry Assays", status: "Accredited" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Banner Header */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs space-y-3">
          <span className="text-[11px] font-extrabold text-emerald-800 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            E-E-A-T Quality & Regulatory Authority
          </span>
          <h1 className="text-3xl font-black text-[#0b2341] tracking-tight">
            Regulatory Compliance & Global Quality Governance
          </h1>
          <p className="text-xs text-slate-500">
            Official Quality Policy, WHO-GMP Certifications, Schedule M Audit Clearance, and Pharmacovigilance Vigilance Desk.
          </p>
        </div>

        {/* 4 Pillar Authority Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certifications.map((c, idx) => (
            <div key={idx} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-2 hover:shadow-xs transition-all">
              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 inline-block">
                {c.status}
              </span>
              <h3 className="text-base font-extrabold text-[#0b2341]">{c.title}</h3>
              <p className="text-xs font-bold text-slate-700">Issuer: {c.issuer}</p>
              <p className="text-xs text-slate-500 font-medium">Scope: {c.scope}</p>
            </div>
          ))}
        </div>

        {/* Regulatory Governance Policy Text */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs space-y-6 text-slate-700 text-xs leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">1. Good Manufacturing Practice (GMP) Standard</h2>
            <p>
              EVVAI Pharmaceuticals operates modern cleanroom facilities operating under strict particulate standards. Every batch manufactured is subject to finished product testing, stability studies, and HPLC potency validation.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">2. Certificate of Analysis (COA) Transparency</h2>
            <p>
              In accordance with CDSCO Schedule M rules, every commercial lot dispatched to hospitals or B2B distributors is accompanied by an authenticated Certificate of Analysis (COA) detailing assay limits, dissolution profiles, and stability test results.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-100 pt-4">
            <h2 className="text-base font-bold text-[#0b2341]">3. Pharmacovigilance & Drug Safety Contact</h2>
            <p>
              Healthcare professionals, distributors, or patients wishing to report adverse events or request batch audit dossiers can contact our Regulatory Affairs Cell directly:
              <br />
              <strong className="text-[#0b2341]">Email: qa-compliance@pharmachain.com | Hotline: +91 (40) 2300-8899</strong>
            </p>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
