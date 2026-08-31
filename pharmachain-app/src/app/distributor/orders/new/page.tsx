"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getStoredUser,
  StoredUser,
  productsAPI,
  ProductItem,
  ordersAPI,
  paymentsAPI,
  loadRazorpayScript,
  authAPI,
  OrderData,
} from "@/lib/api";

interface POLineItem {
  product: ProductItem;
  quantity: number;
}

export default function NewPurchaseOrderPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);

  // Multi-item PO Line Items State (Loaded directly from PO cart)
  const [poItems, setPoItems] = useState<POLineItem[]>([]);

  const [profileData, setProfileData] = useState<any>(null);
  const [myOrders, setMyOrders] = useState<OrderData[]>([]);

  // Checkout & Shipping Details
  const [paymentMethod, setPaymentMethod] = useState<string>("30-Day B2B Credit Line");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("Hyderabad");
  const [deliveryState, setDeliveryState] = useState("Telangana");
  const [deliveryPincode, setDeliveryPincode] = useState("500081");
  const [gstin, setGstin] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [poNotes, setPoNotes] = useState("");

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const stored = getStoredUser();
        setUser(stored);

        // Fetch products, orders, and profile in parallel
        const [prods, profileRes, ordersRes] = await Promise.all([
          productsAPI.list().catch(() => []),
          authAPI.getMe().catch(() => null),
          ordersAPI.getMyOrders().catch(() => []),
        ]);

        if (profileRes) setProfileData(profileRes);
        if (ordersRes) setMyOrders(ordersRes);

        if (prods && prods.length > 0) {
          setProducts(prods);

          // Load items added from Wholesale Catalog
          let initialItems: POLineItem[] = [];
          if (typeof window !== "undefined") {
            const savedCart = localStorage.getItem("pharmalink_distributor_po_cart");
            if (savedCart) {
              try {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  initialItems = parsed;
                }
              } catch (e) {}
            }
          }

          setPoItems(initialItems);
        }

        if (profileRes?.distributor_profile) {
          const dp = profileRes.distributor_profile;
          if (dp.business_address) setDeliveryAddress(dp.business_address);
          if (dp.city) setDeliveryCity(dp.city);
          if (dp.state) setDeliveryState(dp.state);
          if (dp.pincode) setDeliveryPincode(dp.pincode);
          if (dp.gstin) setGstin(dp.gstin);
          if (profileRes.phone) setContactPhone(profileRes.phone);
        } else if (stored?.phone) {
          setContactPhone(stored.phone);
        }
      } catch (err: any) {
        console.error("Failed to load initial PO page data:", err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Save PO items to local storage helper & dispatch event for sidebar sync
  const updatePoItems = (items: POLineItem[]) => {
    setPoItems(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_distributor_po_cart", JSON.stringify(items));
      window.dispatchEvent(new Event("storage"));
    }
  };

  const isApproved = user?.kyc_status === "APPROVED";

  // Helper to calculate pricing per line item
  const getItemPricing = (item: POLineItem) => {
    const prod = item.product;
    const moq = prod.bulk_moq || 20;
    const isBulk = item.quantity >= moq && Boolean(prod.bulk_price && prod.bulk_price > 0);
    const unitPrice = isBulk
      ? (prod.bulk_price || prod.distributor_price || prod.display_price || prod.mrp)
      : (prod.distributor_price || prod.display_price || prod.mrp);
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    const mrpTotal = Math.round(prod.mrp * item.quantity * 100) / 100;
    const savings = Math.max(0, mrpTotal - lineTotal);

    return {
      unitPrice,
      isBulk,
      moq,
      lineTotal,
      savings,
    };
  };

  // Live Aggregate Totals for Sidebar & Summary
  const totalUnits = poItems.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = Math.round(poItems.reduce((sum, it) => sum + getItemPricing(it).lineTotal, 0) * 100) / 100;
  const totalSavings = Math.round(poItems.reduce((sum, it) => sum + getItemPricing(it).savings, 0) * 100) / 100;
  const gstTax = Math.round(subtotal * 0.12 * 100) / 100; // 12% Pharma GST
  const grandTotal = Math.round((subtotal + gstTax) * 100) / 100;

  // Dynamic B2B Credit Limit Computations
  const totalCreditLimit = Number(profileData?.distributor_profile?.credit_limit ?? 500000);
  const outstandingCreditOrders = myOrders.filter((o) => {
    const isCredit = (o.payment_method || "").toLowerCase().includes("credit");
    const isUnpaid = (o.payment_status || "").toUpperCase() !== "PAID";
    const isNotCancelled = (o.order_status || "").toLowerCase() !== "cancelled" && (o.order_status || "").toLowerCase() !== "returned";
    return isCredit && isUnpaid && isNotCancelled;
  });
  const utilizedCreditSoFar = outstandingCreditOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const availableCreditLimit = Math.max(0, totalCreditLimit - utilizedCreditSoFar);
  const remainingCreditAfterOrder = availableCreditLimit - grandTotal;
  const isCreditExceeded = paymentMethod === "30-Day B2B Credit Line" && remainingCreditAfterOrder < 0;

  // Quantity Change Handler
  const handleQuantityChange = (productId: number, newQty: number) => {
    const cleanQty = Math.max(1, newQty);
    const updated = poItems.map((it) =>
      it.product.id === productId ? { ...it, quantity: cleanQty } : it
    );
    updatePoItems(updated);
  };

  // Remove Item Handler
  const handleRemoveItem = (productId: number) => {
    const updated = poItems.filter((it) => it.product.id !== productId);
    updatePoItems(updated);
  };

  // Clear Cart
  const handleClearAll = () => {
    updatePoItems([]);
  };

  // Submit Bulk Purchase Order (Razorpay or B2B Credit)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (poItems.length === 0) {
      setErrorMessage("Please add at least one formulation product from the Wholesale Catalog to your Purchase Order.");
      return;
    }

    // Check stock
    for (const item of poItems) {
      if (item.product.stock < item.quantity) {
        setErrorMessage(
          `Insufficient warehouse stock for ${item.product.name} (Available: ${item.product.stock} units, Requested: ${item.quantity} units). Please adjust quantity.`
        );
        return;
      }
    }

    if (!deliveryAddress.trim() || !deliveryCity.trim() || !deliveryPincode.trim()) {
      setErrorMessage("Please enter the complete delivery warehouse address, city, and pincode.");
      return;
    }

    // Validate B2B Credit Limit
    if (paymentMethod === "30-Day B2B Credit Line" && remainingCreditAfterOrder < 0) {
      setErrorMessage(
        `PO Value (₹${grandTotal.toLocaleString("en-IN")}) exceeds your Available Credit Balance (₹${availableCreditLimit.toLocaleString("en-IN")}). Please choose Razorpay or Bank Wire Transfer, or contact Admin to increase your limit.`
      );
      return;
    }

    const orderPayload = {
      items: poItems.map((it) => ({
        product_id: it.product.id,
        quantity: it.quantity,
      })),
      customer_name: user?.company_name || user?.full_name || "Pharma Distribution Partner",
      customer_phone: contactPhone || user?.phone || "+91 9988776655",
      gstin: gstin || undefined,
      delivery_address: deliveryAddress + (poNotes ? ` (PO Notes: ${poNotes})` : ""),
      delivery_city: deliveryCity,
      delivery_state: deliveryState,
      delivery_pincode: deliveryPincode,
      payment_method: paymentMethod === "razorpay" ? "Razorpay Online (UPI/Card)" : paymentMethod,
    };

    // 1. Razorpay Payment Gateway Flow
    if (paymentMethod === "razorpay") {
      setRazorpayLoading(true);
      try {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error("Could not load Razorpay Payment Gateway. Please check internet connection.");
        }

        const orderItemsPayload = poItems.map(item => ({ product_id: item.product.id, quantity: item.quantity }));
        const rzpOrder = await paymentsAPI.createRazorpayOrder(orderItemsPayload, {
          order_type: "DISTRIBUTOR_BULK_PO",
          total_items: poItems.length,
          total_units: totalUnits,
          company_name: user?.company_name || user?.full_name,
        });

        const options = {
          key: rzpOrder.key_id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || "INR",
          name: "EVVAI PharmaLink Enterprise",
          description: `Bulk PO (${poItems.length} Formulations, ${totalUnits} Units)`,
          image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=120&q=80",
          order_id: rzpOrder.razorpay_order_id,
          prefill: {
            name: user?.company_name || user?.full_name || "Pharma Distributor",
            email: user?.email || "distributor@pharmalink.com",
            contact: contactPhone || user?.phone || "+91 9988776655",
          },
          theme: {
            color: "#0b2341",
          },
          handler: async function (response: any) {
            setSubmitting(true);
            try {
              const placedOrder = await paymentsAPI.verifyAndPlaceOrder({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_data: orderPayload,
              });
              setConfirmedOrder(placedOrder);
              updatePoItems([]);
            } catch (err: any) {
              setErrorMessage(err.message || "Payment verification failed. Please contact distributor support.");
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setRazorpayLoading(false);
            },
          },
        };

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.open();
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to initiate Razorpay checkout.");
      } finally {
        setRazorpayLoading(false);
      }
      return;
    }

    // 2. B2B Credit Line / Wire / LC Flow
    setSubmitting(true);
    try {
      const placedOrder = await ordersAPI.create(orderPayload);
      setConfirmedOrder(placedOrder);
      updatePoItems([]);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit Purchase Order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center max-w-5xl mx-auto shadow-2xs">
        <div className="animate-spin w-8 h-8 border-4 border-[#0b2341] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading catalog formulations & distributor profile...</p>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs max-w-3xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-black text-[#0b2341]">
          B2B Bulk Purchase Order Creation Locked
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your account is currently under Drug License & GST verification by the Regulatory Admin. Purchase order placement and wholesale rates will be unlocked once approved.
        </p>
        <div className="pt-2">
          <Link
            href="/distributor/dashboard"
            className="inline-block bg-[#0b2341] hover:bg-[#12315a] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-xs"
          >
            Check KYC Verification Status &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            B2B Commercial Procurement Desk
          </span>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Create Bulk Purchase Order (PO)
          </h1>
          <p className="text-xs text-slate-500">
            Review your selected formulations, adjust bulk order quantities, and submit with live tax calculation and Razorpay / B2B Credit settlement.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/distributor/catalog"
            className="text-xs font-bold bg-[#0b2341] hover:bg-[#12315a] text-white px-4 py-2.5 rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <span>💊 Browse Catalog</span>
          </Link>
          <Link
            href="/distributor/orders"
            className="text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors flex items-center space-x-1 px-3 py-2 rounded-xl hover:bg-slate-50"
          >
            <span>&larr; PO History</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-2xl font-bold flex items-center justify-between shadow-2xs">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Confirmed Order State */}
      {confirmedOrder ? (
        <div className="bg-white border border-emerald-200 rounded-3xl p-8 shadow-sm space-y-6 text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full mx-auto flex items-center justify-center text-3xl font-black">
            ✓
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#0b2341]">
              Purchase Order Placed Successfully!
            </h2>
            <p className="text-xs text-slate-500">
              PO Code: <span className="font-mono font-bold text-[#0b2341]">{confirmedOrder.order_code}</span> | Payment: <span className="font-bold text-emerald-700">{confirmedOrder.payment_status}</span>
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 max-w-lg mx-auto text-left text-xs space-y-2 font-medium text-slate-700">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Entity:</span>
              <span className="font-bold text-[#0b2341]">{confirmedOrder.customer_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Total Formulations:</span>
              <span className="font-bold text-[#0b2341]">{confirmedOrder.items?.length || 1} Item(s)</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Payment Term:</span>
              <span className="font-bold text-[#0b2341]">{confirmedOrder.payment_method}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-black text-[#0b2341]">
              <span>Grand Total:</span>
              <span className="text-emerald-700">₹{confirmedOrder.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/distributor/orders"
              className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-xs transition-all"
            >
              View PO in Order History &rarr;
            </Link>
            <Link
              href="/distributor/catalog"
              onClick={() => {
                setConfirmedOrder(null);
                updatePoItems([]);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              + Create Another PO from Catalog
            </Link>
          </div>
        </div>
      ) : (
        /* Main Two-Column Layout: Left (Line Items Table, Shipping & Payment) + Right (Sticky Live Calculation Summary Sidebar) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Line Items Table, Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. PO Line Items Table */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-7 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#0b2341] tracking-tight">
                    1. PO Line Items ({poItems.length} Formulation{poItems.length === 1 ? "" : "s"})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Items selected from Wholesale Catalog. Edit order quantities below to unlock bulk MOQ pricing.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    href="/distributor/catalog"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all flex items-center space-x-1.5"
                  >
                    <span>+ Add More from Catalog</span>
                  </Link>
                  {poItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {poItems.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                  <span className="text-4xl block">📦</span>
                  <h4 className="text-sm font-bold text-slate-700">Your Purchase Order is empty</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Explore our wholesale catalog to choose formulations, inspect batch COAs, and add items to this PO.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/distributor/catalog"
                      className="inline-block bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-2xs"
                    >
                      Browse Wholesale Catalog &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50 whitespace-nowrap">
                        <th className="py-3 px-3">Formulation & SKU</th>
                        <th className="py-3 px-3">Rate / Unit</th>
                        <th className="py-3 px-3 text-center">Order Qty</th>
                        <th className="py-3 px-3 text-right">Line Total</th>
                        <th className="py-3 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {poItems.map((item) => {
                        const pricing = getItemPricing(item);
                        return (
                          <tr key={item.product.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-[#0b2341] block text-xs">{item.product.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-xs">{item.product.composition}</span>
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className="font-black text-blue-700 text-xs block">₹{pricing.unitPrice.toFixed(2)}</span>
                              {pricing.isBulk ? (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                  Bulk Tier (≥{pricing.moq})
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 block">
                                  Standard B2B
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap text-center">
                              <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.product.id, item.quantity - 10)}
                                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-black cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.product.id, Number(e.target.value))}
                                  className="w-16 text-center font-mono font-bold text-xs bg-white py-1 focus:outline-none border-x border-slate-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.product.id, item.quantity + 10)}
                                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-black cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono">
                              <span className="font-black text-slate-900 text-xs block">
                                ₹{pricing.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                              {pricing.savings > 0 && (
                                <span className="text-[9px] font-bold text-emerald-600">
                                  Save ₹{pricing.savings.toFixed(0)}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-2 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.product.id)}
                                className="text-slate-400 hover:text-rose-600 font-bold p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove line item"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 2. Payment Method Selection Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-[#0b2341] border-b border-slate-100 pb-2">
                2. Payment Method & Settlement Terms
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Razorpay Online Option */}
                <label
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === "razorpay"
                    ? "border-[#0b2341] bg-blue-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="mt-1 accent-[#0b2341]"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-[#0b2341]">⚡ Razorpay Online</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Instant</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        UPI (GPay/PhonePe), Credit/Debit Card, NetBanking, or Corporate Wallet.
                      </p>
                    </div>
                  </div>
                </label>

                {/* 30-Day B2B Credit Line Option */}
                <label
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === "30-Day B2B Credit Line"
                    ? "border-[#0b2341] bg-blue-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="30-Day B2B Credit Line"
                      checked={paymentMethod === "30-Day B2B Credit Line"}
                      onChange={() => setPaymentMethod("30-Day B2B Credit Line")}
                      className="mt-1 accent-[#0b2341]"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-[#0b2341]">📋 30-Day B2B Credit</span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Post-Paid</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Settled under approved credit limit. Invoice payable within 30 days.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Bank Wire Option */}
                <label
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === "Advance Bank Wire Transfer"
                    ? "border-[#0b2341] bg-blue-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Advance Bank Wire Transfer"
                      checked={paymentMethod === "Advance Bank Wire Transfer"}
                      onChange={() => setPaymentMethod("Advance Bank Wire Transfer")}
                      className="mt-1 accent-[#0b2341]"
                    />
                    <div>
                      <span className="font-extrabold text-[#0b2341]">🏛️ Bank Wire / NEFT</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Direct RTGS/NEFT to EVVAI Corporate Escrow Account.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Letter of Credit */}
                <label
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === "Irrevocable Bank Letter of Credit (LC)"
                    ? "border-[#0b2341] bg-blue-50/40 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Irrevocable Bank Letter of Credit (LC)"
                      checked={paymentMethod === "Irrevocable Bank Letter of Credit (LC)"}
                      onChange={() => setPaymentMethod("Irrevocable Bank Letter of Credit (LC)")}
                      className="mt-1 accent-[#0b2341]"
                    />
                    <div>
                      <span className="font-extrabold text-[#0b2341]">📜 Irrevocable Bank LC</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Institutional procurement via Scheduled Commercial Bank Letter of Credit.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* B2B Credit Line Dynamic Balance Inspection Box */}
              {paymentMethod === "30-Day B2B Credit Line" && (
                <div className={`p-4 rounded-2xl border transition-all space-y-3 ${isCreditExceeded
                  ? "bg-rose-50/90 border-rose-300 text-rose-950"
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-xs">
                      <span>💳 B2B Credit Line Breakdown</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${isCreditExceeded
                        ? "bg-rose-200 text-rose-900 border-rose-300"
                        : "bg-emerald-200 text-emerald-900 border-emerald-300"
                        }`}>
                        {isCreditExceeded ? "Limit Exceeded" : "Credit Available"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-600">
                      Allocated Limit: ₹{totalCreditLimit.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Current Available Credit</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        ₹{availableCreditLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">This PO Value (Deducted)</span>
                      <span className="text-sm font-black text-blue-700 font-mono">
                        - ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border shadow-2xs ${isCreditExceeded ? "bg-rose-100/80 border-rose-300" : "bg-white border-slate-200/80"
                      }`}>
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Balance After Order</span>
                      <span className={`text-sm font-black font-mono ${isCreditExceeded ? "text-rose-700" : "text-[#0b2341]"
                        }`}>
                        ₹{remainingCreditAfterOrder.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {isCreditExceeded && (
                    <div className="p-2.5 bg-rose-100/90 rounded-xl border border-rose-300 text-[11px] font-bold text-rose-900 flex items-center space-x-2">
                      <span>⚠️</span>
                      <span>
                        Order exceeds your available credit line by ₹{Math.abs(remainingCreditAfterOrder).toLocaleString('en-IN')}. Please choose <strong>Razorpay Online</strong> or <strong>Bank Wire Transfer</strong> to place this order.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Delivery & Destination Warehouse Details */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
              <h3 className="text-sm font-black text-[#0b2341] border-b border-slate-100 pb-2">
                3. Destination Warehouse & Logistics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Destination Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Warehouse / Depot Address"
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={deliveryPincode}
                    onChange={(e) => setDeliveryPincode(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN Number (Optional)</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="36AAAAA0000A1Z5"
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Special Dispatch Instructions / PO Remarks</label>
                  <textarea
                    rows={2}
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Temperature controlled cold-chain vehicle required / High priority emergency batch..."
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: STICKY DYNAMIC ORDER SUMMARY SIDEBAR */}
          <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-4">
            <div className="bg-[#0b2341] text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <h3 className="text-base font-black tracking-tight text-white flex items-center space-x-2">
                  <span>📊 Live PO Summary</span>
                </h3>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  {poItems.length} Item{poItems.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Dynamic Line-Items Mini Breakdown */}
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1 text-xs">
                {poItems.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-2 text-center">No formulations added yet.</p>
                ) : (
                  poItems.map((it) => {
                    const pricing = getItemPricing(it);
                    return (
                      <div key={it.product.id} className="flex justify-between items-center py-1.5 border-b border-slate-800/60 text-slate-300">
                        <div className="truncate pr-2">
                          <span className="font-bold text-white block truncate text-[11px]">{it.product.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {it.quantity} units × ₹{pricing.unitPrice.toFixed(2)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-white shrink-0">
                          ₹{pricing.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Live Aggregate Cost Calculation */}
              <div className="space-y-2.5 border-t border-slate-700/80 pt-4 text-xs font-medium">
                <div className="flex justify-between text-slate-300">
                  <span>Total Order Volume:</span>
                  <span className="font-mono font-bold text-white">{totalUnits.toLocaleString("en-IN")} Units</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Base Wholesale Subtotal:</span>
                  <span className="font-mono font-bold text-white">
                    ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-300 font-bold bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/50">
                    <span>Wholesale Bulk Tier Savings:</span>
                    <span className="font-mono">- ₹{totalSavings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300">
                  <span>Pharma GST (12% HSN 3004):</span>
                  <span className="font-mono font-bold text-white">
                    ₹{gstTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>B2B Logistics & Freight:</span>
                  <span className="font-bold text-emerald-400 uppercase text-[10px]">Complimentary</span>
                </div>

                {/* Grand Total Amount Highlight */}
                <div className="border-t border-slate-700 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black text-slate-200 block">Grand Total PO Value:</span>
                    <span className="text-[10px] text-slate-400">All Taxes & Levies Included</span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Submit / Pay Button */}
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={poItems.length === 0 || submitting || razorpayLoading || isCreditExceeded}
                className={`w-full py-4 rounded-2xl font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${isCreditExceeded
                  ? "bg-rose-500 text-white opacity-80 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 text-[#0b2341] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
              >
                {submitting || razorpayLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-[#0b2341] border-t-transparent rounded-full" />
                    <span>{razorpayLoading ? "Launching Razorpay..." : "Processing PO..."}</span>
                  </>
                ) : isCreditExceeded ? (
                  <span>⚠️ Credit Limit Exceeded — Switch to Online/Wire</span>
                ) : (
                  <span>
                    {paymentMethod === "razorpay"
                      ? `Pay ₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} with Razorpay &rarr;`
                      : `Submit PO (₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}) &rarr;`}
                  </span>
                )}
              </button>

              <div className="text-center">
                <span className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
                  <span>🔒 256-Bit SSL Encrypted Enterprise Checkout</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
