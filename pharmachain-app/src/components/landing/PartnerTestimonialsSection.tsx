"use client";

import React from "react";

export const PartnerTestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      quote:
        "EVVAI Pharma consistently delivers high-quality medicines. Their reliability and product standards have greatly supported our daily clinical practice.",
      author: "Dr. Ramesh Kumar",
      title: "General Surgeon",
      organization: "Healthcare Network",
      rating: 5,
      verifiedTag: "Hospital Supply Partner",
      avatarSvg: (
        <svg className="w-6 h-6 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      quote:
        "We trust EVVAI Pharma for timely supply and consistent quality. Their formulations meet strict standards and ensure customer satisfaction.",
      author: "Harish Kumar",
      title: "Chief Pharmacist",
      organization: "Pharmacy Supply Network",
      rating: 5,
      verifiedTag: "Retail Distributor",
      avatarSvg: (
        <svg className="w-6 h-6 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      quote:
        "The effectiveness, purity, and safety of EVVAI Pharma products are commendable. They are a dependable partner in providing quality healthcare.",
      author: "Dr. Anjali Mehta",
      title: "Healthcare Specialist",
      organization: "Global Health Clinic",
      rating: 5,
      verifiedTag: "Clinical Practitioner",
      avatarSvg: (
        <svg className="w-6 h-6 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="space-y-8 my-16 relative z-10">
      {/* Title Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-[#A71380] uppercase tracking-widest bg-[#F8EAF4] px-3.5 py-1 rounded-full border border-[#F3D0E9] inline-block">
          HEALTHCARE PARTNER FEEDBACK
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0B2545] tracking-tight">
          What Healthcare &amp; Supply Partners Say
        </h2>
        <p className="text-xs sm:text-sm text-[#475569]">
          Trusted by clinical practitioners, pharmacy chains, and regional healthcare distributors.
        </p>
      </div>

      {/* 3-Column Highlighted Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {testimonials.map((item, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#E2E8F0] hover:border-[#A71380] rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg group relative"
          >
            {/* Top Quote Mark & Rating Stars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {/* 5-Star Rating */}
                <div className="flex items-center space-x-1 text-amber-400 text-xs">
                  {"★".repeat(item.rating)}
                </div>
                <span className="text-[10px] font-extrabold text-[#A71380] bg-[#F8EAF4] px-2.5 py-0.5 rounded-full border border-[#F3D0E9]">
                  {item.verifiedTag}
                </span>
              </div>

              {/* Quote Content */}
              <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed font-normal italic relative z-10 pt-1">
                &quot;{item.quote}&quot;
              </p>
            </div>

            {/* Author Profile & Universal User Avatar */}
            <div className="flex items-center space-x-3.5 pt-4 border-t border-[#E2E8F0]">
              <div className="w-11 h-11 rounded-full bg-[#F8EAF4] border border-[#F3D0E9] text-[#A71380] group-hover:bg-[#A71380] group-hover:text-white transition-colors flex items-center justify-center shrink-0 shadow-2xs">
                {item.avatarSvg}
              </div>
              <div className="text-xs">
                <h4 className="font-extrabold text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-snug">
                  {item.author}
                </h4>
                <p className="text-[11px] text-[#475569] font-medium">{item.title}</p>
                <span className="text-[11px] font-bold text-[#A71380] block mt-0.5">
                  {item.organization}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
