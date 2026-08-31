"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, authAPI, setStoredUser, productsAPI, ordersAPI, kycAPI, ProductItem, OrderData } from "@/lib/api";

export interface DistributorPortalProps {
  onAddToCart?: (productName: string) => void;
}

export const DistributorPortal: React.FC<DistributorPortalProps> = ({ onAddToCart }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickOrderMsg, setQuickOrderMsg] = useState<string | null>(null);

  // Re-submission Form State
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [resubmitForm, setResubmitForm] = useState({
    company_name: "",
    distributor_name: "",
    gst_number: "",
    drug_license_no: "",
    pan_number: "",
    document_file_url: "",
  });
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);
  const [resubmitMsg, setResubmitMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProfileAndData = async () => {
    try {
      setLoading(true);
      const stored = getStoredUser();
      setUser(stored);

      const [me, prods, myOrders] = await Promise.all([
        authAPI.getMe().catch(() => null),
        productsAPI.list().catch(() => []),
        ordersAPI.getMyOrders().catch(() => [])
      ]);

      if (me) {
        setProfileData(me);
        const kycStatus = me.distributor_profile?.kyc_status || stored?.kyc_status;
        const updated: StoredUser = {
          ...stored!,
          full_name: me.full_name,
          email: me.email,
          role: me.role,
          user_id: me.id,
          kyc_status: kycStatus,
        };
        setStoredUser(updated);
        setUser(updated);

        // Pre-fill resubmit form
        setResubmitForm({
          company_name: me.distributor_profile?.company_name || me.full_name || "",
          distributor_name: me.distributor_profile?.distributor_name || me.full_name || "",
          gst_number: me.distributor_profile?.gstin || "",
          drug_license_no: me.distributor_profile?.drug_license_no || "",
          pan_number: "",
          document_file_url: "",
        });
      }

      if (prods) setProducts(prods);
      if (myOrders) setOrders(myOrders);
    } catch (err) {
      console.warn("Failed fetching distributor portal data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileAndData();
    const handleUpdate = () => {
      const stored = getStoredUser();
      setUser(stored);
    };
    window.addEventListener("pharmalink_user_updated", handleUpdate);
    return () => window.removeEventListener("pharmalink_user_updated", handleUpdate);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfileAndData();
  };

  const handleResubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    setResubmitSubmitting(true);
    setResubmitMsg(null);

    try {
      // 1. Submit revised KYC
      await kycAPI.submit({
        gst_number: resubmitForm.gst_number,
        drug_license_no: resubmitForm.drug_license_no,
        pan_number: resubmitForm.pan_number || undefined,
        document_file_url: resubmitForm.document_file_url || undefined,
      });

      // 2. Also update profile names
      await authAPI.updateProfile({
        full_name: resubmitForm.distributor_name,
        company_name: resubmitForm.company_name,
      });

      // 3. Update local state
      const updatedUser: StoredUser = {
        ...user!,
        kyc_status: "PENDING",
      };
      setStoredUser(updatedUser);
      setUser(updatedUser);

      setResubmitMsg({
        type: "success",
        text: "✓ Revised KYC documents successfully re-submitted! Status has been updated to PENDING verification.",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pharmalink_user_updated"));
      }

      setTimeout(() => {
        setIsResubmitModalOpen(false);
        setResubmitMsg(null);
        fetchProfileAndData();
      }, 2500);
    } catch (err: any) {
      setResubmitMsg({
        type: "error",
        text: err.message || "Failed to re-submit KYC documents. Please check all fields.",
      });
    } finally {
      setResubmitSubmitting(false);
    }
  };

  const isApproved = user?.kyc_status === "APPROVED";
  const isRejected = user?.kyc_status === "REJECTED";
  const distProfile = profileData?.distributor_profile;
  const adminRemarks = distProfile?.admin_remarks;

  // Calculated Dynamic KPIs
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.order_status !== "Delivered" && o.order_status !== "Cancelled" && o.order_status !== "Returned").length;
  const totalPurchaseValue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  
  // Outstanding Credit POs
  const outstandingCreditOrders = orders.filter((o) => {
    const isCredit = (o.payment_method || "").toLowerCase().includes("credit");
    const isUnpaid = (o.payment_status || "").toUpperCase() !== "PAID";
    const isNotCancelled = o.order_status !== "Cancelled" && o.order_status !== "Returned";
    return isCredit && isUnpaid && isNotCancelled;
  });
  const utilizedCredit = outstandingCreditOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalCreditLimit = Number(distProfile?.credit_limit ?? 500000);
  const availableCreditLimit = Math.max(0, totalCreditLimit - utilizedCredit);
  const creditUtilizationPercent = totalCreditLimit > 0 ? Math.min(100, Math.round((utilizedCredit / totalCreditLimit) * 100)) : 0;

  // Featured High-Demand Formulations (Top 4)
  const topFormulations = products.slice(0, 4);

  // Render PENDING / REJECTED KYC Application Status Screen
  if (!isApproved) {
    return (
      <div className="space-y-6 w-full">
        {/* Header Alert Banner */}
        <div className={`${
          isRejected ? "bg-[#1f0a10] border border-rose-500/30" : "bg-[#0b2341]"
        } text-white rounded-3xl p-8 shadow-sm space-y-4 relative overflow-hidden`}>
          <div className="flex items-center space-x-2">
            <span className={`${
              isRejected 
                ? "bg-rose-500/30 text-rose-300 border-rose-400/40" 
                : "bg-amber-500/30 text-amber-300 border-amber-400/30"
            } border px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5`}>
              <span className="animate-pulse">●</span>
              <span>{isRejected ? "KYC Verification Rejected — Action Required" : "KYC Verification In Progress"}</span>
            </span>
            <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
              B2B Wholesaler Partner
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {distProfile?.company_name || user?.full_name || "Pharma Distribution Partner"}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isRejected 
                ? "Your submitted Drug License & GSTIN documents were reviewed and rejected by the Regulatory Compliance Officer. Please review the rejection reason below and re-submit corrected documents to activate your wholesale account."
                : "Your Drug License & GST registration documents have been submitted to EVVAI Pharmaceuticals Regulatory Compliance Admin. Bulk purchase orders and wholesale discounted rates will be automatically unlocked once your Drug License is approved."}
            </p>
          </div>

          {/* Prominent Admin Rejection Remarks Notification Box */}
          {isRejected && (
            <div className="p-4 bg-rose-950/70 border-2 border-rose-500/40 rounded-2xl space-y-1.5 text-xs text-rose-100 shadow-inner">
              <div className="flex items-center space-x-2">
                <span className="text-base">⚠️</span>
                <span className="font-extrabold text-rose-300 uppercase tracking-wide text-[11px]">
                  Reason for Rejection from Compliance Admin:
                </span>
              </div>
              <p className="font-medium text-white pl-6 text-xs leading-relaxed bg-black/30 p-2.5 rounded-xl border border-rose-500/20">
                "{adminRemarks || "Document uploaded is illegible, expired, or GSTIN/Drug License does not match government DCA database records. Please upload a clear valid Form 20B/21B certificate."}"
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isRejected ? (
              <button
                onClick={() => setIsResubmitModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>📝 Edit & Re-submit KYC Documents</span>
              </button>
            ) : (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white hover:bg-slate-100 text-[#0b2341] text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <span className={refreshing ? "animate-spin" : ""}>🔄</span>
                <span>{refreshing ? "Checking Database..." : "Check / Refresh Verification Status"}</span>
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span>Refresh Status</span>
            </button>

            <span className="text-[11px] text-slate-400">
              {isRejected ? "Submit revised papers for expedited review." : "Admin reviews typically take 2-4 hours."}
            </span>
          </div>
        </div>

        {/* Verification Stage Timeline */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#0b2341] uppercase tracking-wider">
              Onboarding & Verification Timeline
            </h3>
            <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
              isRejected 
                ? "text-rose-700 bg-rose-50 border-rose-200" 
                : "text-amber-700 bg-amber-50 border-amber-200"
            }`}>
              {isRejected ? "Stage 2: Rejected (Action Required)" : "Stage 2 of 3 Active"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-800 text-[11px] uppercase">Step 1: Registered</span>
                <span className="text-emerald-600 font-bold text-sm">✓ Complete</span>
              </div>
              <p className="text-slate-600 text-[11px]">User profile & corporate credentials registered.</p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 ${
              isRejected ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/20" : "bg-amber-50/80 border-amber-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`font-bold text-[11px] uppercase ${isRejected ? "text-rose-900" : "text-amber-800"}`}>
                  Step 2: KYC Review
                </span>
                <span className={`font-bold text-sm ${isRejected ? "text-rose-700" : "text-amber-600 animate-pulse"}`}>
                  {isRejected ? "❌ Rejected" : "⏳ In Review"}
                </span>
              </div>
              <p className={`text-[11px] ${isRejected ? "text-rose-800 font-medium" : "text-slate-600"}`}>
                {isRejected ? "Admin rejected submission. Re-submission required." : "GSTIN & Drug License under DCA compliance validation."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 opacity-60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 text-[11px] uppercase">Step 3: B2B Active</span>
                <span className="text-slate-400 font-bold text-sm">🔒 Locked</span>
              </div>
              <p className="text-slate-500 text-[11px]">Wholesale Tier pricing & Purchase Orders enabled.</p>
            </div>
          </div>
        </div>

        {/* Submitted Details Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-2xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
              Submitted Corporate Registration Details
            </h3>
            <button
              onClick={() => setIsResubmitModalOpen(true)}
              className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all shadow-2xs"
            >
              {isRejected ? "📝 Re-submit Documents" : "Edit Details"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Company / Firm</span>
              <span className="font-bold text-[#0b2341] text-xs block truncate">
                {distProfile?.company_name || user?.full_name || "N/A"}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Contact Person</span>
              <span className="font-bold text-[#0b2341] text-xs block truncate">
                {distProfile?.distributor_name || user?.full_name || "Authorized Pharmacist"}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">GSTIN Number</span>
              <span className="font-mono font-bold text-blue-900 text-xs block">
                {distProfile?.gstin || "Under Review"}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Drug License No</span>
              <span className={`font-mono font-bold text-xs block ${isRejected ? "text-rose-700" : "text-emerald-800"}`}>
                {distProfile?.drug_license_no || "DCA Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory Compliance Guidance */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 text-xs text-blue-950 space-y-2">
          <div className="flex items-center space-x-2 font-black">
            <span>🏛️ Why is Drug License verification mandatory?</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Under the Drugs and Cosmetics Rules (Form 20B/21B wholesale provisions), pharmaceutical manufacturers are legally mandated to verify active distributor drug licenses before providing bulk formulations.
            Once verified by our Chief Administrator, your wholesale account will be fully activated.
          </p>
        </div>

        {/* ─── RE-SUBMISSION MODAL ─── */}
        {isResubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold text-blue-700 uppercase bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    Regulatory Compliance
                  </span>
                  <h2 className="text-lg font-black text-[#0b2341] tracking-tight mt-1">
                    Re-submit KYC & Drug License
                  </h2>
                </div>
                <button
                  onClick={() => setIsResubmitModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 font-black text-lg p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {resubmitMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold border transition-all ${
                    resubmitMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {resubmitMsg.text}
                </div>
              )}

              {isRejected && adminRemarks && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px]">
                  <strong>Admin Note:</strong> "{adminRemarks}"
                </div>
              )}

              <form onSubmit={handleResubmitKYC} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Firm Name *</label>
                    <input
                      type="text"
                      required
                      value={resubmitForm.company_name}
                      onChange={(e) => setResubmitForm({ ...resubmitForm, company_name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Pharmacist Name *</label>
                    <input
                      type="text"
                      required
                      value={resubmitForm.distributor_name}
                      onChange={(e) => setResubmitForm({ ...resubmitForm, distributor_name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GSTIN Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 36AAECP1234F1Z5"
                      value={resubmitForm.gst_number}
                      onChange={(e) => setResubmitForm({ ...resubmitForm, gst_number: e.target.value.toUpperCase() })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono font-bold text-blue-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Drug License Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TS/HYD/20B/12345"
                      value={resubmitForm.drug_license_no}
                      onChange={(e) => setResubmitForm({ ...resubmitForm, drug_license_no: e.target.value.toUpperCase() })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Card Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AAECP1234F"
                    value={resubmitForm.pan_number}
                    onChange={(e) => setResubmitForm({ ...resubmitForm, pan_number: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 block">📄 Document Verification Notice:</span>
                  <p>
                    Ensure your Drug License (Form 20B/21B) is current, unexpired, and matches the GST registration trade name. Submissions are verified against DCA portal within 2-4 hours.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResubmitModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resubmitSubmitting}
                    className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-xl font-extrabold shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <span>{resubmitSubmitting ? "Submitting for Review..." : "Submit Revised KYC Documents"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render APPROVED Full Distributor Portal
  return (
    <div className="space-y-6 w-full">
      {/* 1. Welcome Banner matching Customer / Admin Dashboard (#0b2341) */}
      <div className="bg-[#0b2341] text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Active B2B Wholesale Account</span>
            </span>
            <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
              Net-30 Terms Active
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Welcome back, {distProfile?.company_name || user?.full_name}!
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            GSTIN: <span className="font-mono font-bold text-white">{distProfile?.gstin || "On File"}</span> • Drug License: <span className="font-mono font-bold text-white">{distProfile?.drug_license_no || "DCA Verified"}</span> • Direct Manufacturer Wholesale Discount Pricing & Batch COA verification active.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          <Link
            href="/distributor/orders/new"
            className="bg-white hover:bg-slate-100 text-[#0b2341] text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Create Purchase Order</span>
          </Link>
          <Link
            href="/distributor/catalog"
            className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer border border-blue-400/30"
          >
            <span>📦 Wholesale Catalog</span>
          </Link>
          <Link
            href="/distributor/invoices"
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all border border-white/15 cursor-pointer"
          >
            <span>🧾 Tax Invoices</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Manufacturer B2B Scheme & Stock Bonus Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white border border-blue-800/60 rounded-2xl p-4 md:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-lg shrink-0">
            🏷️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                Tiered Batch Scheme
              </span>
              <span className="text-xs font-black text-white">Direct Factory Bulk Allocation</span>
            </div>
            <p className="text-[11px] text-blue-200 mt-0.5">
              Purchase orders with $\ge 50$ units MOQ unlock guaranteed batch testing certificates (COA) + priority dispatch within 24 hours.
            </p>
          </div>
        </div>
        <Link
          href="/distributor/catalog"
          className="bg-white hover:bg-blue-50 text-[#0b2341] text-xs font-black px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 whitespace-nowrap"
        >
          View Eligible Batches &rarr;
        </Link>
      </div>

      {/* 3. 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Purchase Orders */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Total PO Orders</span>
            <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
              {totalOrdersCount}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
              <span>{pendingOrdersCount > 0 ? `${pendingOrdersCount} In-Fulfillment` : "All Delivered"}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Cumulative Spend */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Spend (B2B)</span>
            <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
              ₹{totalPurchaseValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
              <span>Wholesale Rates Applied</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        {/* Card 3: Dynamic Available Credit Limit */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Available Credit</span>
            <div className="w-9 h-9 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
              ₹{availableCreditLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            {/* Progress bar for credit availability */}
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  creditUtilizationPercent > 85 ? "bg-rose-500" : creditUtilizationPercent > 60 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.max(5, 100 - creditUtilizationPercent)}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span>Limit: ₹{totalCreditLimit.toLocaleString('en-IN')}</span>
            <span className="text-emerald-700 font-extrabold">{100 - creditUtilizationPercent}% Avail</span>
          </div>
        </div>

        {/* Card 4: Wholesale Formulations & Catalog Action */}
        <Link 
          href="/distributor/catalog"
          className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:border-blue-500 hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block group-hover:text-blue-700 transition-colors">
              Wholesale Catalog &rarr;
            </span>
            <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
              {products.length}
            </div>
            <div className="text-[11px] font-bold text-blue-700 flex items-center space-x-1">
              <span>View Full Price List &rarr;</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#0b2341] group-hover:bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </Link>
      </div>

      {/* 4. Main Two-Column Operational Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Fast Restock & Recent Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Restock / High Demand Formulations */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-7 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0b2341] tracking-tight flex items-center space-x-2">
                  <span>⚡</span>
                  <span>Fast Re-Stock / High Demand Formulations</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Frequently ordered batches with guaranteed stock allocation
                </p>
              </div>
              <Link
                href="/distributor/catalog"
                className="text-xs font-extrabold text-blue-700 hover:underline"
              >
                Full Catalog &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {topFormulations.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>{prod.sku}</span>
                      {prod.stock > 0 ? (
                        <span className="text-emerald-700 font-bold">● In Stock ({prod.stock})</span>
                      ) : (
                        <span className="text-rose-600 font-bold">● Out of Stock</span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-[#0b2341] line-clamp-1">{prod.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{prod.composition}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block line-through">MRP ₹{(prod.mrp || 0).toFixed(0)}</span>
                      <span className="font-mono font-black text-sm text-blue-700">₹{(prod.distributor_price || prod.price || 0).toFixed(2)}</span>
                    </div>
                    <Link
                      href="/distributor/orders/new"
                      className="bg-white hover:bg-[#0b2341] hover:text-white text-[#0b2341] border border-slate-200 text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                    >
                      + Order PO
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Purchase Orders Table */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-7 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#0b2341] tracking-tight">
                  Recent Purchase Orders (POs)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track shipment status, dispatch tracking, and GST invoices
                </p>
              </div>
              <Link
                href="/distributor/orders"
                className="text-xs font-extrabold text-[#0b2341] hover:text-blue-700 transition-colors"
              >
                View All Orders ({orders.length}) &rarr;
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-600">No purchase orders placed yet.</p>
                <p className="text-[11px] text-slate-400">Your approved B2B pricing is active. Place your first wholesale order via the catalog.</p>
                <div className="pt-2">
                  <Link
                    href="/distributor/orders/new"
                    className="inline-block bg-[#0b2341] hover:bg-[#1d4ed8] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-2xs"
                  >
                    Create First Bulk PO &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3">PO Code</th>
                      <th className="py-3 px-3">Order Date</th>
                      <th className="py-3 px-3">Total Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-blue-700">{ord.order_code}</td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-[#0b2341]">
                          ₹{ord.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border inline-flex items-center space-x-1 uppercase ${
                            ord.order_status === "Delivered"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : ord.order_status === "Shipped"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : ord.order_status === "Packed"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : ord.order_status === "Confirmed"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : ord.order_status === "Cancelled" || ord.order_status === "Returned"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            <span>● {ord.order_status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href="/distributor/invoices"
                            className="inline-block text-[#0b2341] hover:text-blue-700 font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-xl text-xs transition-all shadow-2xs"
                          >
                            Tax Invoice
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Credit Health, Compliance Standing & Key Account Support */}
        <div className="space-y-6">
          {/* Credit Line & Settlement Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0b2341] uppercase tracking-wider flex items-center space-x-2">
                <span>💳</span>
                <span>B2B Credit Line (Net-30)</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Approved Credit Limit:</span>
                <span className="font-bold font-mono text-slate-800">₹{totalCreditLimit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Outstanding Balance:</span>
                <span className="font-bold font-mono text-amber-700">₹{utilizedCredit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2 font-bold">
                <span className="text-slate-700">Available to Order:</span>
                <span className="font-mono text-emerald-700 text-sm">₹{availableCreditLimit.toLocaleString('en-IN')}</span>
              </div>

              {/* Progress visual */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    creditUtilizationPercent > 80 ? "bg-rose-500" : creditUtilizationPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.max(5, 100 - creditUtilizationPercent)}%` }}
                />
              </div>

              <div className="pt-2">
                <Link
                  href="/distributor/orders"
                  className="w-full block text-center bg-[#0b2341] hover:bg-[#1d4ed8] text-white text-xs font-bold py-2 rounded-xl transition-all shadow-2xs"
                >
                  View Outstanding Invoices
                </Link>
              </div>
            </div>
          </div>

          {/* DCA License & Compliance Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0b2341] uppercase tracking-wider flex items-center space-x-2">
                <span>🏛️</span>
                <span>Regulatory Standing</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                DCA Validated
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Drug License No (Form 20B/21B)</span>
                <span className="font-mono font-bold text-[#0b2341]">{distProfile?.drug_license_no || "DL-TG-2024-8899"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Registered GSTIN</span>
                <span className="font-mono font-bold text-blue-900">{distProfile?.gstin || "36AABCM1234F1Z5"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Registered Delivery Warehouse</span>
                <span className="font-medium text-slate-700">{distProfile?.business_address || "Hyderabad, Telangana - 500034"}</span>
              </div>
            </div>
          </div>

          {/* Key Account Manager Support */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0b2341] text-white rounded-3xl p-6 shadow-sm space-y-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-lg">
                👨‍💼
              </div>
              <div>
                <h4 className="font-black text-sm">Dedicated B2B Support</h4>
                <p className="text-[11px] text-blue-200">EVVAI Pharma Institutional Sales</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Need custom institutional tenders, freight logistics assistance, or special formulation batch reservations?
            </p>
            <div className="pt-1 flex items-center space-x-2">
              <a
                href="mailto:wholesale@evvaipharma.com"
                className="flex-1 text-center bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl border border-white/15 transition-all text-xs"
              >
                ✉️ Email KAM
              </a>
              <a
                href="tel:+919000000001"
                className="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all text-xs"
              >
                📞 Direct Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
