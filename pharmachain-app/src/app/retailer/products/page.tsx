"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { productsAPI, ProductItem, ordersAPI, OrderCreatePayload, getStoredUser, StoredUser, authAPI } from "@/lib/api";
import { parsePackagingConfig, getProductImageUrl, getCategoryFallbackImage } from "@/lib/packagingUtils";

interface CartItem {
  product: ProductItem;
  cartons: number;
  loosePacks: number;
  totalPacks: number;
  freePacks: number;
}

export default function RetailerCatalogPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [creditStatus, setCreditStatus] = useState<any>(null);

  const [paymentMethod, setPaymentMethod] = useState<"credit" | "upi" | "bank" | "pod">("credit");

  const loadData = async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      setCurrentUser(user);

      const [prods, me] = await Promise.all([
        productsAPI.list().catch(() => []),
        authAPI.getMe().catch(() => null),
      ]);
      setProducts(prods);
      if (me) {
        setCurrentUser((prev) => ({ ...(prev || {}), ...me } as StoredUser));
      }

      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("pharmalink_retailer_cart");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            // Migrate legacy format if quantity was a flat number
            const normalized: CartItem[] = parsed.map((item: any) => {
              if (item.totalPacks !== undefined) return item;
              const qty = item.quantity || 1;
              const free = Math.floor(qty / 10);
              return {
                product: item.product,
                cartons: 0,
                loosePacks: qty,
                totalPacks: qty,
                freePacks: free,
              };
            });
            setCart(normalized);
          } catch (e) { }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_retailer_cart", JSON.stringify(newCart));
      window.dispatchEvent(new Event("pharmalink_user_updated"));
    }
  };

  const updateCartProduct = (product: ProductItem, cartons: number, loosePacks: number) => {
    const safeCartons = Math.max(0, Math.floor(cartons || 0));
    const safeLoose = Math.max(0, Math.floor(loosePacks || 0));
    const totalPacks = safeCartons * 50 + safeLoose;

    if (totalPacks <= 0) {
      saveCart(cart.filter((i) => i.product.id !== product.id));
      return;
    }

    // 10+1 Trade Scheme calculation: 1 free pack for every 10 packs ordered
    const freePacks = Math.floor(totalPacks / 10);

    const existingIdx = cart.findIndex((i) => i.product.id === product.id);
    let updated: CartItem[];
    if (existingIdx >= 0) {
      updated = [...cart];
      updated[existingIdx] = {
        product,
        cartons: safeCartons,
        loosePacks: safeLoose,
        totalPacks,
        freePacks,
      };
    } else {
      updated = [
        ...cart,
        {
          product,
          cartons: safeCartons,
          loosePacks: safeLoose,
          totalPacks,
          freePacks,
        },
      ];
    }
    saveCart(updated);
  };

  const categories = Array.from(new Set(products.map((p) => p.category_name || "General"))).filter(Boolean);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.name || "").toLowerCase().includes(q) ||
      (p.composition || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q);
    const matchesCat = selectedCategory === "all" || p.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const cartSubtotal = cart.reduce((sum, item) => {
    const price =
      item.product.display_price ||
      item.product.distributor_price ||
      item.product.customer_price ||
      item.product.mrp ||
      0;
    // Billed only for purchased packs; free scheme goods are at ₹0
    return sum + price * item.totalPacks;
  }, 0);

  const cartEstimatedGst = cartSubtotal * 0.12;
  const cartTotalWithGst = cartSubtotal + cartEstimatedGst;
  const cartTotalFreePacks = cart.reduce((sum, item) => sum + item.freePacks, 0);
  const cartTotalDispatchedPacks = cart.reduce((sum, item) => sum + item.totalPacks + item.freePacks, 0);
  const cartMrpValue = cart.reduce((sum, item) => sum + item.product.mrp * (item.totalPacks + item.freePacks), 0);
  const cartRetailProfit = Math.max(0, cartMrpValue - cartTotalWithGst);

  const isKycApproved = (currentUser?.kyc_status || "").toUpperCase() === "APPROVED";

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (!isKycApproved) {
      alert("Trade Ordering Locked: Your Drug License (Form 20/21) KYC is currently pending verification. Once approved by EVVAI Compliance Office, you will be able to place wholesale orders.");
      return;
    }

    try {
      setIsSubmitting(true);
      const user = currentUser || getStoredUser();

      const paymentLabel =
        paymentMethod === "credit"
          ? "Net-30 Trade Credit (Auto-approved)"
          : paymentMethod === "upi"
            ? "Instant UPI / QR Code Transfer"
            : paymentMethod === "bank"
              ? "NEFT / RTGS Corporate Bank Transfer"
              : "Cash on Delivery / POD";

      const payload: OrderCreatePayload = {
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.totalPacks,
          carton_quantity: i.cartons,
          pack_quantity: i.loosePacks,
          scheme_free_quantity: i.freePacks,
          scheme_name: i.freePacks > 0 ? "10+1 Trade Scheme" : undefined,
        })),
        customer_name: user?.shop_name || user?.full_name || "Retail Pharmacy Shop",
        customer_phone: user?.phone || "+91 9876543210",
        delivery_address: user?.shop_address || "Registered Pharmacy Shop Address",
        delivery_city: user?.city || "Hyderabad",
        delivery_state: user?.state || "Telangana",
        delivery_pincode: user?.pincode || "500072",
        payment_method: paymentLabel,
      };

      const res = await ordersAPI.create(payload);
      saveCart([]);
      setOrderSuccess(res.order_code || `ORD-${res.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* ── Order Success Modal ────────────────────────────────────── */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-[#0B2545]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-5 shadow-2xl border border-emerald-300 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
              ✓
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Payment Authorized &amp; Dispatched
              </span>
              <h3 className="text-2xl font-black text-[#0B2545] mt-2">Trade Order Placed!</h3>
              <p className="text-xs text-slate-600 mt-1">
                Your order <span className="font-mono font-bold text-[#A71380] text-sm">{orderSuccess}</span> has been confirmed at Price-To-Retailer (PTR) trade rates.
              </p>
            </div>

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
                <span className="text-slate-500">Fulfillment Hub:</span>
                <span className="font-bold text-[#0B2545]">Central Hyderabad Pharma Depot</span>
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
              Back to Catalog
            </button>
          </div>
        </div>
      )}

      {/* ── KYC Compliance Notice ────────────────────────────────────── */}
      {!isKycApproved && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shrink-0">
              ⚠️
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900">
                Drug License Verification Pending (KYC Status: {currentUser?.kyc_status || "PENDING"})
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Under Indian Drugs and Cosmetics Rules, wholesale purchasing at Price-To-Retailer (PTR) requires verified Form 20/21 licenses. Trade ordering is locked until EVVAI Compliance Office approves your KYC.
              </p>
            </div>
          </div>
          <Link
            href="/retailer/profile"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap transition-all shadow-xs"
          >
            Check KYC Profile &rarr;
          </Link>
        </div>
      )}

      {/* ── Catalog Header ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#A71380] text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
                Price-To-Retailer (PTR)
              </span>
              <span className="text-xs text-emerald-600 font-bold">● 100% WHO-GMP Certified Stock</span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                🎁 10+1 Trade Scheme Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight mt-1">
              Wholesale Pharmacy Catalog
            </h1>

          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by medicine, salt, composition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-[#A71380] transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === "all"
              ? "bg-[#0B2545] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat
                ? "bg-[#0B2545] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout: Products Grid + Sticky Cart Summary ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Products Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl p-16 text-center text-slate-400 text-xs font-bold animate-pulse">
              Loading Wholesale Catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center text-slate-400 text-xs">
              No products found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((prod) => {
                const ptrRate =
                  prod.display_price || prod.distributor_price || prod.customer_price || prod.mrp;
                const marginAmt = prod.mrp - ptrRate;
                const marginPct = prod.mrp > 0 ? Math.round((marginAmt / prod.mrp) * 100) : 20;
                const pkg = parsePackagingConfig(prod.pack_size || (prod as any).packSize);
                const cartItem = cart.find((i) => i.product.id === prod.id);
                const currentCartons = cartItem?.cartons || 0;
                const currentLoose = cartItem?.loosePacks || 0;
                const currentTotal = cartItem?.totalPacks || 0;
                const currentFree = cartItem?.freePacks || 0;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-[#A71380]/40 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:border-[#A71380]/30 transition-colors">
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase text-[#A71380] tracking-wider truncate">
                              {prod.category_name || "General Medicine"}
                            </span>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
                              10+1 Scheme
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-[#0B2545] truncate leading-tight mt-0.5" title={prod.name}>
                            {prod.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono block">{prod.sku}</span>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{prod.composition}</p>
                        </div>
                      </div>

                      {/* Crystal Clear User-Friendly Pricing Box */}
                      <div className="bg-[#F8EAF4]/40 rounded-2xl p-3 border border-[#F3D0E9] space-y-2 shadow-2xs">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs" title="Printed Maximum Retail Price for end customers">
                            <span className="text-[8px] text-slate-400 font-extrabold block uppercase tracking-wider">Customer MRP</span>
                            <span className="text-xs font-bold text-slate-400 line-through">₹{prod.mrp.toFixed(2)}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-[#A71380]/30 shadow-2xs" title="Your special wholesale buying rate from EVVAI">
                            <span className="text-[8px] text-[#A71380] font-black block uppercase tracking-wider">Your Buy Rate (PTR)</span>
                            <span className="text-xs sm:text-sm font-black text-[#A71380]">₹{ptrRate.toFixed(2)}</span>
                          </div>
                          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 shadow-2xs" title="Your direct net profit on selling each box">
                            <span className="text-[8px] text-emerald-700 font-black block uppercase tracking-wider">Your Net Profit</span>
                            <span className="text-xs font-black text-emerald-700">+{marginPct}% <span className="text-[9px] font-bold block text-emerald-600">(₹{marginAmt.toFixed(0)}/Box)</span></span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-100 font-medium">
                          <span>🎁 Scheme: <strong className="text-indigo-700">Buy 10 Packs ➔ Get 1 FREE</strong></span>
                          <span className="text-emerald-700 font-bold">Extra +10% Profit</span>
                        </div>
                      </div>

                      {/* Packaging Info & Stock Tag */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
                        <span>📦 1 Carton = 50 Pks ({pkg.stripsPerPack} Str/Pk)</span>
                        <span className="text-emerald-600 font-bold">🟢 Stock: {prod.stock || 250} Pks</span>
                      </div>
                    </div>

                    {/* Master Carton + Loose Pack Order Controls */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Cartons selector */}
                        <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200 text-center">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                            Cartons (50 Pks)
                          </span>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => updateCartProduct(prod, Math.max(0, currentCartons - 1), currentLoose)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-200 text-xs flex items-center justify-center cursor-pointer transition-colors"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-[#0B2545]">{currentCartons}</span>
                            <button
                              type="button"
                              onClick={() => updateCartProduct(prod, currentCartons + 1, currentLoose)}
                              className="w-7 h-7 rounded-lg bg-slate-800 text-white font-black hover:bg-slate-900 text-xs flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Loose Packs selector */}
                        <div className="bg-slate-50 rounded-2xl p-2 border border-slate-200 text-center">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                            Loose Packs
                          </span>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => updateCartProduct(prod, currentCartons, Math.max(0, currentLoose - 1))}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-200 text-xs flex items-center justify-center cursor-pointer transition-colors"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-[#0B2545]">{currentLoose}</span>
                            <button
                              type="button"
                              onClick={() => updateCartProduct(prod, currentCartons, currentLoose + 1)}
                              className="w-7 h-7 rounded-lg bg-[#A71380] text-white font-black hover:bg-[#8E0F6D] text-xs flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Item Total & Free Goods feedback */}
                      {currentTotal > 0 && (
                        <div className="bg-[#F8EAF4] border border-[#A71380]/20 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-[#0B2545]">
                              {currentTotal} Pks
                            </span>
                            {currentFree > 0 && (
                              <span className="text-emerald-700 font-black ml-1.5">
                                + {currentFree} FREE
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-black text-[#A71380]">
                            ₹{(ptrRate * currentTotal).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky Cart & Checkout Drawer (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🛒</span>
                <h3 className="text-sm font-black text-[#0B2545]">Trade Order Invoice</h3>
              </div>
              <span className="bg-[#A71380] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.totalPacks, 0)} Billed Packs
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <span className="text-3xl block">📦</span>
                <p className="font-bold text-slate-600">Your wholesale cart is empty.</p>
                <p className="text-[11px] text-slate-400">Add Master Cartons or loose Packs to calculate trade pricing and schemes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin divide-y divide-slate-100">
                  {cart.map((item) => {
                    const price =
                      item.product.display_price ||
                      item.product.distributor_price ||
                      item.product.customer_price ||
                      item.product.mrp ||
                      0;
                    return (
                      <div key={item.product.id} className="pt-2.5 first:pt-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-[#0B2545] truncate">{item.product.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.cartons > 0 ? `${item.cartons} Ctn (${item.cartons * 50} Pks)` : ""}
                              {item.cartons > 0 && item.loosePacks > 0 ? " + " : ""}
                              {item.loosePacks > 0 ? `${item.loosePacks} Loose Pks` : ""}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-xs font-black text-[#0B2545]">
                              ₹{(price * item.totalPacks).toFixed(2)}
                            </span>
                            <button
                              onClick={() => updateCartProduct(item.product, 0, 0)}
                              className="text-slate-400 hover:text-rose-500 text-sm px-1 cursor-pointer"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* Scheme Free Pack Line Item */}
                        {item.freePacks > 0 && (
                          <div className="flex items-center justify-between text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                            <span>🎁 10+1 Free Goods: {item.freePacks} Free Packs</span>
                            <span className="font-mono font-bold">₹0.00</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total Dispatched Summary */}
                {cartTotalFreePacks > 0 && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between text-xs text-emerald-900">
                    <span className="font-bold">Total Dispatched Units:</span>
                    <span className="font-mono font-black">
                      {cartTotalDispatchedPacks} Packs ({cart.reduce((s, i) => s + i.totalPacks, 0)} Billed + {cartTotalFreePacks} Free)
                    </span>
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Select Payment Mode
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("credit")}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${paymentMethod === "credit"
                        ? "bg-[#F8EAF4] border-[#A71380] text-[#A71380] font-black"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                    >
                      <div className="text-[11px] font-bold">🏦 30-Day Credit</div>
                      <div className="text-[9px] text-slate-500 font-normal">Auto-approved limit</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${paymentMethod === "upi"
                        ? "bg-[#F8EAF4] border-[#A71380] text-[#A71380] font-black"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                    >
                      <div className="text-[11px] font-bold">⚡ UPI / QR</div>
                      <div className="text-[9px] text-slate-500 font-normal">GPay / PhonePe</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bank")}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${paymentMethod === "bank"
                        ? "bg-[#F8EAF4] border-[#A71380] text-[#A71380] font-black"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                    >
                      <div className="text-[11px] font-bold">🏢 Bank RTGS</div>
                      <div className="text-[9px] text-slate-500 font-normal">Corporate Transfer</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pod")}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${paymentMethod === "pod"
                        ? "bg-[#F8EAF4] border-[#A71380] text-[#A71380] font-black"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                        }`}
                    >
                      <div className="text-[11px] font-bold">💵 Cash / POD</div>
                      <div className="text-[9px] text-slate-500 font-normal">Pay on Delivery</div>
                    </button>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Subtotal (PTR Trade Rate)</span>
                    <span className="font-bold text-slate-700">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>GST (12% Pharma Tax)</span>
                    <span className="font-bold text-slate-700">₹{cartEstimatedGst.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                    <span>Estimated Retail Margin</span>
                    <span>₹{cartRetailProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black text-[#0B2545] pt-2 border-t border-slate-200">
                    <span>Net Invoiced Total</span>
                    <span className="text-[#A71380]">₹{cartTotalWithGst.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || !isKycApproved}
                  className="w-full bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6B0B52] text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#A71380]/30 hover:shadow-xl active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Processing FEFO Allocation..."
                    : !isKycApproved
                      ? "🔒 KYC Verification Required"
                      : "Confirm & Place Trade Order →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
