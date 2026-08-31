"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, ordersAPI, OrderData, notificationsAPI, paymentsAPI } from "@/lib/api";
import { InvoiceDocumentContent } from "@/components/InvoiceDocument";

export default function DistributorInvoicesPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSettings, setAdminSettings] = useState<{
    email?: string;
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
  }>({});

  useEffect(() => {
    setUser(getStoredUser());
    const load = async () => {
      try {
        const [myOrders, notifRes, payRes] = await Promise.allSettled([
          ordersAPI.getMyOrders(),
          notificationsAPI.getSettings(),
          paymentsAPI.getAdminSettings(),
        ]);
        if (myOrders.status === "fulfilled" && myOrders.value) {
          setOrders(myOrders.value);
        }
        const email = notifRes.status === "fulfilled" ? (notifRes.value.sender_email || notifRes.value.smtp_user) : undefined;
        const bankName = payRes.status === "fulfilled" ? payRes.value.bank_name : undefined;
        const accountNo = payRes.status === "fulfilled" ? payRes.value.account_no : undefined;
        const ifscCode = payRes.status === "fulfilled" ? payRes.value.ifsc_code : undefined;
        setAdminSettings({ email, bankName, accountNo, ifscCode });
      } catch (err) {
        console.warn("Failed fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadPDF = (ord: OrderData) => {
    setSelectedInvoice(ord);
    setTimeout(() => {
      window.print();
    }, 300);
  };

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
      {/* Embedded Print CSS to print only the invoice sheet */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
        }
      `}</style>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
          GST Tax Invoices & Billing
        </span>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          GST Tax Invoices & Billing Statements
        </h1>
        <p className="text-xs text-slate-500">
          Official B2B GST tax billing register displaying stockist details, HSN codes, formulation items, and PDF receipt downloads.
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
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono font-black text-[#0b2341] text-sm block">
                        {ord.invoice_number || `EVV-INV-2026-${String(ord.id).padStart(4, "0")}`}
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
                      <span className="font-black text-emerald-700 text-sm block">
                        ₹{Number(ord.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Tax: ₹{(ord.tax_amount || 0).toFixed(2)}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold inline-block border ${(ord.payment_status || "").toUpperCase() === "PAID"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                        {ord.payment_status || "PENDING"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end space-x-2">
                        {/* 1. View Invoice Button */}
                        <button
                          onClick={() => setSelectedInvoice(ord)}
                          className="bg-[#0b2341] hover:bg-[#12315a] text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5"
                          title="Preview Official Tax Invoice"
                        >
                          <span>👁️ View</span>
                        </button>

                        {/* 2. Download / Print PDF Button */}
                        <button
                          onClick={() => handleDownloadPDF(ord)}
                          className="bg-slate-100 hover:bg-slate-200 text-[#0b2341] border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5"
                          title="Direct Download / Print PDF"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>📥 Download PDF</span>
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

      {/* Official Tax Invoice Preview Modal (Matches Admin Order Detail Template) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-300 p-6 sm:p-8 relative space-y-5 my-auto">
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  GST Audit Compliant
                </span>
                <span className="text-xs text-slate-500 font-medium">Official Bill of Supply</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  onClick={() => window.print()}
                  className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
                  title="Close Modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official GST Tax Invoice Document */}
            <div id="printable-invoice">
              <InvoiceDocumentContent
                order={selectedInvoice}
                adminSettings={adminSettings}
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="bg-slate-100 hover:bg-slate-200 text-[#0b2341] text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all cursor-pointer"
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
