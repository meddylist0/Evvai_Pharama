"use client";

import React from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { GlobalImpactStats } from "@/components/GlobalImpactStats";
import { AboutCompanySection } from "@/components/AboutCompanySection";
import { CoreCapabilitiesSection } from "@/components/CoreCapabilitiesSection";
import { QualityAssuranceBanner } from "@/components/QualityAssuranceBanner";
import { CertificationsTrustStrip } from "@/components/CertificationsTrustStrip";
import { FeaturedPipelineSection } from "@/components/FeaturedPipelineSection";
import { PartnerTestimonialsSection } from "@/components/PartnerTestimonialsSection";
import { ContractManufacturingSection } from "@/components/ContractManufacturingSection";
import { PharmaFAQSection } from "@/components/PharmaFAQSection";
import { FooterSection } from "@/components/FooterSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Clean Header Navigation */}
      <Header />

      {/* Main Container - max-w-7xl centered container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-16">
        {/* 1. Hero Section (Strictly preserved) */}
        <HeroSection />

        {/* 2. Global Impact Manufacturing Stats */}
        <GlobalImpactStats />

        {/* 3. About Company & Who We Serve Section */}
        <AboutCompanySection />

        {/* 4. Core Manufacturing Capabilities */}
        <CoreCapabilitiesSection />

        {/* 5. Quality Assurance Banner */}
        <QualityAssuranceBanner />

        {/* 6. Regulatory Certifications Strip */}
        <CertificationsTrustStrip />

        {/* 7. Featured Pipeline Products */}
        <FeaturedPipelineSection />

        {/* 8. Industry Partner & Client Testimonials */}
        <PartnerTestimonialsSection />

        {/* 9. Contract / Third-Party Manufacturing Form */}
        <ContractManufacturingSection />

        {/* 10. Commercial & Procurement FAQs Accordion */}
        <PharmaFAQSection />
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
