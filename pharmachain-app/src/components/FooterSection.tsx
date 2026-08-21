"use client";

import React from "react";
import Link from "next/link";
import { EvvaiLogo } from "@/components/EvvaiLogo";

export const FooterSection: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-12 px-6 md:px-12 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Split Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <EvvaiLogo className="h-10 md:h-11" variant="dark" />
            <p className="text-slate-500 text-xs leading-relaxed">
              Trusted Medicines & Healthcare Solutions. Providing reliable pharmaceutical products for every need.
            </p>
            <div className="flex flex-col space-y-3">
              <div className="text-xs font-semibold text-slate-600 flex flex-col space-y-1">
                <a href="tel:+917075730616" className="hover:text-blue-700">📞 +91 7075730616</a>
                <a href="mailto:sales@evvaipharma.com" className="hover:text-blue-700">✉️ sales@evvaipharma.com</a>
                <a href="https://maps.app.goo.gl/H1ANvGG1yiYe68MT9" target="_blank" rel="noreferrer" className="hover:text-blue-700">📍 View Location Map</a>
              </div>
              {/* Premium Social Media Icons */}
              <div className="flex items-center space-x-3 pt-1">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-[#0b2341] hover:text-white text-slate-400 flex items-center justify-center border border-slate-200/80 transition-all shadow-2xs cursor-pointer"
                  title="LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-[#0b2341] hover:text-white text-slate-400 flex items-center justify-center border border-slate-200/80 transition-all shadow-2xs cursor-pointer"
                  title="Twitter / X"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-[#0b2341] hover:text-white text-slate-400 flex items-center justify-center border border-slate-200/80 transition-all shadow-2xs cursor-pointer"
                  title="YouTube"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#0b2341] uppercase tracking-wider text-[11px]">Corporate Pages</h4>
            <ul className="space-y-1.5 font-medium">
              <li><Link href="/about" className="hover:text-blue-700 transition-colors">About Enterprise</Link></li>
              <li><Link href="/manufacturing" className="hover:text-blue-700 transition-colors">Manufacturing Infrastructure</Link></li>
              <li><Link href="/catalog" className="hover:text-blue-700 transition-colors">Formulation Catalog</Link></li>
              <li><Link href="/trust" className="hover:text-blue-700 transition-colors">Quality & Certifications</Link></li>
              <li><Link href="/contact" className="hover:text-blue-700 transition-colors">Contract Inquiry & Contact</Link></li>
            </ul>
          </div>

          {/* E-E-A-T & Regulatory */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#0b2341] uppercase tracking-wider text-[11px]">Compliance & E-E-A-T</h4>
            <ul className="space-y-1.5 font-medium">
              <li><Link href="/compliance" className="hover:text-blue-700 transition-colors">Regulatory Compliance</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-700 transition-colors">Privacy Policy & Data Security</Link></li>
              <li><Link href="/terms" className="hover:text-blue-700 transition-colors">Terms of Wholesale Supply</Link></li>
              <li><Link href="/trust" className="hover:text-blue-700 transition-colors">COA Lab Dossiers</Link></li>
            </ul>
          </div>

          {/* Enterprise Portals */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#0b2341] uppercase tracking-wider text-[11px]">Enterprise Portals</h4>
            <ul className="space-y-1.5 font-medium">
              <li><Link href="/distributor/dashboard" className="hover:text-blue-700 transition-colors font-bold text-[#0b2341]">B2B Distributor Portal</Link></li>
              <li><Link href="/customer/dashboard" className="hover:text-blue-700 transition-colors">Retail & Hospital Portal</Link></li>
              <li><Link href="/admin/dashboard" className="hover:text-blue-700 transition-colors text-slate-500">Admin Control Center</Link></li>
              <li><Link href="/login" className="hover:text-blue-700 transition-colors">Partner Portal Sign In</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="border-t border-slate-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
          <span>&copy; 2026 EVVAI Pharmaceuticals. All rights reserved.</span>
          <div className="flex items-center space-x-4">
            <Link href="/privacy" className="hover:text-slate-600">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-slate-600">Terms of Supply</Link>
            <span>•</span>
            <Link href="/compliance" className="hover:text-slate-600">Schedule M Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
