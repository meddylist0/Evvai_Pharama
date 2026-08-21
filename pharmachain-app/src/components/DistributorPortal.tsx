"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, authAPI, setStoredUser, productsAPI, ordersAPI, ProductItem, OrderData } from "@/lib/api";

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

  const fetchProfileAndData = async () => {
    try {
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
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfileAndData();
  };

  const isApproved = user?.kyc_status === "APPROVED";
  const distProfile = profileData?.distributor_profile;

  // Real Calculated Dynamic KPIs for this logged-in distributor
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.order_status !== "Delivered").length;
  const totalPurchaseValue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const availableCreditLimit = Math.max(0, 500000 - totalPurchaseValue);

  // Render PENDING KYC Application Status Screen
  if (!isApproved) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header Alert Banner */}
        <div className="bg-[#0b2341] text-white rounded-3xl p-8 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
              <span className="animate-pulse">●</span>
              <span>KYC Verification In Progress</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {distProfile?.company_name || user?.full_name || "Pharma Distribution Partner"}
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Your Drug License & GST registration documents have been submitted to EVVAI Pharmaceuticals Regulatory Compliance Admin.
              Bulk purchase orders and wholesale discounted rates will be automatically unlocked once your Drug License is approved.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white hover:bg-slate-100 text-[#0b2341] text-xs font-black px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>🔄</span>
              <span>{refreshing ? "Checking Database..." : "Check / Refresh Verification Status"}</span>
            </button>

            <span className="text-[11px] text-slate-400">
              Admin reviews typically take 2-4 hours.
            </span>
          </div>
        </div>

        {/* Verification Stage Timeline */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-5">
          <h3 className="text-sm font-extrabold text-[#0b2341] uppercase tracking-wider">
            Onboarding & Verification Timeline
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">✓</span>
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Completed</span>
              </div>
              <h4 className="text-xs font-black text-emerald-950">1. Application & License Upload</h4>
              <p className="text-[11px] text-emerald-800">Drug License No & GST credentials recorded.</p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center animate-spin">⏳</span>
                <span className="text-[10px] font-bold text-amber-800 uppercase">Current Stage</span>
              </div>
              <h4 className="text-xs font-black text-amber-950">2. Admin Regulatory Review</h4>
              <p className="text-[11px] text-amber-800">State Drug Controller (DCA) validity check.</p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 opacity-60">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 font-black text-xs flex items-center justify-center">🔒</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Locked</span>
              </div>
              <h4 className="text-xs font-black text-slate-700">3. Wholesale B2B Purchasing</h4>
              <p className="text-[11px] text-slate-500">Tiered pricing, GST invoices & bulk PO orders.</p>
            </div>
          </div>
        </div>

        {/* Submitted Application Credentials Details */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#0b2341]">
            Submitted Application Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#f7f6f4] p-4 rounded-2xl border border-[#e8e6e2] space-y-1">
              <span className="text-slate-500 text-[11px] block">Company / Entity Name</span>
              <span className="font-bold text-[#0b2341] text-sm block">
                {distProfile?.company_name || user?.full_name || "Pending Registration"}
              </span>
            </div>

            <div className="bg-[#f7f6f4] p-4 rounded-2xl border border-[#e8e6e2] space-y-1">
              <span className="text-slate-500 text-[11px] block">Authorized Person & Email</span>
              <span className="font-bold text-[#0b2341] text-sm block">
                {user?.full_name} ({user?.email})
              </span>
            </div>

            <div className="bg-[#f7f6f4] p-4 rounded-2xl border border-[#e8e6e2] space-y-1">
              <span className="text-slate-500 text-[11px] block">GSTIN Registration</span>
              <span className="font-mono font-bold text-blue-700 text-sm block">
                {distProfile?.gstin || "Recorded on Application"}
              </span>
            </div>

            <div className="bg-[#f7f6f4] p-4 rounded-2xl border border-[#e8e6e2] space-y-1">
              <span className="text-slate-500 text-[11px] block">Drug License Number</span>
              <span className="font-mono font-bold text-emerald-700 text-sm block">
                {distProfile?.drug_license_no || "Under DCA Validation"}
              </span>
            </div>
          </div>
        </div>

        {/* Regulatory Notice & Support */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 text-xs text-blue-950 space-y-2">
          <div className="flex items-center space-x-2 font-black">
            <span>🏛️ Why is Drug License verification mandatory?</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Under the Drugs and Cosmetics Rules (Form 20B/21B wholesale provisions), pharmaceutical manufacturers are legally mandated to verify active distributor drug licenses before providing bulk formulations.
            Once verified by our Chief Administrator, your wholesale account will be fully activated.
          </p>
        </div>
      </div>
    );
  }

  // Render APPROVED Full Distributor Portal with Live Database Data
  return (
    <div className="space-y-6">
      {/* Header Banner matching dark navy corporate branding (#0b2341) */}
      <div className="bg-[#0b2341] text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              ✓ Active B2B Wholesale Account
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {distProfile?.company_name || user?.full_name}
          </h1>
          <p className="text-xs text-slate-300">
            GSTIN: {distProfile?.gstin || "On File"} | Drug License No: {distProfile?.drug_license_no || "DCA Verified"} | Approved B2B Wholesale Active
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/distributor/catalog"
            className="bg-white hover:bg-slate-100 text-[#0b2341] text-xs font-extrabold px-5 py-3 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Quick Bulk PO Order</span>
          </Link>
        </div>
      </div>

      {/* Distributor KPI Cards (Real Data from Database) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Your Purchase Orders</span>
          <span className="text-2xl font-black text-[#0b2341]">{totalOrdersCount} PO Orders</span>
          <span className="text-[10px] text-blue-600 block mt-1 font-bold">
            {pendingOrdersCount > 0 ? `${pendingOrdersCount} In-Fulfillment / Shipping` : "All orders fulfilled"}
          </span>
        </div>

        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Total Purchase Spend</span>
          <span className="text-2xl font-black text-emerald-700">₹{totalPurchaseValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Direct Wholesale Rates Applied</span>
        </div>

        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">Available Credit Limit</span>
          <span className="text-2xl font-black text-[#0b2341]">₹{availableCreditLimit.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-emerald-700 block mt-1 font-bold">Account Status: Active & Approved</span>
        </div>
      </div>

      {/* B2B Wholesale Pricing Sheet (Live Database Products) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[#0b2341]">Distributor Bulk Pricing Sheet</h3>
            <p className="text-xs text-slate-500">Live inventory catalog with MRP vs B2B Wholesale vs Tiered Bulk MOQ Rates</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Special Wholesale Rates Live
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                <th className="py-3 px-4">Formulation & SKU</th>
                <th className="py-3 px-4">Composition</th>
                <th className="py-3 px-4">MRP (₹)</th>
                <th className="py-3 px-4">Your B2B Rate (₹)</th>
                <th className="py-3 px-4">Bulk MoQ Rate (₹)</th>
                <th className="py-3 px-4">Live Stock</th>
                <th className="py-3 px-4 text-right">Order Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-bold text-[#0b2341] block">{prod.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{prod.sku} {prod.batch_no ? `(Batch: ${prod.batch_no})` : ""}</span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-medium">{prod.composition}</td>
                  <td className="py-4 px-4 text-slate-400 line-through">₹{(prod.mrp || 0).toFixed(2)}</td>
                  <td className="py-4 px-4 font-black text-blue-600">₹{(prod.distributor_price || prod.price || 0).toFixed(2)}</td>
                  <td className="py-4 px-4 font-black text-emerald-600">
                    ₹{(prod.bulk_price || prod.distributor_price || prod.price || 0).toFixed(2)}{" "}
                    <span className="text-[10px] text-slate-500 font-normal">(≥{prod.bulk_moq || 20})</span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-700">{prod.stock} Units</td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href="/distributor/catalog"
                      className="inline-block bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs cursor-pointer"
                    >
                      + Order in Catalog
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distributor Purchase Orders & GST Invoices (Real DB Orders for this User) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0b2341]">Your Purchase Orders & GST Tax Invoices</h3>
          <span className="text-xs font-bold text-slate-500">{orders.length} Total Orders</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-600">No purchase orders placed yet.</p>
            <p className="text-[11px] text-slate-400">Your approved B2B pricing is active. Place your first wholesale order via the catalog.</p>
            <div className="pt-2">
              <Link
                href="/distributor/catalog"
                className="inline-block bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
              >
                Browse Wholesale Catalog &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                  <th className="py-3 px-4">PO Code</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4">Total Amount (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invoice Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-blue-600">{ord.order_code}</td>
                    <td className="py-4 px-4 text-slate-600 font-medium">{ord.created_at?.split("T")[0]}</td>
                    <td className="py-4 px-4 font-medium text-slate-800">{ord.items?.length || 1} Formulations</td>
                    <td className="py-4 px-4 font-black text-[#0b2341]">₹{ord.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4">
                      <span className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full font-bold text-[10px] border border-blue-200 uppercase">
                        {ord.order_status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href="/distributor/invoices"
                        className="inline-block text-blue-600 hover:text-blue-800 font-bold border border-blue-200 bg-blue-50 px-3 py-1 rounded-lg text-xs cursor-pointer"
                      >
                        View GST Invoice
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
  );
};


