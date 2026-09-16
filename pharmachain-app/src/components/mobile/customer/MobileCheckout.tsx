"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addressesAPI,
  ordersAPI,
  paymentsAPI,
  AddressItem,
  OrderData,
  OrderCreatePayload,
  PaymentPublicConfig,
  loadRazorpayScript,
  getStoredUser,
  StoredUser,
} from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileOrderSuccess } from "./MobileOrderSuccess";

interface MobileCheckoutProps {
  onBackToCart: () => void;
}

export const MobileCheckout: React.FC<MobileCheckoutProps> = ({
  onBackToCart,
}) => {
  const router = useRouter();
  const { cartItems, cartCount, subtotal, gst, total, clearCart } = useCart();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [paymentConfig, setPaymentConfig] = useState<PaymentPublicConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<OrderData | null>(null);

  // Address Selector Bottom Sheet
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipient_name: "",
    phone: "",
    street_address: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    address_type: "HOME",
    is_default: true,
  });

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);

    const initCheckoutData = async () => {
      try {
        setLoading(true);
        const [addrList, payCfg] = await Promise.allSettled([
          addressesAPI.list(),
          paymentsAPI.getConfig(),
        ]);

        if (addrList.status === "fulfilled" && addrList.value?.length > 0) {
          setAddresses(addrList.value);
          const defaultAddr = addrList.value.find((a) => a.is_default) || addrList.value[0];
          setSelectedAddressId(defaultAddr.id);
        }

        if (payCfg.status === "fulfilled") {
          setPaymentConfig(payCfg.value);
        }
      } catch (err) {
        console.error("Failed to initialize checkout data:", err);
      } finally {
        setLoading(false);
      }
    };

    initCheckoutData();
  }, []);

  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;

  const handleCreateNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await addressesAPI.create({
        ...newAddress,
        recipient_name: newAddress.recipient_name || user?.full_name || "Valued Customer",
        phone: newAddress.phone || user?.phone || "+91 9988776655",
      });
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
      setShowAddressSheet(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save address");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setErrorMsg("Your cart is empty.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    const deliveryAddressStr = selectedAddress
      ? `${selectedAddress.street_address}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`
      : "Standard Clinical Delivery Address";

    const recipientName =
      selectedAddress?.recipient_name || user?.full_name || "Valued Customer";
    const recipientPhone =
      selectedAddress?.phone || user?.phone || "+91 9988776655";

    const orderPayload: OrderCreatePayload = {
      items: cartItems.map((it) => ({
        product_id: it.product.id,
        quantity: it.quantity,
      })),
      customer_name: recipientName,
      customer_phone: recipientPhone,
      delivery_address: selectedAddress?.street_address || deliveryAddressStr,
      delivery_city: selectedAddress?.city || "Hyderabad",
      delivery_state: selectedAddress?.state || "Telangana",
      delivery_pincode: selectedAddress?.pincode || "500033",
      payment_method: paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Razorpay Online (UPI/Card)",
    };

    try {
      if (paymentMethod === "cod") {
        // Direct Cash on Delivery Order Creation
        const created = await ordersAPI.create(orderPayload);
        clearCart();
        setConfirmedOrder(created);
      } else {
        // Razorpay Gateway Flow
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Razorpay SDK failed to load. Please check your network connection.");
        }

        const orderItemsPayload = cartItems.map((it) => ({
          product_id: it.product.id,
          quantity: it.quantity,
        }));

        const razorpayOrder = await paymentsAPI.createRazorpayOrder(orderItemsPayload, {
          customer_name: recipientName,
          customer_email: user?.email || "customer@example.com",
        });

        const options = {
          key: razorpayOrder.key_id || paymentConfig?.key_id || "rzp_test_placeholder",
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || "INR",
          name: "EVVAI Pharmaceuticals",
          description: "Therapeutic Medicines Order",
          image: "/images/evvai_icon.png",
          order_id: razorpayOrder.razorpay_order_id,
          handler: async (response: any) => {
            try {
              setSubmitting(true);
              const finalOrder = await paymentsAPI.verifyAndPlaceOrder({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_data: orderPayload,
              });

              clearCart();
              setConfirmedOrder(finalOrder);
            } catch (err: any) {
              setErrorMsg(err.message || "Payment verification failed. Please contact support.");
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: recipientName,
            email: user?.email || "customer@example.com",
            contact: recipientPhone,
          },
          theme: {
            color: "#A71380",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          setErrorMsg(`Payment failed: ${resp.error?.description || "Payment failed"}`);
          setSubmitting(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // If order was placed successfully, render Screen 8
  if (confirmedOrder) {
    return (
      <MobileOrderSuccess
        order={confirmedOrder}
        onContinueShopping={() => router.push("/products/")}
        onTrackOrder={(id) => router.push(`/customer/orders/?track=${id}`)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col select-none relative">
      {/* Top Header (Matching Image 2 Screen 2: Checkout with 3 dots menu) */}
      <MobileHeader
        title="Checkout"
        showBack={true}
        onBack={onBackToCart}
        rightAction={
          <button
            onClick={() => {}}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#0B2545] hover:text-[#A71380] active:scale-95 cursor-pointer"
            aria-label="More options"
          >
            <svg className="w-5 h-5 text-[#0B2545]" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.75" />
              <circle cx="12" cy="12" r="1.75" />
              <circle cx="12" cy="19" r="1.75" />
            </svg>
          </button>
        }
      />

      {/* Main Checkout Steps & Forms */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-28 px-4 py-3 space-y-4">
        {/* Step Indicator Bar (Matching Image 2 Screen 2: 1 Cart, 2 Address, 3 Payment) */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-around">
          {/* Step 1: Cart */}
          <div className="flex flex-col items-center space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#A71380] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
              1
            </span>
            <span className="text-[11px] font-bold text-[#A71380]">Cart</span>
          </div>

          <div className="w-12 h-0.5 bg-[#A71380]" />

          {/* Step 2: Address */}
          <div className="flex flex-col items-center space-y-1">
            <span className="w-6 h-6 rounded-full bg-[#A71380] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
              2
            </span>
            <span className="text-[11px] font-bold text-[#A71380]">Address</span>
          </div>

          <div className="w-12 h-0.5 bg-slate-200" />

          {/* Step 3: Payment */}
          <div className="flex flex-col items-center space-y-1">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Payment</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Deliver To Address Card (Matching Image 2 Screen 2) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#0B2545]">
              Deliver to
            </h3>
            <button
              onClick={() => setShowAddressSheet(true)}
              className="text-xs font-bold text-[#A71380] hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          {selectedAddress ? (
            <div className="flex items-start space-x-3 pt-0.5">
              {/* Blue Rounded Icon */}
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                🏠
              </div>

              <div className="space-y-0.5 text-xs">
                <div className="font-bold text-slate-900">
                  {selectedAddress.address_type || "Home"}
                </div>
                <div className="font-semibold text-slate-800">
                  {selectedAddress.recipient_name || user?.full_name || "Arun Bhairi"}
                </div>
                <div className="text-slate-600 leading-snug">
                  {selectedAddress.street_address || "Road No. 36, Jubilee Hills"}
                </div>
                <div className="text-slate-600">
                  {selectedAddress.city || "Hyderabad"}, {selectedAddress.state || "Telangana"} - {selectedAddress.pincode || "500033"}
                </div>
                <div className="text-slate-500 font-medium pt-0.5">
                  {selectedAddress.phone || user?.phone || "+91 9988776655"}
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-center py-2 space-y-2">
              <p className="text-xs text-slate-500">No delivery address selected</p>
              <button
                onClick={() => {
                  setShowAddressSheet(true);
                  setShowNewAddressForm(true);
                }}
                className="px-3 py-1.5 bg-[#0B2545] text-white rounded-lg text-xs font-bold"
              >
                + Add Delivery Address
              </button>
            </div>
          )}
        </div>

        {/* Order Items & Cost Summary (Matching Image 2 Screen 2) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-black text-[#0B2545]">
            <span className="uppercase tracking-wider">Order Items ({cartCount})</span>
            <span>₹{subtotal}</span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 pt-1">
            <div className="flex justify-between items-center">
              <span>Delivery Charge</span>
              <span className="font-bold text-emerald-600 uppercase text-[11px]">FREE</span>
            </div>
            <div className="flex justify-between items-center">
              <span>GST (18%)</span>
              <span className="font-bold text-slate-800">₹{gst}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-sm font-black text-[#0B2545]">
              Total Amount
            </span>
            <span className="text-base font-black text-[#0B2545]">
              ₹{total}
            </span>
          </div>
        </div>

        {/* Payment Method Selector (Screen 7 Reference) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
          <h4 className="text-xs font-black text-[#0B2545] uppercase tracking-wider">
            Payment Method
          </h4>

          <div className="space-y-2">
            {/* Cash on Delivery Option */}
            <label
              onClick={() => setPaymentMethod("cod")}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                paymentMethod === "cod"
                  ? "border-[#A71380] bg-[#F8EAF4]/50 shadow-2xs"
                  : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">💵</span>
                <div>
                  <div className="text-xs font-extrabold text-[#0B2545]">
                    Cash on Delivery (COD)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Pay securely at your doorstep upon verification
                  </div>
                </div>
              </div>
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                className="w-4 h-4 text-[#A71380] focus:ring-[#A71380]"
              />
            </label>

            {/* Razorpay Online Payment Option */}
            <label
              onClick={() => setPaymentMethod("razorpay")}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                paymentMethod === "razorpay"
                  ? "border-[#A71380] bg-[#F8EAF4]/50 shadow-2xs"
                  : "border-slate-200 bg-slate-50 hover:bg-white"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">💳</span>
                <div>
                  <div className="text-xs font-extrabold text-[#0B2545]">
                    Razorpay (UPI / Cards / NetBanking)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Instant automated dispatch confirmation
                  </div>
                </div>
              </div>
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                className="w-4 h-4 text-[#A71380] focus:ring-[#A71380]"
              />
            </label>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar (Screen 7: Place Order ->) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_20px_rgba(11,37,69,0.08)] pb-[env(safe-area-inset-bottom,12px)]">
        <div className="max-w-lg mx-auto flex items-center justify-between space-x-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Amount
            </span>
            <span className="text-base font-black text-[#0B2545]">
              ₹{total}
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={submitting || cartItems.length === 0}
            className="flex-1 h-12 bg-gradient-to-r from-[#A71380] to-[#800E62] hover:from-[#8e0f6c] hover:to-[#6b0b52] text-white font-extrabold text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Processing Order...</span>
              </span>
            ) : (
              <>
                <span>Place Order</span>
                <span className="text-sm">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Address Selection & Creation Bottom Sheet */}
      {showAddressSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => {
              setShowAddressSheet(false);
              setShowNewAddressForm(false);
            }}
          />
          <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto pb-[env(safe-area-inset-bottom,20px)]">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

            {!showNewAddressForm ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#0B2545]">
                    Select Delivery Address
                  </h3>
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-xs font-bold text-[#A71380]"
                  >
                    + Add New
                  </button>
                </div>

                <div className="space-y-2.5">
                  {addresses.map((addr) => {
                    const isSelected = addr.id === selectedAddressId;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setShowAddressSheet(false);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#A71380] bg-[#F8EAF4]/50 shadow-xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {addr.recipient_name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {addr.address_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">
                          {addr.street_address}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">
                          Phone: {addr.phone}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Inline Address Form */
              <form onSubmit={handleCreateNewAddress} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#0B2545]">
                    Add New Address
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(false)}
                    className="text-xs font-bold text-slate-400"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Recipient / Pharmacy Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.recipient_name}
                    onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                    placeholder="Arun Bhairi"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="+91 9988776655"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Pincode
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      placeholder="500033"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Street Address / Landmark
                  </label>
                  <input
                    type="text"
                    required
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                    placeholder="Road No. 36, Jubilee Hills"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Hyderabad"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="Telangana"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-[#A71380] text-white font-extrabold text-xs rounded-xl shadow-xs mt-2"
                >
                  Save & Use Address
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
