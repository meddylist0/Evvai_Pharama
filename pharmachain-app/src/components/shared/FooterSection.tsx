"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EvvaiLogo } from "@/components/shared/EvvaiLogo";

export const FooterSection: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="w-full border-t border-slate-800 bg-[#0B2545] py-10 md:py-12 px-6 md:px-12 text-xs text-slate-300 relative z-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* COMPACT B2B NEWSLETTER BAR */}
        <div className="border-b border-slate-700/80 pb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[10px] font-bold text-[#F3D0E9] uppercase tracking-wider bg-[#A71380]/30 px-2.5 py-0.5 rounded border border-[#A71380]/50 inline-block">
              EXECUTIVE BULLETIN
            </span>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Subscribe to WHO-GMP &amp; B2B Batch Release Updates
            </h3>
          </div>

          <div>
            {subscribed ? (
              <span className="text-[#F3D0E9] font-bold text-xs bg-[#A71380]/30 px-4 py-2 rounded-xl border border-[#A71380]/60 inline-block">
                ✓ Subscribed Successfully!
              </span>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center space-x-2" suppressHydrationWarning>
                <input
                  suppressHydrationWarning
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter work email..."
                  className="w-56 sm:w-64 border border-slate-700 bg-slate-900/90 text-white placeholder-slate-400 px-3.5 py-2 rounded-xl focus:outline-none focus:border-[#A71380] text-xs font-medium"
                />
                <button
                  suppressHydrationWarning
                  type="submit"
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
                >
                  Join &rarr;
                </button>
              </form>
            )}
          </div>
        </div>

        {/* 4 SLEEK COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <EvvaiLogo className="h-9" variant="light" />
            <p className="text-slate-300 text-[11px] leading-relaxed font-normal">
              Pharmaceutical manufacturing, WHO-GMP formulation R&amp;D, and reliable B2B wholesale supply networks.
            </p>
            <div className="space-y-2 pt-1 text-[11px]">
              <a href="tel:+917075730616" className="hover:text-[#F3D0E9] transition-colors flex items-center space-x-2 text-slate-200">
                <svg className="w-3.5 h-3.5 text-[#A71380] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91 7075730616</span>
              </a>
              <a href="mailto:sales@evvaipharma.com" className="hover:text-[#F3D0E9] transition-colors flex items-center space-x-2 text-slate-200">
                <svg className="w-3.5 h-3.5 text-[#A71380] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>sales@evvaipharma.com</span>
              </a>
            </div>

            {/* Social Media Icons */}
            <div className="flex items-center space-x-2.5 pt-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-[#A71380] hover:text-white text-slate-300 flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                title="LinkedIn"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-[#A71380] hover:text-white text-slate-300 flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                title="Twitter / X"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg bg-slate-800/90 hover:bg-[#A71380] hover:text-white text-slate-300 flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                title="YouTube"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.553a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.553a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Company */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/about" className="hover:text-[#F3D0E9] transition-colors">About EVVAI</Link></li>
              <li><Link href="/manufacturing" className="hover:text-[#F3D0E9] transition-colors">Manufacturing Units</Link></li>
              <li><Link href="/products" className="hover:text-[#F3D0E9] transition-colors">Our Products</Link></li>
              <li><Link href="/contact" className="hover:text-[#F3D0E9] transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Col 3: Quality & Compliance */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Quality &amp; Standards</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/trust" className="hover:text-[#F3D0E9] transition-colors">WHO-GMP Accreditations</Link></li>
              <li><Link href="/trust" className="hover:text-[#F3D0E9] transition-colors">ISO 9001:2015 Standards</Link></li>
              <li><Link href="/privacy" className="hover:text-[#F3D0E9] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#F3D0E9] transition-colors">Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          {/* Col 4: Business & Partnering (Replaced Portals) */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Business &amp; Partnering</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/distributor/dashboard" className="text-[#F3D0E9] font-bold hover:underline">Distributor Login</Link></li>
              <li><Link href="/contact" className="hover:text-[#F3D0E9] transition-colors">Global Exports</Link></li>
              <li><Link href="/contact" className="hover:text-[#F3D0E9] transition-colors">Contract Manufacturing</Link></li>
              <li><Link href="/contact" className="hover:text-[#F3D0E9] transition-colors">B2B Partnerships</Link></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT STRIP */}
        <div className="border-t border-slate-700/80 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>&copy; 2026 EVVAI Pharmaceuticals Global Supply. All rights reserved.</span>
          <div className="flex items-center space-x-3 text-[10px]">
            <span className="bg-[#A71380]/30 text-[#F3D0E9] px-2 py-0.5 rounded border border-[#A71380]/50 font-bold">WHO-GMP</span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-bold">ISO 9001:2015</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
