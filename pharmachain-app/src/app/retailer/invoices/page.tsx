"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, ordersAPI, OrderData, paymentsAPI } from "@/lib/api";
import { InvoiceDocumentContent } from "@/components/shared/InvoiceDocument";
import { downloadInvoiceDirectPDF, printInvoiceDocumentClean } from "@/lib/pdfDownloader";

export default function RetailerInvoicesPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
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
        const [myOrders, payRes] = await Promise.allSettled([
          ordersAPI.getMyOrders(),
          paymentsAPI.getAdminSettings(),
        ]);

        if (myOrders.status === "fulfilled" && myOrders.value) {
          setOrders(myOrders.value);
        }

        const bankName = payRes.status === "fulfilled" ? payRes.value.bank_name : undefined;
        const accountNo = payRes.status === "fulfilled" ? payRes.value.account_no : undefined;
        const ifscCode = payRes.status === "fulfilled" ? payRes.value.ifsc_code : undefined;
        setAdminSettings({
          email: "sales@evvaipharma.com",
          bankName,
          accountNo,
          ifscCode,
        });
      } catch (err) {
        console.warn("Failed fetching retailer invoices:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [activeDownloadOrder, setActiveDownloadOrder] = useState<OrderData | null>(null);

  const handleDirectDownloadPDF = async (ord: OrderData) => {
    setDownloadingId(ord.id);
    setActiveDownloadOrder(ord);

    setTimeout(async () => {
      try {
        await downloadInvoiceDirectPDF(ord, adminSettings);
      } catch (error) {
        console.error("Direct PDF download error:", error);
      } finally {
        setDownloadingId(null);
        setActiveDownloadOrder(null);
      }
    }, 120);
  };

  const handleModalDownloadPDF = async () => {
    if (!selectedInvoice) return;
    setDownloadingId(selectedInvoice.id);
    try {
      await downloadInvoiceDirectPDF(selectedInvoice, adminSettings);
    } catch (error) {
      console.error("Modal PDF download error:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const isApproved = !user?.kyc_status || user?.kyc_status === "APPROVED";

  if (!isApproved) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-[6px] p-8 shadow-2xs max-w-3xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-[5px] mx-auto flex items-center justify-center text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-black text-[#0b2341]">
          GST Tax Invoices Locked
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your pharmacy account is undergoing regulatory Drug License verification. Once verified by the Admin, GST billing statements & invoices will be generated for your purchase orders.
        </p>
        <div className="pt-2">
          <Link
            href="/retailer/catalog"
            className="inline-block bg-[#A71380] hover:bg-[#880f68] text-white font-bold text-xs px-6 py-3 rounded-[5px] transition-all shadow-xs"
          >
            Browse Products &amp; Catalog &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-invoice,
          #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
          GST Tax Invoices &amp; Billing
        </span>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          Pharmacy GST Invoices &amp; Billing Statements
        </h1>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-[6px] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0b2341]">Your GST Invoices &amp; Billing Statements</h3>
          <span className="text-xs font-bold text-slate-500">{orders.length} Invoices Available</span>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-slate-50 rounded-[5px] border border-slate-100 space-y-3">
            <div className="animate-spin w-8 h-8 border-4 border-[#A71380] border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Loading Pharmacy Invoices...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-[5px] border border-slate-100 space-y-3">
            <div className="w-12 h-12 bg-[#F8EAF4] text-[#A71380] rounded-[5px] mx-auto flex items-center justify-center font-bold text-xl">
              📄
            </div>
            <h4 className="text-sm font-bold text-slate-800">No GST tax invoices generated yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once you place wholesale pharmacy purchase orders through the portal, official GST tax invoices with HSN breakdown will be recorded here automatically.
            </p>
            <div className="pt-2">
              <Link
                href="/retailer/catalog"
                className="bg-[#A71380] hover:bg-[#880f68] text-white text-xs font-extrabold px-5 py-2.5 rounded-[5px] transition-all shadow-xs inline-block"
              >
                + Place First Pharmacy Order
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50 whitespace-nowrap">
                  <th className="py-3.5 px-4">Invoice &amp; Date</th>
                  <th className="py-3.5 px-4">Pharmacy / Bill To</th>
                  <th className="py-3.5 px-4">PO Ref &amp; Items</th>
                  <th className="py-3.5 px-4">Total Amount (₹)</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => {
                  const isThisDownloading = downloadingId === ord.id;
                  return (
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
                        <span className="font-mono text-[#A71380] font-bold block">{ord.order_code}</span>
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
                          <button
                            onClick={() => setSelectedInvoice(ord)}
                            className="bg-[#F8EAF4] hover:bg-[#F3D0E9] text-[#A71380] border border-[#F3D0E9] px-3.5 py-1.5 rounded-[5px] font-extrabold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5"
                            title="Preview Official Tax Invoice"
                          >
                            <span>👁️ View</span>
                          </button>

                          <button
                            onClick={() => handleDirectDownloadPDF(ord)}
                            disabled={isThisDownloading}
                            className="bg-[#A71380] hover:bg-[#880f68] text-white border border-[#A71380] px-3.5 py-1.5 rounded-[5px] font-extrabold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 disabled:opacity-60"
                            title="Download PDF directly to your device"
                          >
                            {isThisDownloading ? (
                              <>
                                <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                                <span>Saving PDF...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>📥 Download PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden container to mount exact InvoiceDocumentContent for instant direct PDF export */}
      {activeDownloadOrder && (
        <div style={{ position: "fixed", left: "-9999px", top: 0, width: "800px", zIndex: -100, background: "#ffffff" }}>
          <div id="printable-invoice" className="p-6 bg-white">
            <InvoiceDocumentContent
              order={activeDownloadOrder}
              adminSettings={adminSettings}
            />
          </div>
        </div>
      )}

      {/* Official Tax Invoice Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[6px] max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-300 p-6 sm:p-8 relative space-y-5 my-auto">
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  GST Audit Compliant
                </span>
                <span className="text-xs text-slate-500 font-medium">Official Bill of Supply</span>
              </div>

              <div className="flex items-center space-x-2.5">
                {/* Direct Download Button inside modal */}
                <button
                  onClick={handleModalDownloadPDF}
                  disabled={downloadingId === selectedInvoice.id}
                  className="bg-[#A71380] hover:bg-[#880f68] text-white text-xs font-black px-4 py-2 rounded-[5px] transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {downloadingId === selectedInvoice.id ? (
                    <>
                      <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      <span>Saving PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Direct Download PDF</span>
                    </>
                  )}
                </button>

                {/* Clean A4 Print Dialog Button */}
                <button
                  onClick={() => printInvoiceDocumentClean(selectedInvoice, adminSettings)}
                  className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-4 py-2 rounded-[5px] transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print</span>
                </button>

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-[#A71380] font-black text-xl p-1 cursor-pointer transition-colors"
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
                className="bg-slate-100 hover:bg-[#F8EAF4] hover:text-[#A71380] text-[#0b2341] text-xs font-extrabold px-6 py-2.5 rounded-[5px] transition-all cursor-pointer border border-slate-200"
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
