"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/lib/api";

export const LoginPageView: React.FC = () => {
  const router = useRouter();
  const { login } = useAuth();

  // Mode: "login" | "register-customer" | "register-distributor"
  const [authMode, setAuthMode] = useState<"login" | "register-customer" | "register-distributor">("login");

  // Login Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Customer Registration States
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPassword, setCustPassword] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custCity, setCustCity] = useState("");
  const [custState, setCustState] = useState("");
  const [custPincode, setCustPincode] = useState("");

  // Distributor Registration States
  const [distCompanyName, setDistCompanyName] = useState("");
  const [distPersonName, setDistPersonName] = useState("");
  const [distEmail, setDistEmail] = useState("");
  const [distPassword, setDistPassword] = useState("");
  const [distPhone, setDistPhone] = useState("");
  const [distGstin, setDistGstin] = useState("");
  const [distDrugLicense, setDistDrugLicense] = useState("");
  const [distPanNumber, setDistPanNumber] = useState("");
  const [distDocumentUrl, setDistDocumentUrl] = useState("");
  const [distDocFileName, setDistDocFileName] = useState("");
  const [distAddress, setDistAddress] = useState("");
  const [distCity, setDistCity] = useState("");
  const [distState, setDistState] = useState("");
  const [distPincode, setDistPincode] = useState("");

  // Load remembered email, mode, and check for session expiration redirect
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("reason") === "session_expired") {
        setErrorMsg("Your session has expired. Please log in again to continue.");
      }
      const modeParam = params.get("mode");
      if (modeParam === "register-customer" || modeParam === "register-distributor" || modeParam === "login") {
        setAuthMode(modeParam as any);
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

  // Handle Customer Registration
  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await authAPI.registerCustomer({
        email: custEmail.trim(),
        password: custPassword,
        full_name: custName,
        phone: custPhone,
        address: custAddress,
        city: custCity,
        state: custState,
        pincode: custPincode,
      });

      setSuccessMsg("Account created successfully! Logging you in...");
      setTimeout(() => {
        router.push("/customer/dashboard");
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Distributor Registration (with GST & Drug License)
  const handleDistributorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      await authAPI.registerDistributor({
        email: distEmail.trim(),
        password: distPassword,
        full_name: distPersonName,
        phone: distPhone,
        company_name: distCompanyName,
        distributor_name: distPersonName,
        gstin: distGstin.trim().toUpperCase(),
        drug_license_no: distDrugLicense.trim().toUpperCase(),
        pan_number: distPanNumber.trim().toUpperCase() || undefined,
        document_file_url: distDocumentUrl || (distDocFileName ? `doc://${distDocFileName}` : undefined),
        business_address: distAddress,
        city: distCity,
        state: distState,
        pincode: distPincode,
      });

      setSuccessMsg("Distributor application & Drug License submitted for KYC approval! Redirecting to status portal...");
      setTimeout(() => {
        router.push("/distributor/dashboard");
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Distributor registration failed.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full flex items-center justify-center">
        <div className="w-full max-w-lg space-y-5">
          {/* Card Container */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm space-y-6">
            {/* Header / Logo */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#0b2545] text-white rounded-2xl mx-auto flex items-center justify-center shadow-xs font-bold text-xl">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {authMode === "login"
                  ? "Sign In to EVVAI Pharmaceuticals"
                  : authMode === "register-customer"
                  ? "Create Customer Account"
                  : "Distributor B2B Onboarding"}
              </h1>
              <p className="text-xs text-slate-500">
                {authMode === "login"
                  ? "Single unified login. The system automatically routes you based on your verified role in the database."
                  : authMode === "register-customer"
                  ? "Direct access to medicine catalog, order tracking & fast checkout."
                  : "Register your wholesale distribution network with GST & Drug License."}
              </p>
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
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-semibold flex items-center space-x-2">
                <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* MODE 1: UNIFIED LOGIN FORM */}
            {authMode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="e.g. admin@pharmalink.com / distributor@medplus.com"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-3 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <a href="#" className="text-[11px] font-semibold text-blue-600 hover:underline">
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
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-3 bg-slate-50 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-medium text-slate-600">Keep me signed in</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0b2545] hover:bg-[#133a68] text-white py-3.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating with DB...</span>
                  ) : (
                    <>
                      <span>Secure Sign In</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE 2: CUSTOMER REGISTRATION FORM */}
            {authMode === "register-customer" && (
              <form onSubmit={handleCustomerRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="Kavita Reddy"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone</label>
                    <input
                      type="tel"
                      required
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="+91 9988776655"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="customer@gmail.com"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={custPassword}
                    onChange={(e) => setCustPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="Flat 402, Green Meadows, Madhapur"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={custCity}
                      onChange={(e) => setCustCity(e.target.value)}
                      placeholder="Hyderabad"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={custState}
                      onChange={(e) => setCustState(e.target.value)}
                      placeholder="Telangana"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={custPincode}
                      onChange={(e) => setCustPincode(e.target.value)}
                      placeholder="500081"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0b2545] hover:bg-[#133a68] text-white py-3 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer mt-3"
                >
                  {loading ? "Registering Customer..." : "Create Customer Account"}
                </button>
              </form>
            )}

            {/* MODE 3: DISTRIBUTOR REGISTRATION (KYC) FORM */}
            {authMode === "register-distributor" && (
              <form onSubmit={handleDistributorRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Pharmacy Name</label>
                    <input
                      type="text"
                      required
                      value={distCompanyName}
                      onChange={(e) => setDistCompanyName(e.target.value)}
                      placeholder="Apex Pharma Distributors"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Authorized Person</label>
                    <input
                      type="text"
                      required
                      value={distPersonName}
                      onChange={(e) => setDistPersonName(e.target.value)}
                      placeholder="Suresh Kumar"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">GSTIN Number *</label>
                    <input
                      type="text"
                      required
                      value={distGstin}
                      onChange={(e) => setDistGstin(e.target.value)}
                      placeholder="36AAACR1234F1Z9"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Drug License No *</label>
                    <input
                      type="text"
                      required
                      value={distDrugLicense}
                      onChange={(e) => setDistDrugLicense(e.target.value)}
                      placeholder="DL-HYD-2025-9988"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                {/* PAN Number & Drug License Upload */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Company PAN (Optional)</label>
                    <input
                      type="text"
                      value={distPanNumber}
                      onChange={(e) => setDistPanNumber(e.target.value)}
                      placeholder="AAACR1234F"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Upload Drug License / GST (PDF/IMG) *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="drug-license-file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setDistDocFileName(file.name);
                            const reader = new FileReader();
                            reader.onload = () => {
                              setDistDocumentUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="drug-license-file"
                        className="w-full border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 rounded-lg px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-all text-slate-700 font-medium"
                      >
                        <span className="truncate max-w-[130px] text-[11px]">
                          {distDocFileName ? `📄 ${distDocFileName}` : "📎 Select File..."}
                        </span>
                        <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">
                          Browse
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={distEmail}
                      onChange={(e) => setDistEmail(e.target.value)}
                      placeholder="distributor@apexpharma.com"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={distPassword}
                      onChange={(e) => setDistPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Business Address</label>
                  <input
                    type="text"
                    required
                    value={distAddress}
                    onChange={(e) => setDistAddress(e.target.value)}
                    placeholder="Plot 18, Phase 2, Industrial Hub"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={distCity}
                      onChange={(e) => setDistCity(e.target.value)}
                      placeholder="Hyderabad"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={distState}
                      onChange={(e) => setDistState(e.target.value)}
                      placeholder="Telangana"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={distPhone}
                      onChange={(e) => setDistPhone(e.target.value)}
                      placeholder="+91 9849012345"
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0b2545] hover:bg-[#133a68] text-white py-3 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer mt-3"
                >
                  {loading ? "Submitting for KYC..." : "Submit Distributor Application"}
                </button>
              </form>
            )}


            {/* Bottom Mode Switcher */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
              {authMode === "login" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register-customer");
                      setErrorMsg("");
                    }}
                    className="text-blue-700 hover:underline"
                  >
                    + Register as Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register-distributor");
                      setErrorMsg("");
                    }}
                    className="text-[#0b2545] font-bold hover:underline"
                  >
                    Distributor KYC Onboarding &rarr;
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setErrorMsg("");
                  }}
                  className="text-blue-700 font-bold hover:underline mx-auto"
                >
                  &larr; Back to Secure Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};
