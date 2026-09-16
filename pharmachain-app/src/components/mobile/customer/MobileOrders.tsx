"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ordersAPI, OrderData } from "@/lib/api";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { MobileOrderTracking } from "./MobileOrderTracking";

export const MobileOrders: React.FC = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<OrderData | null>(null);
  const [viewingOrderDetail, setViewingOrderDetail] = useState<OrderData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await ordersAPI.getMyOrders();
        if (isMounted) {
          setOrders(data || []);
        }
      } catch (err) {
        console.error("Failed to load customer orders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle URL query parameters (?track=xxx, ?status=yyy)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const trackParam = params.get("track");
      const statusParam = params.get("status");

      if (statusParam) {
        setStatusFilter(statusParam.toLowerCase());
      }

      if (trackParam && orders.length > 0) {
        const found = orders.find(
          (o) =>
            String(o.id) === trackParam ||
            o.order_code === trackParam ||
            o.order_number === trackParam ||
            String(o.order_id) === trackParam
        );
        if (found) {
          setSelectedTrackingOrder(found);
        }
      }
    }
  }, [orders]);

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderSt = (o.order_status || "confirmed").toLowerCase();
      if (statusFilter !== "all" && !orderSt.includes(statusFilter)) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const num = (o.order_code || o.order_number || (o.order_id ? String(o.order_id) : "") || String(o.id)).toLowerCase();
        return num.includes(q);
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // If a specific order is selected for live tracking, show Screen 10
  if (selectedTrackingOrder) {
    return (
      <MobileOrderTracking
        order={selectedTrackingOrder}
        onBack={() => setSelectedTrackingOrder(null)}
      />
    );
  }

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || "confirmed").toLowerCase();
    if (s.includes("delivered")) {
      return (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          ● Delivered
        </span>
      );
    }
    if (s.includes("shipped") || s.includes("transit")) {
      return (
        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
          ● Shipped
        </span>
      );
    }
    if (s.includes("cancel")) {
      return (
        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
          ● Cancelled
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
        ● Confirmed
      </span>
    );
  };

  return (
    <MobileAppShell
      headerTitle="My Orders"
      showBack={true}
      activeTab="account"
      rightAction={
        <Link
          href="/customer/profile/"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#0B2545] active:scale-95 cursor-pointer"
          aria-label="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      }
    >
      {/* Top Search & Filter Bar (Screen 9 Reference) */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 space-y-2.5 sticky top-14 z-30 shadow-2xs">
        {/* Search Orders */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search orders by Order ID..."
            className="w-full h-10 pl-9 pr-4 bg-slate-100/90 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#A71380] transition-all font-medium"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Status Filter Tabs (Matching Image 2 Screen 4: All, Pending, Confirmed, Shipped) */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
          {filterTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-[#580B43] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List Container */}
      <div className="px-4 py-3 space-y-3">
        {loading ? (
          /* Skeletons */
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-1/4" />
              </div>
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-8 bg-slate-200 rounded w-full pt-2" />
            </div>
          ))
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((o) => {
            const orderNum = o.order_code || o.order_number || (o.order_id ? String(o.order_id) : "") || `EVV-ORD-${o.id}`;
            const dateStr = o.created_at
              ? new Date(o.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "12 Sep 2026";
            const itemCount = (o.items && o.items.length) || 1;
            const amount = Number(o.total_amount || 0);
            const st = (o.order_status || "").toLowerCase();
            const isShippedOrTransit = st.includes("ship") || st.includes("transit") || st.includes("pack") || st.includes("pend");

            return (
              <div
                key={o.id}
                onClick={() => setViewingOrderDetail(o)}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5 active:scale-[0.99] transition-all cursor-pointer"
              >
                {/* Header Row: ID + Status Badge (Screen 4 Reference) */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-black text-[#0B2545] tracking-tight">
                    {orderNum}
                  </h3>
                  {getStatusBadge(o.order_status || "confirmed")}
                </div>

                {/* Date */}
                <p className="text-[11px] text-slate-400 font-medium">
                  {dateStr}
                </p>

                {/* Items Summary & Action Button Row (Matching Image 2 Screen 4) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                    <span className="font-black text-[#0B2545] ml-2">
                      ₹{amount}
                    </span>
                  </div>

                  {isShippedOrTransit ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrackingOrder(o);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#F8EAF4] hover:bg-pink-100 text-[#A71380] text-xs font-bold transition-all cursor-pointer"
                    >
                      Track Order
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingOrderDetail(o);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty Orders State */
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3 my-8">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-2xl mx-auto">
              📦
            </div>
            <h4 className="text-sm font-black text-slate-800">No Orders Found</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You haven&apos;t placed any orders matching the selected filter yet.
            </p>
            <Link
              href="/products/"
              className="inline-block px-4 py-2 bg-[#0B2545] text-white rounded-xl text-xs font-bold"
            >
              Order Formulations →
            </Link>
          </div>
        )}
      </div>

      {/* Order Details Bottom Sheet Modal */}
      {viewingOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setViewingOrderDetail(null)}
          />
          <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,20px)] space-y-4">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#0B2545]">
                Order Details
              </h3>
              <button
                onClick={() => setViewingOrderDetail(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-bold text-[#0B2545] font-mono">{viewingOrderDetail.order_code || viewingOrderDetail.order_number || `EVV-${viewingOrderDetail.id}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold">{viewingOrderDetail.order_status || "Confirmed"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-black text-[#A71380]">₹{viewingOrderDetail.total_amount}</span>
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Shipping Address:</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {viewingOrderDetail.shipping_address || viewingOrderDetail.delivery_address || "Road No. 36, Jubilee Hills, Hyderabad, Telangana - 500033"}
              </p>
            </div>

            <button
              onClick={() => {
                const o = viewingOrderDetail;
                setViewingOrderDetail(null);
                setSelectedTrackingOrder(o);
              }}
              className="w-full h-11 rounded-xl bg-[#A71380] text-white font-extrabold text-xs shadow-xs"
            >
              Track Live Shipment →
            </button>
          </div>
        </div>
      )}
    </MobileAppShell>
  );
};
