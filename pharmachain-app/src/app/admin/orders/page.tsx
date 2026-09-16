"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { INITIAL_ORDERS } from "@/data/mockData";
import { ordersAPI, OrderData } from "@/lib/api";
import { getOrderStatusDisplay } from "@/lib/pricingUtils";

function AdminOrdersContent() {
  const searchParams = useSearchParams();
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

  // Admin Cancellation Modal State
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<any | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>("Admin cancelled order after review");
  const [cancelProcessing, setCancelProcessing] = useState(false);

  const handleOpenCancelModal = (ord: any) => {
    setSelectedCancelOrder(ord);
    setCancelReasonInput("Admin cancelled order after review");
    setStatusMsg(null);
  };

  const handleConfirmAdminCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCancelOrder) return;

    setCancelProcessing(true);
    setStatusMsg(null);

    try {
      await ordersAPI.updateStatus(
        selectedCancelOrder.id,
        "Cancelled",
        cancelReasonInput || "Admin cancelled order"
      );

      const orderCode = selectedCancelOrder.order_code || selectedCancelOrder.id;
      const pmUpper = (selectedCancelOrder.payment_method || selectedCancelOrder.paymentStatus || "").toUpperCase();
      const isCredit = pmUpper.includes("CREDIT") || pmUpper.includes("NET-30") || pmUpper.includes("PAY LATER");

      setStatusMsg({
        type: "success",
        text: `✓ Order ${orderCode} cancelled by Admin. Reason: "${cancelReasonInput}". ${isCredit
          ? "B2B Credit Limit of ₹" + (selectedCancelOrder.total_amount || 0).toLocaleString("en-IN") + " restored to partner account."
          : "Stock restored to inventory."
          }`,
      });
      setSelectedCancelOrder(null);
      loadOrders();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: `Cancellation failed: ${err.message || "Server error"}`,
      });
    } finally {
      setCancelProcessing(false);
    }
  };

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

  useEffect(() => {
    const s = searchParams.get("status");
    if (s) {
      setStatusFilter(s);
    } else {
      setStatusFilter("all");
    }
    setCurrentPage(1);
  }, [searchParams]);

  const formatOrderTimestamp = (ts: string | null | undefined) => {
    if (!ts) return "N/A";
    try {
      const d = new Date(ts.includes("T") || ts.endsWith("Z") ? ts : ts.replace(" ", "T") + "Z");
      if (isNaN(d.getTime())) return ts;
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return ts;
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: any, orderCode: string) => {
    setStatusMsg(null);
    try {
      await ordersAPI.updateStatus(id, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? ({ ...o, order_status: newStatus, orderStatus: newStatus } as any) : o))
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
            ? ({
              ...o,
              payment_status: "REFUNDED",
              paymentStatus: "Refunded",
              refund_id: (updated as any).refund_id || (updated as any).refundId,
              refund_status: "REFUNDED",
            } as any)
            : o
        )
      );

      setStatusMsg({
        type: "success",
        text: `✔ Gateway Refund successfully processed for Order ${selectedRefundOrder.order_code || selectedRefundOrder.id}! Payment marked as REFUNDED.`,
      });
      setSelectedRefundOrder(null);
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

    // Check items / formulations match
    const itemsMatch = o.items && Array.isArray(o.items) && o.items.some((item: any) =>
      (item.product_name || item.name || "").toLowerCase().includes(query) ||
      (item.sku || "").toLowerCase().includes(query)
    );

    if (query) {
      const matchesSearch =
        orderCode.includes(query) ||
        customerName.includes(query) ||
        city.includes(query) ||
        role.includes(query) ||
        itemsMatch ||
        (o.refund_id && o.refund_id.toLowerCase().includes(query)) ||
        (o.razorpay_payment_id && o.razorpay_payment_id.toLowerCase().includes(query));
      if (!matchesSearch) return false;
      return true;
    }

    if (statusFilter !== "all") {
      if (statusFilter === "Refunded") {
        const isRef =
          paymentStatus.toUpperCase() === "REFUNDED" ||
          o.refund_status === "REFUNDED" ||
          currentStatus.toUpperCase() === "RETURNED";
        if (!isRef) return false;
      } else if (statusFilter.toLowerCase() === "cancelled") {
        if (currentStatus.toUpperCase() !== "CANCELLED") return false;
      } else {
        if (currentStatus.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
    }

    return true;
  });

  const sortedOrders = [...filteredOrders].sort((a: any, b: any) => {
    const dateA = new Date(a.created_at || a.orderDate || 0).getTime();
    const dateB = new Date(b.created_at || b.orderDate || 0).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.ceil(sortedOrders.length / pageSize) || 1;
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // Quick Executive KPI Metrics
  const stats = {
    totalCount: orders.length,
    totalRevenue: orders
      .filter((o: any) => (o.payment_status || o.paymentStatus || "").toUpperCase() === "PAID")
      .reduce((acc: number, o: any) => acc + (o.total_amount || o.totalAmount || 0), 0),
    pending: orders.filter((o: any) => ["pending", "confirmed"].includes((o.order_status || o.orderStatus || "").toLowerCase())).length,
    inTransit: orders.filter((o: any) => ["packed", "shipped"].includes((o.order_status || o.orderStatus || "").toLowerCase())).length,
    delivered: orders.filter((o: any) => (o.order_status || o.orderStatus || "").toLowerCase() === "delivered").length,
    cancelled: orders.filter((o: any) => (o.order_status || o.orderStatus || "").toLowerCase() === "cancelled").length,
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
              Operations &amp; Fulfillment
            </span>
          </div>
          <h1 className="text-xl font-black text-[#0b2341] tracking-tight mt-1.5">
            Order Lifecycle Management
          </h1>
          {/* <p className="text-xs text-slate-500 mt-0.5">
            Monitor incoming B2B wholesale and B2C retail orders, track real-time payments, and dispatch consignments.
          </p> */}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={loadOrders}
            className="text-xs font-bold text-slate-700 hover:text-[#0b2341] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>



      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-between shadow-2xs animate-in fade-in duration-200 ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          <div className="flex items-center space-x-2">
            <span>{statusMsg.type === "success" ? "✓" : "⚠️"}</span>
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-500 hover:text-slate-800 font-black ml-3 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* UNIFIED ORDERS MANAGEMENT CARD (Search, Tabs & Table Together) */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
        {/* Top Control Bar: Search & Page Controls */}
        <div className="p-3.5 bg-white border-b border-slate-100 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search Order Code, Brand, Customer, City..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#0b2341] transition-all shadow-2xs"
              />
              <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Per Page Selector */}
            <div className="flex items-center space-x-2 text-slate-500 font-medium self-end md:self-auto text-xs">
              <span className="text-[11px] font-bold text-slate-600">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-md px-2 py-1 bg-slate-50 font-bold text-[#0b2341] text-xs cursor-pointer focus:outline-none focus:border-[#0b2341]"
              >
                <option value={5}>5 per page</option>
                <option value={8}>8 per page</option>
                <option value={15}>15 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>

          {/* Unified Filter Tabs Bar (Matching standard admin tab aesthetics) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleStatusFilterChange("all")}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center space-x-1.5 ${statusFilter === "all"
                ? "bg-[#0b2341] text-white shadow-xs border border-[#0b2341]"
                : "bg-slate-100/80 hover:bg-slate-200/90 text-slate-700 border border-slate-200/70"
                }`}
            >
              <span>All Orders</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${statusFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusFilterChange("Pending")}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center space-x-1.5 ${statusFilter === "Pending"
                ? "bg-amber-600 text-white shadow-xs border border-amber-600"
                : "bg-amber-50/80 text-amber-800 border border-amber-200/80 hover:bg-amber-100"
                }`}
            >
              <span>Pending</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${statusFilter === "Pending" ? "bg-white/25 text-white" : "bg-amber-200/60 text-amber-900"
                  }`}
              >
                {orders.filter((o: any) => (o.order_status || o.orderStatus || "").toLowerCase() === "pending").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusFilterChange("Confirmed")}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center space-x-1.5 ${statusFilter === "Confirmed"
                ? "bg-[#A71380] text-white shadow-xs border border-[#A71380]"
                : "bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] hover:bg-[#F3D0E9]"
                }`}
            >
              <span>Confirmed</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${statusFilter === "Confirmed" ? "bg-white/25 text-white" : "bg-[#A71380]/20 text-[#A71380]"
                  }`}
              >
                {orders.filter((o: any) => (o.order_status || o.orderStatus || "").toLowerCase() === "confirmed").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusFilterChange("Packed")}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center space-x-1.5 ${statusFilter === "Packed"
                ? "bg-indigo-600 text-white shadow-xs border border-indigo-600"
                : "bg-indigo-50/80 text-indigo-800 border border-indigo-200/80 hover:bg-indigo-100"
                }`}
            >
              <span>Packed</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${statusFilter === "Packed" ? "bg-white/25 text-white" : "bg-indigo-200/60 text-indigo-900"
                  }`}
              >
                {orders.filter((o: any) => (o.order_status || o.orderStatus || "").toLowerCase() === "packed").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusFilterChange("Shipped")}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center space-x-1.5 ${statusFilter === "Shipped"
                ? "bg-purple-600 text-white shadow-xs border border-purple-600"
                : "bg-purple-50/80 text-purple-800 border border-purple-200/80 hover:bg-purple-100"
                }`}
            >
              <span>Shipped</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${statusFilter === "Shipped" ? "bg-white/25 text-white" : "bg-purple-200/60 text-purple-900"
                  }`}
              >
                {orders.filter((o: any) => (o.order_status || o.orderStatus || "").toLowerCase() === "shipped").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusFilterChange("Delivered")}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center space-x-1.5 ${statusFilter === "Delivered"
                ? "bg-emerald-600 text-white shadow-xs border border-emerald-600"
                : "bg-emerald-50/80 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100"
                }`}
            >
              <span>Delivered</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${statusFilter === "Delivered" ? "bg-white/25 text-white" : "bg-emerald-200/60 text-emerald-900"
                  }`}
              >
                {orders.filter((o: any) => (o.order_status || o.orderStatus || "").toLowerCase() === "delivered").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusFilterChange("Cancelled")}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center space-x-1.5 ${statusFilter === "Cancelled"
                ? "bg-rose-600 text-white shadow-xs border border-rose-600"
                : "bg-rose-50/80 text-rose-800 border border-rose-200/80 hover:bg-rose-100"
                }`}
            >
              <span>Cancelled</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${statusFilter === "Cancelled" ? "bg-white/25 text-white" : "bg-rose-200/60 text-rose-900"
                  }`}
              >
                {stats.cancelled}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusFilterChange("Refunded")}
              className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer whitespace-nowrap text-xs flex items-center space-x-1.5 ${statusFilter === "Refunded"
                ? "bg-purple-800 text-white shadow-xs border border-purple-800"
                : "bg-purple-50/80 text-purple-800 border border-purple-200/80 hover:bg-purple-100"
                }`}
            >
              <span>💸 Refunded</span>
            </button>
          </div>
        </div>

        {/* Orders Table Container */}
        {loading ? (
          <div className="text-center py-12 bg-white">
            <div className="animate-spin w-7 h-7 border-3 border-[#A71380] border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-xs font-bold text-slate-600">Loading live orders from database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/90 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-40 text-slate-600">Order Code</th>
                  <th className="py-3 px-4 min-w-[200px] text-slate-600">Buyer &amp; Account</th>
                  <th className="py-3 px-4 min-w-[200px] text-slate-600">Ordered Brands / Items</th>
                  <th className="py-3 px-4 w-28 text-slate-600">Total Amount</th>
                  <th className="py-3 px-4 w-32 text-slate-600">Payment Status</th>
                  <th className="py-3 px-4 w-32 text-slate-600">Lifecycle State</th>
                  <th className="py-3 px-4 text-right min-w-[190px] text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold text-xs space-y-1.5">
                      <span className="text-2xl block">🔍</span>
                      <p className="text-slate-700 font-bold text-sm">No matching orders found</p>
                      <p className="text-slate-400 text-xs max-w-md mx-auto">
                        {searchTerm
                          ? `No orders match "${searchTerm}". Try a different order code, formulation name, or buyer details.`
                          : "No orders are currently available under this status filter."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord: any) => {
                    const currentStatus = ord.order_status || ord.orderStatus || "Pending";
                    const paymentStatus = ord.payment_status || ord.paymentStatus || "PAID";
                    const isPaid = paymentStatus.toUpperCase() === "PAID";
                    const isRefunded = paymentStatus.toUpperCase() === "REFUNDED" || ord.refund_status === "REFUNDED";
                    const isRefundFailed = ord.refund_status === "REFUND_FAILED";
                    const orderCode = ord.order_code || ord.id;
                    const total = ord.total_amount || ord.totalAmount || 0;
                    const refundId = ord.refund_id || ord.refundId;
                    const isDistributor = (ord.role || "").toLowerCase().includes("distributor");
                    const customerName = ord.customer_name || ord.customerName || "Healthcare Buyer";

                    // Extract items / brands summary
                    const itemsList = ord.items && Array.isArray(ord.items) ? ord.items : [];
                    const itemsCount =
                      ord.items_count ||
                      ord.itemsCount ||
                      (itemsList.length > 0 ? itemsList.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 1);

                    return (
                      <tr key={ord.id || orderCode} className="hover:bg-slate-50/90 transition-colors group">
                        {/* Col 1: Order Code & Timestamp */}
                        <td className="py-2.5 px-3.5 align-middle">
                          <Link
                            href={`/admin/orders/${ord.id || orderCode}`}
                            className="font-mono font-black text-[#A71380] hover:underline block text-xs"
                            title="View Full Order File"
                          >
                            {orderCode}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            {formatOrderTimestamp(ord.created_at || ord.orderDate)}
                          </span>
                        </td>

                        {/* Col 2: Buyer & Role */}
                        <td className="py-2.5 px-3.5 align-middle">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-extrabold text-[10px] flex items-center justify-center shrink-0 border border-slate-200">
                              {customerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-extrabold text-[#0b2341] text-xs leading-none truncate max-w-[160px]" title={customerName}>
                                {customerName}
                              </div>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wide inline-block ${isDistributor
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9]"
                                    }`}
                                >
                                  {isDistributor ? "DISTRIBUTOR" : "RETAIL"}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium truncate max-w-[85px]">
                                  {ord.delivery_city || ord.deliveryCity || "Hyderabad"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Col 3: Formulation Brands / Items */}
                        <td className="py-2.5 px-3.5 align-middle">
                          {itemsList.length > 0 ? (
                            <div className="space-y-0.5">
                              <div className="font-bold text-[#0b2341] text-[11px] truncate max-w-[190px]" title={itemsList[0].product_name || itemsList[0].name}>
                                {itemsList[0].product_name || itemsList[0].name || "Formulation Brand"}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium flex items-center space-x-1">
                                <span className="font-bold text-[#A71380] bg-[#F8EAF4] px-1.5 py-0.2 rounded text-[9px] border border-[#F3D0E9]">
                                  {itemsList[0].quantity} {itemsList[0].quantity === 1 ? "unit" : "units"}
                                </span>
                                {itemsList.length > 1 && (
                                  <span className="text-slate-400 font-medium text-[9px]">
                                    +{itemsList.length - 1} more
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-[#0b2341] text-[11px] block">EVVAI Formulations</span>
                              <span className="text-[10px] text-slate-500 font-bold">{itemsCount} Total Units</span>
                            </div>
                          )}
                        </td>

                        {/* Col 4: Total Amount */}
                        <td className="py-2.5 px-3.5 align-middle">
                          <div className="font-mono font-black text-slate-900 text-xs">
                            ₹{total.toLocaleString("en-IN")}
                          </div>
                          <span className="text-[9px] text-slate-400 block font-medium">Incl. Tax</span>
                        </td>

                        {/* Col 5: Payment Status */}
                        <td className="py-2.5 px-3.5 align-middle">
                          {isRefunded ? (
                            <div>
                              <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[9px] font-extrabold inline-block">
                                💸 REFUNDED
                              </span>
                              {refundId && (
                                <span className="text-[8px] font-mono text-slate-400 block truncate max-w-[95px]" title={refundId}>
                                  {refundId}
                                </span>
                              )}
                            </div>
                          ) : isRefundFailed ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-extrabold inline-block">
                              ⚠ REFUND FAILED
                            </span>
                          ) : isPaid ? (
                            <div>
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-extrabold inline-flex items-center space-x-1">
                                <span>✓</span>
                                <span>PAID</span>
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium block truncate max-w-[95px]">
                                {ord.payment_method || "Online"}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-bold inline-block">
                                {paymentStatus}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium block truncate max-w-[95px]">
                                {ord.payment_method || "Pending"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Col 6: Lifecycle State */}
                        <td className="py-2.5 px-3.5 align-middle">
                          {(() => {
                            const st = getOrderStatusDisplay(currentStatus, (ord as any).cancellation_reason, (ord as any).admin_notes);
                            return (
                              <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] uppercase inline-flex items-center space-x-1 border ${st.badgeClass}`}>
                                <span>{st.isCancelled ? "🚫" : "●"}</span>
                                <span>{st.label}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* Col 7: Actions */}
                        <td className="py-2.5 px-3.5 align-middle text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {/* View Button */}
                            <Link
                              href={`/admin/orders/${ord.id || orderCode}`}
                              className="bg-[#F8EAF4] hover:bg-[#F3D0E9] text-[#A71380] border border-[#F3D0E9] px-2 py-1 rounded font-extrabold text-[10px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 h-7"
                              title="Open full order details"
                            >
                              <span>👁️</span>
                              <span>View</span>
                            </Link>

                            {/* Status Selector Dropdown */}
                            {["Cancelled", "CANCELLED", "Returned", "RETURNED"].includes(currentStatus) ? (
                              isRefunded ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded h-7 inline-flex items-center">
                                  Refunded
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded h-7 inline-flex items-center">
                                  Closed
                                </span>
                              )
                            ) : (
                              <select
                                value={currentStatus}
                                onChange={(e) => {
                                  if (e.target.value === "Cancelled") {
                                    handleOpenCancelModal(ord);
                                  } else {
                                    handleUpdateStatus(ord.id, e.target.value, orderCode);
                                  }
                                }}
                                className="border border-slate-200 rounded px-1.5 py-1 bg-slate-50 font-bold text-[10px] text-[#0b2341] cursor-pointer hover:border-[#A71380] focus:outline-none transition-colors h-7"
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

                            {/* Refund Button */}
                            {isPaid && !isRefunded && (
                              <button
                                type="button"
                                onClick={() => handleOpenRefundModal(ord)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-extrabold px-2 py-1 rounded text-[10px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 h-7"
                                title="Issue Razorpay refund"
                              >
                                <span>💸</span>
                                <span>Refund</span>
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
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
          <div className="flex items-center space-x-3">
            {filteredOrders.length > 0 ? (
              <span>
                Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredOrders.length)}</span> of{" "}
                <span className="font-bold text-[#0b2341]">{filteredOrders.length}</span> orders
              </span>
            ) : (
              <span>0 orders found</span>
            )}
            <span className="text-slate-300">|</span>
            <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* First Page Button */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700 shadow-2xs"
              title="First Page"
            >
              «
            </button>

            {/* Previous Page Button */}
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700 shadow-2xs"
            >
              ‹ Prev
            </button>

            {/* Numbered Page Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              if (
                totalPages <= 7 ||
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] px-2.5 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${currentPage === pageNum
                      ? "bg-[#A71380] text-white shadow-sm border border-[#A71380]"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-2xs"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <span key={pageNum} className="px-1 text-slate-400 font-bold text-xs select-none">
                    ...
                  </span>
                );
              }
              return null;
            })}

            {/* Next Page Button */}
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700 shadow-2xs"
            >
              Next ›
            </button>

            {/* Last Page Button */}
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700 shadow-2xs"
              title="Last Page"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Direct Refund Confirmation Modal */}
      {selectedRefundOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 p-7 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${(selectedRefundOrder.payment_method || "").toUpperCase() === "COD" || selectedRefundOrder.payment_status === "COD" || !selectedRefundOrder.razorpay_payment_id
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}>
                  {(selectedRefundOrder.payment_method || "").toUpperCase() === "COD" || selectedRefundOrder.payment_status === "COD" || !selectedRefundOrder.razorpay_payment_id
                    ? "Cash On Delivery (COD) / Offline Refund"
                    : "Automated Gateway Refund"}
                </span>
                <h2 className="text-lg font-black text-[#0b2341] tracking-tight mt-1.5">
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
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Buyer:</span>
                  <span className="font-extrabold text-[#0b2341]">
                    {selectedRefundOrder.customer_name || selectedRefundOrder.customerName} ({selectedRefundOrder.role || "Customer"})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="font-extrabold text-[#A71380] font-mono">
                    {selectedRefundOrder.payment_method || selectedRefundOrder.payment_status || "Online"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Original Order Total:</span>
                  <span className="font-black text-emerald-700 text-sm font-mono">
                    ₹{(selectedRefundOrder.total_amount || selectedRefundOrder.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                {selectedRefundOrder.razorpay_payment_id && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Gateway Payment ID:</span>
                    <span className="font-mono text-[#A71380] font-bold">{selectedRefundOrder.razorpay_payment_id}</span>
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
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-black text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-rose-500"
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

              <div className={`p-3 rounded-xl text-[11px] leading-relaxed border ${(selectedRefundOrder.payment_method || "").toUpperCase() === "COD" || selectedRefundOrder.payment_status === "COD" || !selectedRefundOrder.razorpay_payment_id
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                {(selectedRefundOrder.payment_method || "").toUpperCase() === "COD" || selectedRefundOrder.payment_status === "COD" || !selectedRefundOrder.razorpay_payment_id ? (
                  <span><strong>COD / Offline Order:</strong> Clicking confirm will record an offline refund entry, mark the order as <span className="font-mono font-bold">REFUNDED</span>, and log the audit without contacting the payment gateway.</span>
                ) : (
                  <span><strong>Automated Gateway:</strong> Clicking confirm will trigger a live API call to Razorpay to issue the refund immediately.</span>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRefundOrder(null)}
                  className="w-1/3 border border-slate-300 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundProcessing}
                  className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {refundProcessing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Processing Refund...</span>
                    </>
                  ) : (
                    <span>
                      {(selectedRefundOrder.payment_method || "").toUpperCase() === "COD" || selectedRefundOrder.payment_status === "COD" || !selectedRefundOrder.razorpay_payment_id
                        ? "Confirm Offline Refund"
                        : "⚡ Confirm Razorpay Refund"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Cancellation Confirmation Modal */}
      {selectedCancelOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-md">
                  Admin Order Cancellation
                </span>
                <h2 className="text-lg font-black text-[#0b2341] tracking-tight mt-1.5">
                  Cancel Order: {selectedCancelOrder.order_code || selectedCancelOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCancelOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAdminCancel} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Customer / Partner:</span>
                  <span className="font-extrabold text-[#0b2341]">
                    {selectedCancelOrder.customer_name || selectedCancelOrder.customerName} ({selectedCancelOrder.role || "Buyer"})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="font-extrabold text-[#A71380] font-mono">
                    {selectedCancelOrder.payment_method || selectedCancelOrder.payment_status || "Standard"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Order Total:</span>
                  <span className="font-black text-slate-900 text-sm font-mono">
                    ₹{(selectedCancelOrder.total_amount || selectedCancelOrder.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Dynamic Information Banner */}
              <div className="p-3.5 rounded-xl text-[11px] leading-relaxed border bg-blue-50 border-blue-200 text-blue-900">
                {(selectedCancelOrder.payment_method || "").toUpperCase().includes("CREDIT") || (selectedCancelOrder.payment_method || "").toUpperCase().includes("NET-30") || (selectedCancelOrder.payment_method || "").toUpperCase().includes("PAY LATER") ? (
                  <span>
                    <strong>💳 B2B Trade Credit Restoration:</strong> This order was placed using Trade Credit Limit. Cancelling will <strong>automatically restore ₹{(selectedCancelOrder.total_amount || 0).toLocaleString("en-IN")} back</strong> to the partner's available trade credit limit. No fake gateway refund will be logged.
                  </span>
                ) : (selectedCancelOrder.payment_status || "").toUpperCase() === "PAID" && selectedCancelOrder.razorpay_payment_id ? (
                  <span>
                    <strong>⚡ Gateway Refund:</strong> Cancelling this online paid order will trigger an automated Razorpay refund for ₹{(selectedCancelOrder.total_amount || 0).toLocaleString("en-IN")}.
                  </span>
                ) : (
                  <span>
                    <strong>📦 Inventory Restock:</strong> Cancelling will restore allocated batch items back to inventory stock.
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cancellation Reason (Required for Audit Trail) *</label>
                <textarea
                  rows={3}
                  required
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-rose-500 text-xs"
                  placeholder="Provide reason for admin cancellation..."
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCancelOrder(null)}
                  className="w-1/3 border border-slate-300 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={cancelProcessing}
                  className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {cancelProcessing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Cancelling Order...</span>
                    </>
                  ) : (
                    <span>🚫 Confirm Admin Cancellation</span>
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

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersContent />
    </Suspense>
  );
}
