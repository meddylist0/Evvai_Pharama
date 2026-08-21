"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { INITIAL_SECONDARY_INVOICES, SecondaryInvoice, LocalBuyer, INITIAL_LOCAL_BUYERS } from "@/data/mockData";

export default function SecondarySalesDashboardPage() {
  const [invoices, setInvoices] = useState<SecondaryInvoice[]>([]);
  const [buyers, setBuyers] = useState<LocalBuyer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Pagination State (Admin-style)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [selectedInvoice, setSelectedInvoice] = useState<SecondaryInvoice | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    try {
      const savedInvoices = localStorage.getItem("pharmalink_secondary_invoices");
      setInvoices(savedInvoices ? JSON.parse(savedInvoices) : INITIAL_SECONDARY_INVOICES);
      const savedBuyers = localStorage.getItem("pharmalink_local_buyers");
      setBuyers(savedBuyers ? JSON.parse(savedBuyers) : INITIAL_LOCAL_BUYERS);
    } catch (e) {
      setInvoices(INITIAL_SECONDARY_INVOICES);
      setBuyers(INITIAL_LOCAL_BUYERS);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    const targetInvoice = invoices.find((inv) => inv.id === invoiceId);
    if (!targetInvoice) return;

    const balanceToClear = targetInvoice.balanceAmount;

    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId
        ? { ...inv, paidAmount: inv.totalAmount, balanceAmount: 0, status: "PAID" as const }
        : inv
    );

    setInvoices(updatedInvoices);
    try {
      localStorage.setItem("pharmalink_secondary_invoices", JSON.stringify(updatedInvoices));

      // Reduce buyer outstanding credit
      if (balanceToClear > 0) {
        const updatedBuyers = buyers.map((b) =>
          b.id === targetInvoice.buyerId
            ? { ...b, currentOutstanding: Math.max(0, b.currentOutstanding - balanceToClear) }
            : b
        );
        setBuyers(updatedBuyers);
        localStorage.setItem("pharmalink_local_buyers", JSON.stringify(updatedBuyers));
      }
    } catch (e) {
      console.error(e);
    }

    setStatusMsg({ type: "success", text: `✓ Invoice '${targetInvoice.invoiceNo}' marked as PAID!` });
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice({ ...targetInvoice, paidAmount: targetInvoice.totalAmount, balanceAmount: 0, status: "PAID" });
    }
  };

  // Filtering Logic
  const filteredInvoices = invoices.filter((inv) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(search) ||
      inv.buyerName.toLowerCase().includes(search) ||
      inv.villageTown.toLowerCase().includes(search) ||
      inv.paymentMode.toLowerCase().includes(search);

    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic (Matching Admin Console)
  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
  const paidCount = invoices.filter((inv) => inv.status === "PAID").length;
  const pendingCount = invoices.filter((inv) => inv.status === "CREDIT_PENDING" || inv.status === "PARTIAL").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
              Admin Grade Console • Secondary Distribution Revenue & Credit
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Database Synced
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Secondary B2B Sales & Credit Invoices
          </h1>
          <p className="text-xs text-slate-500">
            Manage tax compliant sales bills, credit collections, and payments from local RMP doctors and chemist counters.
          </p>
        </div>

        <Link
          href="/distributor/sales/new"
          className="bg-[#0b2341] hover:bg-[#12315a] text-white font-bold px-5 py-3 rounded-2xl shadow-xs transition-all text-xs flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <span>+ Create B2B Sales Invoice</span>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales Turnover</span>
          <div className="text-2xl font-black text-[#0b2341]">₹{totalRevenue.toLocaleString("en-IN")}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credit Collectibles (Outstanding)</span>
          <div className="text-2xl font-black text-rose-600">₹{totalOutstanding.toLocaleString("en-IN")}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settled / Paid Invoices</span>
          <div className="text-2xl font-black text-emerald-600">{paidCount} Paid</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Credit Invoices</span>
          <div className="text-2xl font-black text-amber-600">{pendingCount} Pending</div>
        </div>
      </div>

      {/* Status Msg */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
            statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Admin Controls Bar: Search + Filter + View Mode Toggle + Per Page + Pagination Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
        <input
          type="text"
          placeholder="Search invoice no, buyer name, village, payment mode..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 font-medium w-full sm:w-80 focus:bg-white focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-bold text-[11px]">Payment Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
            >
              <option value="ALL">All Statuses ({invoices.length})</option>
              <option value="PAID">PAID ({paidCount})</option>
              <option value="CREDIT_PENDING">CREDIT PENDING ({pendingCount})</option>
            </select>
          </div>

          {/* View Toggle (Table vs Grid Cards) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Grid Cards
            </button>
          </div>

          <div className="text-slate-500 font-bold text-xs border-l border-slate-200 pl-3">
            Invoices: <span className="text-[#0b2341]">{filteredInvoices.length}</span>
          </div>

          {/* Per Page Selector */}
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium border-l border-slate-200 pl-3">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Container (Table View vs Grid View) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold text-xs">
            No secondary invoices match your search or filter criteria.
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                    <th className="py-3.5 px-6">Invoice No & Date</th>
                    <th className="py-3.5 px-6">Buyer / Doctor Name</th>
                    <th className="py-3.5 px-6">Village / Mandal</th>
                    <th className="py-3.5 px-6">Payment Terms</th>
                    <th className="py-3.5 px-6">Total Amount</th>
                    <th className="py-3.5 px-6">Due Balance</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {paginatedInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#0b2341] font-mono text-sm">{inv.invoiceNo}</div>
                        <div className="text-[11px] text-slate-400">{inv.invoiceDate}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-[#0b2341]">{inv.buyerName}</div>
                        <div className="text-[10px] text-blue-600 font-bold">{inv.buyerType.replace("_", " ")}</div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700">{inv.villageTown}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 border border-slate-200 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-700">
                          {inv.paymentMode.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-black text-[#0b2341] text-sm font-mono">
                        ₹{inv.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-6 font-mono">
                        {inv.balanceAmount > 0 ? (
                          <span className="font-black text-rose-600 text-sm">₹{inv.balanceAmount.toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="font-bold text-emerald-600">₹0</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {inv.status === "PAID" ? (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            ✓ PAID
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                            ⏳ CREDIT DUE
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {inv.balanceAmount > 0 && (
                          <button
                            onClick={() => handleMarkAsPaid(inv.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer shadow-2xs"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer"
                        >
                          View Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Admin Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/70 border-t border-slate-200 text-xs font-semibold text-slate-600">
              <div>
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredInvoices.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filteredInvoices.length}</span> secondary invoices
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                    title="Previous Page"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === pageNum
                          ? "bg-[#0b2341] text-white border-[#0b2341] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                    title="Next Page"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Grid View Cards */
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedInvoices.map((inv) => (
                <div key={inv.id} className="border border-slate-200/90 rounded-2xl p-5 bg-white hover:shadow-md transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-sm font-black text-[#0b2341]">{inv.invoiceNo}</span>
                      <div className="text-[11px] text-slate-400">{inv.invoiceDate}</div>
                    </div>
                    {inv.status === "PAID" ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        ✓ PAID
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        ⏳ CREDIT DUE
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                    <div className="font-bold text-[#0b2341]">{inv.buyerName}</div>
                    <div className="text-[11px] text-blue-600 font-bold">{inv.buyerType.replace("_", " ")} | Location: {inv.villageTown}</div>
                    <div className="text-[11px] text-slate-500">Terms: <span className="font-bold">{inv.paymentMode.replace("_", " ")}</span></div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Bill</span>
                      <span className="font-black text-[#0b2341] font-mono text-base">₹{inv.totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Due Balance</span>
                      {inv.balanceAmount > 0 ? (
                        <span className="font-black text-rose-600 font-mono text-base">₹{inv.balanceAmount.toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="font-bold text-emerald-600 text-sm">₹0</span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-slate-100">
                    {inv.balanceAmount > 0 && (
                      <button
                        onClick={() => handleMarkAsPaid(inv.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
                    >
                      View Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600">
              <div>
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredInvoices.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filteredInvoices.length}</span> invoices
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === pageNum
                          ? "bg-[#0b2341] text-white border-[#0b2341] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal with WhatsApp & Print */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase">
                  B2B TAX INVOICE • {selectedInvoice.status}
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">{selectedInvoice.invoiceNo}</h3>
                <p className="text-xs text-slate-500">Issued to: {selectedInvoice.buyerName} | Date: {selectedInvoice.invoiceDate}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 font-bold text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-3">
                        <div className="font-bold text-[#0b2341]">{it.productName}</div>
                        <div className="text-[10px] text-slate-400">{it.composition}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">{it.batchNo} ({it.expiryDate})</td>
                      <td className="p-3 text-center font-bold">{it.quantity}</td>
                      <td className="p-3 text-right font-mono font-bold">₹{it.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-[#0b2341]">
                <span>Total Invoice Amount:</span>
                <span>₹{selectedInvoice.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span>₹{selectedInvoice.paidAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
                <span>Outstanding Balance:</span>
                <span>₹{selectedInvoice.balanceAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {selectedInvoice.balanceAmount > 0 && (
                <button
                  onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                  className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  ✓ Mark Balance as Paid
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                🖨️ Print PDF
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(
                    `*PharmaLink B2B Invoice*\nInvoice No: ${selectedInvoice.invoiceNo}\nBuyer: ${selectedInvoice.buyerName}\nTotal: ₹${selectedInvoice.totalAmount}\nDue Balance: ₹${selectedInvoice.balanceAmount}`
                  );
                  window.open(`https://wa.me/?text=${text}`, "_blank");
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                📲 WhatsApp Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
