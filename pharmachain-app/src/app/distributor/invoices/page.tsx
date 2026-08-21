"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, ordersAPI, OrderData } from "@/lib/api";

export default function DistributorInvoicesPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    const load = async () => {
      try {
        const myOrders = await ordersAPI.getMyOrders();
        if (myOrders) setOrders(myOrders);
      } catch (err) {
        console.warn("Failed fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isApproved = user?.kyc_status === "APPROVED";

  if (!isApproved) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs max-w-3xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-black text-[#0b2341]">
          GST Tax Invoices Locked
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your account is undergoing regulatory Drug License verification. Once verified by the Admin, GST billing statements & invoices will be generated for your purchase orders.
        </p>
        <div className="pt-2">
          <Link
            href="/distributor/dashboard"
            className="inline-block bg-[#0b2341] hover:bg-[#12315a] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-xs"
          >
            Check KYC Verification Status &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
          GST Tax Invoices & Billing
        </span>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          GST Tax Invoices & Billing Statements
        </h1>
        <p className="text-xs text-slate-500">
          Detailed GST tax billing register displaying stockist details, HSN codes, formulation items, and PDF receipt downloads.
        </p>
      </div>

      {/* Invoices Detailed Register Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0b2341]">Your GST Invoices & Billing Statements</h3>
          <span className="text-xs font-bold text-slate-500">{orders.length} Invoices Available</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-900 rounded-2xl mx-auto flex items-center justify-center font-bold text-xl">
              📄
            </div>
            <h4 className="text-sm font-bold text-slate-800">No GST tax invoices generated yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once you place wholesale purchase orders through the portal, official GST tax invoices with HSN breakdown will be recorded here automatically.
            </p>
            <div className="pt-2">
              <Link
                href="/distributor/catalog"
                className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs inline-block"
              >
                + Place First Purchase Order
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50 whitespace-nowrap">
                  <th className="py-3.5 px-4">Invoice & Date</th>
                  <th className="py-3.5 px-4">Stockist / Bill To</th>
                  <th className="py-3.5 px-4">PO Ref & Items</th>
                  <th className="py-3.5 px-4">Total Amount (₹)</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord, idx) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono font-black text-[#0b2341] text-sm block">
                        {ord.invoice_number || `INV-EVV-2026-${1000 + ord.id}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{ord.created_at?.split("T")[0]}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#0b2341] block text-sm">{ord.customer_name}</span>
                      <span className="text-[10px] text-slate-500">{ord.delivery_city}, {ord.delivery_state}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono text-blue-600 font-bold block">{ord.order_code}</span>
                      <span className="text-[11px] text-slate-600 font-medium">{ord.items?.length || 1} Formulations</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-black text-emerald-700 text-sm block">₹{ord.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Tax: ₹{(ord.tax_amount || 0).toFixed(2)}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-extrabold inline-block">
                        ✓ {ord.payment_status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(ord)}
                          className="bg-[#0b2341] hover:bg-[#12315a] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                        >
                          🔍 Preview
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full GST Tax Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6 p-8 relative">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Tax Audit Compliant GST Invoice
                </span>
                <h2 className="text-xl font-black text-[#0b2341] tracking-tight mt-1">
                  Tax Invoice {selectedInvoice.invoice_number || `INV-EVV-2026-${1000 + selectedInvoice.id}`}
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
                >
                  🖨️ Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Corporate & B2B Wholesaler Details Split Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-6 text-xs">
              {/* Seller Information */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Seller / Manufacturer</span>
                <h3 className="font-extrabold text-[#0b2341] text-sm">EVVAI Pharmaceuticals Global Ltd</h3>
                <p className="text-slate-600 font-normal">Plot 18, BioTech Industrial Campus, Phase II</p>
                <p className="text-slate-600 font-normal">Gachibowli, Hyderabad, Telangana 500032</p>
                <p className="font-mono text-blue-900 font-bold pt-1">GSTIN: 36AAACE9988F1Z5</p>
                <p className="font-mono text-slate-600">Drug Lic: TS/HYD/2025/8892</p>
              </div>

              {/* Buyer Information */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">B2B Bill To / Stockist</span>
                <h3 className="font-extrabold text-[#0b2341] text-sm">{selectedInvoice.customer_name}</h3>
                <p className="text-slate-600 font-normal">Phone: {selectedInvoice.customer_phone || "On file"}</p>
                <p className="text-slate-600 font-normal">{selectedInvoice.delivery_address}, {selectedInvoice.delivery_city}, {selectedInvoice.delivery_state} - {selectedInvoice.delivery_pincode}</p>
                <p className="font-mono text-blue-900 font-bold pt-1">GSTIN: {selectedInvoice.gstin || "Recorded on KYC"}</p>
                <p className="font-mono text-slate-600">PO Ref: {selectedInvoice.order_code} | Date: {selectedInvoice.created_at?.split("T")[0]}</p>
              </div>
            </div>

            {/* Itemized Formulation Billing Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#0b2341] uppercase tracking-wider">Itemized Formulation Breakdown</h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Item & Batch</th>
                      <th className="py-3 px-4">HSN Code</th>
                      <th className="py-3 px-4">Qty</th>
                      <th className="py-3 px-4 text-right">Unit B2B Rate</th>
                      <th className="py-3 px-4 text-right">Taxable Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#0b2341] block">{it.product_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Batch: {it.batch_no || "BAT-2026"}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">3004 90 99</td>
                        <td className="py-3.5 px-4 font-bold">{it.quantity} Units</td>
                        <td className="py-3.5 px-4 text-right">₹{it.unit_price?.toFixed(2)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-blue-700">₹{it.total_price?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax Summary Total */}
              <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-4 flex flex-col items-end space-y-1.5 text-xs">
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Subtotal (Taxable Value):</span>
                  <span className="font-bold">₹{selectedInvoice.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-600">
                  <span>GST (12% Pharma Rate):</span>
                  <span className="font-bold">₹{selectedInvoice.tax_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Shipping & Cold-Chain:</span>
                  <span className="font-bold">₹{selectedInvoice.shipping_charge?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-64 text-sm font-black text-[#0b2341] border-t border-slate-300 pt-1.5">
                  <span>Grand Total (INR):</span>
                  <span className="text-emerald-700 text-base">₹{selectedInvoice.total_amount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
