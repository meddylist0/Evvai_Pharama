"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, ordersAPI, OrderData } from "@/lib/api";
import { getOrderStatusDisplay } from "@/lib/pricingUtils";

export default function DistributorOrdersPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    const load = async () => {
      try {
        const myOrders = await ordersAPI.getMyOrders();
        if (myOrders) setOrders(myOrders);
      } catch (err) {
        console.warn("Failed fetching distributor orders:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isApproved = user?.kyc_status === "APPROVED";

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "shipped":
        return "bg-[#F8EAF4] text-[#A71380] border-blue-300";
      case "packed":
      case "confirmed":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  if (!isApproved) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-[6px] p-8 shadow-2xs max-w-3xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-[5px] mx-auto flex items-center justify-center text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-black text-[#0b2341]">
          Purchase Order Creation Locked
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your distributor application is currently undergoing regulatory Drug License verification. Bulk purchase order placement will be available immediately once approved.
        </p>
        <div className="pt-2">
          <Link
            href="/distributor/dashboard"
            className="inline-block bg-[#0b2341] hover:bg-[#12315a] text-white font-bold text-xs px-6 py-3 rounded-[5px] transition-all shadow-xs"
          >
            Check KYC Verification Status &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <div>
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
            Purchase Orders & Dispatch Fulfillment
          </span>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Distributor Purchase Orders Tracking
          </h1>

        </div>

        <Link
          href="/distributor/orders/new"
          className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-extrabold px-5 py-3 rounded-[5px] shadow-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <span>+ Create Bulk PO</span>
        </Link>
      </div>

      {/* Comprehensive Orders Register Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-[6px] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0b2341]">Your Purchase Orders</h3>
          <span className="text-xs font-bold text-slate-500">{orders.length} Total Orders</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-[5px] border border-slate-100 space-y-3">
            <div className="w-12 h-12 bg-[#F8EAF4] text-[#A71380] rounded-[5px] mx-auto flex items-center justify-center font-bold text-xl">
              📦
            </div>
            <h4 className="text-sm font-bold text-slate-800">No purchase orders placed yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your account is approved for B2B wholesale purchasing. Create your first Purchase Order directly through the catalog.
            </p>
            <div className="pt-2">
              <Link
                href="/distributor/catalog"
                className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-5 py-2.5 rounded-[5px] transition-all shadow-xs inline-block"
              >
                + Browse Formulation Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50 whitespace-nowrap">
                  <th className="py-3.5 px-4">PO Code & Date</th>
                  <th className="py-3.5 px-4">Formulation Items Summary</th>
                  <th className="py-3.5 px-4">Delivery & City</th>
                  <th className="py-3.5 px-4">PO Amount</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-mono font-black text-[#A71380] text-sm block">{ord.order_code}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{ord.created_at?.split("T")[0]}</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-[#0b2341] block text-sm">
                        {ord.items?.[0]?.product_name || "Formulations Pack"} ({ord.items?.[0]?.quantity || 1} units)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {(ord.items?.length || 1) > 1 ? `+ ${(ord.items?.length || 1) - 1} more formulation items` : "Single formulation"}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 block text-xs">{ord.delivery_city}, {ord.delivery_state}</span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        PIN: {ord.delivery_pincode}
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-black text-[#0b2341] text-sm block">₹{ord.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{ord.payment_status}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {(() => {
                        const st = getOrderStatusDisplay(ord.order_status, (ord as any).cancellation_reason, (ord as any).admin_notes);
                        return (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border inline-block ${st.badgeClass}`}>
                            ● {st.label}
                          </span>
                        );
                      })()}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="bg-[#0b2341] hover:bg-[#12315a] text-white px-3.5 py-1.5 rounded-[5px] text-xs font-bold shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                        >
                          🔍 View Details
                        </button>
                        <Link
                          href="/distributor/invoices"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-[5px] border border-slate-300 transition-all cursor-pointer whitespace-nowrap"
                        >
                          Invoice
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PO Full Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6 p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-[#A71380] uppercase bg-[#F8EAF4] px-2.5 py-0.5 rounded border border-[#F3D0E9]">
                  Confirmed Purchase Order
                </span>
                <h2 className="text-xl font-black text-[#0b2341] tracking-tight mt-1">
                  PO #{selectedOrder.order_code}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cancellation Banner if Cancelled */}
            {(() => {
              const st = getOrderStatusDisplay(selectedOrder.order_status, (selectedOrder as any).cancellation_reason, (selectedOrder as any).admin_notes);
              if (!st.isCancelled) return null;
              return (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 space-y-1 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-start space-x-3">
                    <span className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 mt-0.5">
                      ✕
                    </span>
                    <div>
                      <h3 className="font-black text-sm text-rose-950 uppercase tracking-wide">
                        {st.label}
                      </h3>
                      <p className="text-xs text-rose-800 font-medium mt-0.5">
                        {(selectedOrder as any).cancellation_reason || (selectedOrder as any).admin_notes || "This purchase order was cancelled by system administrator."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-[5px] p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-medium block">Buyer / Entity:</span>
                  <strong className="text-[#0b2341] block text-sm">{selectedOrder.customer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Order Status:</span>
                  {(() => {
                    const st = getOrderStatusDisplay(selectedOrder.order_status, (selectedOrder as any).cancellation_reason, (selectedOrder as any).admin_notes);
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border inline-block mt-0.5 ${st.badgeClass}`}>
                        ● {st.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {selectedOrder.tracking_number && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-slate-500 font-medium block">Tracking Number:</span>
                  <span className="font-mono font-bold text-[#A71380]">{selectedOrder.tracking_number}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-slate-500 font-medium block">Delivery Address:</span>
                <span className="font-medium text-slate-800 block">{selectedOrder.delivery_address}, {selectedOrder.delivery_city}, {selectedOrder.delivery_state} - {selectedOrder.delivery_pincode}</span>
              </div>
            </div>

            {/* Items Table in Modal */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-[#0b2341] text-sm">Ordered Formulations</h3>
              <div className="border border-slate-200 rounded-[5px] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-3">Batch #</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-3 font-bold text-[#0b2341]">{it.product_name}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{it.batch_no || "BAT-2026"}</td>
                        <td className="py-3 px-3 font-bold">{it.quantity} units</td>
                        <td className="py-3 px-3 text-right">₹{it.unit_price?.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-black text-[#A71380]">₹{it.total_price?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="font-extrabold text-slate-700">Total Purchase Value:</span>
                <span className="font-black text-emerald-700 text-lg">₹{selectedOrder.total_amount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-5 py-2.5 rounded-[5px] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
