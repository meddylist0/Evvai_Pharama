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
import {
  parsePackagingConfig,
  calculateStockBreakdown,
  formatCartons,
} from "@/lib/packagingUtils";

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
              } catch (e) { }
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
  const totalCreditLimit = Number(profileData?.distributor_profile?.credit_limit ?? 0);
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
      <div className="bg-white border border-slate-200/90 rounded-[6px] p-12 text-center max-w-5xl mx-auto shadow-2xs">
        <div className="animate-spin w-8 h-8 border-4 border-[#0b2341] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-500">Loading catalog formulations & distributor profile...</p>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-[6px] p-8 shadow-2xs max-w-3xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-[5px] mx-auto flex items-center justify-center text-2xl">
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
            className="inline-block bg-[#0b2341] hover:bg-[#12315a] text-white font-bold text-xs px-6 py-3 rounded-[5px] transition-all shadow-xs"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <div>
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            Distributor Purchase Order
          </span>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Create Purchase Order (PO)
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/distributor/catalog"
            className="text-xs font-bold bg-[#A71380] hover:bg-[#880f68] text-white px-4 py-2.5 rounded-[5px] transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <span>+ Add Products</span>
          </Link>
          <Link
            href="/distributor/orders"
            className="text-xs font-bold text-slate-600 hover:text-[#A71380] transition-colors flex items-center space-x-1 px-3 py-2 rounded-[5px] hover:bg-slate-50"
          >
            <span>&larr; View Orders</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-4 rounded-[5px] font-bold flex items-center justify-between shadow-2xs">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Confirmed Order State */}
      {confirmedOrder ? (
        <div className="bg-white border border-emerald-200 rounded-[6px] p-8 shadow-sm space-y-6 text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full mx-auto flex items-center justify-center text-3xl font-black">
            ✓
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#0b2341]">
              Purchase Order Placed Successfully!
            </h2>
            <p className="text-xs text-slate-500">
              Order Code: <span className="font-mono font-bold text-[#0b2341]">{confirmedOrder.order_code}</span> | Payment: <span className="font-bold text-emerald-700">{confirmedOrder.payment_status}</span>
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/90 rounded-[5px] p-5 max-w-lg mx-auto text-left text-xs space-y-2 font-medium text-slate-700">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Distributor / Company:</span>
              <span className="font-bold text-[#0b2341]">{confirmedOrder.customer_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Total Items:</span>
              <span className="font-bold text-[#0b2341]">{confirmedOrder.items?.length || 1} Item(s)</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Payment Method:</span>
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
              className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-[5px] font-bold text-xs shadow-xs transition-all"
            >
              View Order History &rarr;
            </Link>
            <Link
              href="/distributor/catalog"
              onClick={() => {
                setConfirmedOrder(null);
                updatePoItems([]);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-[5px] font-bold text-xs transition-all cursor-pointer"
            >
              + Create Another Order
            </Link>
          </div>
        </div>
      ) : (
        /* Main Two-Column Layout: Left (Line Items Table, Shipping & Payment) + Right (Sticky Live Calculation Summary Sidebar) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Line Items Table, Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. PO Line Items Table */}
            <div className="bg-white border border-slate-200/90 rounded-[6px] p-6 md:p-7 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#0b2341] tracking-tight">
                    1. Selected Products ({poItems.length} Item{poItems.length === 1 ? "" : "s"})
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  <Link
                    href="/distributor/catalog"
                    className="bg-[#A71380] hover:bg-[#880f68] text-white text-xs font-bold px-3.5 py-1.5 rounded-[5px] transition-all flex items-center space-x-1.5 shadow-2xs"
                  >
                    <span>+ Add Products</span>
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
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[5px] space-y-3">
                  <span className="text-4xl block">📦</span>
                  <h4 className="text-sm font-bold text-slate-700">Your order list is empty</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Browse our product catalog to select medicines and add them to this order.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/distributor/catalog"
                      className="inline-block bg-[#A71380] hover:bg-[#880f68] text-white text-xs font-extrabold px-5 py-2.5 rounded-[5px] transition-all shadow-2xs"
                    >
                      Browse Products Catalog &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-[6px]">
                  <table className="w-full text-left text-xs min-w-[620px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50">
                        <th className="py-3 px-3.5 w-[38%]">Product / Medicine</th>
                        <th className="py-3 px-3 w-[18%]">Unit Price</th>
                        <th className="py-3 px-3 w-[24%] text-center">Quantity</th>
                        <th className="py-3 px-3 w-[14%] text-right">Total</th>
                        <th className="py-3 px-2 w-[6%] text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {poItems.map((item) => {
                        const pricing = getItemPricing(item);
                        const pkg = parsePackagingConfig(item.product.pack_size || item.product.packSize);
                        const tabsPerPack = pkg.stripsPerPack * pkg.tabletsPerStrip;
                        const totalTabs = item.quantity * tabsPerPack;
                        const cartons = (item.quantity / pkg.packsPerCarton).toFixed(1);

                        return (
                          <tr key={item.product.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3.5">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-[5px] bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs mt-0.5">
                                  {item.product.image ? (
                                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="text-lg">💊</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-[#0b2341] block text-xs truncate">{item.product.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono block">{item.product.sku}</span>
                                  <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">{item.product.composition}</span>
                                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[9px] font-mono">
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                      📦 1 Pk = {tabsPerPack} Tabs ({pkg.stripsPerPack} Str)
                                    </span>
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                      🚚 1 Ctn = {pkg.packsPerCarton} Pks
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap align-top">
                              <span className="font-black text-[#A71380] text-xs block">₹{pricing.unitPrice.toFixed(2)}</span>
                              <span className="text-[9px] text-slate-400 block">per Pack</span>
                              {pricing.isBulk ? (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                                  Bulk Price (≥{pricing.moq})
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 block">
                                  Standard Rate
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-center align-top">
                              <div className="inline-flex items-center border border-slate-200 rounded-[5px] overflow-hidden bg-slate-50 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.product.id, item.quantity - 10)}
                                  className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-black cursor-pointer text-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.product.id, Number(e.target.value))}
                                  className="w-14 text-center font-mono font-bold text-xs bg-white py-1 focus:outline-none border-x border-slate-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.product.id, item.quantity + 10)}
                                  className="px-2 py-1 text-slate-600 hover:bg-slate-200 font-black cursor-pointer text-xs"
                                >
                                  +
                                </button>
                              </div>
                              <div className="mt-1 text-[9px] font-mono text-slate-500 font-medium leading-tight">
                                <span className="font-semibold text-slate-700">{item.quantity} Packs</span>
                                <span className="text-slate-400 mx-1">≈</span>
                                <span className="text-blue-700 font-bold">{cartons} Cartons</span>
                                <span className="block text-[8.5px] text-emerald-700 font-semibold mt-0.5">
                                  ({totalTabs.toLocaleString('en-IN')} Tabs)
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono align-top">
                              <span className="font-black text-slate-900 text-xs block">
                                ₹{pricing.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                              {pricing.savings > 0 && (
                                <span className="text-[9px] font-bold text-emerald-600 block mt-0.5">
                                  Save ₹{pricing.savings.toFixed(0)}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-2 text-center whitespace-nowrap align-top">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.product.id)}
                                className="text-slate-400 hover:text-rose-600 font-bold p-1.5 rounded-[4px] hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove item"
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
            <div className="bg-white border border-slate-200/90 rounded-[6px] p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-black text-[#0b2341] border-b border-slate-100 pb-2">
                2. Select Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Razorpay Online Option */}
                <label
                  className={`border-2 rounded-[5px] p-4 cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === "razorpay"
                    ? "border-[#0b2341] bg-[#F8EAF4]/40 shadow-xs"
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
                        <span className="font-extrabold text-[#0b2341]">⚡ Online Payment (Razorpay)</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Instant</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pay instantly via UPI (GPay/PhonePe), Debit/Credit Card, NetBanking.
                      </p>
                    </div>
                  </div>
                </label>

                {/* 30-Day B2B Credit Line Option */}
                <label
                  className={`border-2 rounded-[5px] p-4 cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === "30-Day B2B Credit Line"
                    ? "border-[#0b2341] bg-[#F8EAF4]/40 shadow-xs"
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
                        <span className="font-extrabold text-[#0b2341]">📋 30-Day Credit</span>
                        <span className="bg-[#F8EAF4] text-[#A71380] text-[10px] font-bold px-1.5 py-0.5 rounded">Post-Paid</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Order on approved credit limit. Pay invoice within 30 days.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Bank Wire Option */}
                <label
                  className={`border-2 rounded-[5px] p-4 cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === "Advance Bank Wire Transfer"
                    ? "border-[#0b2341] bg-[#F8EAF4]/40 shadow-xs"
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
                      <span className="font-extrabold text-[#0b2341]">🏛️ Direct Bank Transfer</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Direct RTGS / NEFT / IMPS to company bank account.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Letter of Credit */}
                <label
                  className={`border-2 rounded-[5px] p-4 cursor-pointer transition-all flex flex-col justify-between ${paymentMethod === "Irrevocable Bank Letter of Credit (LC)"
                    ? "border-[#0b2341] bg-[#F8EAF4]/40 shadow-xs"
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
                      <span className="font-extrabold text-[#0b2341]">📜 Bank Letter of Credit (LC)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Commercial bank letter of credit for large orders.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* B2B Credit Line Dynamic Balance Inspection Box */}
              {paymentMethod === "30-Day B2B Credit Line" && (
                <div className={`p-4 rounded-[5px] border transition-all space-y-3 ${isCreditExceeded
                  ? "bg-rose-50/90 border-rose-300 text-rose-950"
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-black text-xs">
                      <span>💳 Credit Line Balance</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${isCreditExceeded
                        ? "bg-rose-200 text-rose-900 border-rose-300"
                        : "bg-emerald-200 text-emerald-900 border-emerald-300"
                        }`}>
                        {isCreditExceeded ? "Limit Exceeded" : "Credit Available"}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-600">
                      Total Credit Limit: ₹{totalCreditLimit.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-white rounded-[5px] border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Available Credit</span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        ₹{availableCreditLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="p-2.5 bg-white rounded-[5px] border border-slate-200/80 shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Order Value</span>
                      <span className="text-sm font-black text-[#A71380] font-mono">
                        - ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-[5px] border shadow-2xs ${isCreditExceeded ? "bg-rose-100/80 border-rose-300" : "bg-white border-slate-200/80"
                      }`}>
                      <span className="text-[10px] font-bold text-slate-500 block uppercase">Balance After Order</span>
                      <span className={`text-sm font-black font-mono ${isCreditExceeded ? "text-rose-700" : "text-[#0b2341]"
                        }`}>
                        ₹{remainingCreditAfterOrder.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {isCreditExceeded && (
                    <div className="p-2.5 bg-rose-100/90 rounded-[5px] border border-rose-300 text-[11px] font-bold text-rose-900 flex items-center space-x-2">
                      <span>⚠️</span>
                      <span>
                        Order amount exceeds your available credit by ₹{Math.abs(remainingCreditAfterOrder).toLocaleString('en-IN')}. Please choose <strong>Online Payment</strong> or <strong>Direct Bank Transfer</strong>.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Delivery & Destination Warehouse Details */}
            <div className="bg-white border border-slate-200/90 rounded-[6px] p-6 shadow-2xs space-y-4 text-xs">
              <h3 className="text-sm font-black text-[#0b2341] border-b border-slate-100 pb-2">
                3. Delivery & Shipping Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Shop / Warehouse Address"
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={deliveryPincode}
                    onChange={(e) => setDeliveryPincode(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="36AAAAA0000A1Z5"
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-mono font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Order Notes / Instructions (Optional)</label>
                  <textarea
                    rows={2}
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    placeholder="e.g. Urgent delivery / Cold-chain handling required..."
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: STICKY DYNAMIC ORDER SUMMARY SIDEBAR */}
          <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-4">
            <div className="bg-[#0b2341] text-white rounded-[6px] p-6 shadow-xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                <h3 className="text-base font-black tracking-tight text-white flex items-center space-x-2">
                  <span>📊 Order Summary</span>
                </h3>
                <span className="bg-[#A71380]/40 text-pink-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#A71380]/60">
                  {poItems.length} Item{poItems.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Dynamic Line-Items Mini Breakdown */}
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1 text-xs">
                {poItems.length === 0 ? (
                  <p className="text-slate-400 text-xs italic py-2 text-center">No products added yet.</p>
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
                  <span>Total Quantity:</span>
                  <span className="font-mono font-bold text-white">{totalUnits.toLocaleString("en-IN")} Packs</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-white">
                    ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-300 font-bold bg-emerald-950/40 p-2 rounded-[5px] border border-emerald-800/50">
                    <span>Wholesale Savings:</span>
                    <span className="font-mono">- ₹{totalSavings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300">
                  <span>GST (12%):</span>
                  <span className="font-mono font-bold text-white">
                    ₹{gstTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Delivery Charges:</span>
                  <span className="font-bold text-emerald-400 uppercase text-[10px]">Free</span>
                </div>

                {/* Grand Total Amount Highlight */}
                <div className="border-t border-slate-700 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-black text-slate-200 block">Total Amount:</span>
                    <span className="text-[10px] text-slate-400">All Taxes Included</span>
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
                className={`w-full py-4 rounded-[5px] font-black text-xs shadow-lg transition-all flex items-center justify-center space-x-2 ${isCreditExceeded
                  ? "bg-rose-500 text-white opacity-80 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-400 text-[#0b2341] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
              >
                {submitting || razorpayLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-[#0b2341] border-t-transparent rounded-full" />
                    <span>{razorpayLoading ? "Opening Payment..." : "Submitting Order..."}</span>
                  </>
                ) : isCreditExceeded ? (
                  <span>⚠️ Credit Limit Exceeded — Switch to Online/Bank</span>
                ) : (
                  <span>
                    {paymentMethod === "razorpay"
                      ? `Pay ₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} Online &rarr;`
                      : `Place Order (₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}) &rarr;`}
                  </span>
                )}
              </button>

              <div className="text-center">
                <span className="text-[10px] text-slate-400 flex items-center justify-center space-x-1">
                  <span>🔒 100% Safe & Secure Checkout</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
