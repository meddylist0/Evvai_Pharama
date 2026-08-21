"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ordersAPI,
  paymentsAPI,
  loadRazorpayScript,
  getStoredUser,
  StoredUser,
  ProductItem,
  OrderData,
} from "@/lib/api";

export default function CustomerCheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [cartItems, setCartItems] = useState<{ product: ProductItem; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [shippingForm, setShippingForm] = useState({
    full_name: "",
    phone: "+91 9988776655",
    gstin: "",
    delivery_address: "Road No. 36, Jubilee Hills",
    delivery_city: "Hyderabad",
    delivery_state: "Telangana",
    delivery_pincode: "500033",
  });

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setShippingForm((prev) => ({
        ...prev,
        full_name: stored.full_name || "Valued Customer",
        phone: stored.phone || "+91 9988776655",
      }));
    }

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("pharmalink_cart");
        if (saved) setCartItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const updateCartState = (items: { product: ProductItem; quantity: number }[]) => {
    setCartItems(items);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_cart", JSON.stringify(items));
      window.dispatchEvent(new Event("storage"));
    }
  };

  const handleQtyChange = (productId: number, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as { product: ProductItem; quantity: number }[];
    updateCartState(updated);
  };

  const handleRemove = (productId: number) => {
    const updated = cartItems.filter((it) => it.product.id !== productId);
    updateCartState(updated);
  };

  const handleClear = () => {
    updateCartState([]);
  };

  // Calculations
  const cartSubtotal = cartItems.reduce((acc, it) => {
    const price = it.product.customer_price || it.product.display_price || it.product.mrp;
    return acc + Number(price) * it.quantity;
  }, 0);
  const cartTax = Math.round(cartSubtotal * 0.12 * 100) / 100;
  const shippingFee = cartSubtotal > 1000 || cartSubtotal === 0 ? 0 : 50;
  const grandTotal = Math.round((cartSubtotal + cartTax + shippingFee) * 100) / 100;
  const totalItemsCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // COD Order
  const processCodOrder = async () => {
    setOrderSubmitting(true);
    try {
      const payload = {
        items: cartItems.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
        })),
        customer_name: shippingForm.full_name || user?.full_name || "Valued Customer",
        customer_phone: shippingForm.phone || user?.phone || "+91 9988776655",
        gstin: shippingForm.gstin || undefined,
        delivery_address: shippingForm.delivery_address,
        delivery_city: shippingForm.delivery_city,
        delivery_state: shippingForm.delivery_state,
        delivery_pincode: shippingForm.delivery_pincode,
        payment_method: "Cash on Delivery (COD)",
      };

      const placed = await ordersAPI.create(payload);
      setConfirmedOrder(placed);
      updateCartState([]);
      setStatusMsg({
        type: "success",
        text: `✓ Cash on Delivery Order #${placed.order_code} placed successfully!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to place order.",
      });
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Razorpay Payment
  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setStatusMsg({ type: "error", text: "Your cart is empty!" });
      return;
    }

    if (paymentMethod === "cod") {
      await processCodOrder();
      return;
    }

    setRazorpayLoading(true);
    setStatusMsg(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) throw new Error("Could not load Razorpay SDK.");

      const orderItemsPayload = cartItems.map(item => ({ product_id: item.product.id, quantity: item.quantity }));
      const rzpOrder = await paymentsAPI.createRazorpayOrder(orderItemsPayload, {
        customer_name: shippingForm.full_name || user?.full_name || "Valued Customer",
        customer_email: user?.email || "customer@pharmalink.com",
      });

      const options = {
        key: rzpOrder.key_id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        name: "EVVAI PharmaLink Enterprise",
        description: `Pharmaceutical Order (${totalItemsCount} items)`,
        order_id: rzpOrder.razorpay_order_id,
        prefill: {
          name: shippingForm.full_name || user?.full_name || "Valued Customer",
          email: user?.email || "customer@pharmalink.com",
          contact: shippingForm.phone || user?.phone || "+91 9988776655",
        },
        theme: { color: "#0b2341" },
        handler: async function (response: any) {
          setOrderSubmitting(true);
          try {
            const payload = {
              items: cartItems.map((it) => ({
                product_id: it.product.id,
                quantity: it.quantity,
              })),
              customer_name: shippingForm.full_name || user?.full_name || "Valued Customer",
              customer_phone: shippingForm.phone || user?.phone || "+91 9988776655",
              gstin: shippingForm.gstin || undefined,
              delivery_address: shippingForm.delivery_address,
              delivery_city: shippingForm.delivery_city,
              delivery_state: shippingForm.delivery_state,
              delivery_pincode: shippingForm.delivery_pincode,
              payment_method: "Razorpay Online (UPI/Card)",
            };

            const paid = await paymentsAPI.verifyAndPlaceOrder({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              order_data: payload,
            });

            setConfirmedOrder(paid);
            updateCartState([]);
            setStatusMsg({
              type: "success",
              text: `✓ Payment Verified & Order #${paid.order_code} confirmed!`,
            });
          } catch (err: any) {
            setStatusMsg({
              type: "error",
              text: err.message || "Payment verification failed.",
            });
          } finally {
            setOrderSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setRazorpayLoading(false),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        setStatusMsg({
          type: "error",
          text: `Payment failed: ${resp.error?.description || "Cancelled"}`,
        });
        setRazorpayLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Razorpay initialization error.",
      });
    } finally {
      setRazorpayLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
              Direct WHO-GMP Fulfillment
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● Secure Razorpay Gateway
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Shopping Cart & Secure Checkout
          </h1>
          <p className="text-xs text-slate-500">
            Review your order items, enter delivery destination, and pay securely via UPI, Cards or Cash on Delivery.
          </p>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer self-start md:self-auto"
          >
            Clear Cart
          </button>
        )}
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

      {/* Confirmed Order Banner */}
      {confirmedOrder && (
        <div className="bg-emerald-50 border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-base">
                  ✓
                </span>
                <h3 className="text-xl font-black text-emerald-950">Payment & Order Confirmed!</h3>
              </div>
              <p className="text-xs text-emerald-800 pl-10">
                Your order has been verified and sent for WHO-GMP batch packing and dispatch.
              </p>
            </div>
            <button onClick={() => setConfirmedOrder(null)} className="text-emerald-700 hover:text-emerald-950 text-xs font-bold">
              ✕ Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/80 p-4 rounded-2xl border border-emerald-200 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Tracking ID</span>
              <span className="font-bold text-blue-700 text-sm">{confirmedOrder.order_code}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Invoice Reference</span>
              <span className="font-bold text-slate-800 text-sm">{confirmedOrder.invoice_number || "INV-EVV-2026"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid Total</span>
              <span className="font-bold text-emerald-700 text-sm">
                ₹{Number(confirmedOrder.total_amount).toFixed(2)} ({confirmedOrder.payment_method})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/customer/orders"
              className="bg-[#0b2341] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:bg-[#12315a]"
            >
              Track in My Orders &rarr;
            </Link>
            <Link
              href="/customer/catalog"
              className="bg-white text-emerald-900 border border-emerald-300 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {cartItems.length === 0 && !confirmedOrder ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-4">
          <div className="text-4xl">🛒</div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Your Cart is Currently Empty</h3>
            <p className="text-xs text-slate-400">
              Browse our catalog of WHO-GMP certified formulations to add items to your cart.
            </p>
          </div>
          <Link
            href="/customer/catalog"
            className="inline-block bg-[#0b2341] text-white px-6 py-2.5 rounded-2xl text-xs font-bold hover:bg-[#12315a] transition-all"
          >
            Browse Formulation Catalog &rarr;
          </Link>
        </div>
      ) : cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Cart Items & Shipping Destination */}
          <div className="lg:col-span-7 space-y-6">
            {/* Cart Items */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                1. Selected Formulations ({totalItemsCount} items)
              </h3>

              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => {
                  const unitPrice = item.product.customer_price || item.product.display_price || item.product.mrp;
                  const lineTotal = Number(unitPrice) * item.quantity;

                  return (
                    <div key={item.product.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {item.product.category_name || "Pharma"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.product.sku}</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0b2341] truncate">{item.product.name}</h4>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          ₹{Number(unitPrice).toFixed(2)} per unit
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                          <button
                            onClick={() => handleQtyChange(item.product.id, -1)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-mono font-bold text-xs text-[#0b2341]">{item.quantity}</span>
                          <button
                            onClick={() => handleQtyChange(item.product.id, 1)}
                            className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 font-black text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="font-mono font-black text-sm text-[#0b2341] block">₹{lineTotal.toFixed(2)}</span>
                          <button
                            onClick={() => handleRemove(item.product.id)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 text-xs">
              <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                2. Shipping Destination & Consignee Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer / Consignee Name *</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.full_name}
                    onChange={(e) => setShippingForm({ ...shippingForm, full_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={shippingForm.delivery_address}
                  onChange={(e) => setShippingForm({ ...shippingForm, delivery_address: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.delivery_city}
                    onChange={(e) => setShippingForm({ ...shippingForm, delivery_city: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.delivery_state}
                    onChange={(e) => setShippingForm({ ...shippingForm, delivery_state: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={shippingForm.delivery_pincode}
                    onChange={(e) => setShippingForm({ ...shippingForm, delivery_pincode: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Selection & Price Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
              <h3 className="font-bold text-sm text-[#0b2341] uppercase tracking-wider">
                3. Payment Method & Billing
              </h3>

              {/* Payment Methods */}
              <div className="space-y-3">
                <div
                  onClick={() => setPaymentMethod("razorpay")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === "razorpay" ? "border-blue-600 bg-blue-50/50 shadow-xs" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-[#0b2341]">Razorpay Gateway</span>
                      <span className="bg-blue-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Instant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">UPI (GPay, PhonePe, Paytm, QR), Cards & NetBanking</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "razorpay" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                    }`}
                  >
                    {paymentMethod === "razorpay" && <span className="text-white text-[10px]">✓</span>}
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    paymentMethod === "cod" ? "border-emerald-600 bg-emerald-50/50 shadow-xs" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-black text-sm text-[#0b2341]">Cash on Delivery (COD)</span>
                    <p className="text-[11px] text-slate-500">Pay cash upon batch delivery at your address</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "cod" ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                    }`}
                  >
                    {paymentMethod === "cod" && <span className="text-white text-[10px]">✓</span>}
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal ({totalItemsCount} items):</span>
                  <span className="font-bold text-slate-800">₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pharma GST (12%):</span>
                  <span className="font-bold text-slate-800">₹{cartTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery & Handling:</span>
                  <span className="font-bold text-slate-800">
                    {shippingFee === 0 ? <span className="text-emerald-600">FREE</span> : `₹${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base text-[#0b2341]">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleInitiatePayment}
                disabled={orderSubmitting || razorpayLoading || cartItems.length === 0}
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {orderSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Placing Order...</span>
                  </div>
                ) : razorpayLoading ? (
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading Razorpay...</span>
                  </div>
                ) : paymentMethod === "razorpay" ? (
                  <span>Proceed to Pay ₹{grandTotal.toFixed(2)} via Razorpay &rarr;</span>
                ) : (
                  <span>Confirm Cash on Delivery Order (₹{grandTotal.toFixed(2)}) &rarr;</span>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400">
                🔒 256-bit SSL Encrypted • WHO-GMP Certified Dispatch
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
