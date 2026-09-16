"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  getStoredUser,
  StoredUser,
  authAPI,
  setStoredUser,
  productsAPI,
  ordersAPI,
  ProductItem,
  OrderData,
  OrderCreatePayload,
  creditAPI,
  paymentsAPI,
  PaymentPublicConfig,
} from "@/lib/api";
import { parsePackagingConfig, formatDerivedUnits, getDerivedUnitLabel, getProductImageUrl, getCategoryFallbackImage } from "@/lib/packagingUtils";
import { getOrderStatusDisplay } from "@/lib/pricingUtils";

export interface RetailerPortalProps {
  onAddToCart?: (productName: string) => void;
}

interface CartItem {
  product: ProductItem;
  quantity: number;
}

export const RetailerPortal: React.FC<RetailerPortalProps> = ({ onAddToCart }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "razorpay" | "upi" | "bank" | "pod">("credit");
  const [paymentConfig, setPaymentConfig] = useState<PaymentPublicConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showAddressEdit, setShowAddressEdit] = useState(false);

  // Delivery / Shop Address State (auto-populated from profile & system settings)
  const [deliveryShopName, setDeliveryShopName] = useState("Srikanth MedPlus Pharmacy");
  const [deliveryPhone, setDeliveryPhone] = useState("+91 9876501234");
  const [deliveryAddress, setDeliveryAddress] = useState("Shop #4, Main Road, KPHB Colony");
  const [deliveryCity, setDeliveryCity] = useState("Hyderabad");
  const [deliveryState, setDeliveryState] = useState("Telangana");
  const [deliveryPincode, setDeliveryPincode] = useState("500072");

  const [creditData, setCreditData] = useState<{
    credit_limit: number;
    outstanding_amount: number;
    available_credit: number;
    credit_terms_days: number;
    kyc_status: string;
    unpaid_orders_count: number;
  } | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchProfileAndData = async () => {
    try {
      setLoading(true);
      const stored = getStoredUser();
      setUser(stored);

      const [me, prods, myOrders, credit, payCfg] = await Promise.all([
        authAPI.getMe().catch(() => null),
        productsAPI.list().catch(() => []),
        ordersAPI.getMyOrders().catch(() => []),
        creditAPI.getMyCreditStatus().catch(() => null),
        paymentsAPI.getConfig().catch(() => null),
      ]);

      if (payCfg) {
        setPaymentConfig(payCfg);
      }

      if (credit) {
        setCreditData(credit);
      }

      if (me) {
        setProfileData(me);
        const rp = me.retailer_profile;
        if (rp) {
          setDeliveryShopName(rp.shop_name || me.full_name || "Pharmacy Shop");
          setDeliveryAddress(rp.shop_address || "Registered Pharmacy Shop Address");
          setDeliveryCity(rp.city || "Hyderabad");
          setDeliveryState(rp.state || "Telangana");
          setDeliveryPincode(rp.pincode || "500072");
          setDeliveryPhone(me.phone || "+91 9876501234");
        } else if (stored) {
          setDeliveryShopName(stored.shop_name || stored.full_name || "Pharmacy Shop");
          setDeliveryPhone(stored.phone || "+91 9876501234");
        }

        const updated: StoredUser = {
          ...stored!,
          full_name: me.full_name,
          email: me.email,
          role: me.role,
          user_id: me.id,
          kyc_status: me.retailer_profile?.kyc_status || credit?.kyc_status || stored?.kyc_status || "PENDING",
          shop_name: me.retailer_profile?.shop_name || stored?.shop_name,
        };
        setStoredUser(updated);
        setUser(updated);
      }

      if (prods) setProducts(prods);
      if (myOrders) setOrders(myOrders);

      // Load local cart
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("pharmalink_retailer_cart");
        if (raw) {
          try {
            setCart(JSON.parse(raw));
          } catch (e) { }
        }
      }
    } catch (err) {
      console.warn("Error fetching retailer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_retailer_cart", JSON.stringify(newCart));
      window.dispatchEvent(new Event("pharmalink_user_updated"));
    }
  };

  const handleUpdateQuantity = (product: ProductItem, delta: number) => {
    const existingIdx = cart.findIndex((i) => i.product.id === product.id);
    let updated = [...cart];

    if (existingIdx >= 0) {
      const nextQty = updated[existingIdx].quantity + delta;
      if (nextQty <= 0) {
        updated.splice(existingIdx, 1);
        showToast(`Removed ${product.name} from cart`);
      } else {
        updated[existingIdx].quantity = nextQty;
        showToast(`Updated ${product.name} (${nextQty} Packs)`);
      }
    } else if (delta > 0) {
      updated.push({ product, quantity: delta });
      showToast(`Added ${delta} Pack of ${product.name} to Shop Order!`);
    }

    saveCart(updated);
    if (onAddToCart && delta > 0) onAddToCart(product.name);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category_name || "General"))).filter(Boolean)];

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      (p.name || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q) ||
      (p.composition || "").toLowerCase().includes(q);
    const matchCategory = selectedCategory === "all" || p.category_name === selectedCategory;
    return matchQuery && matchCategory;
  });

  const cartPacksCount = cart.reduce((s, i) => s + i.quantity, 0);

  const cartSubtotal = cart.reduce((sum, item) => {
    const price =
      item.product.display_price ||
      item.product.distributor_price ||
      item.product.customer_price ||
      item.product.mrp ||
      0;
    return sum + price * item.quantity;
  }, 0);

  const cartEstimatedGst = cartSubtotal * 0.12;
  const cartTotalWithGst = cartSubtotal + cartEstimatedGst;

  // Potential retail profit calculation
  const cartMrpValue = cart.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);
  const cartRetailProfit = Math.max(0, cartMrpValue - cartSubtotal);

  const activeRetailOrders = orders.filter((o) => {
    const st = (o.order_status || o.orderStatus || "").toUpperCase();
    return st !== "CANCELLED" && st !== "RETURNED";
  });
  const totalSpent = activeRetailOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Handle placing the order & payment
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setIsSubmitting(true);
      const currentUser = getStoredUser();

      const payload: OrderCreatePayload = {
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        customer_name: deliveryShopName || profileData?.retailer_profile?.shop_name || currentUser?.shop_name || currentUser?.full_name || "Pharmacy Shop",
        customer_phone: deliveryPhone || currentUser?.phone || "+91 9876543210",
        delivery_address: deliveryAddress || profileData?.retailer_profile?.shop_address || currentUser?.shop_address || "Registered Pharmacy Shop Address",
        delivery_city: deliveryCity || profileData?.retailer_profile?.city || currentUser?.city || "Hyderabad",
        delivery_state: deliveryState || profileData?.retailer_profile?.state || currentUser?.state || "Telangana",
        delivery_pincode: deliveryPincode || profileData?.retailer_profile?.pincode || currentUser?.pincode || "500072",
        payment_method:
          paymentMethod === "razorpay"
            ? "Razorpay Online Payment (Cards/UPI/NetBanking)"
            : paymentMethod === "credit"
              ? "Net-30 Trade Credit (Auto-approved)"
              : paymentMethod === "upi"
                ? "Instant UPI / QR Code Transfer"
                : paymentMethod === "bank"
                  ? "NEFT / RTGS Corporate Bank Transfer"
                  : "Cash on Delivery / POD",
      };

      // ── 1. Razorpay Gateway Flow ──────────────────────────────────
      if (paymentMethod === "razorpay") {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          throw new Error("Could not load Razorpay Payment Gateway. Please check your internet connection.");
        }

        const orderItemsPayload = cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
        const rzpOrder = await paymentsAPI.createRazorpayOrder(orderItemsPayload, {
          order_type: "RETAILER_TRADE_ORDER",
          shop_name: deliveryShopName,
          total_items: cart.length,
          total_packs: cartPacksCount,
        });

        const options = {
          key: rzpOrder.key_id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || "INR",
          name: "EVVAI Pharmaceuticals",
          description: `Trade Order for ${deliveryShopName} (${cartPacksCount} Packs)`,
          image: "/images/evvai_logo_dark.png",
          order_id: rzpOrder.razorpay_order_id,
          prefill: {
            name: deliveryShopName || currentUser?.full_name || "Pharmacy Retailer",
            email: currentUser?.email || "retailer@pharmachain.com",
            contact: deliveryPhone || currentUser?.phone || "+91 9876501234",
          },
          theme: {
            color: "#A71380",
          },
          handler: async function (response: any) {
            try {
              setIsSubmitting(true);
              const placedOrder = await paymentsAPI.verifyAndPlaceOrder({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_data: payload,
              });
              saveCart([]);
              setIsDrawerOpen(false);
              setOrderSuccess(placedOrder.order_code || `ORD-${placedOrder.id}`);
              ordersAPI.getMyOrders().then(setOrders).catch(() => { });
            } catch (err: any) {
              alert(err.message || "Payment verification failed. Please contact support.");
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (resp: any) {
          alert(`Payment failed: ${resp.error.description || "Transaction declined"}`);
          setIsSubmitting(false);
        });
        rzp.open();
        return;
      }

      // ── 2. Standard Credit / Direct Payment Flow ─────────────────
      const res = await ordersAPI.create(payload);
      saveCart([]);
      setIsDrawerOpen(false);
      setOrderSuccess(res.order_code || `ORD-${res.id}`);
      // Refresh orders
      ordersAPI.getMyOrders().then(setOrders).catch(() => { });
    } catch (err: any) {
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* ── Floating Notification Toast ─────────────────────────────── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B2545] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#A71380]/60 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A71380] animate-pulse" />
          <span className="text-xs font-bold">{toastMsg}</span>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-3 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer ml-2"
          >
            Open Cart ({cartPacksCount})
          </button>
        </div>
      )}

      {/* ── Order Success Modal ────────────────────────────────────── */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-[#0B2545]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl border border-emerald-300 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
              ✓
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Payment &amp; Order Authorized
              </span>
              <h3 className="text-2xl font-black text-[#0B2545] mt-2">Order Confirmed!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Order reference <span className="font-mono font-bold text-[#A71380] text-sm">{orderSuccess}</span> has been dispatched to the central WHO-GMP formulation depot.
              </p>
            </div>

            {/* Order meta summary */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-bold text-[#0B2545]">
                  {paymentMethod === "credit"
                    ? "Net-30 Trade Credit"
                    : paymentMethod === "upi"
                      ? "Instant UPI / QR Code"
                      : paymentMethod === "bank"
                        ? "Bank RTGS / NEFT"
                        : "Pay on Delivery (POD)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dispatch Hub:</span>
                <span className="font-bold text-[#0B2545]">Hyderabad Central Cold-Chain Hub</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-emerald-600">Within 24 Hours Priority Express</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/retailer/orders"
                className="bg-[#0B2545] hover:bg-[#103058] text-white py-3 rounded-2xl text-xs font-bold transition-all text-center"
              >
                Track Shipment &rarr;
              </Link>
              <Link
                href="/retailer/invoices"
                className="bg-[#A71380] hover:bg-[#8E0F6D] text-white py-3 rounded-2xl text-xs font-bold transition-all text-center shadow-md shadow-[#A71380]/20"
              >
                Download GST Invoice
              </Link>
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer pt-1"
            >
              Continue Stocking Medicines
            </button>
          </div>
        </div>
      )}

      {/* ── KYC COMPLIANCE NOTICE BANNER (IF PENDING) ───────────────── */}
      {user?.kyc_status && user.kyc_status !== "APPROVED" && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex items-start space-x-4 shadow-sm animate-in fade-in">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shrink-0">
            ⚠️
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-amber-900 text-sm">
                KYC Verification {user.kyc_status === "PENDING" ? "Pending Admin Review" : user.kyc_status}
              </span>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                {user.kyc_status}
              </span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Your Pharmacy Drug License (Form 20/21) &amp; Pharmacist credentials have been submitted. Once verified by EVVAI Compliance, Price-To-Retailer (PTR) trade checkouts and revolving credit will be activated.
            </p>
          </div>
        </div>
      )}

      {/* ── HERO BANNER: SHOP INFO & KYC STATUS ──────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B2545] via-[#123663] to-[#0B2545] p-6 sm:p-8 md:p-10 text-white shadow-xl border border-slate-700/60">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#A71380]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#A71380] text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-full shadow-sm tracking-wider">
                🏪 Licensed Retail Pharmacy Desk
              </span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex items-center space-x-1.5 backdrop-blur-xs border ${user?.kyc_status === "APPROVED"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}>
                <span className={`w-2 h-2 rounded-full ${user?.kyc_status === "APPROVED" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span>Drug License: {user?.kyc_status === "APPROVED" ? "Verified (DL 20/21)" : "KYC Under Review"}</span>
              </span>
              <span className="bg-white/10 text-slate-200 border border-white/20 text-[10px] font-bold px-3 py-1 rounded-full">
                GSTIN: {profileData?.retailer_profile?.gstin || "36AABCS1234F1Z9"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
              {profileData?.retailer_profile?.shop_name || user?.shop_name || "Srikanth MedPlus Pharmacy & Chemist"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              Welcome, <span className="font-bold text-white">{user?.full_name || "Pharmacist"}</span>. Direct access to WHO-GMP formulation supply, Price-To-Retailer (PTR) trade discounts, and 30-day revolving credit line.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6B0B52] text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#A71380]/40 hover:-translate-y-0.5 active:scale-95 flex items-center space-x-2 cursor-pointer"
            >
              <span>🛒 View Cart &amp; Checkout</span>
              {cartPacksCount > 0 && (
                <span className="bg-white text-[#A71380] text-[11px] font-black px-2 py-0.5 rounded-full shadow-inner">
                  {cartPacksCount}
                </span>
              )}
            </button>

            <Link
              href="/retailer/catalog"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3.5 rounded-2xl text-xs font-bold transition-all hover:-translate-y-0.5"
            >
              Full PTR Catalog &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Shop Orders</span>
            <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base group-hover:scale-110 transition-transform">
              📦
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B2545]">{orders.length}</div>
          <p className="text-[11px] text-slate-400 flex items-center space-x-1">
            <span className="text-emerald-500 font-bold">●</span>
            <span>All shipments tracked via GPS</span>
          </p>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Purchase Value</span>
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base group-hover:scale-110 transition-transform">
              ₹
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#0B2545]">
            ₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
            <span>✓ 100% Tax Invoiced &amp; GST Ready</span>
          </p>
        </div>

        {/* Average Retailer Profit Margin */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trade Margin (PTR vs MRP)</span>
            <span className="w-10 h-10 rounded-2xl bg-[#F8EAF4] text-[#A71380] flex items-center justify-center font-bold text-base group-hover:scale-110 transition-transform">
              📈
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#A71380]">22.5%</div>
          <p className="text-[11px] text-slate-400">Direct pharmacy profit on retail sale</p>
        </div>

        {/* Trade Credit Limit */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trade Credit Line</span>
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base group-hover:scale-110 transition-transform">
              💳
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            ₹{(creditData?.available_credit ?? 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-400">
            Limit: ₹{(creditData?.credit_limit ?? 0).toLocaleString("en-IN")} | Used: ₹{(creditData?.outstanding_amount ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* ── SCHEME PROMO BANNER ──────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-50 via-pink-50 to-amber-50 border border-amber-200/80 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20 shrink-0">
            🎁
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Trade Scheme 10+1
              </span>
              <span className="text-xs font-black text-[#0B2545]">Free Bonus Packs on Bulk Orders</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Order any 10 Saleable Packs of our active medicine range and receive 1 bonus pack completely free (Auto-calculated at billing).
            </p>
          </div>
        </div>

        <Link
          href="/retailer/catalog"
          className="bg-[#0B2545] hover:bg-[#103058] text-white px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm flex items-center space-x-1"
        >
          <span>Explore Scheme Formulations</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* ── FAST MEDICINE RE-ORDER DESK & SEARCH ─────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#A71380] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                PTR Trade Rates
              </span>
              <h2 className="text-xl font-black text-[#0B2545]">Fast Pharmacy Stock Re-Order</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select quantities in saleable pack units with verified Price-To-Retailer (PTR) trade discounts.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by brand, generic salt, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#A71380] transition-colors"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                ? "bg-[#0B2545] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {cat === "all" ? `All Medicines (${products.length})` : cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold animate-pulse">
            Loading Pharmacy Formulation Catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No medicines found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.slice(0, 9).map((prod) => {
              const ptrRate =
                prod.display_price || prod.distributor_price || prod.customer_price || prod.mrp;
              const marginAmt = prod.mrp - ptrRate;
              const marginPct = prod.mrp > 0 ? Math.round((marginAmt / prod.mrp) * 100) : 22;
              const catName = prod.category_name || (prod as any).category;
              const packStr = prod.pack_size || (prod as any).packSize;
              const pkg = parsePackagingConfig(packStr, null, 50, catName);
              const cartItem = cart.find((i) => i.product.id === prod.id);
              const currentQty = cartItem ? cartItem.quantity : 0;

              return (
                <div
                  key={prod.id}
                  className="bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-[#A71380]/40 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-200 hover:shadow-lg group"
                >
                  <div className="space-y-3">
                    {/* Header: Image + Title */}
                    <div className="flex items-start space-x-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:border-[#A71380]/30 transition-colors">
                        <img
                          src={getProductImageUrl(prod)}
                          alt={prod.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getCategoryFallbackImage(
                              prod.category_name || (prod as any).category,
                              prod.pack_size || (prod as any).packSize
                            );
                          }}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black uppercase text-[#A71380] tracking-wider block truncate">
                          {prod.category_name || "Pharmaceutical Formulation"}
                        </span>
                        <h3 className="text-sm font-black text-[#0B2545] truncate leading-tight" title={prod.name}>
                          {prod.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{prod.composition}</p>
                      </div>
                    </div>

                    {/* Pricing Pill Grid */}
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/90 grid grid-cols-3 gap-2 text-center shadow-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">MRP</span>
                        <span className="text-xs font-bold text-slate-500 line-through">₹{prod.mrp.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#A71380] font-black block uppercase">Trade (PTR)</span>
                        <span className="text-sm font-black text-[#A71380]">₹{ptrRate.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-emerald-600 font-black block uppercase">Margin</span>
                        <span className="text-xs font-black text-emerald-600">+{marginPct}%</span>
                      </div>
                    </div>

                    {/* Packaging specs */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                      <span className="flex items-center space-x-1">
                        <span>📦</span>
                        <span>{pkg.stripsPerPack > 1 ? `${pkg.stripsPerPack} Strips × ` : ""}{formatDerivedUnits(pkg.tabletsPerStrip, catName, packStr)} / Pack</span>
                      </span>
                      <span className="text-emerald-600 font-bold">🟢 In Stock</span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Add Button */}
                  <div>
                    {currentQty > 0 ? (
                      <div className="flex items-center justify-between bg-white rounded-2xl p-1.5 border border-[#A71380]/40 shadow-sm">
                        <button
                          onClick={() => handleUpdateQuantity(prod, -1)}
                          className="w-9 h-9 rounded-xl bg-slate-100 font-black text-[#0B2545] hover:bg-rose-50 hover:text-rose-600 text-sm flex items-center justify-center cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <div className="text-center">
                          <span className="text-xs font-black text-[#0B2545] block">{currentQty} Packs</span>
                          <span className="text-[9px] font-bold text-[#A71380] font-mono">
                            = ₹{(ptrRate * currentQty).toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUpdateQuantity(prod, 1)}
                          className="w-9 h-9 rounded-xl bg-[#A71380] text-white font-black hover:bg-[#8E0F6D] text-sm flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpdateQuantity(prod, 1)}
                        className="w-full bg-[#0B2545] hover:bg-[#A71380] text-white py-3 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <span>+ Add to Shop Order</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View full catalog CTA */}
        <div className="pt-4 text-center border-t border-slate-100">
          <Link
            href="/retailer/catalog"
            className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-[#0B2545] px-6 py-3 rounded-2xl text-xs font-black transition-all"
          >
            <span>Browse All 100+ WHO-GMP Formulations in Catalog &rarr;</span>
          </Link>
        </div>
      </div>

      {/* ── RECENT ORDERS OVERVIEW TABLE ─────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#0B2545]">Recent Shop Purchases &amp; Invoices</h2>
            <p className="text-xs text-slate-500">Track delivery status and download tax invoices.</p>
          </div>
          <Link href="/retailer/orders" className="text-xs font-bold text-[#A71380] hover:underline">
            View All Dispatches &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No purchase orders placed yet. Add medicines above to place your first trade order!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3 px-3">Order Ref</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Medicines</th>
                  <th className="pb-3 px-3">Payment Terms</th>
                  <th className="pb-3 px-3 text-right">Invoiced Amount</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 px-3 text-center">GST Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-[#0B2545]">
                      {ord.order_code || `ORD-${ord.id}`}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500">
                      {ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-IN") : "Today"}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      {ord.items?.length || 1} Products (
                      {ord.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 1} Packs)
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-medium">
                      {ord.payment_method || "Net-30 Trade Credit"}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-[#0B2545]">
                      ₹{(ord.total_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {(() => {
                        const st = getOrderStatusDisplay(
                          ord.order_status || ord.orderStatus || ord.status,
                          (ord as any).cancellation_reason,
                          (ord as any).admin_notes
                        );
                        return (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${st.badgeClass}`}>
                            ● {st.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Link
                        href="/retailer/invoices"
                        className="bg-slate-100 hover:bg-[#A71380] hover:text-white text-[#0B2545] px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      >
                        PDF Bill
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SLIDE-OUT CART & CHECKOUT DRAWER ─────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#0B2545]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-[#0B2545] to-[#123663] text-white">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🛒</span>
                <div>
                  <h3 className="text-sm font-black">Pharmacy Order Cart</h3>
                  <span className="text-[10px] text-slate-300">
                    {cartPacksCount} Saleable Packs selected
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <span className="text-4xl block">📦</span>
                  <p className="text-xs font-bold text-slate-600">Your shop cart is empty.</p>
                  <p className="text-[11px] text-slate-400">
                    Select quantities from the medicine catalog to start your order.
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Items List */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Selected Formulations
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {cart.map((item) => {
                        const price =
                          item.product.display_price ||
                          item.product.distributor_price ||
                          item.product.customer_price ||
                          item.product.mrp ||
                          0;
                        return (
                          <div key={item.product.id} className="py-3 first:pt-0 flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-[#0B2545] truncate">{item.product.name}</h5>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ₹{price.toFixed(2)} &times; {item.quantity} Packs
                              </span>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center space-x-2 shrink-0">
                              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                                <button
                                  onClick={() => handleUpdateQuantity(item.product, -1)}
                                  className="w-6 h-6 rounded-lg bg-white text-xs font-bold text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-7 text-center text-xs font-bold text-[#0B2545]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.product, 1)}
                                  className="w-6 h-6 rounded-lg bg-[#A71380] text-xs font-bold text-white hover:bg-[#8E0F6D] flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-xs font-black text-[#0B2545] min-w-16 text-right">
                                ₹{(price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery / Shop Address Section */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                        <span>📍 Delivery & Shipping Address</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddressEdit(!showAddressEdit)}
                        className="text-[10px] font-extrabold text-[#A71380] hover:underline cursor-pointer"
                      >
                        {showAddressEdit ? "Done" : "✎ Edit Address"}
                      </button>
                    </div>

                    {showAddressEdit ? (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Shop / Business Name</label>
                          <input
                            type="text"
                            value={deliveryShopName}
                            onChange={(e) => setDeliveryShopName(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold text-[#0B2545] focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Contact Phone</label>
                          <input
                            type="text"
                            value={deliveryPhone}
                            onChange={(e) => setDeliveryPhone(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold text-[#0B2545] focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Street Address</label>
                          <input
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold text-[#0B2545] focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">City</label>
                            <input
                              type="text"
                              value={deliveryCity}
                              onChange={(e) => setDeliveryCity(e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold text-[#0B2545] focus:outline-none focus:border-[#A71380]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">State</label>
                            <input
                              type="text"
                              value={deliveryState}
                              onChange={(e) => setDeliveryState(e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold text-[#0B2545] focus:outline-none focus:border-[#A71380]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Pincode</label>
                            <input
                              type="text"
                              value={deliveryPincode}
                              onChange={(e) => setDeliveryPincode(e.target.value)}
                              className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs font-semibold text-[#0B2545] focus:outline-none focus:border-[#A71380]"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                        <div className="font-bold text-[#0B2545] flex items-center justify-between">
                          <span>{deliveryShopName}</span>
                          <span className="font-mono text-[10px] text-slate-500 font-normal">{deliveryPhone}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">
                          {deliveryAddress}, {deliveryCity}, {deliveryState} - {deliveryPincode}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Select Payment Mode
                    </h4>

                    <div className="space-y-2">
                      {/* Option 1: Net-30 Trade Credit */}
                      <label
                        className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "credit"
                          ? "bg-[#F8EAF4] border-[#A71380] shadow-xs"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "credit"}
                          onChange={() => setPaymentMethod("credit")}
                          className="mt-1 accent-[#A71380]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#0B2545]">
                              🏦 Net-30 Trade Credit Line
                            </span>
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                              Auto-Approved
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Pay within 30 days of receiving medicine invoice.
                          </p>
                        </div>
                      </label>

                      {/* Option 2: Razorpay Online Cards / NetBanking / UPI */}
                      <label
                        className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "razorpay"
                          ? "bg-[#F8EAF4] border-[#A71380] shadow-xs"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "razorpay"}
                          onChange={() => setPaymentMethod("razorpay")}
                          className="mt-1 accent-[#A71380]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#0B2545]">
                              💳 Razorpay Gateway (Cards / UPI / NetBanking)
                            </span>
                            <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                              Live Gateway
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Credit/Debit Cards, Corporate NetBanking &amp; Instant UPI popup.
                          </p>
                        </div>
                      </label>

                      {/* Option 3: Instant UPI / QR */}
                      <label
                        className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "upi"
                          ? "bg-[#F8EAF4] border-[#A71380] shadow-xs"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "upi"}
                          onChange={() => setPaymentMethod("upi")}
                          className="mt-1 accent-[#A71380]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-[#0B2545]">⚡ Direct UPI / QR Code</span>
                            <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                              Direct VPA
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            GPay, PhonePe, Paytm (VPA: evvaipharma@icici)
                          </p>
                        </div>
                      </label>

                      {/* Option 4: RTGS / Bank */}
                      <label
                        className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "bank"
                          ? "bg-[#F8EAF4] border-[#A71380] shadow-xs"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "bank"}
                          onChange={() => setPaymentMethod("bank")}
                          className="mt-1 accent-[#A71380]"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-extrabold text-[#0B2545]">🏢 RTGS / NEFT Direct Bank</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            HDFC Current A/C: 50200088991234 (IFSC: HDFC0000123)
                          </p>
                        </div>
                      </label>

                      {/* Option 5: Pay on Delivery */}
                      <label
                        className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all ${paymentMethod === "pod"
                          ? "bg-[#F8EAF4] border-[#A71380] shadow-xs"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "pod"}
                          onChange={() => setPaymentMethod("pod")}
                          className="mt-1 accent-[#A71380]"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-extrabold text-[#0B2545]">💵 Pay on Delivery (POD)</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Pay via Cheque or Cash upon physical delivery at shop.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cart Footer Summary */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal (PTR Trade Rate)</span>
                    <span className="font-bold text-[#0B2545]">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (12% Pharma Tax)</span>
                    <span className="font-bold text-[#0B2545]">₹{cartEstimatedGst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 p-1.5 rounded-lg">
                    <span>Your Estimated Profit Margin</span>
                    <span>₹{cartRetailProfit.toFixed(2)} (Earn on MRP)</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#0B2545] pt-2 border-t border-slate-200">
                    <span>Net Invoiced Total</span>
                    <span className="text-[#A71380]">₹{cartTotalWithGst.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6B0B52] text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#A71380]/30 hover:shadow-xl active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Authorizing Order..." : "Confirm & Place Trade Order →"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

