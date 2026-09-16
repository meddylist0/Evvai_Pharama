"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";
import { authAPI } from "@/lib/api";

export const RegisterPageView: React.FC = () => {
  const router = useRouter();

  // Wizard Step State: 1 = Basic Details & Role Selection, 2 = Role-specific Business KYC & Documents
  const [step, setStep] = useState<1 | 2>(1);

  // Role Selection Mode: "customer" | "retailer" | "distributor"
  const [roleMode, setRoleMode] = useState<"customer" | "retailer" | "distributor">("retailer");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Step 1: Basic Credentials State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Role-Specific Business & KYC States
  // Retailer specific
  const [retShopName, setRetShopName] = useState("");
  const [retDrugLicense, setRetDrugLicense] = useState("");
  const [retGstin, setRetGstin] = useState("");

  // Distributor specific
  const [distCompanyName, setDistCompanyName] = useState("");
  const [distGstin, setDistGstin] = useState("");
  const [distDrugLicense, setDistDrugLicense] = useState("");
  const [distPan, setDistPan] = useState("");

  // Customer specific
  const [custAddress, setCustAddress] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custPincode, setCustPincode] = useState("");

  // License / KYC File Upload
  const [licenseFile, setLicenseFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Read URL query parameters for default tab / role
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      if (roleParam === "distributor") {
        setRoleMode("distributor");
      } else if (roleParam === "customer") {
        setRoleMode("customer");
      } else if (roleParam === "retailer") {
        setRoleMode("retailer");
      }
    }
  }, []);

  // Sync shop name default if full name entered
  useEffect(() => {
    if (fullName) {
      if (!retShopName && roleMode === "retailer") {
        setRetShopName(`${fullName}'s Pharmacy`);
      }
      if (!distCompanyName && roleMode === "distributor") {
        setDistCompanyName(`${fullName} Enterprise`);
      }
    }
  }, [fullName, roleMode]);

  // Handle Document / Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("File size must be under 5MB (PDF / JPG / PNG).");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setLicenseFile(reader.result as string);
        setErrorMsg("");
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1 Validation & Proceeding to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    // Go to Step 2
    setStep(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  // Step 2 Submission Handler
  const handleFinalRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (roleMode === "customer") {
        await authAPI.registerCustomer({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim(),
          address: custAddress.trim() || undefined,
          city: custCity.trim() || undefined,
          pincode: custPincode.trim() || undefined,
        });

        setSuccessMsg("Customer account created successfully! Redirecting to Dashboard...");
        setTimeout(() => {
          router.push("/customer/dashboard");
        }, 800);
      } else if (roleMode === "retailer") {
        if (!retDrugLicense.trim()) {
          setErrorMsg("Drug License No (DL 20B/21B) is required for Retailer Registration.");
          setLoading(false);
          return;
        }

        await authAPI.registerRetailer({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim(),
          shop_name: retShopName.trim() || `${fullName}'s Pharmacy`,
          owner_name: fullName.trim(),
          gstin: retGstin.trim() || undefined,
          drug_license_no: retDrugLicense.trim(),
        });

        setSuccessMsg("Pharmacy Retailer account created! Redirecting to Retailer Dashboard...");
        setTimeout(() => {
          router.push("/retailer/dashboard");
        }, 800);
      } else if (roleMode === "distributor") {
        if (!distDrugLicense.trim()) {
          setErrorMsg("Drug License No (DL 20B/21B) is required for Wholesale Distributor.");
          setLoading(false);
          return;
        }
        if (!distGstin.trim()) {
          setErrorMsg("GSTIN is required for Wholesale Distributor Onboarding.");
          setLoading(false);
          return;
        }

        await authAPI.registerDistributor({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim(),
          company_name: distCompanyName.trim() || `${fullName} Enterprise`,
          distributor_name: fullName.trim(),
          gstin: distGstin.trim(),
          drug_license_no: distDrugLicense.trim(),
          pan_number: distPan.trim() || undefined,
          document_file_url: licenseFile || undefined,
        });

        setSuccessMsg("Distributor application & Drug License KYC submitted! Redirecting...");
        setTimeout(() => {
          router.push("/distributor/dashboard");
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FA] text-[#0F172A] font-sans selection:bg-[#A71380] selection:text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1 w-full flex items-center justify-center relative z-10">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#A71380]/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#0B2545]/6 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">

          {/* ── LEFT SIDE: BRAND HIGHLIGHTS & TRUST PILLARS ────────────── */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#0B2545] via-[#103058] to-[#0B2545] text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-700/60 flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient Magenta & Emerald Glows */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#A71380]/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center space-x-2">
                <span className="bg-[#A71380]/30 text-[#F3D0E9] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#A71380]/60 backdrop-blur-xs">
                  EVVAI ONBOARDING PORTAL
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/40">
                  Step {step} of 2
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Join EVVAI Official Pharmaceutical Supply Network
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                Direct procurement from WHO-GMP certified formulation facilities, guaranteed Price-To-Retailer (PTR) trade discounts, and nationwide 24-hour dispatch.
              </p>

              {/* Regulatory Checklist Pillars */}
              <div className="space-y-3 pt-3 border-t border-slate-700/80 text-xs">
                <div className={`p-3 rounded-2xl border transition-all ${
                  roleMode === "retailer" 
                    ? "bg-[#A71380]/20 border-[#A71380]/60 text-white ring-1 ring-[#A71380]/40" 
                    : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#A71380]/30 text-[#F3D0E9] border border-[#A71380]/50 flex items-center justify-center shrink-0 text-sm mt-0.5">
                      🏪
                    </div>
                    <div>
                      <span className="font-bold text-white block">Retail Chemists &amp; Pharmacies</span>
                      <span className="text-[11px] text-slate-300 leading-normal">
                        Form 20/21 or 20B/21B Drug License validation for PTR trade margin invoicing.
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border transition-all ${
                  roleMode === "distributor" 
                    ? "bg-emerald-500/20 border-emerald-500/60 text-white ring-1 ring-emerald-500/40" 
                    : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 flex items-center justify-center shrink-0 text-sm mt-0.5">
                      🏬
                    </div>
                    <div>
                      <span className="font-bold text-white block">Wholesale Stockists &amp; Distributors</span>
                      <span className="text-[11px] text-slate-300 leading-normal">
                        Form 20B/21B DL Copy &amp; GSTIN for bulk shipper carton allocations and trade credit.
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border transition-all ${
                  roleMode === "customer" 
                    ? "bg-sky-500/20 border-sky-500/60 text-white ring-1 ring-sky-500/40" 
                    : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/30 text-sky-300 border border-sky-500/50 flex items-center justify-center shrink-0 text-sm mt-0.5">
                      👤
                    </div>
                    <div>
                      <span className="font-bold text-white block">Retail Customers &amp; Patients</span>
                      <span className="text-[11px] text-slate-300 leading-normal">
                        Direct medicine purchases at standard MRP with home delivery &amp; order tracking.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Sign-In Link */}
            <div className="relative z-10 pt-3 border-t border-slate-700/80 text-xs text-slate-300 flex items-center justify-between">
              <span>Already have an account?</span>
              <Link href="/login" className="text-[#F3D0E9] font-black hover:underline flex items-center space-x-1">
                <span>Sign In &rarr;</span>
              </Link>
            </div>
          </div>

          {/* ── RIGHT SIDE: HIGH-CLASS MULTI-STEP REGISTRATION CARD ──────────────── */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 flex flex-col justify-between">

            <div>
              {/* ── STEPPER PROGRESS BAR ─────────────────────────────────────── */}
              <div className="mb-5 pb-4 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black uppercase tracking-wider text-[#A71380]">
                    {step === 1 ? "Step 1 of 2: Basic Details & Account Type" : "Step 2 of 2: Business Details & Verification"}
                  </span>
                  <span className="font-extrabold text-slate-400 text-[11px]">
                    {step === 1 ? "50% Completed" : "100% Ready"}
                  </span>
                </div>

                {/* Animated Visual Progress Track */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-[#0B2545] via-[#A71380] to-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
                    style={{ width: step === 1 ? "50%" : "100%" }}
                  />
                </div>

                {/* Step Indicator Badges */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 2) setStep(1);
                    }}
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-left transition-all ${
                      step === 1
                        ? "bg-[#0B2545]/5 border-[#0B2545]/30 text-[#0B2545]"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800 cursor-pointer hover:bg-emerald-100"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                      step === 1 ? "bg-[#0B2545] text-white" : "bg-emerald-600 text-white"
                    }`}>
                      {step === 2 ? "✓" : "1"}
                    </span>
                    <span className="text-[11px] font-bold truncate">1. Account &amp; Role</span>
                  </button>

                  <div className={`flex items-center space-x-2 p-2 rounded-xl border text-left transition-all ${
                    step === 2
                      ? "bg-[#A71380]/5 border-[#A71380]/30 text-[#A71380]"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}>
                    <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                      step === 2 ? "bg-[#A71380] text-white" : "bg-slate-300 text-slate-600"
                    }`}>
                      2
                    </span>
                    <span className="text-[11px] font-bold truncate">2. KYC &amp; Verification</span>
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-semibold flex items-center space-x-2 animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Banner */}
              {successMsg && (
                <div className="mb-4 bg-[#F8EAF4] border border-[#F3D0E9] text-[#A71380] text-xs p-3 rounded-xl font-semibold flex items-center space-x-2 animate-in fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A71380] shrink-0 animate-pulse" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* ── STEP 1: BASIC DETAILS & ROLE SELECTION ────────────────── */}
              {/* ───────────────────────────────────────────────────────────── */}
              {step === 1 && (
                <form onSubmit={handleProceedToStep2} className="space-y-4 text-xs">
                  
                  {/* Section Title */}
                  <div className="border-b border-slate-100 pb-2">
                    <h2 className="text-sm font-black text-[#0B2545] tracking-tight">
                      Step 1: Enter Basic Account Details
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Provide your primary contact credentials first, then select your account role below.
                    </p>
                  </div>

                  {/* 1. Basic Inputs Grid FIRST AT TOP */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#0B2545] mb-1">
                          Full Name / Contact Person *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Dr. Srikanth Reddy"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#0B2545] mb-1">
                          Mobile Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-[#0B2545] mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="contact@pharmacy.com"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-[#0B2545] mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                          >
                            {showPassword ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Account Type / Role Selection CUSTOM INTERACTIVE DROPDOWN AT THE BOTTOM */}
                  <div className="pt-2 border-t border-slate-100 space-y-2 relative">
                    <label className="block font-black text-[#0B2545] text-xs">
                      Select Account Type / User Role *
                    </label>

                    {/* Custom Interactive Dropdown Button Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                        className={`w-full text-left border-2 rounded-2xl p-3.5 bg-white cursor-pointer transition-all shadow-xs flex items-center justify-between space-x-3 ${
                          isRoleDropdownOpen
                            ? "border-[#A71380] ring-2 ring-[#A71380]/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <span className="text-2xl shrink-0 p-2 bg-[#F8FAFC] border border-slate-200/80 rounded-xl">
                            {roleMode === "retailer" ? "🏪" : roleMode === "distributor" ? "🏬" : "👤"}
                          </span>
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-xs text-[#0B2545] truncate">
                                {roleMode === "retailer"
                                  ? "Pharmacy Retailer & Chemist"
                                  : roleMode === "distributor"
                                    ? "B2B Wholesale Distributor"
                                    : "Retail Customer Account"}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0 ${
                                roleMode === "retailer"
                                  ? "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]"
                                  : roleMode === "distributor"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-sky-50 text-sky-800 border-sky-200"
                              }`}>
                                {roleMode === "retailer" ? "PTR Trade" : roleMode === "distributor" ? "Wholesale MOQ" : "Standard MRP"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                              {roleMode === "retailer"
                                ? "Form 20/21 Chemist — PTR Trade Discount Billing"
                                : roleMode === "distributor"
                                  ? "Form 20B/21B License — Master Shipper Carton Lots"
                                  : "Patient Direct Orders — Fast Standard Home Delivery"}
                            </span>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                          {isRoleDropdownOpen ? "▲" : "▼"}
                        </div>
                      </button>

                      {/* Custom Popover Options Menu (Opens UPWARD so it is never cut off at the bottom of the page) */}
                      {isRoleDropdownOpen && (
                        <>
                          {/* Backdrop to close menu */}
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setIsRoleDropdownOpen(false)}
                          />

                          <div className="absolute bottom-full left-0 right-0 mb-2.5 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {/* Option 1: Retailer */}
                            <button
                              type="button"
                              onClick={() => {
                                setRoleMode("retailer");
                                setIsRoleDropdownOpen(false);
                                setErrorMsg("");
                              }}
                              className={`w-full p-3.5 text-left flex items-start space-x-3 transition-all cursor-pointer hover:bg-[#F8EAF4]/50 ${
                                roleMode === "retailer" ? "bg-[#F8EAF4] font-bold" : "bg-white"
                              }`}
                            >
                              <span className="text-2xl shrink-0 mt-0.5">🏪</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-xs text-[#0B2545]">Pharmacy Retailer &amp; Chemist</span>
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#A71380] text-white">
                                    PTR Trade Rates
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                  For Chemist Shops &amp; Retail Pharmacies (Requires Form 20/21 Drug License).
                                </p>
                              </div>
                              {roleMode === "retailer" && (
                                <span className="text-[#A71380] font-black text-sm shrink-0">✓</span>
                              )}
                            </button>

                            {/* Option 2: Distributor */}
                            <button
                              type="button"
                              onClick={() => {
                                setRoleMode("distributor");
                                setIsRoleDropdownOpen(false);
                                setErrorMsg("");
                              }}
                              className={`w-full p-3.5 text-left flex items-start space-x-3 transition-all cursor-pointer hover:bg-emerald-50/60 ${
                                roleMode === "distributor" ? "bg-emerald-50 font-bold" : "bg-white"
                              }`}
                            >
                              <span className="text-2xl shrink-0 mt-0.5">🏬</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-xs text-[#0B2545]">B2B Wholesale Distributor</span>
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-700 text-white">
                                    Wholesale MOQ
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                  For Wholesale Stockists &amp; Distributors (Requires Form 20B/21B &amp; GSTIN).
                                </p>
                              </div>
                              {roleMode === "distributor" && (
                                <span className="text-emerald-600 font-black text-sm shrink-0">✓</span>
                              )}
                            </button>

                            {/* Option 3: Customer */}
                            <button
                              type="button"
                              onClick={() => {
                                setRoleMode("customer");
                                setIsRoleDropdownOpen(false);
                                setErrorMsg("");
                              }}
                              className={`w-full p-3.5 text-left flex items-start space-x-3 transition-all cursor-pointer hover:bg-sky-50/60 ${
                                roleMode === "customer" ? "bg-sky-50 font-bold" : "bg-white"
                              }`}
                            >
                              <span className="text-2xl shrink-0 mt-0.5">👤</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-xs text-[#0B2545]">Retail Customer / Patient</span>
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#0B2545] text-white">
                                    Standard MRP
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                                  For Patients &amp; Retail Medicine buyers (Direct Order Tracking &amp; Home Delivery).
                                </p>
                              </div>
                              {roleMode === "customer" && (
                                <span className="text-[#0B2545] font-black text-sm shrink-0">✓</span>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Proceed to Step 2 Action */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#0B2545] via-[#123663] to-[#A71380] hover:opacity-95 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <span>Next: Complete {roleMode === "retailer" ? "Pharmacy KYC" : roleMode === "distributor" ? "Distributor KYC" : "Account Setup"}</span>
                      <span className="text-sm">&rarr;</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* ── STEP 2: BUSINESS KYC & ROLE SPECIFIC DETAILS ─────────── */}
              {/* ───────────────────────────────────────────────────────────── */}
              {step === 2 && (
                <form onSubmit={handleFinalRegistration} className="space-y-4 text-xs">

                  {/* Selected Role Summary Bar */}
                  <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">
                        {roleMode === "retailer" ? "🏪" : roleMode === "distributor" ? "🏬" : "👤"}
                      </span>
                      <div>
                        <span className="font-extrabold text-[#0B2545] text-xs block">
                          {roleMode === "retailer"
                            ? "Pharmacy Retailer Account"
                            : roleMode === "distributor"
                              ? "Wholesale Distributor Account"
                              : "Retail Customer Account"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Account Owner: <strong className="text-slate-700">{fullName}</strong> ({email})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] font-bold text-[#A71380] hover:underline px-2 py-1 rounded-lg bg-[#F8EAF4]"
                    >
                      Edit Info
                    </button>
                  </div>

                  {/* FORM SPECIFIC TO RETAILER */}
                  {roleMode === "retailer" && (
                    <div className="space-y-3">
                      <h3 className="font-black text-[#0B2545] text-xs border-b border-slate-100 pb-1 flex items-center space-x-1">
                        <span>Pharmacy License &amp; Business KYC</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-[#0B2545] mb-1">
                            Pharmacy / Chemist Shop Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={retShopName}
                            onChange={(e) => setRetShopName(e.target.value)}
                            placeholder="e.g. MedPlus Chemist & Druggist"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-[#0B2545] mb-1">
                            Drug License No (DL 20/21 or 20B/21B) *
                          </label>
                          <input
                            type="text"
                            required
                            value={retDrugLicense}
                            onChange={(e) => setRetDrugLicense(e.target.value)}
                            placeholder="DL-HYD-20B-12345"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-mono font-bold text-[#0B2545] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-[#0B2545] mb-1">
                          Pharmacy GSTIN (Optional)
                        </label>
                        <input
                          type="text"
                          value={retGstin}
                          onChange={(e) => setRetGstin(e.target.value)}
                          placeholder="36AABCS1234F1Z5"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-mono text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all"
                        />
                      </div>

                      {/* File Upload Section */}
                      <div>
                        <label className="block font-bold text-[#0B2545] mb-1">
                          Upload Drug License Copy (Form 20/21 or 20B/21B)
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-[#A71380] bg-[#F8FAFC] hover:bg-white rounded-xl p-3 text-center cursor-pointer transition-all flex items-center justify-center space-x-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <span className="text-lg">📄</span>
                              <span className="text-[11px] font-bold text-slate-600 truncate block">
                                {fileName ? `${fileName} (Attached)` : "Click to select Drug License (PDF / Image)"}
                              </span>
                            </label>
                            {fileName && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFileName(null);
                                  setLicenseFile(null);
                                }}
                                className="px-2.5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer shrink-0"
                              >
                                ✕ Remove
                              </button>
                            )}
                          </div>
                          {licenseFile && licenseFile.startsWith("data:image/") && (
                            <div className="flex items-center space-x-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                              <img
                                src={licenseFile}
                                alt="Drug License Preview"
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs"
                              />
                              <div className="text-[10px] text-slate-500">
                                <span className="font-bold text-emerald-600 block">✓ License Document Attached</span>
                                <span>{fileName}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORM SPECIFIC TO DISTRIBUTOR */}
                  {roleMode === "distributor" && (
                    <div className="space-y-3">
                      <h3 className="font-black text-[#0B2545] text-xs border-b border-slate-100 pb-1 flex items-center space-x-1">
                        <span>Wholesale Enterprise KYC &amp; Verification</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-[#0B2545] mb-1">
                            Company / Firm Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={distCompanyName}
                            onChange={(e) => setDistCompanyName(e.target.value)}
                            placeholder="e.g. MedPlus Wholesale Pvt Ltd"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#0B2545] transition-all"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-[#0B2545] mb-1">
                            Wholesale Drug License (DL 20B/21B) *
                          </label>
                          <input
                            type="text"
                            required
                            value={distDrugLicense}
                            onChange={(e) => setDistDrugLicense(e.target.value)}
                            placeholder="DL-20B-98765"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-mono font-bold text-[#0B2545] focus:bg-white focus:outline-none focus:border-[#0B2545] transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-[#0B2545] mb-1">
                            GSTIN Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={distGstin}
                            onChange={(e) => setDistGstin(e.target.value)}
                            placeholder="36AAACR1234F1Z9"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-mono font-bold text-[#0B2545] focus:bg-white focus:outline-none focus:border-[#0B2545] transition-all"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-[#0B2545] mb-1">
                            Company PAN Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={distPan}
                            onChange={(e) => setDistPan(e.target.value)}
                            placeholder="ABCDE1234F"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-mono font-bold text-[#0B2545] focus:bg-white focus:outline-none focus:border-[#0B2545] transition-all"
                          />
                        </div>
                      </div>

                      {/* File Upload Section */}
                      <div>
                        <label className="block font-bold text-[#0B2545] mb-1">
                          Upload Wholesale Drug License Copy Form 20B/21B *
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-[#0B2545] bg-[#F8FAFC] hover:bg-white rounded-xl p-3 text-center cursor-pointer transition-all flex items-center justify-center space-x-2">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                              <span className="text-lg">📁</span>
                              <span className="text-[11px] font-bold text-slate-700 truncate block">
                                {fileName ? `${fileName} (Attached)` : "Select Wholesale DL 20B/21B (PDF / Image)"}
                              </span>
                            </label>
                            {fileName && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFileName(null);
                                  setLicenseFile(null);
                                }}
                                className="px-2.5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer shrink-0"
                              >
                                ✕ Remove
                              </button>
                            )}
                          </div>
                          {licenseFile && licenseFile.startsWith("data:image/") && (
                            <div className="flex items-center space-x-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                              <img
                                src={licenseFile}
                                alt="Distributor DL Preview"
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs"
                              />
                              <div className="text-[10px] text-slate-500">
                                <span className="font-bold text-emerald-600 block">✓ Wholesale License Ready for Verification</span>
                                <span>{fileName}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FORM SPECIFIC TO CUSTOMER */}
                  {roleMode === "customer" && (
                    <div className="space-y-3">
                      <h3 className="font-black text-[#0B2545] text-xs border-b border-slate-100 pb-1">
                        Delivery Address &amp; Location Details (Optional)
                      </h3>

                      <div>
                        <label className="block font-bold text-[#0B2545] mb-1">
                          Delivery Street Address
                        </label>
                        <input
                          type="text"
                          value={custAddress}
                          onChange={(e) => setCustAddress(e.target.value)}
                          placeholder="Flat / House No, Street name"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#0B2545] transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-[#0B2545] mb-1">City</label>
                          <input
                            type="text"
                            value={custCity}
                            onChange={(e) => setCustCity(e.target.value)}
                            placeholder="Hyderabad"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#0B2545] transition-all"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-[#0B2545] mb-1">Pincode</label>
                          <input
                            type="text"
                            value={custPincode}
                            onChange={(e) => setCustPincode(e.target.value)}
                            placeholder="500001"
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-[#F8FAFC] text-xs font-mono text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#0B2545] transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons for Step 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="sm:col-span-1 border border-slate-300 hover:bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>&larr; Back to Step 1</span>
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`sm:col-span-2 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 ${
                        roleMode === "retailer"
                          ? "bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6B0B52] shadow-[#A71380]/25"
                          : roleMode === "distributor"
                            ? "bg-gradient-to-r from-[#0B2545] to-[#123663] hover:from-[#103058] hover:to-[#0B2545] shadow-[#0B2545]/20"
                            : "bg-gradient-to-r from-sky-700 to-sky-900 hover:from-sky-800 hover:to-sky-950 shadow-sky-900/20"
                      }`}
                    >
                      <span>
                        {loading
                          ? "Submitting Registration..."
                          : roleMode === "retailer"
                            ? "Register Pharmacy & Get PTR Rates →"
                            : roleMode === "distributor"
                              ? "Submit Wholesale KYC Application →"
                              : "Complete Registration →"}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};
