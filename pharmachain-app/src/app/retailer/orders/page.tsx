"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ordersAPI, claimsAPI, OrderData, ClaimItem } from "@/lib/api";
import { getOrderStatusDisplay } from "@/lib/pricingUtils";

export default function RetailerOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

  // Claim Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimOrder, setClaimOrder] = useState<OrderData | null>(null);
  const [claimProductId, setClaimProductId] = useState<number | undefined>(undefined);
  const [claimProductName, setClaimProductName] = useState("");
  const [claimBatchNo, setClaimBatchNo] = useState("");
  const [claimQuantity, setClaimQuantity] = useState(1);
  const [claimType, setClaimType] = useState<string>("DAMAGED_GOODS");
  const [claimDescription, setClaimDescription] = useState("");
  const [claimDocUrl, setClaimDocUrl] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOrdersAndClaims = async () => {
    try {
      setLoading(true);
      const [myOrders, myClaims] = await Promise.all([
        ordersAPI.getMyOrders().catch(() => []),
        claimsAPI.getMyClaims().catch(() => []),
      ]);
      setOrders(myOrders);
      setClaims(myClaims);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndClaims();
  }, []);

  const handleOpenClaimModal = (order: OrderData) => {
    setClaimOrder(order);
    const firstItem = order.items?.[0];
    if (firstItem) {
      setClaimProductId(firstItem.product_id);
      setClaimProductName(firstItem.product_name);
      setClaimBatchNo(firstItem.batch_no || "");
      setClaimQuantity(Math.min(firstItem.quantity || 1, 10));
    }
    setClaimType("DAMAGED_GOODS");
    setClaimDescription("");
    setClaimDocUrl("");
    setClaimMsg(null);
    setIsClaimModalOpen(true);
  };

  const handleItemSelectForClaim = (productId: number) => {
    const item = claimOrder?.items?.find((i) => i.product_id === productId);
    if (item) {
      setClaimProductId(item.product_id);
      setClaimProductName(item.product_name);
      setClaimBatchNo(item.batch_no || "");
      setClaimQuantity(1);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimOrder) return;

    try {
      setClaimSubmitting(true);
      setClaimMsg(null);

      const res = await claimsAPI.create({
        order_id: claimOrder.id,
        product_id: claimProductId,
        product_name: claimProductName,
        batch_no: claimBatchNo,
        quantity: claimQuantity,
        claim_type: claimType,
        reason_description: claimDescription,
        supporting_doc_url: claimDocUrl || undefined,
      });

      setClaimMsg({
        type: "success",
        text: `✓ Return Claim ${res.claim_code} submitted! EVVAI Compliance will review and issue a Credit Note.`,
      });

      // Refresh claims
      claimsAPI.getMyClaims().then(setClaims).catch(() => { });
      setTimeout(() => {
        setIsClaimModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setClaimMsg({
        type: "error",
        text: err.message || "Failed to submit claim. Please try again.",
      });
    } finally {
      setClaimSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#A71380] text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full">
              Order Fulfillment
            </span>
            <span className="text-xs text-slate-500 font-bold">Live Depot Dispatches &amp; Returns</span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-1">
            Pharmacy Purchase Orders &amp; Claims Desk
          </h1>

        </div>

        <Link
          href="/retailer/catalog"
          className="bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6B0B52] text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#A71380]/20 shrink-0"
        >
          + New Trade Order &rarr;
        </Link>
      </div>

      {/* ── Order Detail Modal ─────────────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-[#A71380] uppercase tracking-wider">Order Details</span>
                <h3 className="text-lg font-black text-[#0b2341] font-mono">
                  {selectedOrder.order_code || `ORD-${selectedOrder.id}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cancellation Banner if Cancelled */}
            {(() => {
              const st = getOrderStatusDisplay(
                selectedOrder.order_status || (selectedOrder as any).status,
                (selectedOrder as any).cancellation_reason,
                (selectedOrder as any).admin_notes
              );
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
                        {(selectedOrder as any).cancellation_reason || (selectedOrder as any).admin_notes || "This order was cancelled by system administrator."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Order Items List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchased Formulations &amp; Batches</h4>
              <div className="bg-slate-50 rounded-2xl p-4 divide-y divide-slate-200/80 space-y-3">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#0b2341] block">
                          {item.product_name || `Product #${item.product_id}`}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono space-x-2">
                          <span>Qty: {item.quantity} Packs @ ₹{(item.unit_price || 0).toFixed(2)}/Pk</span>
                          {item.batch_no && (
                            <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">
                              Batch: {item.batch_no}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-[#0b2341]">
                        ₹{(item.total_price || ((item.quantity || 1) * (item.unit_price || 0))).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Order items details processed.</p>
                )}
              </div>
            </div>

            {/* Summary Box & Actions */}
            <div className="bg-[#0b2341] text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-300 block text-[11px]">Total Invoiced Amount</span>
                <span className="text-xl font-black text-white">₹{(selectedOrder.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    handleOpenClaimModal(selectedOrder);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ⚠️ Raise Return / Claim
                </button>
                <Link
                  href="/retailer/invoices"
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  GST Invoice &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Raise Return / Claim Modal ─────────────────────────────── */}
      {isClaimModalOpen && claimOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Post-Delivery Claims
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">
                  Raise Return / Breakage Claim for {claimOrder.order_code}
                </h3>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            {claimMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${claimMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
              >
                {claimMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
              {/* Product Selector from Order */}
              <div>
                <label className="block font-bold text-[#0b2341] mb-1">Select Ordered Product *</label>
                <select
                  value={claimProductId}
                  onChange={(e) => handleItemSelectForClaim(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                >
                  {claimOrder.items?.map((i) => (
                    <option key={i.product_id} value={i.product_id}>
                      {i.product_name} (Ordered: {i.quantity} Packs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0b2341] mb-1">Claim Reason / Category *</label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                  >
                    <option value="DAMAGED_GOODS">Damaged / Broken Strips</option>
                    <option value="WRONG_PRODUCT">Wrong Formulation Dispatched</option>
                    <option value="SHORT_QUANTITY">Short Quantity / Missing Packs</option>
                    <option value="TRANSIT_DAMAGE">Transit / Seal Leakage</option>
                    <option value="NEAR_EXPIRY">Near Expiry (&lt; 3 Months)</option>
                    <option value="OTHER">Other Compliance Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0b2341] mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={claimBatchNo}
                    onChange={(e) => setClaimBatchNo(e.target.value)}
                    placeholder="Batch printed on strip"
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0b2341] mb-1">Affected Quantity (Packs) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={claimQuantity}
                    onChange={(e) => setClaimQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0b2341] mb-1">Photo / Proof Document URL (Optional)</label>
                  <input
                    type="text"
                    value={claimDocUrl}
                    onChange={(e) => setClaimDocUrl(e.target.value)}
                    placeholder="https://... image link or photo"
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0b2341] mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  value={claimDescription}
                  onChange={(e) => setClaimDescription(e.target.value)}
                  placeholder="Explain the damage, breakage, or shortage observed upon delivery receipt..."
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {claimSubmitting ? "Submitting..." : "Submit Claim for Credit Note →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Active Return Claims Section (if any) ─────────────────── */}
      {claims.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#A71380] tracking-wider">Claims Ledger</span>
              <h3 className="text-base font-black text-[#0b2341]">Submitted Return &amp; Breakage Claims</h3>
            </div>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black">
              {claims.length} Active Claims
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 px-3">Claim Code</th>
                  <th className="pb-3 px-3">Product &amp; Batch</th>
                  <th className="pb-3 px-3">Claim Category</th>
                  <th className="pb-3 px-3 text-center">Quantity</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 px-3">Credit Note / Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#0b2341]">{c.claim_code}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-[#0b2341] block">{c.product_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Batch: {c.batch_no || "N/A"}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-semibold">{c.claim_type.replace("_", " ")}</td>
                    <td className="py-3 px-3 text-center font-bold text-[#0b2341]">{c.quantity} Pks</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${c.status === "APPROVED" || c.status === "SETTLED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : c.status === "REJECTED"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {c.credit_note_number ? (
                        <span className="text-emerald-700 font-bold">
                          ✓ {c.credit_note_number} {c.credit_amount ? `(₹${c.credit_amount})` : ""}
                        </span>
                      ) : (
                        "Under Admin Verification"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Orders Table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold animate-pulse">
            Loading Pharmacy Orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-3">
            <span className="text-4xl block">📦</span>
            <p className="font-bold text-slate-600">No Orders Found</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Your pharmacy has not placed any trade orders yet. Browse our catalog to stock up.
            </p>
            <Link
              href="/retailer/catalog"
              className="inline-block bg-[#0b2341] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#A71380] transition-all mt-2"
            >
              Browse Pharmacy Catalog &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 px-3">Order Ref</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Items Ordered</th>
                  <th className="pb-3 px-3 text-right">Total Amount</th>
                  <th className="pb-3 px-3 text-center">Fulfillment Status</th>
                  <th className="pb-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-3 font-mono font-bold text-[#0b2341]">
                      {ord.order_code || `ORD-${ord.id}`}
                    </td>
                    <td className="py-4 px-3 text-slate-500">
                      {ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-IN") : "Today"}
                    </td>
                    <td className="py-4 px-3 text-slate-600 font-medium">
                      {ord.items?.length || 1} Products ({ord.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1} Packs)
                    </td>
                    <td className="py-4 px-3 text-right font-black text-[#0b2341]">
                      ₹{(ord.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-3 text-center">
                      {(() => {
                        const st = getOrderStatusDisplay(
                          ord.order_status || (ord as any).status,
                          (ord as any).cancellation_reason,
                          (ord as any).admin_notes
                        );
                        return (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-block ${st.badgeClass}`}>
                            ● {st.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-3 text-center space-x-2">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="bg-slate-100 hover:bg-slate-200 text-[#0b2341] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenClaimModal(ord)}
                        className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg font-bold text-xs border border-amber-200 cursor-pointer"
                        title="Raise return / damage claim"
                      >
                        Claim
                      </button>
                      <Link
                        href="/retailer/invoices"
                        className="text-[#A71380] hover:underline font-bold text-xs"
                      >
                        GST Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

