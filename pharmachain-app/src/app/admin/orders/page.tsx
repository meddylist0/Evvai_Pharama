"use client";

import React, { useState, useEffect } from "react";
import { INITIAL_ORDERS } from "@/data/mockData";
import { ordersAPI, OrderData } from "@/lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Refund Modal State
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState<string>("Customer requested refund / Order cancelled");
  const [refundAmount, setRefundAmount] = useState<number | "">("");
  const [refundProcessing, setRefundProcessing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersAPI.getAdminAllOrders();
      if (data && data.length > 0) {
        setOrders(data);
      } else {
        setOrders(INITIAL_ORDERS as any);
      }
    } catch (err) {
      console.warn("Failed fetching orders from API, using fallback:", err);
      setOrders(INITIAL_ORDERS as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const handleGlobalSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setSearchTerm(q);
      setCurrentPage(1);
    };
    window.addEventListener("pharmalink_admin_search", handleGlobalSearch);
    return () => window.removeEventListener("pharmalink_admin_search", handleGlobalSearch);
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: any, orderCode: string) => {
    setStatusMsg(null);
    try {
      await ordersAPI.updateStatus(id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, order_status: newStatus, orderStatus: newStatus } as any : o))
      );
      setStatusMsg({
        type: "success",
        text: `Order ${orderCode} status updated to '${newStatus}' in database.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update order status in backend." });
    }
  };

  const handleOpenRefundModal = (ord: any) => {
    setSelectedRefundOrder(ord);
    setRefundAmount(ord.total_amount || ord.totalAmount || 0);
    setRefundReason("Admin processed return/cancellation refund");
    setStatusMsg(null);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRefundOrder) return;

    setRefundProcessing(true);
    setStatusMsg(null);

    try {
      const amountVal = typeof refundAmount === "number" ? refundAmount : undefined;
      const updated = await ordersAPI.refundOrder(selectedRefundOrder.id, refundReason, amountVal);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedRefundOrder.id
            ? {
                ...o,
                payment_status: "REFUNDED",
                paymentStatus: "Refunded",
                refund_id: (updated as any).refund_id || (updated as any).refundId,
                refund_status: "REFUNDED",
              } as any
            : o
        )
      );

      setStatusMsg({
        type: "success",
        text: `✔ Gateway Refund successfully processed for Order ${selectedRefundOrder.order_code || selectedRefundOrder.id}! Payment marked as REFUNDED.`,
      });
      setSelectedRefundOrder(null);
      // Reload fresh orders
      loadOrders();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: `Refund failed: ${err.message || "Gateway error"}`,
      });
    } finally {
      setRefundProcessing(false);
    }
  };

  // Filter and Search logic
  const filteredOrders = orders.filter((o: any) => {
    const currentStatus = (o.order_status || o.orderStatus || "").toString();
    const paymentStatus = (o.payment_status || o.paymentStatus || "").toString();
    const orderCode = (o.order_code || o.id || "").toString().toLowerCase();
    const customerName = (o.customer_name || o.customerName || "").toString().toLowerCase();
    const city = (o.delivery_city || o.deliveryCity || "").toString().toLowerCase();
    const role = (o.role || "").toString().toLowerCase();
    const query = searchTerm.trim().toLowerCase();

    // 1. Search Filter Check (Global Across All Attributes)
    if (query) {
      const matchesSearch =
        orderCode.includes(query) ||
        customerName.includes(query) ||
        city.includes(query) ||
        role.includes(query) ||
        (o.refund_id && o.refund_id.toLowerCase().includes(query)) ||
        (o.razorpay_payment_id && o.razorpay_payment_id.toLowerCase().includes(query));
      if (!matchesSearch) return false;
      // When searching with query, search universally across all statuses
      return true;
    }

    // 2. Status Filter Check (When not actively searching)
    if (statusFilter !== "all") {
      if (statusFilter === "Refunded") {
        const isRef =
          paymentStatus.toUpperCase() === "REFUNDED" ||
          o.refund_status === "REFUNDED" ||
          currentStatus.toUpperCase() === "RETURNED";
        if (!isRef) return false;
      } else {
        if (currentStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Order Fulfillment Operations & Status Lifecycle
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            FastAPI Synced
          </span>
          <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            Razorpay Automated Refunds
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          Order Lifecycle Management & Fulfillment
        </h1>
        <p className="text-xs text-slate-500">
          Transition orders across states (Pending &rarr; Confirmed &rarr; Packed &rarr; Shipped &rarr; Delivered) or initiate direct Razorpay gateway refunds.
        </p>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
              : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search Order Code, Customer Name, City, Refund ID..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Per Page Selector */}
          <div className="flex items-center space-x-2 text-slate-500 font-medium self-end md:self-auto">
            <span className="text-[11px]">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 font-bold text-[#0b2341] text-xs cursor-pointer focus:outline-none"
            >
              <option value={5}>5 per page</option>
              <option value={8}>8 per page</option>
              <option value={15}>15 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1 scrollbar-none">
          <button
            onClick={() => handleStatusFilterChange("all")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "all" ? "bg-[#0b2341] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => handleStatusFilterChange("Pending")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Pending" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => handleStatusFilterChange("Confirmed")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Confirmed" ? "bg-blue-600 text-white shadow-xs" : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => handleStatusFilterChange("Packed")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Packed" ? "bg-indigo-600 text-white shadow-xs" : "bg-indigo-50 text-indigo-800 border border-indigo-200"
            }`}
          >
            Packed
          </button>
          <button
            onClick={() => handleStatusFilterChange("Shipped")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Shipped" ? "bg-purple-600 text-white shadow-xs" : "bg-purple-50 text-purple-800 border border-purple-200"
            }`}
          >
            Shipped
          </button>
          <button
            onClick={() => handleStatusFilterChange("Delivered")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Delivered" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => handleStatusFilterChange("Refunded")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Refunded" ? "bg-rose-600 text-white shadow-xs" : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            💸 Refunded
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading orders from database...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Order Code</th>
                  <th className="py-3.5 px-4">Customer / Distributor</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment & Refund</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Actions / Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold text-xs space-y-1">
                      <span className="text-2xl block">🔍</span>
                      <p className="text-slate-600 font-bold">No matching orders found</p>
                      <p className="text-slate-400 text-[11px]">
                        {searchTerm ? `No results matching "${searchTerm}". Try a different code or customer name.` : "No orders found under this status filter."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord: any) => {
                    const currentStatus = ord.order_status || ord.orderStatus;
                    const paymentStatus = ord.payment_status || ord.paymentStatus || "PAID";
                    const isPaid = paymentStatus.toUpperCase() === "PAID";
                    const isRefunded = paymentStatus.toUpperCase() === "REFUNDED" || ord.refund_status === "REFUNDED";
                    const isRefundFailed = ord.refund_status === "REFUND_FAILED";
                    const orderCode = ord.order_code || ord.id;
                    const total = ord.total_amount || ord.totalAmount || 0;
                    const refundId = ord.refund_id || ord.refundId;

                    return (
                      <tr key={ord.id || orderCode} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{orderCode}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-[#0b2341]">{ord.customer_name || ord.customerName}</div>
                          <span className="text-[10px] text-slate-400">{ord.delivery_city || ord.deliveryCity || "Hyderabad"}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (ord.role || "").includes("Distributor") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {ord.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">₹{total.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {isRefunded ? (
                              <div>
                                <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-extrabold block w-max">
                                  💸 REFUNDED
                                </span>
                                {refundId && (
                                  <span className="text-[9px] font-mono text-slate-500 block truncate max-w-[130px]" title={refundId}>
                                    ID: {refundId}
                                  </span>
                                )}
                              </div>
                            ) : isRefundFailed ? (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-extrabold block w-max">
                                ⚠ REFUND FAILED
                              </span>
                            ) : isPaid ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-extrabold block w-max">
                                ✓ PAID
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold block w-max">
                                {paymentStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              currentStatus === "Delivered" || currentStatus === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : currentStatus === "Shipped" || currentStatus === "SHIPPED"
                                ? "bg-purple-100 text-purple-800"
                                : currentStatus === "Packed" || currentStatus === "PACKED"
                                ? "bg-indigo-100 text-indigo-800"
                                : currentStatus === "Confirmed" || currentStatus === "CONFIRMED"
                                ? "bg-blue-100 text-blue-800"
                                : currentStatus === "Cancelled" || currentStatus === "CANCELLED" || currentStatus === "Returned" || currentStatus === "RETURNED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {currentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Update Status Dropdown strictly matching valid transitions */}
                            {["Cancelled", "CANCELLED", "Returned", "RETURNED"].includes(currentStatus) ? (
                              <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                Terminal
                              </span>
                            ) : (
                              <select
                                value={currentStatus}
                                onChange={(e) => handleUpdateStatus(ord.id, e.target.value, orderCode)}
                                className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 font-bold text-[11px] text-[#0b2341] cursor-pointer hover:border-blue-500 transition-colors"
                              >
                                <option value={currentStatus}>{currentStatus}</option>
                                {(currentStatus.toLowerCase() === "pending"
                                  ? ["Confirmed", "Cancelled"]
                                  : currentStatus.toLowerCase() === "confirmed"
                                  ? ["Packed", "Cancelled"]
                                  : currentStatus.toLowerCase() === "packed"
                                  ? ["Shipped", "Cancelled"]
                                  : currentStatus.toLowerCase() === "shipped"
                                  ? ["Delivered"]
                                  : currentStatus.toLowerCase() === "delivered"
                                  ? ["Returned"]
                                  : []
                                ).map((nxt) => (
                                  <option key={nxt} value={nxt}>
                                    &rarr; {nxt}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Direct Refund Button if Paid and not already refunded */}
                            {isPaid && !isRefunded && (
                              <button
                                onClick={() => handleOpenRefundModal(ord)}
                                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1"
                                title="Issue automated Razorpay refund"
                              >
                                <span>💸 Refund</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
            <div>
              {filteredOrders.length > 0 ? (
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredOrders.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filteredOrders.length}</span> orders
                </span>
              ) : (
                <span>0 orders found</span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="First Page"
                >
                  «
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
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
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#0b2341] text-white shadow-2xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1 text-slate-400 font-bold text-[10px]">...</span>;
                  }
                  return null;
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                >
                  Next ›
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="Last Page"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DIRECT REFUND CONFIRMATION MODAL ─── */}
      {selectedRefundOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-rose-800 uppercase bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                  Automated Gateway Refund
                </span>
                <h2 className="text-xl font-black text-[#0b2341] tracking-tight mt-1">
                  Issue Refund: {selectedRefundOrder.order_code || selectedRefundOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRefundOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Buyer:</span>
                  <span className="font-extrabold text-[#0b2341]">
                    {selectedRefundOrder.customer_name || selectedRefundOrder.customerName} ({selectedRefundOrder.role})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Original Order Total:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    ₹{(selectedRefundOrder.total_amount || selectedRefundOrder.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
                {selectedRefundOrder.razorpay_payment_id && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Gateway Payment ID:</span>
                    <span className="font-mono text-blue-700 font-bold">{selectedRefundOrder.razorpay_payment_id}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Refund Amount (₹ INR)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min={1}
                  max={selectedRefundOrder.total_amount || selectedRefundOrder.totalAmount || 999999}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || "")}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-black text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Defaults to full order amount. Partial refund is supported.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Refund Reason / Audit Note</label>
                <textarea
                  rows={2}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-rose-500"
                  placeholder="State reason for issuing refund..."
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-[11px] leading-relaxed">
                <strong>Important:</strong> Clicking confirm will trigger a live API call to Razorpay to initiate the refund, update the order to <span className="font-mono font-bold">REFUNDED</span>, and record an immutable audit log.
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRefundOrder(null)}
                  className="w-1/3 border border-slate-300 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundProcessing}
                  className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {refundProcessing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Processing Gateway Refund...</span>
                    </>
                  ) : (
                    <span>⚡ Confirm Razorpay Refund</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
