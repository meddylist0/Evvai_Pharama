"use client";

import React, { useState } from "react";

export const PartnerTestimonialsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      quote:
        "EVVAI Pharma consistently delivers high-quality medicines. Their reliability and product standards have greatly supported our daily clinical practice.",
      author: "Dr. Ramesh Kumar",
      title: "General Surgeon",
      organization: "Healthcare Network",
      initials: "RK",
      rating: "★★★★★",
    },
    {
      quote:
        "We trust EVVAI Pharma for timely supply and consistent quality. Their products meet expectations and ensure customer satisfaction.",
      author: "Harish Kumar",
      title: "Pharmacist",
      organization: "Pharmacy Supply",
      initials: "HK",
      rating: "★★★★★",
    },
    {
      quote:
        "The effectiveness and safety of EVVAI Pharma products are commendable. They are a dependable partner in providing quality healthcare.",
      author: "Dr. Anjali Mehta",
      title: "Healthcare Specialist",
      organization: "Global Health Clinic",
      initials: "AM",
      rating: "★★★★★",
    },
  ];

  const partners = [
    "Apollo Hospitals Network",
    "MedPlus Supply Chain",
    "Max Healthcare Systems",
    "Fortis Clinical Labs",
    "Sun Pharma Wholesale",
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const current = testimonials[activeIndex];

  return (
    <section className="space-y-8 my-12">
      {/* Title Header matching Corporate Navy #0b2341 */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3.5 py-1 rounded-full border border-blue-200 inline-block">
          Enterprise Trust & Endorsements
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-[#0b2341] tracking-tight">
          What Healthcare & Supply Chain Partners Say
        </h2>
        <p className="text-xs md:text-sm text-slate-500">
          Supplying 500M+ formulation doses annually to leading hospital networks and wholesale stockists.
        </p>
      </div>

      {/* Unique Interactive Testimonial Slider Panel */}
      <div className="relative max-w-3xl mx-auto bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-8 md:p-12 shadow-2xs hover:shadow-xs transition-all space-y-6">
        {/* Quote & Rating */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-amber-500 font-extrabold text-sm tracking-wider">{current.rating}</span>
            <span className="text-6xl font-serif font-black text-[#0b2341]/10 leading-none select-none">
              “
            </span>
          </div>
          <p className="text-sm md:text-base text-slate-700 leading-relaxed font-medium transition-all duration-300">
            {current.quote}
          </p>
        </div>

        {/* User Profile & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 pt-6 border-t border-slate-200/80">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0b2341] text-white font-black flex items-center justify-center text-sm shadow-2xs shrink-0 ring-2 ring-white">
              {current.initials}
            </div>
            <div className="text-xs">
              <h4 className="font-black text-[#0b2341] text-sm leading-tight">{current.author}</h4>
              <p className="text-[11px] text-slate-500 font-medium">{current.title}</p>
              <span className="text-[11px] font-bold text-[#3865b0] block mt-0.5">{current.organization}</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#0b2341] hover:bg-[#0b2341] hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer text-xs font-bold"
              aria-label="Previous Testimonial"
            >
              ←
            </button>
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  activeIndex === idx ? "bg-[#0b2341] w-4" : "bg-slate-300 hover:bg-slate-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#0b2341] hover:bg-[#0b2341] hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer text-xs font-bold"
              aria-label="Next Testimonial"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Clean Corporate Brand Strip */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-3">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block text-center">
          Verified Commercial Procurement Partners
        </span>

        <div className="flex flex-wrap items-center justify-around gap-6 pt-1">
          {partners.map((name, idx) => (
            <div
              key={idx}
              className="text-xs font-black text-[#0b2341] bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl tracking-tight shadow-2xs"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
