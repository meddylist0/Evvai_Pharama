"use client";

import React, { useState, useRef } from "react";

interface MobileOnboardingProps {
  onComplete: () => void;
}

interface BadgeItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface FeatureItem {
  title: string;
  iconBg: string;
  icon: React.ReactNode;
}

type Slide =
  | {
      id: "step1";
      type: "doctor";
      titleHighlight: string;
      titleConnector: string;
      titleMain: string;
      subtitle: string;
      badges: BadgeItem[];
      ctaText: string;
    }
  | {
      id: "step2";
      type: "bottles";
      title: string;
      subtitle: string;
      image: string;
      features: FeatureItem[];
      ctaText: string;
    }
  | {
      id: "step3";
      type: "delivery";
      titleHighlight: string;
      titleConnector: string;
      titleMain: string;
      subtitle: string;
      badges: BadgeItem[];
      ctaText: string;
    };

export const MobileOnboarding: React.FC<MobileOnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const slides: Slide[] = [
    // Step 1: Doctor on Left + 4 Feature Cards with Subtitles on Right
    {
      id: "step1",
      type: "doctor",
      titleHighlight: "Quality Medicines",
      titleConnector: "for a",
      titleMain: "Healthier Tomorrow",
      subtitle: "High-quality, affordable and trusted pharmaceutical products for everyone.",
      badges: [
        {
          title: "Trusted Quality",
          subtitle: "WHO-GMP certified products",
          icon: (
            <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 8v8m-4-4h8" />
            </svg>
          ),
        },
        {
          title: "Wide Range",
          subtitle: "Across therapeutic categories",
          icon: (
            <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10.5 3.5a4.95 4.95 0 017 7l-7 7a4.95 4.95 0 01-7-7l7-7z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8.5 12.5l3-3" />
            </svg>
          ),
        },
        {
          title: "Pan-India Delivery",
          subtitle: "Safe and reliable delivery",
          icon: (
            <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4l3 3v5a1 1 0 01-1 1h-1" />
            </svg>
          ),
        },
        {
          title: "Better Health",
          subtitle: "For a healthier tomorrow",
          icon: (
            <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
      ],
      ctaText: "Get Started →",
    },

    // Step 2: Pharma Bottles & Certified Quality
    {
      id: "step2",
      type: "bottles",
      title: "Safe. Genuine.\nTrusted.",
      subtitle: "WHO-GMP certified medicines delivered with care.",
      image: "/images/pharma_bottles_onboarding.jpg",
      features: [
        {
          title: "Genuine Products",
          iconBg: "bg-[#E6F7F5] border-[#B2EBF2] text-[#0D9488]",
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
        {
          title: "Secure Packaging",
          iconBg: "bg-[#E6F7F5] border-[#B2EBF2] text-[#0D9488]",
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          title: "Easy Ordering",
          iconBg: "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]",
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          title: "Dedicated Support",
          iconBg: "bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]",
          icon: (
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
      ],
      ctaText: "Next →",
    },

    // Step 3: Fast Logistics & Pan-India Reach
    {
      id: "step3",
      type: "delivery",
      titleHighlight: "Reliable Supply",
      titleConnector: "across",
      titleMain: "All of India",
      subtitle: "Insulated temperature control with real-time dispatch alerts until doorstep arrival.",
      badges: [
        {
          title: "Live GPS Tracking",
          subtitle: "Real-time dispatch updates",
          icon: (
            <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          title: "Cold Chain Control",
          subtitle: "2°C - 8°C insulated pack",
          icon: (
            <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 3v18m0-18l-3 3m3-3l3 3m-3 15l-3-3m3 3l3-3m-9-6h18m-18 0l3-3m-3 3l3 3m15-3l-3-3m3 3l-3 3" />
            </svg>
          ),
        },
        {
          title: "Instant Verification",
          subtitle: "Batch assay COA lookup",
          icon: (
            <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          title: "Digital Invoicing",
          subtitle: "GST compliant billing",
          icon: (
            <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
      ctaText: "Get Started →",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("evvai_onboarding_completed", "true");
      } catch {}
    }
    onComplete();
  };

  // Touch Swipe Handlers for mobile gestures
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (diff > 45) {
      // Swiped left -> next
      if (currentSlide < slides.length - 1) {
        setCurrentSlide((prev) => prev + 1);
      } else {
        handleFinish();
      }
    } else if (diff < -45) {
      // Swiped right -> prev
      if (currentSlide > 0) {
        setCurrentSlide((prev) => prev - 1);
      }
    }
  };

  const current = slides[currentSlide];

  // ---- Shared badge renderer for doctor & delivery screens ----
  const renderBadges = (badges: BadgeItem[]) => (
    <div className="w-[52%] flex flex-col justify-around h-full pl-2 z-10 py-1" style={{ gap: "clamp(4px, 1.2vh, 10px)" }}>
      {badges.map((b, idx) => (
        <div key={idx} className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-[#FFF0F7] border border-[#FCE7F3] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            {b.icon}
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="text-[12px] font-black text-[#0B2545] leading-tight tracking-tight">
              {b.title}
            </div>
            <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
              {b.subtitle}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ---- Shared doctor+badges layout for screen 1 & 3 ----
  const renderDoctorLayout = (slide: Extract<Slide, { type: "doctor" | "delivery" }>) => (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Title & Subtitle — fixed height, won't push content */}
      <div className="shrink-0 animate-in fade-in duration-300 pt-1">
        <h1 style={{ fontSize: "clamp(22px, 6vw, 30px)" }} className="font-black leading-[1.18] tracking-tight">
          <span className="text-[#C00065]">{slide.titleHighlight}</span>{" "}
          <span className="text-[#0B2545]">{slide.titleConnector}</span>
          <br />
          <span className="text-[#0B2545]">{slide.titleMain}</span>
        </h1>
        <p className="text-[#475569] text-[12.5px] font-normal leading-relaxed mt-1.5 max-w-[310px]">
          {slide.subtitle}
        </p>
      </div>

      {/* Center: Doctor on Left + 4 Compact Badges on Right — takes remaining space */}
      <div className="relative flex-1 min-h-0 flex items-end justify-between mt-2">
        {/* Soft pink glow backdrop */}
        <div className="absolute left-[-15px] bottom-0 w-[58%] h-[85%] rounded-tr-[100px] bg-gradient-to-b from-[#FFF0F7] via-[#FFF5FA] to-[#FDF4FA] pointer-events-none -z-0" />

        {/* Doctor Cutout — uses viewport height for adaptive sizing */}
        <div className="w-[48%] h-full flex items-end justify-start relative select-none z-10 pl-0 pb-1">
          <img
            src="/images/doctor_onboarding.jpg"
            alt="EVVAI Healthcare Specialist"
            style={{ maxHeight: "clamp(200px, 42vh, 380px)" }}
            className="h-full w-auto max-w-[135%] object-contain object-bottom pointer-events-none select-none drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/pharma_scientist_microscope.jpg";
            }}
          />
        </div>

        {/* 4 Badges — adaptive height */}
        {renderBadges(slide.badges)}
      </div>
    </div>
  );

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        fontFamily: "'Plus Jakarta Sans', var(--font-plus-jakarta), system-ui, -apple-system, sans-serif",
        height: "100dvh",
      }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-[#FFFFFF] via-[#FFF8FC] to-[#FDF4FA] flex flex-col overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* Top Header Row with Skip Action */}
      <div className="flex items-center justify-between px-5 shrink-0 z-20" style={{ paddingTop: "max(env(safe-area-inset-top, 8px), 8px)", paddingBottom: "4px" }}>
        {currentSlide > 0 ? (
          <button
            onClick={() => setCurrentSlide((prev) => prev - 1)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-[#0B2545] transition-colors cursor-pointer"
            aria-label="Previous Slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="w-8" />
        )}

        <button
          onClick={handleFinish}
          className="text-sm font-semibold text-[#1E40AF] hover:text-[#1E3A8A] py-1 px-2.5 rounded-lg hover:bg-blue-50/60 transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Middle Content Section — flex-1 takes ALL remaining space between header and footer */}
      <div className="flex-1 min-h-0 flex flex-col px-5 overflow-hidden">
        {current.type === "doctor" ? (
          renderDoctorLayout(current as Extract<Slide, { type: "doctor" }>)
        ) : current.type === "bottles" ? (
          // ==================== SCREEN 2: PHARMA BOTTLES & PILLS LAYOUT ====================
          <div className="flex-1 min-h-0 flex flex-col justify-between py-1 animate-in fade-in duration-300">
            {/* Top Hero Image — adaptive height */}
            <div className="w-full flex items-center justify-center relative mt-1 mb-2 shrink-0">
              <div
                className="relative w-full max-w-[300px] flex items-center justify-center overflow-hidden rounded-2xl shadow-xs"
                style={{ height: "clamp(120px, 22vh, 200px)" }}
              >
                <img
                  src={current.image}
                  alt="Safe Genuine Trusted Pharma"
                  className="w-full h-full object-cover object-center drop-shadow-sm select-none pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/plant_sphere_health.jpg";
                  }}
                />
              </div>
            </div>

            {/* Middle Content: Heading + Subtitle */}
            <div className="shrink-0">
              <h1 style={{ fontSize: "clamp(22px, 6vw, 30px)" }} className="font-extrabold text-[#0B2545] leading-[1.15] tracking-[-0.02em] whitespace-pre-line">
                {current.title}
              </h1>
              <p className="text-[#475569] text-[12.5px] font-normal leading-relaxed mt-1">
                {current.subtitle}
              </p>
            </div>

            {/* 4 Feature Items List */}
            <div className="mt-2 shrink-0" style={{ display: "flex", flexDirection: "column", gap: "clamp(6px, 1.2vh, 12px)" }}>
              {current.features.map((f, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-xs ${f.iconBg}`}>
                    {f.icon}
                  </div>
                  <span className="text-[13px] font-bold text-[#0B2545] tracking-tight">
                    {f.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          renderDoctorLayout(current as Extract<Slide, { type: "delivery" }>)
        )}
      </div>

      {/* Bottom Section: ALWAYS pinned to bottom — Dots & CTA Button */}
      <div
        className="w-full px-5 shrink-0 z-30 bg-gradient-to-t from-[#FDF4FA] via-[#FDF4FA] to-transparent"
        style={{
          paddingTop: "8px",
          paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Pagination Dots (Active Magenta Pill + Inactive Dots) */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide
                  ? "w-6 h-2 bg-[#C00065]"
                  : "w-2 h-2 bg-[#E2D9E8] hover:bg-[#D4C5DD]"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Primary CTA Button: Get Started → / Next → */}
        <button
          onClick={handleNext}
          className="w-full h-12 rounded-[18px] bg-gradient-to-r from-[#C00065] to-[#B0005C] hover:opacity-95 active:scale-[0.98] text-white font-bold text-[15px] tracking-wide shadow-lg shadow-pink-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <span>{current.ctaText}</span>
        </button>
      </div>
    </div>
  );
};
