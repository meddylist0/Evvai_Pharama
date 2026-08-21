"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";

export const ContactPageView: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "General Inquiry",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10">
        {/* Contact Hero Banner */}
        <div className="bg-[#0b2341] text-white rounded-3xl p-8 md:p-12 space-y-3 shadow-xs">
          <span className="inline-block bg-blue-500/30 text-blue-200 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-blue-400/30">
            Global Operations & Inquiries
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Contact EVVAI Pharmaceuticals
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed">
            Have an inquiry about formulations, healthcare products, B2B distributor partnerships, or contract manufacturing? Our sales technical teams are here to assist you.
          </p>
        </div>

        {/* Contact Form & Corporate HQ Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Inquiry Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#0b2341] tracking-tight">Send Us a Message</h2>
              <p className="text-xs text-slate-500">Fill out the form below and our regional sales team will respond within 24 business hours.</p>
            </div>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-slate-900">Thank You for Reaching Out!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your message has been assigned Ticket ID <span className="font-bold text-[#0b2341]">#TCK-88492</span>. A representative from our pharmaceutical commercial division will contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-[#0b2341] hover:underline pt-2 inline-block cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. Vikram Reddy"
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Work Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="vikram@pharma.com"
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Company / Organization</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Apollo Healthcare Network"
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Subject / Inquiry Type</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option>B2B Distributor Bulk Order Inquiry</option>
                    <option>Third-Party Contract Manufacturing</option>
                    <option>Quality & Regulatory Dossier Request</option>
                    <option>General Corporate Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Message / Details *</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Provide details about required dosage forms, quantities, or regulatory questions..."
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Submit Message</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Corporate Info & Map */}
          <div className="lg:col-span-5 space-y-6">
            {/* Global HQ Info */}
            <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-6 space-y-4">
              <h3 className="text-base font-extrabold text-[#0b2341] tracking-tight">Global Headquarters</h3>
              
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                    📍
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Manufacturing Facility & HQ</span>
                    <span>PharmaChain Campus, BioTech City, Phase II, Hyderabad 500081, India</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                    📞
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Commercial Desk</span>
                    <span>+91 (040) 2345-6789 / +91 98765 43210</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                    ✉️
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Direct Email Inquiries</span>
                    <span>b2b@pharmachain.com / qa@pharmachain.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Hours & Regulatory Desk */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-3 shadow-xs">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0b2341]">Business Hours & Regulatory Desk</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Monday &ndash; Friday</span>
                  <span className="font-bold text-slate-900">08:00 AM &ndash; 07:00 PM IST</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Saturday (Dispatcher Desk)</span>
                  <span className="font-bold text-slate-900">09:00 AM &ndash; 02:00 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sunday</span>
                  <span className="font-semibold text-rose-600">Closed (Emergency QA On-Call)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};
