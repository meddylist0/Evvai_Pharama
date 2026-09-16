"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderData } from "@/lib/api";

interface MobileOrderSuccessProps {
  order: OrderData;
  onContinueShopping?: () => void;
  onTrackOrder?: (orderId: number | string) => void;
}

export const MobileOrderSuccess: React.FC<MobileOrderSuccessProps> = ({
  order,
  onContinueShopping,
  onTrackOrder,
}) => {
  const router = useRouter();

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

  const orderNumber =
    order.order_code ||
    order.order_number ||
    (order.order_id ? String(order.order_id) : "") ||
    `EVV-ORD-${order.id || "78452"}`;

  const totalAmount = Number(order.total_amount || 0);

  const paymentMethodLabel =
    (order.payment_method || "").toLowerCase() === "razorpay"
      ? "Online Payment"
      : "Cash on Delivery";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between pt-[env(safe-area-inset-top,20px)] pb-[env(safe-area-inset-bottom,28px)] px-5 select-none animate-in fade-in duration-300 relative overflow-hidden">
      {/* Decorative Confetti in Background */}
      <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none opacity-40 overflow-hidden">
        <span className="absolute top-4 left-6 text-sm">🎉</span>
        <span className="absolute top-8 left-1/4 text-xs text-pink-400">✨</span>
        <span className="absolute top-6 right-8 text-sm">🎊</span>
        <span className="absolute top-12 right-1/4 text-xs text-blue-400">✨</span>
        <span className="absolute top-16 left-12 text-xs text-emerald-400">●</span>
        <span className="absolute top-20 right-16 text-xs text-amber-400">▲</span>
      </div>

      {/* Top Brand Header */}
      <div className="flex items-center justify-between py-2 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#A71380] to-[#0B2545] p-0.5 flex items-center justify-center shadow-xs">
          <img
            src="/images/evvai_icon.png"
            alt="EVVAI Logo"
            className="w-full h-full object-contain rounded-md bg-white p-0.5"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
        <span className="text-[10px] font-black tracking-widest text-[#0B2545] uppercase">
          EVVAI Pharmaceuticals
        </span>
      </div>

      {/* Main Success Container (Screen 1 Reference) */}
      <div className="my-auto py-4 space-y-6 max-w-sm mx-auto w-full relative z-10">
        {/* Animated Checkmark Circle */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-[#A71380] text-white flex items-center justify-center text-3xl font-black shadow-lg mx-auto ring-8 ring-pink-100/90 animate-in zoom-in duration-300">
            ✓
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-black text-[#0B2545] tracking-tight">
              Order Placed Successfully!
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Thank you for choosing EVVAI Pharma. Your order has been confirmed.
            </p>
          </div>
        </div>

        {/* Order Details Summary Box (Matching Mockup 1) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3.5">
          {/* Order ID */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <svg className="w-4 h-4 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Order ID</span>
            </div>
            <span className="font-mono text-xs font-black text-[#0B2545]">
              {orderNumber}
            </span>
          </div>

          {/* Order Date */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <svg className="w-4 h-4 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Order Date</span>
            </div>
            <span className="text-xs font-bold text-slate-800">
              {formattedDate}
            </span>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <span className="text-sm font-bold text-[#0B2545]">₹</span>
              <span>Total Amount</span>
            </div>
            <span className="text-sm font-black text-[#0B2545]">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-500 text-xs font-semibold">
              <svg className="w-4 h-4 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Payment Method</span>
            </div>
            <span className="text-xs font-bold text-slate-800">
              {paymentMethodLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons (Matching Mockup 1) */}
      <div className="space-y-3 pt-2 max-w-sm mx-auto w-full relative z-10">
        {/* Primary: Track Order */}
        <button
          onClick={() => {
            if (onTrackOrder) {
              onTrackOrder(order.id);
            } else {
              router.push(`/customer/orders/?track=${order.id}`);
            }
          }}
          className="w-full h-12 rounded-2xl bg-[#A71380] hover:bg-[#8e0f6c] text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>🛒 Track Order</span>
          <span className="text-sm">→</span>
        </button>

        {/* Secondary: Continue Shopping */}
        <button
          onClick={() => {
            if (onContinueShopping) {
              onContinueShopping();
            } else {
              router.push("/products/");
            }
          }}
          className="w-full h-12 rounded-2xl bg-white border border-[#C00065] text-[#C00065] font-bold text-sm shadow-2xs hover:bg-pink-50/50 active:scale-98 transition-all flex items-center justify-center cursor-pointer"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
