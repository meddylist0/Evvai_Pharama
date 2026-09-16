"use client";

import React from "react";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-8">
        {/* Title Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs space-y-3">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Legal & Data Governance
          </span>
          <h1 className="text-3xl font-black text-[#0b2341] tracking-tight">
            Privacy Policy & Data Security
          </h1>
          <p className="text-xs text-slate-500">
            Effective Date: January 1, 2026 | Compliant with Indian IT Act 2000, GDPR, and Pharmacovigilance Data Privacy Regulations.
          </p>
        </div>

        {/* Policy Body */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs space-y-6 text-slate-700 text-xs leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">1. Enterprise Commitment to Privacy</h2>
            <p>
              PharmaChain Global Manufacturing Ltd (&quot;PharmaChain&quot;, &quot;We&quot;, &quot;Us&quot;) is committed to preserving the confidentiality, security, and integrity of personal, commercial, and regulatory data collected through our enterprise web application and B2B distributor portal.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">2. Data Collected & B2B KYC Information</h2>
            <p>
              To process wholesale orders and verify regulatory licensure under the Drugs and Cosmetics Act (1940), we collect:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Corporate Name, Registered Office Address, and GSTIN registration credentials.</li>
              <li>Drug License Numbers (Form 20B / Form 21B) and statutory Pharmacist license copies.</li>
              <li>Authorized contact details, billing transaction logs, and IP access logs for security audits.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">3. Pharmacovigilance & Adverse Event Reporting</h2>
            <p>
              In compliance with WHO-GMP guidelines and Central Drugs Standard Control Organization (CDSCO) mandates, clinical adverse event data submitted to our Pharmacovigilance Desk is anonymized and strictly processed for drug safety monitoring and statutory submission to regulatory authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0b2341]">4. Data Encryption & Access Controls</h2>
            <p>
              All data transmitted across our portals is protected using 256-bit SSL/TLS encryption. Role-based access controls (RBAC) ensure that financial and regulatory records are accessible solely by authorized enterprise administrators and compliance officers.
            </p>
          </section>

          <section className="space-y-2 border-t border-slate-100 pt-4">
            <h2 className="text-base font-bold text-[#0b2341]">5. Contact Governance Officer</h2>
            <p>
              For privacy inquiries, audit log requests, or data protection queries, contact our Data Protection Desk at:
              <br />
              <strong className="text-[#0b2341]">Email: privacy@pharmachain.com | Tel: +91 (40) 2300-8800</strong>
            </p>
          </section>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
