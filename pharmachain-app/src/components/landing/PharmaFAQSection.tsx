"use client";

import React, { useState } from "react";
import { MolecularLatticeBackground } from "@/components/shared/MolecularLatticeBackground";

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

export const PharmaFAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      category: "COMPLIANCE & STANDARDS",
      question: "What regulatory certifications and standards do EVVAI Pharmaceuticals follow?",
      answer:
        "EVVAI Pharmaceuticals adheres to strict WHO-GMP certified, ISO accredited, and Schedule M quality benchmarks, ensuring every batch undergoes finished product testing and stability studies for patient safety.",
    },
    {
      category: "MOQ & PRICING",
      question: "What is the Minimum Order Quantity (MOQ) for B2B wholesale pricing?",
      answer:
        "Standard B2B wholesale pricing unlocks starting at 50 to 100 pack units depending on the formulation. Tiered bulk discounts are automatically calculated in our B2B Distributor Portal for larger order volumes (≥500 units).",
    },
    {
      category: "COA & AUDIT DOSSIERS",
      question: "How do I request a Certificate of Analysis (COA) for batch audit?",
      answer:
        "Registered hospital buyers and B2B distributors can download batch COA PDF dossiers directly from their portal dashboard or request certified lab reports via our Trust Desk (/trust).",
    },
    {
      category: "MANUFACTURING TIMELINES",
      question: "What is the turnaround time for Contract & Third-Party Manufacturing?",
      answer:
        "Commercial production batches are typically executed and dispatched within 14 to 21 business days following formulation approval, regulatory packaging artwork validation, and quality clearance.",
    },
    {
      category: "COLD-CHAIN LOGISTICS",
      question: "How are temperature-sensitive formulations shipped?",
      answer:
        "Injectables and liquid formulations are dispatched using temperature-controlled cold-chain packaging (2°C to 8°C) equipped with digital temperature monitoring.",
    },
  ];

  return (
    <section id="faq" className="my-16 relative z-10 py-6 overflow-hidden">
      {/* Soft Ambient Radial Glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#A71380]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Chemical Molecular Lattice Lines Overlay - Restricted to Right Side */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-1/2 pointer-events-none opacity-50 overflow-hidden">
        <MolecularLatticeBackground className="!left-auto right-0 w-full text-[#A71380]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
      </div>

      {/* 2-Column Split FAQ Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative z-10">

        {/* Left Column: Heading, Description & Quick Support Card */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-[#F8EAF4] border border-[#F3D0E9] px-3.5 py-1 rounded-full text-xs font-bold text-[#A71380]">
              <span className="w-2 h-2 rounded-full bg-[#A71380] animate-pulse" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2545] tracking-tight leading-snug">
              Questions About Our <span className="text-[#A71380]">Services &amp; Supply</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Find instant clarity regarding WHO-GMP quality benchmarks, B2B wholesale MOQ terms, batch COA clearance, and cold-chain shipping standards.
            </p>
          </div>

          {/* Quick Support / Trust Desk Card */}
          <div className="bg-gradient-to-br from-[#F8FAFC] to-[#F8EAF4] border border-[#F3D0E9] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#A71380] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                💬
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0B2545]">Have custom bulk inquiry?</h4>
                <p className="text-[11px] text-[#475569]">Our B2B Support Desk is ready to assist with custom formulations &amp; tenders.</p>
              </div>
            </div>
            <a
              href="/trust"
              className="inline-flex items-center justify-between w-full bg-white border border-[#E2E8F0] hover:border-[#A71380] text-[#0B2545] hover:text-[#A71380] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs group"
            >
              <span>Visit Compliance Trust Desk</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </a>
          </div>
        </div>

        {/* Right Column: Interactive Accordion */}
        <div className="lg:col-span-7 space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? "border-[#A71380] shadow-md ring-1 ring-[#A71380]/20"
                    : "border-[#E2E8F0] hover:border-[#CBD5E1] shadow-2xs"
                }`}
              >
                <button
                  suppressHydrationWarning
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-1.5 pr-2">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md inline-block ${
                      isOpen
                        ? "bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9]"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}>
                      {faq.category}
                    </span>
                    <h3 className={`text-xs sm:text-sm font-bold transition-colors leading-snug ${
                      isOpen ? "text-[#A71380]" : "text-[#0B2545] group-hover:text-[#A71380]"
                    }`}>
                      {faq.question}
                    </h3>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 mt-1 ${
                    isOpen
                      ? "bg-[#A71380] text-white rotate-180 shadow-xs"
                      : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] group-hover:border-[#A71380] group-hover:text-[#A71380]"
                  }`}>
                    <svg className="w-4 h-4 stroke-current fill-none stroke-[2.5]" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-[#475569] leading-relaxed border-t border-[#F1F5F9] bg-gradient-to-b from-[#F0F9FF]/30 to-white">
                    <p className="pt-2 text-slate-600 font-medium">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
