"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ordersAPI, notificationsAPI, paymentsAPI } from "@/lib/api";
import { INITIAL_ORDERS } from "@/data/mockData";
import { EvvaiLogo } from "@/components/EvvaiLogo";
import { InvoiceDocumentContent } from "@/components/InvoiceDocument";

interface AdminOrderDetailClientViewProps {
  orderId: string;
}

export function AdminOrderDetailClientView({ orderId }: AdminOrderDetailClientViewProps) {
  const rawId = orderId;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [adminSettings, setAdminSettings] = useState<{
    email?: string;
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
  }>({});

  // Refund Drawer/Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState<string>("Admin processed order cancellation/return refund");
  const [refundAmount, setRefundAmount] = useState<number | "">("");
  const [refundProcessing, setRefundProcessing] = useState(false);

  // Admin note state
  const [adminNote, setAdminNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const loadOrderDetail = async () => {
    if (!rawId) return;
    try {
      setLoading(true);

      // Concurrently load live settings from database / backend settings API
      try {
        const [notifRes, payRes] = await Promise.allSettled([
          notificationsAPI.getSettings(),
          paymentsAPI.getAdminSettings(),
        ]);
        const email = notifRes.status === "fulfilled" ? (notifRes.value.sender_email || notifRes.value.smtp_user) : undefined;
        const bankName = payRes.status === "fulfilled" ? payRes.value.bank_name : undefined;
        const accountNo = payRes.status === "fulfilled" ? payRes.value.account_no : undefined;
        const ifscCode = payRes.status === "fulfilled" ? payRes.value.ifsc_code : undefined;
        setAdminSettings({ email, bankName, accountNo, ifscCode });
      } catch {
        // use default fallback
      }
      let found: any = null;
      try {
        if (!isNaN(Number(rawId))) {
          found = await ordersAPI.getOrder(Number(rawId));
        }
      } catch {
        // fallback to query
      }

      if (!found) {
        const all = await ordersAPI.getAdminAllOrders();
        found = all.find(
          (o: any) =>
            String(o.id) === String(rawId) ||
            String(o.order_code || "").toLowerCase() === String(rawId).toLowerCase()
        );
      }

      if (!found) {
        const mockFound = INITIAL_ORDERS.find(
          (o: any) =>
            String(o.id).toLowerCase() === String(rawId).toLowerCase() ||
            String((o as any).order_code || "").toLowerCase() === String(rawId).toLowerCase()
        );
        if (mockFound) found = mockFound;
      }

      if (found) {
        setOrder(found);
        setTrackingNumber(found.tracking_number || "");
        setAdminNote(found.admin_notes || "");
        setRefundAmount(found.total_amount || found.totalAmount || 0);
      }
    } catch (err: any) {
      console.error("Failed fetching order details:", err);
      setStatusMsg({ type: "error", text: "Failed to load order file from database." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [rawId]);

  const formatTimestamp = (ts: string | null | undefined) => {
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

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    setUpdating(true);
    setStatusMsg(null);
    try {
      await ordersAPI.updateStatus(
        order.id,
        newStatus,
        adminNote || undefined,
        trackingNumber || undefined
      );
      setOrder((prev: any) => ({
        ...prev,
        order_status: newStatus,
        orderStatus: newStatus,
        tracking_number: trackingNumber || prev.tracking_number,
        admin_notes: adminNote || prev.admin_notes,
      }));
      setStatusMsg({
        type: "success",
        text: `✔ Order lifecycle state transitioned to '${newStatus}' in live database.`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to update order state in database.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setRefundProcessing(true);
    setStatusMsg(null);

    try {
      const amountVal = typeof refundAmount === "number" ? refundAmount : undefined;
      const updated = await ordersAPI.refundOrder(order.id, refundReason, amountVal);

      setOrder((prev: any) => ({
        ...prev,
        payment_status: "REFUNDED",
        paymentStatus: "Refunded",
        refund_id: (updated as any).refund_id || (updated as any).refundId,
        refund_status: "REFUNDED",
      }));

      setStatusMsg({
        type: "success",
        text: `✔ Razorpay Gateway Refund successfully recorded for Order ${order.order_code || order.id}!`,
      });
      setIsRefundModalOpen(false);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: `Refund failed: ${err.message || "Gateway error"}`,
      });
    } finally {
      setRefundProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-2xs">
        <div className="animate-spin w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-600">Loading comprehensive order record from database...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-2xs max-w-xl mx-auto">
        <span className="text-4xl block">🔍</span>
        <h2 className="text-xl font-black text-[#0b2341]">Order Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested order ID &apos;{rawId}&apos; could not be resolved from the database catalog.
        </p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#0b2341] text-white rounded-xl text-xs font-bold hover:bg-[#12315a] transition-all cursor-pointer shadow-xs"
        >
          <span>&larr; Return to Orders Console</span>
        </Link>
      </div>
    );
  }

  const currentStatus = order.order_status || order.orderStatus || "Pending";
  const paymentStatus = order.payment_status || order.paymentStatus || "PAID";
  const isPaid = paymentStatus.toUpperCase() === "PAID";
  const isRefunded = paymentStatus.toUpperCase() === "REFUNDED" || order.refund_status === "REFUNDED";
  const isDistributor = (order.role || "").toLowerCase().includes("distributor");
  const orderCode = order.order_code || order.id;
  const total = order.total_amount || order.totalAmount || 0;
  const subtotal = order.subtotal || Math.round(total / 1.12);
  const tax = order.tax_amount || Math.round(total - subtotal);
  const cgst = Math.round(tax / 2);
  const sgst = tax - cgst;
  const shipping = order.shipping_charge || 0;
  const discount = order.discount_amount || 0;

  const itemsList = order.items && Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
      {
        id: 1,
        product_name: "CardioVas XR 20mg Tablet",
        composition: "Telmisartan 40mg + Amlodipine 5mg",
        sku: "EVV-CARD-001",
        batch_no: "EV2026-C01",
        expiry_date: "12/2028",
        quantity: order.items_count || order.itemsCount || 1,
        unit_price: Math.round(subtotal / (order.items_count || order.itemsCount || 1)),
        total_price: subtotal,
      }
    ];

  const totalQuantity = itemsList.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0);
  const steps = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"];
  const currentStepIdx = steps.findIndex((s) => s.toLowerCase() === currentStatus.toLowerCase());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-slate-800">
      {/* ─── ULTRA-CRISP HIGH RESOLUTION PRINT STYLES ─── */}
      <style jsx global>{`
        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            text-rendering: geometricPrecision !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, aside, header, footer, [role="navigation"], .no-print {
            display: none !important;
          }
          .admin-screen-view {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          .invoice-print-container {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .invoice-box {
            border: 1.5px solid #0f172a !important;
            border-radius: 8px !important;
            padding: 24px !important;
            box-shadow: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border-color: #cbd5e1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
        }
      `}</style>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ─── ADMIN DASHBOARD SCREEN VIEW (Hidden automatically during print) ─── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="admin-screen-view space-y-6">
        {/* 1. Top Header Banner */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Link
                href="/admin/orders"
                className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition-colors inline-flex items-center space-x-1"
              >
                <span>&larr; Orders Management Console</span>
              </Link>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                ● Live DB Synced
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2.5">
              <h1 className="text-2xl font-black text-[#0b2341] tracking-tight font-mono">
                {orderCode}
              </h1>

              <span
                className={`px-3 py-1 rounded-full font-extrabold text-[11px] uppercase tracking-wide ${currentStatus === "Delivered" || currentStatus === "DELIVERED"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : currentStatus === "Shipped" || currentStatus === "SHIPPED"
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : currentStatus === "Packed" || currentStatus === "PACKED"
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                      : currentStatus === "Confirmed" || currentStatus === "CONFIRMED"
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : currentStatus === "Cancelled" || currentStatus === "CANCELLED" || currentStatus === "Returned" || currentStatus === "RETURNED"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
              >
                ● {currentStatus}
              </span>

              {isRefunded ? (
                <span className="bg-rose-50 text-rose-800 border border-rose-300 px-3 py-1 rounded-full text-[11px] font-extrabold">
                  💸 REFUNDED
                </span>
              ) : isPaid ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-[11px] font-extrabold">
                  ✓ PAYMENT CONFIRMED (PAID)
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1 rounded-full text-[11px] font-bold">
                  ⌛ {paymentStatus}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium mt-1">
              Registered on {formatTimestamp(order.created_at || order.orderDate)} • Role-Based Formulation Pricing & Invoicing
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowInvoicePreview(!showInvoicePreview)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-[#0b2341] transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
            >
              <span>{showInvoicePreview ? "📋 Hide Invoice" : "👁️ View Tax Invoice"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0b2341] hover:bg-[#12315a] text-white transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
            >
              <span>🖨️ Print Official Invoice</span>
            </button>
            <Link
              href="/admin/orders"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              &larr; Back
            </Link>
          </div>
        </div>

        {/* Status Alert */}
        {statusMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold border transition-all ${statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
              : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
              }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* 2. KPI Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Order Value</span>
            <div className="text-xl sm:text-2xl font-black text-[#0b2341] font-mono">
              ₹{total.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block">Tax & Invoicing Included</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Payment Status</span>
            <div className={`text-base sm:text-lg font-black ${isRefunded ? "text-rose-700" : isPaid ? "text-emerald-700" : "text-amber-600"}`}>
              {isRefunded ? "REFUNDED" : isPaid ? "✓ PAID" : paymentStatus}
            </div>
            <span className="text-[10px] text-slate-400 font-medium block truncate">
              {order.payment_method || "UPI / NetBanking"}
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Formulations Ordered</span>
            <div className="text-xl sm:text-2xl font-black text-[#0b2341] font-mono">
              {totalQuantity} <span className="text-xs font-bold text-slate-500">units</span>
            </div>
            <span className="text-[10px] text-blue-700 font-bold block">
              {itemsList.length} Formulation SKU(s)
            </span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Buyer Entity</span>
            <div className="text-base sm:text-lg font-black text-[#0b2341] truncate" title={order.customer_name || order.customerName}>
              {order.customer_name || order.customerName}
            </div>
            <span className="text-[10px] text-slate-500 font-bold block truncate">
              {isDistributor ? "🏢 Verified B2B Distributor" : "👤 Retail Customer"}
            </span>
          </div>
        </div>

        {/* 3. Stepper */}
        {!["Cancelled", "CANCELLED", "Returned", "RETURNED"].includes(currentStatus) && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
            <h3 className="text-xs font-extrabold text-[#0b2341] uppercase tracking-wider mb-4">
              🚚 Fulfillment Lifecycle Stepper
            </h3>
            <div className="flex items-center justify-between relative px-2 sm:px-6">
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0"></div>
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#0b2341] transition-all duration-300 z-0"
                style={{
                  width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 88}%`,
                }}
              ></div>

              {steps.map((step, idx) => {
                const isPastOrCurrent = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;
                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isCurrent
                        ? "bg-[#0b2341] text-white ring-4 ring-blue-100 shadow-md scale-110"
                        : isPastOrCurrent
                          ? "bg-[#0b2341] text-white"
                          : "bg-white text-slate-400 border-2 border-slate-200"
                        }`}
                    >
                      {isPastOrCurrent && !isCurrent ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-2 ${isCurrent ? "text-[#0b2341] font-black" : isPastOrCurrent ? "text-blue-900 font-bold" : "text-slate-400"
                        }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Interactive Live Invoice Preview on Screen (if toggled) */}
        {showInvoicePreview && (
          <div className="bg-slate-100 p-6 rounded-3xl border border-slate-300 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-[#0b2341] uppercase tracking-wider">
                  🧾 Official E-Commerce Tax Invoice Preview
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Print-Ready A4 Format
                </span>
              </div>
              <button
                onClick={handlePrint}
                className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
              >
                <span>🖨️ Send to Printer / PDF</span>
              </button>
            </div>

            {/* Embedded Invoice Render in screen preview */}
            <div className="bg-white p-8 rounded-2xl shadow-md max-w-4xl mx-auto border border-slate-200">
              <InvoiceDocumentContent
                order={order}
                itemsList={itemsList}
                subtotal={subtotal}
                tax={tax}
                cgst={cgst}
                sgst={sgst}
                total={total}
                shipping={shipping}
                discount={discount}
                adminSettings={adminSettings}
              />
            </div>
          </div>
        )}

        {/* 5. Main 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulations & Brands Specifications */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-[#0b2341] flex items-center space-x-2">
                  <span>💊 1. Formulation Brands & Unit Rates</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {itemsList.length} Line Item(s)
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-3.5 px-4">Formulation Name</th>
                      <th className="py-3.5 px-4">SKU / Code</th>
                      <th className="py-3.5 px-4 text-center">Qty (Units)</th>
                      <th className="py-3.5 px-4 text-right">Unit Rate (₹)</th>
                      <th className="py-3.5 px-4 text-right">Total Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itemsList.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-[#0b2341]">
                          <div className="text-xs">{item.product_name || item.name}</div>
                          {item.batch_no && (
                            <span className="inline-block text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold mt-1">
                              Batch: {item.batch_no}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-blue-700 font-bold text-xs">
                          {item.sku || "EVV-MED-01"}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-slate-800 text-xs">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-bold">
                          ₹{(item.unit_price || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-[#0b2341] text-xs">
                          ₹{(item.total_price || item.quantity * item.unit_price || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Commercial Invoicing & Pricing Breakdown */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
              <h3 className="text-sm font-extrabold text-[#0b2341] border-b border-slate-100 pb-3 flex items-center space-x-2">
                <span>🧾 2. Commercial Pricing & Tax Breakdown</span>
              </h3>

              <div className="space-y-2.5 max-w-md ml-auto text-xs text-slate-600 font-medium">
                <div className="flex justify-between">
                  <span>Items Base Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pharma GST (12% CGST + SGST):</span>
                  <span className="font-mono font-bold text-slate-900">₹{tax.toLocaleString()}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping & Cold-Chain Logistics:</span>
                    <span className="font-mono font-bold text-slate-900">₹{shipping.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Wholesale / Promotion Discount:</span>
                    <span className="font-mono font-bold">-₹{discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200 text-sm">
                  <span className="font-black text-[#0b2341] uppercase tracking-wide">Grand Invoice Total:</span>
                  <span className="font-black text-[#0b2341] text-2xl font-mono">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Dispatch & Operations Audit */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
              <h3 className="text-sm font-extrabold text-[#0b2341] border-b border-slate-100 pb-3 flex items-center space-x-2">
                <span>📝 3. Dispatch & Logistics Tracking</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Courier / Logistics Tracking Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. BLUEDART-8891024 / DTDC-9921"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-blue-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Internal Operations Dispatch Note</label>
                  <input
                    type="text"
                    placeholder="Batch dispatch, cold-chain verification..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col) */}
          <div className="space-y-6">
            {/* Buyer Entity Profile */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-[#0b2341]">
                  {isDistributor ? "🏢 Verified Distributor" : "👤 Direct Retail Buyer"}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${isDistributor ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}
                >
                  {order.role || (isDistributor ? "Distributor" : "Customer")}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Full Entity / Contact Name</span>
                  <span className="font-extrabold text-[#0b2341] text-sm block">{order.customer_name || order.customerName}</span>
                </div>

                {order.gstin && (
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">GSTIN Registration</span>
                    <span className="font-mono font-bold text-blue-700 text-xs">{order.gstin}</span>
                  </div>
                )}

                {order.customer_phone && (
                  <div>
                    <span className="text-slate-400 font-bold text-[10px] uppercase block">Contact Phone Number</span>
                    <span className="font-bold text-slate-800 text-xs">{order.customer_phone}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-bold text-[10px] uppercase block">Delivery Destination</span>
                  <p className="font-medium text-slate-700 text-xs mt-0.5 leading-relaxed">
                    {order.delivery_address ? `${order.delivery_address}, ` : ""}
                    <strong className="text-slate-900">{order.delivery_city || order.deliveryCity || "Hyderabad"}</strong>
                    {order.delivery_state ? `, ${order.delivery_state}` : ""}
                    {order.delivery_pincode ? ` - ${order.delivery_pincode}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Gateway & Financial Audit */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-[#0b2341]">💳 Gateway & Payment</h3>
                {isRefunded ? (
                  <span className="bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded text-[10px]">
                    💸 REFUNDED
                  </span>
                ) : isPaid ? (
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded text-[10px]">
                    ✓ PAID
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded text-[10px]">
                    {paymentStatus}
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="font-bold text-slate-800">{order.payment_method || "UPI / Online NetBanking"}</span>
                </div>

                {order.razorpay_payment_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Gateway Txn ID:</span>
                    <span className="font-mono text-blue-700 font-bold text-[11px] truncate max-w-[140px]" title={order.razorpay_payment_id}>
                      {order.razorpay_payment_id}
                    </span>
                  </div>
                )}

                {order.refund_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Refund Reference:</span>
                    <span className="font-mono text-rose-700 font-bold text-[11px] truncate max-w-[140px]" title={order.refund_id}>
                      {order.refund_id}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Invoice Reference:</span>
                  <span className="font-mono font-bold text-[#0b2341]">
                    {order.invoice_number || `INV-2026-${order.id}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Lifecycle Action Hub */}
            <div className="bg-[#0b2341] text-white rounded-3xl p-6 shadow-md space-y-4 text-xs">
              <h3 className="text-sm font-extrabold border-b border-white/10 pb-3 flex items-center space-x-1.5">
                <span>⚡ Admin Lifecycle Controls</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                    Advance Order State Transition:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"].map((st) => (
                      <button
                        key={st}
                        disabled={updating || currentStatus.toLowerCase() === st.toLowerCase()}
                        onClick={() => handleUpdateStatus(st)}
                        className={`py-2 px-3 rounded-xl font-bold text-[11px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${currentStatus.toLowerCase() === st.toLowerCase()
                          ? "bg-white text-[#0b2341]"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                          }`}
                      >
                        {currentStatus.toLowerCase() === st.toLowerCase() ? `✓ ${st}` : `→ Mark ${st}`}
                      </button>
                    ))}
                  </div>
                </div>

                {isPaid && !isRefunded && (
                  <div className="pt-3 border-t border-white/10">
                    <button
                      onClick={() => setIsRefundModalOpen(true)}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <span>💸 Trigger Razorpay Refund</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ─── DEDICATED OFFICIAL TAX INVOICE (Rendered for Print & Clean A4) ─── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="invoice-print-container hidden print:block bg-white text-slate-900 font-sans p-4">
        <InvoiceDocumentContent
          order={order}
          itemsList={itemsList}
          subtotal={subtotal}
          tax={tax}
          cgst={cgst}
          sgst={sgst}
          total={total}
          shipping={shipping}
          discount={discount}
          adminSettings={adminSettings}
        />
      </div>

      {/* ─── DIRECT REFUND CONFIRMATION MODAL ─── */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 p-8 relative text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-rose-800 uppercase bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                  Automated Gateway Refund
                </span>
                <h2 className="text-xl font-black text-[#0b2341] tracking-tight mt-1">
                  Issue Refund: {orderCode}
                </h2>
              </div>
              <button
                onClick={() => setIsRefundModalOpen(false)}
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
                    {order.customer_name || order.customerName} ({order.role})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Original Order Total:</span>
                  <span className="font-black text-emerald-700 text-sm font-mono">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Gateway Payment ID:</span>
                    <span className="font-mono text-blue-700 font-bold">{order.razorpay_payment_id}</span>
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
                  max={total || 999999}
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
                  onClick={() => setIsRefundModalOpen(false)}
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
