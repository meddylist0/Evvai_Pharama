"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ordersAPI, OrderData } from "@/lib/api";
import { getOrderStatusDisplay } from "@/lib/pricingUtils";
import { usePlatform } from "@/lib/platform";
import { MobileOrders } from "@/components/mobile/customer/MobileOrders";

export default function CustomerOrdersPage() {
  const platform = usePlatform();

  if (platform.isNative || platform.isMobile) {
    return <MobileOrders />;
  }

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Cancellation Modal State
  const [cancellingOrder, setCancellingOrder] = useState<OrderData | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelCustomNotes, setCancelCustomNotes] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // Return Modal State
  const [returningOrder, setReturningOrder] = useState<OrderData | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const handleGlobalSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setSearchTerm(q);
    };
    window.addEventListener("pharmalink_customer_search", handleGlobalSearch);
    return () => window.removeEventListener("pharmalink_customer_search", handleGlobalSearch);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    setCancelSubmitting(true);
    setStatusMsg(null);

    const fullReason = cancelCustomNotes.trim()
      ? `${cancelReason || "Other"}: ${cancelCustomNotes.trim()}`
      : cancelReason || "Customer requested cancellation";

    try {
      const updated = await ordersAPI.cancelOrder(cancellingOrder.id, fullReason);
      setOrders((prev) => prev.map((o) => (o.id === cancellingOrder.id ? updated : o)));
      setStatusMsg({
        type: "success",
        text: `✓ Order #${cancellingOrder.order_code || cancellingOrder.id} cancelled successfully! Full refund of ₹${Number(cancellingOrder.total_amount).toFixed(2)} has been initiated (credited in 5–7 business days). Stock units have been restored to warehouse inventory.`,
      });
      setCancellingOrder(null);
      setCancelReason("");
      setCancelCustomNotes("");
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to cancel order.",
      });
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningOrder) return;
    setReturnSubmitting(true);
    try {
      const updatedOrder = await ordersAPI.requestReturn(returningOrder.id, returnReason);
      setOrders((prev) => prev.map((o) => (o.id === returningOrder.id ? updatedOrder : o)));
      setStatusMsg({
        type: "success",
        text: `✓ Return request submitted for Order #${returningOrder.order_code}!`,
      });
      setReturningOrder(null);
      setReturnReason("");
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to submit return request.",
      });
    } finally {
      setReturnSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const currentStatus = (o.order_status || "").toString();
    const orderCode = (o.order_code || o.id || "").toString().toLowerCase();
    const query = searchTerm.trim().toLowerCase();

    if (query) {
      const matchesSearch =
        orderCode.includes(query) ||
        (o.items && o.items.some((it: any) => it.product_name?.toLowerCase().includes(query)));
      if (!matchesSearch) return false;
      return true;
    }

    if (statusFilter !== "all") {
      if (currentStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
            Order Fulfillment & Live Tracking
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● {orders.length} Total Orders
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          My Order History & Invoices
        </h1>

      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-[5px] text-xs font-bold border transition-all ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
            : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search Order Code, Item Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-[5px] font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#A71380] transition-all"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <Link
            href="/customer/catalog"
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-4 py-2 rounded-[5px] font-extrabold text-xs shadow-sm shadow-[#A71380]/20 self-start md:self-auto cursor-pointer"
          >
            + Place New Order
          </Link>
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-[5px] font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === "all" ? "bg-[#A71380] text-white shadow-xs shadow-[#A71380]/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter("Pending")}
            className={`px-3.5 py-1.5 rounded-[5px] font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === "Pending" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("Confirmed")}
            className={`px-3.5 py-1.5 rounded-[5px] font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === "Confirmed" ? "bg-[#A71380] text-white shadow-xs" : "bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9]"
              }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter("Packed")}
            className={`px-3.5 py-1.5 rounded-[5px] font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === "Packed" ? "bg-indigo-600 text-white shadow-xs" : "bg-indigo-50 text-indigo-800 border border-indigo-200"
              }`}
          >
            Packed
          </button>
          <button
            onClick={() => setStatusFilter("Shipped")}
            className={`px-3.5 py-1.5 rounded-[5px] font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === "Shipped" ? "bg-purple-600 text-white shadow-xs" : "bg-purple-50 text-purple-800 border border-purple-200"
              }`}
          >
            Shipped
          </button>
          <button
            onClick={() => setStatusFilter("Delivered")}
            className={`px-3.5 py-1.5 rounded-[5px] font-bold transition-all cursor-pointer whitespace-nowrap ${statusFilter === "Delivered" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
          >
            Delivered
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-[6px] border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-[#A71380] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-[6px] text-center border border-slate-200 space-y-3">
          <div className="text-3xl">📦</div>
          <h3 className="font-bold text-[#0b2341] text-base">No Orders Found</h3>
          <p className="text-xs text-slate-400">
            {searchTerm ? `No orders matched "${searchTerm}".` : "You have not placed any orders under this filter."}
          </p>
          <Link
            href="/customer/catalog"
            className="inline-block bg-[#0b2341] text-white px-5 py-2.5 rounded-[5px] text-xs font-bold cursor-pointer"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-5">Order Code</th>
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">Items Summary</th>
                <th className="py-3.5 px-5">Payment Status</th>
                <th className="py-3.5 px-5">Total (₹)</th>
                <th className="py-3.5 px-5">Fulfillment Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((ord) => {
                const isPaid = (ord.payment_status || "").toUpperCase() === "PAID";
                const isRefunded = (ord.payment_status || "").toUpperCase() === "REFUNDED" || ord.refund_status === "REFUNDED";

                return (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-[#A71380]">
                      {ord.order_code || `#ORD-${ord.id}`}
                    </td>
                    <td className="py-4 px-5 text-slate-600">
                      {new Date(ord.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-5 font-medium text-slate-800">
                      {ord.items && ord.items.length > 0
                        ? ord.items.map((it: any) => `${it.product_name} (×${it.quantity})`).join(", ")
                        : "Pharmaceutical Supplies"}
                    </td>
                    <td className="py-4 px-5">
                      {ord.order_status === "Cancelled" ? (
                        ord.payment_method?.toUpperCase().includes("COD") ? (
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                            COD (No Charge)
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold inline-block w-fit">
                              💸 REFUNDED
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
                              Credited in 5–7 Days
                            </span>
                          </div>
                        )
                      ) : isRefunded ? (
                        <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          💸 REFUNDED
                        </span>
                      ) : isPaid ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          ✓ PAID
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {ord.payment_status || ord.payment_method}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 font-mono font-black text-sm text-[#0b2341]">
                      ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-5">
                      {(() => {
                        const st = getOrderStatusDisplay(ord.order_status, (ord as any).cancellation_reason, (ord as any).admin_notes);
                        return (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${st.badgeClass}`}>
                            <span>● {st.label}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      {ord.order_status === "Pending" || ord.order_status === "Confirmed" || ord.order_status === "Packed" ? (
                        <button
                          onClick={() => {
                            setCancellingOrder(ord);
                            setCancelReason("");
                            setCancelCustomNotes("");
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-[5px] text-[11px] font-bold cursor-pointer transition-all"
                        >
                          Cancel Order
                        </button>
                      ) : ord.order_status === "Delivered" ? (
                        <button
                          onClick={() => {
                            setReturningOrder(ord);
                            setReturnReason("");
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-[5px] text-[11px] font-bold cursor-pointer transition-all"
                        >
                          ↩ Return
                        </button>
                      ) : ord.order_status === "Cancelled" ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            Cancelled & Restocked
                          </span>
                          <span className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                            {ord.payment_method?.toUpperCase().includes("COD")
                              ? "COD Order (No charges)"
                              : "Refund Initiated (5-7 Days)"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Bar */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
              <div className="flex items-center space-x-3">
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredOrders.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filteredOrders.length}</span> orders
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
                  <span className="text-[11px]">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 rounded-[4px] px-2 py-1 bg-white font-bold text-[#0b2341]"
                  >
                    <option value={5}>5</option>
                    <option value={8}>8</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                    title="First Page"
                  >
                    «
                  </button>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-[4px] font-bold text-[11px] transition-all cursor-pointer ${currentPage === pageNum
                            ? "bg-[#A71380] text-white shadow-xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  >
                    Next ›
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                    title="Last Page"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancellation Modal with Reason & Refund Details */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg p-6 rounded-[6px] shadow-2xl space-y-4 text-xs border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-[#0b2341]">Cancel Order</h3>
                <p className="text-[11px] text-slate-400">Please provide a cancellation reason for administration records</p>
              </div>
              <button
                onClick={() => setCancellingOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Order Summary & Pricing */}
            <div className="bg-slate-50 p-3.5 rounded-[5px] border border-slate-200 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Code:</span>
                <span className="font-bold text-[#A71380]">{cancellingOrder.order_code || `#ORD-${cancellingOrder.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-[#0b2341]">₹{Number(cancellingOrder.total_amount).toFixed(2)} ({cancellingOrder.payment_method || "Prepaid"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items:</span>
                <span className="font-bold text-slate-700">{cancellingOrder.items?.length || 1} formulation(s)</span>
              </div>
            </div>

            {/* Refund Timeline & Restocking Explanation Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-[5px] p-3 space-y-1 text-emerald-900">
              <div className="font-bold flex items-center space-x-1.5 text-emerald-800">
                <span>⚡ Restock & Refund Policy</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-emerald-800/90 font-sans">
                <li><strong>Stock Units:</strong> All reserved batch units will automatically go back into active warehouse inventory.</li>
                <li>
                  <strong>Refund Status:</strong>{" "}
                  {cancellingOrder.payment_method?.toUpperCase().includes("COD")
                    ? "COD order — zero deduction."
                    : "Prepaid via Razorpay — refund initiated immediately (credited in 5–7 business days to original bank/card, 1–2 days for UPI)."}
                </li>
              </ul>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Why are you cancelling this order? <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                >
                  <option value="">-- Select Cancellation Reason --</option>
                  <option value="Ordered by mistake / incorrect items selected">Ordered by mistake / incorrect items selected</option>
                  <option value="Found a better price / alternative source">Found a better price / alternative source</option>
                  <option value="Delivery time is too long / emergency requirement">Delivery time is too long / emergency requirement</option>
                  <option value="Need to change shipping address or quantity">Need to change shipping address or quantity</option>
                  <option value="Incorrect payment method chosen">Incorrect payment method chosen</option>
                  <option value="Product no longer required">Product no longer required</option>
                  <option value="Other reason">Other reason (specify below)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Additional Notes / Comments <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={cancelCustomNotes}
                  onChange={(e) => setCancelCustomNotes(e.target.value)}
                  placeholder="Provide any additional explanation for the administrative team..."
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 py-2 rounded-[5px] border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting || !cancelReason}
                  className="px-5 py-2 rounded-[5px] bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50 transition-all"
                >
                  {cancelSubmitting ? "Processing Cancellation..." : "Confirm & Cancel Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-[6px] shadow-xl space-y-4 text-xs border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-[#0b2341]">Request Return</h3>
              <button onClick={() => setReturningOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer">
                ✕
              </button>
            </div>

            <div className="bg-[#F8EAF4] p-3 rounded-[5px] border border-[#F3D0E9] space-y-1">
              <div className="font-bold text-[#A71380] text-xs">Order #{returningOrder.order_code || returningOrder.id}</div>
              <div className="text-[11px] text-[#A71380]">Total Paid: ₹{returningOrder.total_amount}</div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Return *</label>
                <select
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380] mb-2"
                >
                  <option value="">-- Choose Reason --</option>
                  <option value="Damaged or broken packaging">Damaged or broken packaging</option>
                  <option value="Wrong medicine or formulation received">Wrong medicine or formulation received</option>
                  <option value="Expired or near-expiry batch">Expired or near-expiry batch</option>
                  <option value="Quality issue or seal compromised">Quality issue or seal compromised</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReturningOrder(null)}
                  className="px-4 py-2.5 rounded-[5px] border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting || !returnReason}
                  className="px-5 py-2.5 rounded-[5px] bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {returnSubmitting ? "Submitting..." : "Submit Return Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
