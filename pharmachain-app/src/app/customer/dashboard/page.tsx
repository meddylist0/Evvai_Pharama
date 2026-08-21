"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productsAPI, ordersAPI, getStoredUser, StoredUser, ProductItem, OrderData } from "@/lib/api";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setUser(getStoredUser());

      const [prods, myOrders] = await Promise.allSettled([
        productsAPI.list(),
        ordersAPI.getMyOrders(),
      ]);

      if (prods.status === "fulfilled") {
        setProducts(prods.value || []);
      }
      if (myOrders.status === "fulfilled") {
        setOrders(myOrders.value || []);
      }

      if (typeof window !== "undefined") {
        try {
          const savedCart = localStorage.getItem("pharmalink_cart");
          if (savedCart) {
            const items = JSON.parse(savedCart);
            setCartCount(items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0));
          }
        } catch { }
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingOrders = orders.filter(
    (o) => o.order_status === "Pending" || o.order_status === "Confirmed" || o.order_status === "Packed" || o.order_status === "Shipped"
  );
  const deliveredCount = orders.filter((o) => o.order_status === "Delivered").length;
  const totalCount = orders.length;

  const getProductImageUrl = (prod: ProductItem) => {
    if (prod.image && prod.image.trim().length > 0) {
      if (prod.image.startsWith("http") || prod.image.startsWith("/")) return prod.image;
      return `/images/${prod.image}`;
    }
    const name = (prod.name || "").toLowerCase();
    if (name.includes("zene") || name.includes("melatonin")) return "/images/product_zene.png";
    if (name.includes("nxtnerve") || name.includes("b12")) return "/images/product_nxtnerve.png";
    if (name.includes("bilevia")) return "/images/product_bilevia.jpg";
    if (name.includes("evi ova")) return "/images/product_evi_ova.jpg";
    if (name.includes("gestogen")) return "/images/product_gestogen.jpg";
    if (name.includes("nxtlife")) return "/images/product_nxtlife.jpg";
    return "/images/dolotab_blister.jpg";
  };

  const handleAddToCart = (product: ProductItem) => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("pharmalink_cart");
      let cart: any[] = saved ? JSON.parse(saved) : [];
      const existing = cart.find((it) => it.product.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ product, quantity: 1 });
      }
      localStorage.setItem("pharmalink_cart", JSON.stringify(cart));
      setCartCount(cart.reduce((acc, it) => acc + it.quantity, 0));
      window.dispatchEvent(new Event("storage"));
      alert(`✓ Added '${product.name}' to cart!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstantBuy = (product: ProductItem) => {
    handleAddToCart(product);
    router.push("/customer/checkout");
  };

  const displayName = user?.full_name || "Valued Customer";
  const userAccountCode = user ? `#CUS-${String(user.id || user.user_id).padStart(4, "0")}` : "#CUS-0004";

  return (
    <div className="space-y-8">
      {/* ─── 1. ELITE PHARMA ENTERPRISE HERO BANNER ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2341] via-[#12315a] to-[#1e4a7a] text-white rounded-3xl p-7 md:p-8 shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-400/30 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>WHO-GMP & Schedule M Certified</span>
              </span>
              <span className="bg-white/10 text-blue-200 text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/10">
                Direct Buyer Account {userAccountCode}
              </span>
              <span className="bg-blue-600/30 text-blue-100 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-400/20">
                {user?.role === "DISTRIBUTOR" ? "B2B Wholesale Partner" : "Direct Retail Customer"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome Back, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time access to verified pharmaceutical formulations, government-audited COA batch testing certificates, and end-to-end cold-chain order fulfillment.
            </p>
          </div>

          {/* Quick Action Pill Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <Link
              href="/customer/checkout"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-3 rounded-2xl font-bold text-xs transition-all backdrop-blur-md flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Active Cart</span>
              {cartCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/customer/catalog"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl font-extrabold text-xs transition-all shadow-lg hover:shadow-blue-600/30 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Browse Catalog</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. 4 EXECUTIVE STAT METRIC CARDS (EXACT ADMIN THEME) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Orders */}
        <Link href="/customer/orders" className="block">
          <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Orders</span>
              <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
                {loading ? "..." : totalCount}
              </div>
              <div className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                <span>{pendingOrders.length} active in transit</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Card 2: Completed Deliveries */}
        <Link href="/customer/orders" className="block">
          <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Delivered Orders</span>
              <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
                {loading ? "..." : deliveredCount}
              </div>
              <div className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
                <span>Doorstep Fulfilled &rarr;</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Card 3: Active Cart Items */}
        <Link href="/customer/checkout" className="block">
          <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Active Cart Items</span>
              <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
                {cartCount}
              </div>
              <div className="text-[11px] font-bold text-blue-700">
                Proceed to Checkout &rarr;
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Card 4: Verified Formulations */}
        <Link href="/customer/catalog" className="block">
          <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs hover:border-blue-300 transition-all cursor-pointer">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Live Formulations</span>
              <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
                {loading ? "..." : products.length}
              </div>
              <div className="text-[11px] font-bold text-slate-600">
                Schedule M Audited &rarr;
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* ─── 3. PHARMA COLD-CHAIN & QUALITY ASSURANCE PILLARS ─── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-black text-[#0b2341] uppercase tracking-wider">
              Pharmaceutical Supply Chain & Compliance Standards
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Quality benchmarks maintained across manufacturing and door delivery</p>
          </div>
          <Link href="/customer/coa" className="text-xs font-bold text-blue-700 hover:underline">
            View COA Reports &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="font-extrabold text-[#0b2341]">2°C - 8°C Cold Chain</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Thermal insulated packaging with real-time temperature audit logger for injectables.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="font-extrabold text-[#0b2341]">100% Batch Tested</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Schedule M certified chemical assay and microbiological sterility compliance.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="font-extrabold text-[#0b2341]">Tamper-Evident Seal</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Anti-counterfeiting holographic barcodes and batch authentication numbers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="font-extrabold text-[#0b2341]">Express Dispatch</div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Same-day warehouse dispatch for confirmed orders with live tracking.
            </p>
          </div>
        </div>
      </div>

      {/* ─── 4. RECENT ORDERS & LIVE DISPATCH TRACKING ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-lg font-black text-[#0b2341] tracking-tight">Recent Orders & Shipment Tracking</h2>
            <p className="text-xs text-slate-400">Live order status from batch reservation to delivery</p>
          </div>
          <Link
            href="/customer/orders"
            className="text-xs font-bold text-blue-700 hover:text-[#0b2341] transition-colors"
          >
            View All ({orders.length}) Orders &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Orders Placed Yet</h3>
            <p className="text-xs text-slate-400">Browse the certified formulation catalog to place your first healthcare order.</p>
            <Link
              href="/customer/catalog"
              className="inline-block bg-[#0b2341] text-white px-5 py-2.5 rounded-xl text-xs font-bold mt-1 cursor-pointer"
            >
              Browse Formulation Catalog
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-4 px-5">Order Code</th>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Order Items</th>
                  <th className="py-4 px-5">Payment</th>
                  <th className="py-4 px-5">Total (₹)</th>
                  <th className="py-4 px-5">Fulfillment Status</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((ord) => {
                  const isPaid = (ord.payment_status || "").toUpperCase() === "PAID";
                  const isRefunded = (ord.payment_status || "").toUpperCase() === "REFUNDED";

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {ord.order_code || `#ORD-${ord.id}`}
                      </td>
                      <td className="py-4 px-5 text-slate-600 whitespace-nowrap">
                        {new Date(ord.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-800 max-w-xs truncate">
                        {ord.items && ord.items.length > 0
                          ? ord.items.map((it: any) => `${it.product_name} (×${it.quantity})`).join(", ")
                          : "Pharmaceutical Supplies"}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {isRefunded ? (
                          <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                            REFUNDED
                          </span>
                        ) : isPaid ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                            PAID
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-[10px] font-bold">
                            {ord.payment_status || ord.payment_method}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-mono font-black text-sm text-[#0b2341] whitespace-nowrap">
                        ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border inline-flex items-center space-x-1.5 ${
                            ord.order_status === "Delivered"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : ord.order_status === "Shipped"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : ord.order_status === "Packed"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                              : ord.order_status === "Confirmed"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : ord.order_status === "Cancelled" || ord.order_status === "Returned"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          <span>● {ord.order_status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <Link
                          href="/customer/orders"
                          className="bg-slate-100 hover:bg-[#0b2341] hover:text-white text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-block"
                        >
                          Track &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── 5. FEATURED FORMULATIONS CATALOG SHOWCASE ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
          <div>
            <h2 className="text-lg font-black text-[#0b2341] tracking-tight">
              Recommended OTC & Wellness Formulations
            </h2>
            <p className="text-xs text-slate-400">Directly fetched from WHO-GMP certified inventory with Schedule M compliance</p>
          </div>
          <Link
            href="/customer/catalog"
            className="text-xs font-bold text-blue-700 hover:text-[#0b2341] transition-colors"
          >
            View All {products.length} Products &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
            <p className="font-bold text-xs">Loading Live Products Catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center text-slate-400 border border-slate-200">
            No products available.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.slice(0, 6).map((prod) => {
              const price = Number(prod.customer_price || prod.display_price || prod.mrp || 0);
              const mrp = Number(prod.mrp || (price > 0 ? price * 1.25 : 100));
              const inStock = prod.stock > 0;
              const imageUrl = getProductImageUrl(prod);

              return (
                <div
                  key={prod.id}
                  className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-2xs"
                >
                  <div className="relative h-44 bg-slate-100/70 overflow-hidden flex items-center justify-center p-3">
                    <img src={imageUrl} alt={prod.name} className="w-full h-full object-cover rounded-2xl" />
                    <div className="absolute top-3 left-3 bg-[#0b2341]/85 backdrop-blur-xs text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full">
                      {prod.category_name || "Healthcare"}
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>SKU: {prod.sku}</span>
                        {inStock ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ● In Stock
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            ● Out of Stock
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-sm text-[#0b2341] line-clamp-1">{prod.name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {prod.composition || prod.subtitle || "Standard WHO-GMP formulation"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-black text-[#0b2341] font-mono">₹{price.toFixed(2)}</span>
                          {mrp > price && (
                            <span className="text-xs text-slate-400 line-through font-mono ml-1.5">₹{mrp.toFixed(2)}</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddToCart(prod)}
                          disabled={!inStock}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleInstantBuy(prod)}
                          disabled={!inStock}
                          className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white py-2 rounded-xl text-xs font-extrabold shadow-2xs cursor-pointer disabled:opacity-40 transition-all"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
