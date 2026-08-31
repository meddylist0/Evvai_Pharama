"use client";

import React, { useState } from "react";

export const PharmaFAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What regulatory certifications and standards do EVVAI Pharmaceuticals follow?",
      answer:
        "EVVAI Pharmaceuticals adheres to strict WHO-GMP certified, ISO accredited, and Schedule M quality benchmarks, ensuring every batch undergoes finished product testing and stability studies for patient safety.",
    },
    {
      question: "What is the Minimum Order Quantity (MOQ) for B2B wholesale pricing?",
      answer:
        "Standard B2B wholesale pricing unlocks starting at 50 to 100 pack units depending on the formulation. Tiered bulk discounts are automatically calculated in our B2B Distributor Portal for larger order volumes (≥500 units).",
    },
    {
      question: "How do I request a Certificate of Analysis (COA) for batch audit?",
      answer:
        "Registered hospital buyers and B2B distributors can download batch COA PDF dossiers directly from their portal dashboard or request certified lab reports via our Trust Desk (/trust).",
    },
    {
      question: "What is the turnaround time for Contract & Third-Party Manufacturing?",
      answer:
        "Commercial production batches are typically executed and dispatched within 14 to 21 business days following formulation approval, regulatory packaging artwork validation, and quality clearance.",
    },
    {
      question: "How are temperature-sensitive formulations shipped?",
      answer:
        "Injectables, syrups, and vaccines are dispatched using temperature-validated cold-chain packaging (2°C to 8°C) equipped with real-time digital temperature data loggers.",
    },
  ];

  return (
    <section className="space-y-6 my-10 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3.5 py-1 rounded-full border border-blue-200 inline-block">
          Frequently Asked Questions
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-[#0b2341] tracking-tight">
          Commercial Procurement & Manufacturing FAQs
        </h2>
        <p className="text-xs md:text-sm text-slate-500">
          Everything you need to know about our WHO-GMP production, B2B wholesale pricing, and COA verification.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between font-extrabold text-xs md:text-sm text-[#0b2341] hover:bg-slate-50 transition-colors cursor-pointer"
                suppressHydrationWarning
              >
                <span>{faq.question}</span>
                <span className="text-blue-600 text-base font-black ml-4 shrink-0">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-medium">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
