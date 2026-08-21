"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ordersAPI, OrderData } from "@/lib/api";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

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

  const handleCancelOrder = async (orderId: number, orderCode: string) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderCode}? If prepaid, your refund will be automatically processed.`)) {
      return;
    }
    setCancellingOrderId(orderId);
    setStatusMsg(null);
    try {
      const updated = await ordersAPI.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setStatusMsg({
        type: "success",
        text: `✓ Order #${orderCode} cancelled successfully. Payment status: ${updated.payment_status}`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to cancel order.",
      });
    } finally {
      setCancellingOrderId(null);
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Order Fulfillment & Live Tracking
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● {orders.length} Total Orders
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          My Order History & Invoices
        </h1>
        <p className="text-xs text-slate-500">
          Track live dispatch status from warehouse to doorstep delivery, view official tax invoices, or manage cancellations.
        </p>
      </div>

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
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search Order Code, Item Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
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
            className="bg-[#0b2341] hover:bg-[#12315a] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs self-start md:self-auto cursor-pointer"
          >
            + Place New Order
          </Link>
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pt-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "all" ? "bg-[#0b2341] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter("Pending")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Pending" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter("Confirmed")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Confirmed" ? "bg-blue-600 text-white shadow-xs" : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter("Packed")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Packed" ? "bg-indigo-600 text-white shadow-xs" : "bg-indigo-50 text-indigo-800 border border-indigo-200"
            }`}
          >
            Packed
          </button>
          <button
            onClick={() => setStatusFilter("Shipped")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Shipped" ? "bg-purple-600 text-white shadow-xs" : "bg-purple-50 text-purple-800 border border-purple-200"
            }`}
          >
            Shipped
          </button>
          <button
            onClick={() => setStatusFilter("Delivered")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === "Delivered" ? "bg-emerald-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}
          >
            Delivered
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
          <div className="text-3xl">📦</div>
          <h3 className="font-bold text-[#0b2341] text-base">No Orders Found</h3>
          <p className="text-xs text-slate-400">
            {searchTerm ? `No orders matched "${searchTerm}".` : "You have not placed any orders under this filter."}
          </p>
          <Link
            href="/customer/catalog"
            className="inline-block bg-[#0b2341] text-white px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
          >
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
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
              {filteredOrders.map((ord) => {
                const isPaid = (ord.payment_status || "").toUpperCase() === "PAID";
                const isRefunded = (ord.payment_status || "").toUpperCase() === "REFUNDED" || ord.refund_status === "REFUNDED";

                return (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-blue-700">
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
                      {isRefunded ? (
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
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1 ${
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
                        }`}
                      >
                        <span>● {ord.order_status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      {ord.order_status === "Pending" || ord.order_status === "Confirmed" || ord.order_status === "Packed" ? (
                        <button
                          onClick={() => handleCancelOrder(ord.id, ord.order_code || `ORD-${ord.id}`)}
                          disabled={cancellingOrderId === ord.id}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50"
                        >
                          {cancellingOrderId === ord.id ? "Cancelling..." : "Cancel Order"}
                        </button>
                      ) : ord.order_status === "Delivered" ? (
                        <button
                          onClick={() => {
                            setReturningOrder(ord);
                            setReturnReason("");
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                        >
                          ↩ Return
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Modal */}
      {returningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-xl space-y-4 text-xs border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-[#0b2341]">Request Return</h3>
              <button onClick={() => setReturningOrder(null)} className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer">
                ✕
              </button>
            </div>

            <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100 space-y-1">
              <div className="font-bold text-blue-900 text-xs">Order #{returningOrder.order_code || returningOrder.id}</div>
              <div className="text-[11px] text-blue-700">Total Paid: ₹{returningOrder.total_amount}</div>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Return *</label>
                <select
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600 mb-2"
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting || !returnReason}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer disabled:opacity-50"
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
