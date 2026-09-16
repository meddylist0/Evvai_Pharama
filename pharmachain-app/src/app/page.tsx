"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { GlobalImpactStats } from "@/components/landing/GlobalImpactStats";
import { AboutCompanySection } from "@/components/landing/AboutCompanySection";
import { HexagonServicesSection } from "@/components/landing/HexagonServicesSection";
import { FeaturedPipelineSection } from "@/components/landing/FeaturedPipelineSection";
import { PortalGatewaySection } from "@/components/landing/PortalGatewaySection";
import { PartnerTestimonialsSection } from "@/components/landing/PartnerTestimonialsSection";
import { PharmaFAQSection } from "@/components/landing/PharmaFAQSection";
import { FooterSection } from "@/components/shared/FooterSection";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { usePlatform } from "@/lib/platform";
import { MobileHomeView } from "@/components/mobile";

export default function Home() {
  const platform = usePlatform();
  // Render dedicated mobile app shell in Capacitor Native App and mobile viewports
  if (platform.isNative || platform.isMobile) {
    return <MobileHomeView />;
  }

  return (
    <div suppressHydrationWarning className="min-h-screen flex flex-col bg-[#F5F9FA] text-[#0F172A] font-sans selection:bg-[#A71380] selection:text-white relative overflow-x-hidden">
      <Header />
      <HeroSection />
      <main suppressHydrationWarning className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1 w-full space-y-16 sm:space-y-24 relative z-10">
        <ScrollReveal direction="up" delay={100}>
          <GlobalImpactStats />
        </ScrollReveal>
        <ScrollReveal direction="up">
          <AboutCompanySection />
        </ScrollReveal>
        <ScrollReveal direction="up">
          <HexagonServicesSection />
        </ScrollReveal>
        <ScrollReveal direction="up">
          <FeaturedPipelineSection />
        </ScrollReveal>
        <ScrollReveal direction="up">
          <PortalGatewaySection />
        </ScrollReveal>
        <ScrollReveal direction="up">
          <PartnerTestimonialsSection />
        </ScrollReveal>
        <ScrollReveal direction="up">
          <PharmaFAQSection />
        </ScrollReveal>
      </main>
      <FooterSection />
    </div>
  );
}
