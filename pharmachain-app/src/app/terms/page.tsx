"use client";

import React from "react";
import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Title Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs space-y-3">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Commercial Agreement
          </span>
          <h1 className="text-3xl font-black text-[#0b2341] tracking-tight">
            Terms of Wholesale Supply & Service
          </h1>
          <p className="text-xs text-slate-500">
            Governing B2B procurement, Minimum Order Quantities (MOQ), cold-chain transit responsibility, and statutory compliance.
          </p>
        </div>

        {/* Terms Content Body */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs space-y-6 text-slate-700 text-xs leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">1. Statutory Licensing & Eligibility</h2>
            <p>
              Supply of pharmaceutical formulations is restricted to entities holding valid Wholesale Drug Licenses (Form 20B/21B) issued by State Licensing Authorities under the Drugs and Cosmetics Rules 1945. Orders placed without active KYC verification will remain locked.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">2. Tiered Wholesale Pricing & MOQs</h2>
            <p>
              Pricing is automatically determined based on buyer classification (Retail Hospital vs Approved B2B Distributor) and configured Minimum Order Quantities (MOQ). Bulk tiered pricing applies strictly when order quantities meet or exceed specified threshold limits (e.g., 500+ units).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">3. Cold-Chain Storage & Quality Assurance</h2>
            <p>
              Temperature-sensitive formulations (injectables, vaccines) are dispatched in validated cold-chain packaging (2°C–8°C). Upon receipt at the destination depot, the distributor must verify temperature data loggers within 24 hours.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">4. Payment Terms & Credit Lines</h2>
            <p>
              Distributors operating on 30-day approved credit lines must settle invoices within the stipulated tenure. Late payments beyond 30 days incur statutory interest @ 1.5% per month and temporary suspension of credit limits.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-100 pt-4">
            <h2 className="text-base font-bold text-[#0b2341]">5. Jurisdiction & Legal Disputes</h2>
            <p>
              All contracts and invoices generated through PharmaChain are governed by the laws of India and subject to the exclusive jurisdiction of the Courts of Hyderabad, Telangana.
            </p>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
