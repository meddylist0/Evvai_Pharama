"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";
import { inquiriesAPI } from "@/lib/api";

export const ContactPageView: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [countryCode, setCountryCode] = useState("+91");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "B2B Distributor Bulk Order Inquiry",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setErrorMsg("Please agree to be contacted regarding your inquiry.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      await inquiriesAPI.submitInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: `${countryCode} ${formData.phone.trim()}`,
        company: formData.company.trim() || undefined,
        subject: formData.subject,
        message: formData.message.trim(),
      });

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        subject: "B2B Distributor Bulk Order Inquiry",
        message: "",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit inquiry. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFD] text-[#0F172A] font-sans selection:bg-[#A71380] selection:text-white">
      <Header />

      {/* 1. HERO SECTION WITH 100% CLEAR BUILDING & MIDDLE CHANNELS */}
      <section className="relative w-full bg-gradient-to-r from-[#FFF5F9] via-[#FAF5FF] to-[#F1F5F9] overflow-hidden border-b border-pink-100/70 min-h-[540px] md:min-h-[600px] flex items-center">

        {/* Soft background ambient glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#A71380]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-[#FCE7F3]/60 blur-2xl pointer-events-none" />

        {/* Right Side Facility Image - 100% CRYSTAL CLEAR & SHARP BUILDING & LOGO */}
        <div className="absolute top-0 right-0 w-full md:w-[56%] lg:w-[52%] xl:w-[50%] h-full z-0 pointer-events-none overflow-hidden hidden md:block">
          <img
            src="/images/contact-hero.png"
            alt="EVVAI Pharmaceuticals Corporate Facility"
            className="w-full h-full object-cover object-[78%_center] opacity-100 brightness-[1.02] contrast-[1.02]"
          />
          {/* Subtle edge blend strictly on the far-left boundary */}
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#FFF5F9] to-transparent pointer-events-none" />

          {/* Top Right Floating Quote Card with Cursive / Serif Typography */}
          <div className="absolute top-6 right-6 lg:right-8 z-20 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg border border-pink-100/80 max-w-[260px] hidden lg:block pointer-events-auto hover:shadow-xl transition-all">
            <p className="text-sm md:text-[15px] font-serif italic font-semibold text-[#0B2545] leading-snug">
              &ldquo;Trusted Partnerships for a Healthier World&rdquo;
            </p>
            <div className="pt-1.5 flex items-center space-x-2">
              <span className="w-5 h-[2px] bg-[#A71380] rounded-full" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A71380]">
                EVVAI PHARMA
              </span>
            </div>
          </div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

            {/* Left Content Column */}
            <div className="md:col-span-8 lg:col-span-7 xl:col-span-6 space-y-5">

              {/* Top Tag */}
              <div>
                <span className="text-xs md:text-[13px] font-bold text-slate-500 uppercase tracking-[0.22em] inline-block">
                  COMMERCIAL DESK &amp; GLOBAL INQUIRIES
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-[#0B2545] leading-[1.08] tracking-tight">
                Contact EVVAI <br />
                <span className="text-[#A71380]">Pharmaceuticals</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal max-w-lg">
                Have an inquiry about formulations, B2B wholesale pricing, contract manufacturing, or regulatory support? Our sales and technical teams are here to assist you.
              </p>

              {/* 4 Feature Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">

                {/* Card 1: Quick Response */}
                <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-2xl p-3.5 text-center space-y-1.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight">Quick</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Response</p>
                  </div>
                </div>

                {/* Card 2: Dedicated Support Team */}
                <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-2xl p-3.5 text-center space-y-1.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-9 h-9 rounded-full bg-[#D1FAE5] text-[#059669] flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight">Dedicated</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Support Team</p>
                  </div>
                </div>

                {/* Card 3: B2B & Bulk Inquiries */}
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl p-3.5 text-center space-y-1.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-9 h-9 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight">B2B &amp; Bulk</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Inquiries</p>
                  </div>
                </div>

                {/* Card 4: Pan-India & Global Reach */}
                <div className="bg-[#FFF5F8] border border-[#FCE7F3] rounded-2xl p-3.5 text-center space-y-1.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-9 h-9 rounded-full bg-[#FCE7F3] text-[#A71380] flex items-center justify-center mx-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight">Pan-India &amp;</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Global Reach</p>
                  </div>
                </div>

              </div>

              {/* 2 Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="#contact-form"
                  suppressHydrationWarning
                  onClick={(e) => {
                    e.preventDefault();
                    const formEl = document.getElementById("contact-form");
                    formEl?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-[#A71380]/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                >
                  <span>Send us a Message</span>
                  <span>&rarr;</span>
                </a>

                <a
                  href="tel:+914029801234"
                  suppressHydrationWarning
                  className="bg-white hover:bg-[#FCE7F3]/30 text-[#0B2545] hover:text-[#A71380] border border-[#A71380]/80 px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-2xs transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                >
                  <span>Talk to Our Team</span>
                  <span>&rarr;</span>
                </a>
              </div>

              {/* Tagline Line */}
              <div className="pt-2 flex items-center space-x-3">
                <span className="w-12 h-[2px] bg-[#A71380] rounded-full" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  PARTNERING FOR A HEALTHIER TOMORROW
                </span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex-1 w-full space-y-10">

        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#A71380] transition-colors">
            Home
          </Link>
          <span className="text-slate-300">&gt;</span>
          <span className="text-[#0B2545] font-semibold">Contact</span>
        </nav>

        {/* TWO COLUMN GRID: FORM & DIRECTORY (ALIGNED IN SAME ROW) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          {/* LEFT COLUMN: CONTACT FORM */}
          <div id="contact-form" className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 scroll-mt-24">
            <div className="space-y-1.5">
              <span className="inline-block bg-[#FCE7F3] text-[#A71380] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-[#FBCFE8]/60">
                GET IN TOUCH
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] tracking-tight">
                Send Us a Message
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Fill out the form below and our team will get back to you within 24 business hours.
              </p>
            </div>

            {submitted ? (
              <div className="bg-[#FAF5FF] border border-[#F3D0E9] rounded-2xl p-8 text-center space-y-4 animate-in fade-in my-auto">
                <div className="w-14 h-14 bg-[#A71380] text-white rounded-full mx-auto flex items-center justify-center text-2xl font-bold shadow-lg shadow-[#A71380]/20">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-[#0B2545]">Thank You for Reaching Out!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your inquiry has been successfully sent. A representative from EVVAI Pharma will get in touch with you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  suppressHydrationWarning
                  className="text-xs font-bold text-[#A71380] hover:underline pt-2 inline-block cursor-pointer"
                >
                  Send another message &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} suppressHydrationWarning className="space-y-4 text-xs sm:text-sm flex-1 flex flex-col justify-between">
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-semibold flex items-center space-x-2 animate-in fade-in">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Row 1: Full Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#0B2545] mb-1.5 text-xs">
                        Full Name <span className="text-[#A71380]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        suppressHydrationWarning
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:border-[#A71380] focus:ring-1 focus:ring-[#A71380] font-medium text-[#0F172A] placeholder:text-slate-400 transition-all text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#0B2545] mb-1.5 text-xs">
                        Email Address <span className="text-[#A71380]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        suppressHydrationWarning
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email address"
                        className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:border-[#A71380] focus:ring-1 focus:ring-[#A71380] font-medium text-[#0F172A] placeholder:text-slate-400 transition-all text-xs"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#0B2545] mb-1.5 text-xs">
                        Phone Number <span className="text-[#A71380]">*</span>
                      </label>
                      <div className="flex rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus-within:bg-white focus-within:border-[#A71380] focus-within:ring-1 focus-within:ring-[#A71380] overflow-hidden transition-all">
                        <div className="flex items-center px-2.5 bg-slate-100/70 border-r border-slate-200 text-xs font-semibold text-slate-700 space-x-1 shrink-0">
                          <span>🇮🇳</span>
                          <select
                            value={countryCode}
                            suppressHydrationWarning
                            onChange={(e) => setCountryCode(e.target.value)}
                            aria-label="Country Code"
                            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1"
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            <option value="+971">+971</option>
                            <option value="+65">+65</option>
                          </select>
                        </div>
                        <input
                          type="tel"
                          required
                          suppressHydrationWarning
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter your phone number"
                          className="w-full p-3 bg-transparent focus:outline-none font-medium text-[#0F172A] placeholder:text-slate-400 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-[#0B2545] mb-1.5 text-xs">
                        Company / Organization
                      </label>
                      <input
                        type="text"
                        suppressHydrationWarning
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Enter company name (optional)"
                        className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:border-[#A71380] focus:ring-1 focus:ring-[#A71380] font-medium text-[#0F172A] placeholder:text-slate-400 transition-all text-xs"
                      />
                    </div>
                  </div>

                  {/* Subject Selector */}
                  <div>
                    <label className="block font-bold text-[#0B2545] mb-1.5 text-xs">
                      Subject <span className="text-[#A71380]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.subject}
                        suppressHydrationWarning
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:border-[#A71380] focus:ring-1 focus:ring-[#A71380] font-medium text-[#0F172A] appearance-none cursor-pointer transition-all text-xs"
                      >
                        <option value="B2B Distributor Bulk Order Inquiry">B2B Distributor Bulk Order Inquiry</option>
                        <option value="Third-Party Contract Manufacturing">Third-Party Contract Manufacturing</option>
                        <option value="Quality & COA Dossier Request">Quality &amp; COA Dossier Request</option>
                        <option value="Regulatory & CTD Support">Regulatory &amp; CTD Support</option>
                        <option value="Career Inquiries">Career Inquiries</option>
                        <option value="General Corporate Inquiry">General Corporate Inquiry</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block font-bold text-[#0B2545] mb-1.5 text-xs">
                      Message <span className="text-[#A71380]">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      suppressHydrationWarning
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your inquiry..."
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:border-[#A71380] focus:ring-1 focus:ring-[#A71380] font-medium text-[#0F172A] placeholder:text-slate-400 transition-all text-xs resize-y min-h-[90px]"
                    />
                  </div>
                </div>

                {/* Submit Action & Consent */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    suppressHydrationWarning
                    className="bg-[#A71380] hover:bg-[#8E0F6D] active:scale-98 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-[#A71380]/20 transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 transform rotate-45 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>{loading ? "Sending Message..." : "Send Message"}</span>
                    <span>&rarr;</span>
                  </button>

                  <label className="flex items-center space-x-2.5 cursor-pointer select-none text-[11px] text-slate-500">
                    <input
                      type="checkbox"
                      checked={agreed}
                      suppressHydrationWarning
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#A71380] focus:ring-[#A71380] cursor-pointer"
                    />
                    <span>I agree to be contacted by EVVAI Pharma regarding my inquiry.</span>
                  </label>
                </div>
              </form>
            )}
          </div>

          {/* RIGHT COLUMN: CONTACT INFORMATION CARDS & REAL HYDERABAD MAP */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-[#0B2545] tracking-tight">
                Our Contact Information
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Reach out to us through any of the following channels. We&apos;re here to help.
              </p>
            </div>

            {/* Contact Items List */}
            <div className="space-y-3.5 divide-y divide-slate-100 flex-1">

              {/* Head Office */}
              <div className="flex items-start justify-between pt-2.5 first:pt-0">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B2545]">Head Office</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      EVVAI Pharmaceuticals Pvt. Ltd.<br />
                      Plot No. 123, Pharma City, Genome Valley,<br />
                      Hyderabad, Telangana &ndash; 500078, India.
                    </p>
                  </div>
                </div>
                <a
                  href="https://maps.google.com/?q=Genome+Valley+Hyderabad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#A71380] hover:underline flex items-center space-x-1 shrink-0 ml-2 pt-1"
                >
                  <span>Get Directions</span>
                  <span>&rarr;</span>
                </a>
              </div>

              {/* Phone */}
              <div className="flex items-start justify-between pt-3.5">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B2545]">Phone</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5 font-medium">
                      +91 40 2980 1234<br />
                      +91 40 2980 5678
                    </p>
                  </div>
                </div>
                <a
                  href="tel:+914029801234"
                  className="text-[11px] font-bold text-[#A71380] hover:underline flex items-center space-x-1 shrink-0 ml-2 pt-1"
                >
                  <span>Call Now</span>
                  <span>&rarr;</span>
                </a>
              </div>

              {/* Email */}
              <div className="flex items-start justify-between pt-3.5">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B2545]">Email</h4>
                    <p className="text-[11px] text-[#0F766E] font-medium leading-relaxed mt-0.5">
                      info@evvaipharma.com<br />
                      sales@evvaipharma.com
                    </p>
                  </div>
                </div>
                <a
                  href="mailto:info@evvaipharma.com"
                  className="text-[11px] font-bold text-[#A71380] hover:underline flex items-center space-x-1 shrink-0 ml-2 pt-1"
                >
                  <span>Send Email</span>
                  <span>&rarr;</span>
                </a>
              </div>

              {/* Business Hours */}
              <div className="flex items-start justify-between pt-3.5">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0B2545]">Business Hours</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      Monday &ndash; Saturday: 9:00 AM &ndash; 6:00 PM (IST)
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#A71380] flex items-center space-x-1 shrink-0 ml-2 pt-1">
                  <span>Mon &ndash; Sat</span>
                </span>
              </div>

            </div>

            {/* REAL EMBEDDED HYDERABAD MAP (EVVAI PHARMA BRANCH OFFICE) */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-4 shadow-sm">
              <div className="h-44 w-full relative">
                <iframe
                  title="EVVAI Pharmaceuticals Hyderabad Office Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3445.173234768864!2d78.47658937684223!3d17.40985105958971!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99a65d602059%3A0x52d302da0bf3f377!2sEVVAI%20Pharmaceuticals%20%7C%20Evvai%20Pharma%20(Branch%20office)!5e1!3m2!1sen!2sin!4v1788877073576!5m2!1sen!2sin"
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              {/* Map Footer Bar */}
              <div className="bg-white px-4 py-2.5 flex items-center justify-between border-t border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#A71380] animate-pulse" />
                  <span className="text-[11px] font-bold text-[#0B2545]">EVVAI Pharmaceuticals, Hyderabad</span>
                </div>
                <a
                  href="https://maps.google.com/?q=EVVAI+Pharmaceuticals+Hyderabad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#A71380] hover:underline flex items-center space-x-1"
                >
                  <span>View Larger Map</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* 3. 4 QUICK INQUIRY CARDS (MATCHING REFERENCE IMAGE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Distributor Inquiries */}
          <div className="bg-[#FFF5F8] border border-[#FCE7F3] hover:border-pink-300 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-md flex items-center justify-between group cursor-pointer">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors">
                  Distributor Inquiries
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 font-medium">
                  Get wholesale pricing and our partnership details
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white text-[#A71380] border border-pink-200/90 shadow-2xs flex items-center justify-center text-xs font-black group-hover:bg-[#A71380] group-hover:text-white group-hover:border-[#A71380] transition-all shrink-0 ml-2">
              &rarr;
            </div>
          </div>

          {/* Card 2: Product Support */}
          <div className="bg-[#F8FAFC] border border-slate-200/80 hover:border-blue-200 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-md flex items-center justify-between group cursor-pointer">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-[#0B2545] group-hover:text-[#2563EB] transition-colors">
                  Product Support
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 font-medium">
                  Technical information and documentation
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white text-[#2563EB] border border-blue-200/90 shadow-2xs flex items-center justify-center text-xs font-black group-hover:bg-[#2563EB] group-hover:text-white group-hover:border-[#2563EB] transition-all shrink-0 ml-2">
              &rarr;
            </div>
          </div>

          {/* Card 3: Regulatory Queries */}
          <div className="bg-[#FFF5F8] border border-[#FCE7F3] hover:border-pink-300 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-md flex items-center justify-between group cursor-pointer">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors">
                  Regulatory Queries
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 font-medium">
                  Certificates, CTD and compliance dossiers
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white text-[#A71380] border border-pink-200/90 shadow-2xs flex items-center justify-center text-xs font-black group-hover:bg-[#A71380] group-hover:text-white group-hover:border-[#A71380] transition-all shrink-0 ml-2">
              &rarr;
            </div>
          </div>

          {/* Card 4: Career Opportunities */}
          <div className="bg-[#FFF5F8] border border-[#FCE7F3] hover:border-pink-300 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-md flex items-center justify-between group cursor-pointer">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-[#0B2545] group-hover:text-[#A71380] transition-colors">
                  Career Opportunities
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 font-medium">
                  Join our rapidly growing team
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white text-[#A71380] border border-pink-200/90 shadow-2xs flex items-center justify-center text-xs font-black group-hover:bg-[#A71380] group-hover:text-white group-hover:border-[#A71380] transition-all shrink-0 ml-2">
              &rarr;
            </div>
          </div>

        </div>

        {/* 4. IMPACT STATS & QUOTE ROW (MATCHING REFERENCE IMAGE) */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-xs">

          {/* Left Title */}
          <div className="lg:col-span-3 space-y-1">
            <h3 className="text-2xl sm:text-[28px] font-black text-[#0B2545] leading-[1.12] tracking-tight">
              Every <br />
              Conversation <br />
              <span className="text-[#A71380]">Moves Healthcare Forward</span>
            </h3>
            <div className="w-10 h-1 bg-[#A71380] rounded-full mt-3" />
          </div>

          {/* Center Metrics Grid */}
          <div className="lg:col-span-5 grid grid-cols-4 gap-2 border-y sm:border-y-0 sm:border-x border-slate-200 py-4 sm:py-0 sm:px-4 text-center">

            {/* Stat 1: 500+ Products */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#FFF5F8] border border-[#FCE7F3] text-[#A71380] flex items-center justify-center shadow-2xs">
                <svg className="w-5 h-5 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="8" width="18" height="8" rx="4" strokeWidth="2.2" />
                  <line x1="12" y1="8" x2="12" y2="16" strokeWidth="2.2" />
                </svg>
              </div>
              <div className="text-lg sm:text-xl font-black text-[#0B2545] leading-none">500+</div>
              <div className="text-[10px] text-slate-500 font-semibold">Products</div>
            </div>

            {/* Stat 2: 1,000+ Healthcare Partners */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#FAF5FF] border border-[#F3E8FF] text-[#9333EA] flex items-center justify-center shadow-2xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-lg sm:text-xl font-black text-[#0B2545] leading-none">1,000+</div>
              <div className="text-[10px] text-slate-500 font-semibold">Healthcare Partners</div>
            </div>

            {/* Stat 3: 28 States Coverage */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#F0FDFA] border border-[#CCFBF1] text-[#0D9488] flex items-center justify-center shadow-2xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-lg sm:text-xl font-black text-[#0B2545] leading-none">28</div>
              <div className="text-[10px] text-slate-500 font-semibold">States Coverage</div>
            </div>

            {/* Stat 4: Growing Across India */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#FFF5F8] border border-[#FCE7F3] text-[#A71380] flex items-center justify-center shadow-2xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="text-lg sm:text-xl font-black text-[#0B2545] leading-none">Growing</div>
              <div className="text-[10px] text-slate-500 font-semibold">Across India</div>
            </div>

          </div>

          {/* Right Quote Card (Boxed & Clean) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs relative">
            <svg className="w-7 h-7 text-[#A71380] mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <div className="space-y-2">
              <p className="text-xs sm:text-[13px] italic text-[#0B2545] font-serif font-medium leading-relaxed">
                We value your interest in EVVAI Pharma. Together, we can make quality healthcare accessible to more people.
              </p>
              <div className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase flex items-center space-x-1.5 pt-1">
                <span>&mdash;</span>
                <span className="text-slate-600">EVVAI PHARMA</span>
              </div>
            </div>
          </div>

        </div>

        {/* 5. BOTTOM CTA BANNER (WITH SCIENTIST / LAB VISUAL) */}
        <div className="relative rounded-3xl overflow-hidden bg-[#F0F9FF] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between p-8 sm:p-10 min-h-[170px]">
          
          {/* Background Laboratory Image overlay */}
          <div className="absolute top-0 right-0 w-full md:w-3/5 h-full pointer-events-none overflow-hidden opacity-90">
            <img
              src="/images/pharma_scientist_microscope.jpg"
              alt="EVVAI Pharma Research Laboratory"
              className="w-full h-full object-cover object-center"
            />
            {/* Smooth gradient blend from left banner to image */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F0F9FF] via-[#F0F9FF]/85 to-transparent" />
          </div>

          {/* Left Content */}
          <div className="relative z-10 max-w-xl space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-600 text-sm">🌱</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0F766E]">
                PARTNER WITH US
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B2545] tracking-tight">
              Let&apos;s Create a Healthier Future Together
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-normal">
              Whether you&apos;re a distributor, healthcare provider, or research partner &mdash; we&apos;d love to hear from you.
            </p>
          </div>

          {/* Right Button */}
          <div className="relative z-10 shrink-0 mt-4 md:mt-0">
            <Link
              href="/partners"
              className="inline-flex items-center space-x-2 bg-[#A71380] hover:bg-[#8E0F6D] active:scale-95 text-white px-7 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#A71380]/25 transition-all"
            >
              <span>Start a Partnership</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

      </main>

      <FooterSection />
    </div>
  );
};
