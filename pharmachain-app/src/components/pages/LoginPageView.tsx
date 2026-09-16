"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";
import { useAuth } from "@/context/AuthContext";

export const LoginPageView: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();

  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load remembered email and check for session expiration redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "session_expired") {
        setErrorMsg("Your session has expired. Please log in again to continue.");
      }
      const savedEmail = localStorage.getItem("pharmalink_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  // Handle Login via FastAPI Backend
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem("pharmalink_remembered_email", email.trim());
      } else {
        localStorage.removeItem("pharmalink_remembered_email");
      }

      const loggedUser = await login(email.trim(), password);
      setSuccessMsg(`Welcome back, ${loggedUser.full_name}! Redirecting...`);

      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirectUrl = params?.get("redirect");

      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
          return;
        }
        // Automatic Role-Based Routing based on Database/JWT validation
        switch (loggedUser.role) {
          case "ADMIN":
            router.push("/admin/dashboard");
            break;
          case "DISTRIBUTOR":
            router.push("/distributor/dashboard");
            break;
          case "RETAILER":
            router.push("/retailer/dashboard");
            break;
          case "CUSTOMER":
            router.push("/customer/dashboard");
            break;
          default:
            router.push("/catalog");
        }
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FA] text-[#0F172A] font-sans selection:bg-[#A71380] selection:text-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 flex-1 w-full flex items-center justify-center relative z-10">
        
        {/* Ambient Background Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#A71380]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#0B2545]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10 animate-fade-up">
          
          {/* LEFT SIDE: EDITORIAL BRAND PROFILE CARD */}
          <div className="lg:col-span-5 bg-[#0B2545] text-white rounded-3xl p-8 md:p-10 space-y-6 shadow-xl border border-[#0B2545] flex flex-col justify-between relative overflow-hidden group">
            
            {/* Ambient Magenta Glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#A71380]/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0F766E]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <span className="inline-block bg-[#A71380]/30 text-[#F3D0E9] text-[10px] font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full border border-[#A71380]/60 backdrop-blur-xs">
                EVVAI PORTAL GATEWAY
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Secure Sign In to EVVAI Network
              </h2>

              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                Single unified portal sign-in for hospital procurement officers, retail pharmacy buyers, and wholesale distributor networks with automated role routing.
              </p>

              {/* 3 Security Pillars */}
              <div className="space-y-3 pt-4 border-t border-slate-700/80 text-xs">
                <div className="flex items-center space-x-3 text-slate-200">
                  <div className="p-2 rounded-xl bg-[#A71380]/30 text-[#F3D0E9] border border-[#A71380]/50 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-white block">256-Bit Encrypted Auth</span>
                    <span className="text-[11px] text-slate-300">FastAPI JWT Token Validation</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-slate-200">
                  <div className="p-2 rounded-xl bg-[#A71380]/30 text-[#F3D0E9] border border-[#A71380]/50 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-white block">WHO-GMP Batch Verification</span>
                    <span className="text-[11px] text-slate-300">Digital COA Clearance Ready</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-slate-200">
                  <div className="p-2 rounded-xl bg-[#A71380]/30 text-[#F3D0E9] border border-[#A71380]/50 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-white block">Fast B2B Order Dispatch</span>
                    <span className="text-[11px] text-slate-300">Direct Inventory Allocation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Support Callout */}
            <div className="relative z-10 pt-4 border-t border-slate-700/80 text-[11px] text-slate-300 flex items-center justify-between">
              <span>Need help with sign in?</span>
              <a href="tel:+917075730616" className="text-[#F3D0E9] font-bold hover:underline">
                Call Support &rarr;
              </a>
            </div>

          </div>

          {/* RIGHT SIDE: SIGN IN FORM CARD */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm space-y-6 flex flex-col justify-between">
            
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0B2545] tracking-tight">
                  Sign In to Your Account
                </h1>
                <p className="text-xs text-[#475569] mt-1">
                  Enter your email address &amp; password. The system automatically routes you to your authorized dashboard.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl font-semibold flex items-center space-x-2">
                <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div className="bg-[#F8EAF4] border border-[#F3D0E9] text-[#A71380] text-xs p-3.5 rounded-xl font-semibold flex items-center space-x-2">
                <svg className="w-4 h-4 shrink-0 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#0B2545] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="e.g. buyer@pharma.com / distributor@medplus.com"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3.5 py-3 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-[#0B2545]">
                    Password *
                  </label>
                  <a href="#" className="text-[11px] font-bold text-[#A71380] hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-[#E2E8F0] rounded-xl px-3.5 py-3 bg-[#F8FAFC] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#A71380] transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0B2545] text-xs font-bold"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#475569] pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-[#A71380] focus:ring-0 cursor-pointer accent-[#A71380]"
                  />
                  <span className="font-semibold">Keep me signed in</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In To Portal</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* 1-Tap Quick Demo Credentials */}
            <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Quick 1-Tap Demo Credentials
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("customer@gmail.com");
                    setPassword("Cust@123");
                    setErrorMsg("");
                  }}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-left hover:border-[#A71380] active:scale-95 transition-all cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-[#0B2545]">Customer</div>
                  <div className="text-[9px] text-slate-500 truncate">customer@gmail.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail("distributor@medplus.com");
                    setPassword("Dist@123");
                    setErrorMsg("");
                  }}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-left hover:border-[#A71380] active:scale-95 transition-all cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-[#A71380]">Distributor</div>
                  <div className="text-[9px] text-slate-500 truncate">distributor@medplus.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@pharmalink.com");
                    setPassword("Admin@123");
                    setErrorMsg("");
                  }}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-left hover:border-[#0B2545] active:scale-95 transition-all cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-[#0B2545]">Admin</div>
                  <div className="text-[9px] text-slate-500 truncate">admin@pharmalink.com</div>
                </button>
              </div>
            </div>

            {/* Bottom Link to Register Page */}
            <div className="border-t border-[#E2E8F0] pt-4 flex items-center justify-between text-xs font-semibold text-[#475569]">
              <span>Don't have an account yet?</span>
              <Link
                href="/register"
                className="text-[#A71380] font-extrabold hover:underline cursor-pointer flex items-center space-x-1"
              >
                <span>Register Now</span>
                <span>&rarr;</span>
              </Link>
            </div>

          </div>

        </div>
      </main>

      <FooterSection />
    </div>
  );
};
