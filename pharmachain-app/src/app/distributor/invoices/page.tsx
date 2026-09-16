"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, ordersAPI, OrderData, paymentsAPI } from "@/lib/api";
import { InvoiceDocumentContent } from "@/components/shared/InvoiceDocument";
import { downloadInvoiceDirectPDF, printInvoiceDocumentClean } from "@/lib/pdfDownloader";

export default function DistributorInvoicesPage() {
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setUser(getStoredUser());
    const load = async () => {
      try {
        setLoading(true);
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
        console.warn("Failed fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [activeDownloadOrder, setActiveDownloadOrder] = useState<OrderData | null>(null);

  // Paginated Orders
  const totalPages = Math.ceil(orders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    return orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [orders, currentPage, pageSize]);

  // Direct PDF Download Handler
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

  // Download from inside modal
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

  const isApproved = user?.kyc_status === "APPROVED";

  if (!isApproved) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-8 shadow-xs max-w-3xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full mx-auto flex items-center justify-center border border-amber-200 shadow-2xs">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-6V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[#0b2341] tracking-tight">
          GST Tax Invoices Locked
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
          Your account is undergoing regulatory Drug License verification. Once verified by the Admin, GST billing statements & invoices will be generated for your purchase orders.
        </p>
        <div className="pt-2">
          <Link
            href="/distributor/dashboard"
            className="inline-flex items-center space-x-2 bg-[#0b2341] hover:bg-[#A71380] text-white font-extrabold text-xs px-6 py-3 rounded-lg transition-all shadow-xs"
          >
            <span>Check KYC Verification Status &rarr;</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Precision Print Stylesheet ensuring 0 top margin displacement */}
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

      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold uppercase bg-[#F8EAF4] text-[#A71380] px-2.5 py-0.5 rounded border border-[#F3D0E9]">
              GST Tax Invoices & Billing
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Audit Compliant
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-1.5">
            GST Tax Invoices & Billing Statements
          </h1>

        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/distributor/catalog"
            className="bg-[#0b2341] hover:bg-[#A71380] text-white px-4 py-2 rounded-lg font-extrabold text-xs transition-all shadow-xs flex items-center space-x-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Place Purchase Order</span>
          </Link>
        </div>
      </div>

      {/* Invoices Detailed Register Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#0b2341]">Your GST Invoices & Billing Statements</h3>
          <span className="text-xs font-bold text-slate-500">{orders.length} Invoices Available</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#A71380] border-t-transparent mb-2"></div>
            <p>Loading GST Invoices from Database...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 space-y-3 p-6">
            <div className="w-12 h-12 bg-[#F8EAF4] text-[#A71380] rounded-xl mx-auto flex items-center justify-center font-bold text-xl border border-[#F3D0E9]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-800">No GST Tax Invoices Generated Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Once you place wholesale purchase orders through the portal, official GST tax invoices with HSN breakdown will be recorded here automatically.
            </p>
            <div className="pt-2">
              <Link
                href="/distributor/catalog"
                className="bg-[#A71380] hover:bg-[#880f68] text-white text-xs font-extrabold px-5 py-2.5 rounded-lg transition-all shadow-xs inline-block"
              >
                + Place First Purchase Order
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs table-auto">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50 tracking-wider">
                  <th className="py-3 px-3.5 w-[22%]">Invoice &amp; Date</th>
                  <th className="py-3 px-3.5 w-[22%]">Stockist / Bill To</th>
                  <th className="py-3 px-3.5 w-[18%]">PO Ref &amp; Items</th>
                  <th className="py-3 px-3.5 w-[16%]">Total Amount (₹)</th>
                  <th className="py-3 px-3 text-center w-[10%]">Payment Status</th>
                  <th className="py-3 px-3.5 text-right w-[12%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.map((ord) => {
                  const isThisDownloading = downloadingId === ord.id;
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Invoice & Date */}
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-black text-[#0b2341] text-xs block leading-snug truncate max-w-[170px]">
                          {ord.invoice_number || `EVV-INV-2026-${String(ord.id).padStart(4, "0")}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{ord.created_at?.split("T")[0]}</span>
                      </td>

                      {/* Stockist / Bill To */}
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-[#0b2341] text-xs block leading-snug truncate max-w-[180px]">
                          {ord.customer_name}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[180px] block">
                          {ord.delivery_city}, {ord.delivery_state}
                        </span>
                      </td>

                      {/* PO Ref & Items */}
                      <td className="py-3 px-3.5">
                        <span className="font-mono text-[#A71380] font-bold block text-xs truncate max-w-[140px]">
                          {ord.order_code}
                        </span>
                        <span className="text-[10px] text-slate-600 font-medium">
                          {ord.items?.length || 1} Formulations
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3.5">
                        <span className="font-black text-emerald-700 text-xs font-mono block">
                          ₹{Number(ord.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Tax: ₹{(ord.tax_amount || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-block border ${(ord.payment_status || "").toUpperCase() === "PAID"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                        >
                          {ord.payment_status || "PENDING"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end space-x-1.5">
                          {/* View Invoice Button */}
                          <button
                            onClick={() => setSelectedInvoice(ord)}
                            className="bg-[#F8EAF4] hover:bg-[#F3D0E9] text-[#A71380] border border-[#F3D0E9] px-2.5 py-1 rounded-md font-extrabold text-[10px] shadow-2xs transition-all cursor-pointer whitespace-nowrap inline-flex items-center space-x-1"
                            title="Preview Official Tax Invoice"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>

                          {/* Direct Instant PDF Download Button */}
                          <button
                            onClick={() => handleDirectDownloadPDF(ord)}
                            disabled={isThisDownloading}
                            className="bg-[#A71380] hover:bg-[#880f68] text-white border border-[#A71380] px-2.5 py-1 rounded-md font-extrabold text-[10px] shadow-xs transition-all cursor-pointer whitespace-nowrap inline-flex items-center space-x-1 disabled:opacity-60"
                            title="Download PDF directly to your device"
                          >
                            {isThisDownloading ? (
                              <>
                                <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>PDF</span>
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

        {/* Pagination Footer */}
        {orders.length > 0 && (
          <div className="bg-slate-50/90 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-slate-500">
                Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, orders.length)}</span> of{" "}
                <span className="font-bold text-slate-800">{orders.length}</span> invoices
              </span>

              <div className="flex items-center space-x-1.5 text-slate-500">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Invoices per page"
                  className="bg-white border border-slate-200 rounded-[4px] px-2.5 py-1 font-bold text-slate-700 focus:outline-none focus:border-[#A71380]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="First page"
                className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-[4px] font-bold transition-all cursor-pointer ${currentPage === pageNum
                          ? "bg-[#A71380] text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
                className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                »
              </button>
            </div>
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
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-300 p-6 sm:p-8 relative space-y-5 my-auto">
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  GST Audit Compliant
                </span>
                <span className="text-xs text-slate-500 font-medium">Official Bill of Supply</span>
              </div>

              <div className="flex items-center space-x-2.5">
                {/* Direct Download Button inside modal (Pink #A71380) */}
                <button
                  onClick={handleModalDownloadPDF}
                  disabled={downloadingId === selectedInvoice.id}
                  className="bg-[#A71380] hover:bg-[#880f68] text-white text-xs font-black px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-60"
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
                  className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
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
                className="bg-slate-100 hover:bg-[#F8EAF4] hover:text-[#A71380] text-[#0b2341] text-xs font-extrabold px-6 py-2.5 rounded-lg transition-all cursor-pointer border border-slate-200"
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
