"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { OrderData } from "@/lib/api";
import { MobileHeader } from "@/components/mobile/MobileHeader";

interface MobileOrderTrackingProps {
  order: OrderData;
  onBack?: () => void;
}

export const MobileOrderTracking: React.FC<MobileOrderTrackingProps> = ({
  order,
  onBack,
}) => {
  const router = useRouter();

  const orderNumber =
    order.order_code ||
    order.order_number ||
    (order.order_id ? String(order.order_id) : "") ||
    `EVV-ORD-${order.id || "78452"}`;

  // Parse order created date dynamically
  const createdDate = order.created_at ? new Date(order.created_at) : new Date();
  
  const formatDateOnly = (d: Date) => {
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (d: Date) => {
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const placedDateStr = formatDateOnly(createdDate);

  // Dynamic status check
  const rawStatus = (order.order_status || "Confirmed").toLowerCase();
  
  const isDelivered = rawStatus.includes("deliver");
  const isOutForDelivery = rawStatus.includes("out") || isDelivered;
  const isShipped = rawStatus.includes("ship") || rawStatus.includes("transit") || isOutForDelivery;
  const isPacked = rawStatus.includes("pack") || isShipped;
  const isConfirmed = true; // Any placed order is confirmed

  // Dynamic milestone timestamps based on creation time
  const packedDate = new Date(createdDate.getTime() + 4 * 60 * 60 * 1000);
  const shippedDate = new Date(createdDate.getTime() + 24 * 60 * 60 * 1000);
  const outDate = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const deliveryDate = new Date(createdDate.getTime() + 4 * 24 * 60 * 60 * 1000);

  const estimatedDeliveryStr = formatDateOnly(deliveryDate);

  // Status Badge UI
  let statusBadge = (
    <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 flex items-center space-x-1">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
      <span>Confirmed</span>
    </span>
  );

  if (isDelivered) {
    statusBadge = (
      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Delivered</span>
      </span>
    );
  } else if (isShipped) {
    statusBadge = (
      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>In Transit</span>
      </span>
    );
  } else if (isPacked) {
    statusBadge = (
      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center space-x-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span>Packed</span>
      </span>
    );
  }

  // 5 Steps dynamic timeline
  const steps = [
    {
      title: "Order Confirmed",
      time: formatDateTime(createdDate),
      isCompleted: isConfirmed,
      isCurrent: !isPacked,
      color: "teal",
      description: "Order verified and payment cleared by EVVAI Pharma.",
    },
    {
      title: "Packed",
      time: isPacked ? formatDateTime(packedDate) : `Expected ${formatDateTime(packedDate)}`,
      isCompleted: isPacked,
      isCurrent: isPacked && !isShipped,
      color: "blue",
      description: "Batch verified, cold-chain packed with security seal.",
    },
    {
      title: "Shipped",
      time: isShipped ? formatDateTime(shippedDate) : `Expected ${formatDateOnly(shippedDate)}, 09:30 AM`,
      isCompleted: isShipped,
      isCurrent: isShipped && !isOutForDelivery,
      color: "blue",
      description: "Handed over to pharmaceutical logistics partner.",
    },
    {
      title: "Out for Delivery",
      time: isOutForDelivery ? formatDateTime(outDate) : `Expected ${formatDateOnly(outDate)}, 08:00 AM`,
      isCompleted: isOutForDelivery,
      isCurrent: isOutForDelivery && !isDelivered,
      color: "blue",
      description: "Courier executive out for delivery to your address.",
    },
    {
      title: "Delivered",
      time: isDelivered ? formatDateTime(deliveryDate) : `Expected ${estimatedDeliveryStr}`,
      isCompleted: isDelivered,
      isCurrent: isDelivered,
      color: "emerald",
      description: "Package safely handed over with OTP verification.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col select-none relative">
      {/* Header (Matching Screen 3: Track Order with Refresh Icon) */}
      <MobileHeader
        title="Track Order"
        showBack={true}
        onBack={onBack ? onBack : () => router.back()}
        rightAction={
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#0B2545] active:scale-95 cursor-pointer"
            aria-label="Refresh tracking status"
            title="Refresh Status"
          >
            <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        }
      />

      {/* Main Tracking Content */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-12 px-4 py-3 space-y-4">
        {/* 1. Order Header Card (Matching Mockup 3) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-black text-[#0B2545] font-mono tracking-tight">
                  {orderNumber}
                </h2>
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({
                        title: `Tracking Order ${orderNumber}`,
                        text: `Track your EVVAI order ${orderNumber}`,
                        url: window.location.href,
                      });
                    }
                  }}
                  className="text-slate-400 hover:text-[#0B2545]"
                  title="Share"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Placed on {placedDateStr}
              </p>
            </div>

            {statusBadge}
          </div>
        </div>

        {/* 2. 5-Step Timeline Stepper (Matching Mockup 3 Pixel-Perfect) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="space-y-6 relative">
            {steps.map((st, idx) => {
              const isLast = idx === steps.length - 1;
              const nextStepCompleted = !isLast && steps[idx + 1].isCompleted;

              return (
                <div key={idx} className="relative flex items-start space-x-3.5 group">
                  {/* Connecting Line between steps */}
                  {!isLast && (
                    <div
                      className={`absolute left-3 top-6 bottom-[-24px] w-0.5 transition-colors ${
                        nextStepCompleted ? "bg-[#0284C7]" : "bg-slate-200"
                      }`}
                    />
                  )}

                  {/* Node Circle */}
                  <div className="relative z-10 shrink-0">
                    {st.isCompleted ? (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                          st.color === "teal"
                            ? "bg-[#0D9488]"
                            : st.color === "emerald"
                            ? "bg-[#059669]"
                            : "bg-[#0284C7]"
                        }`}
                      >
                        ✓
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Milestone Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-xs font-extrabold ${
                          st.isCompleted ? "text-[#0B2545]" : "text-slate-400"
                        }`}
                      >
                        {st.title}
                      </h4>
                      <span
                        className={`text-[10px] font-medium ${
                          st.isCompleted ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {st.time}
                      </span>
                    </div>
                    {st.description && (
                      <p
                        className={`text-[11px] leading-snug mt-0.5 ${
                          st.isCompleted ? "text-slate-500" : "text-slate-400/80"
                        }`}
                      >
                        {st.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Estimated Delivery Card (Matching Mockup 3) */}
        <div className="rounded-2xl bg-[#FFF5F8] border border-pink-200/80 p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-white shadow-2xs flex items-center justify-center text-xl text-[#A71380] border border-pink-100 shrink-0">
              <svg className="w-6 h-6 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <span className="text-sm font-black text-[#0B2545] leading-tight block mt-0.5">
                {estimatedDeliveryStr}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#C00065] bg-white px-2.5 py-1 rounded-full shadow-2xs border border-pink-100">
            On Schedule
          </span>
        </div>

        {/* 4. Delivery Address Summary */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center space-x-2 text-[#0B2545]">
            <span className="text-xs">📍</span>
            <h4 className="text-xs font-black uppercase tracking-wider">
              Delivery Destination
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pl-5">
            {order.shipping_address || order.delivery_address || "Road No. 36, Jubilee Hills, Hyderabad, Telangana - 500033"}
          </p>
        </div>
      </main>
    </div>
  );
};
