"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productsAPI, ProductItem } from "@/lib/api";

export default function CustomerWishlistPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true);
        const data = await productsAPI.list();
        setProducts(data || []);

        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("pharmalink_wishlist");
          if (saved) setSavedIds(JSON.parse(saved));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadWishlist();
  }, []);

  const handleRemoveSaved = (id: number) => {
    const updated = savedIds.filter((x) => x !== id);
    setSavedIds(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_wishlist", JSON.stringify(updated));
    }
  };

  const handleBuyNow = (product: ProductItem) => {
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
      window.dispatchEvent(new Event("storage"));
      router.push(`/customer/checkout?buy_now_id=${product.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const savedProducts = products.filter((p) => savedIds.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-rose-100/60 px-3 py-1 rounded-full border border-rose-200">
            Saved Formulations
          </span>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            {savedProducts.length} Saved Items
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          Saved Healthcare Formulations (Wishlist)
        </h1>
        <p className="text-xs text-slate-500">
          Quickly access medicines and wellness products you have bookmarked for future orders.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading saved formulations...</p>
        </div>
      ) : savedProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
          <div className="text-4xl text-rose-400">♥</div>
          <h3 className="font-bold text-[#0b2341] text-base">No Saved Formulations Yet</h3>
          <p className="text-xs text-slate-400">Click the bookmark icon on any product in the catalog to save it here.</p>
          <Link
            href="/customer/catalog"
            className="inline-block bg-[#0b2341] text-white px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer hover:bg-[#12315a]"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {prod.category_name || "Healthcare"}
                  </span>
                  <button
                    onClick={() => handleRemoveSaved(prod.id)}
                    className="text-rose-600 p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 cursor-pointer text-xs font-bold"
                  >
                    ♥ Remove
                  </button>
                </div>
                <h4 className="font-bold text-[#0b2341] text-sm">{prod.name}</h4>
                <p className="text-xs text-slate-500">{prod.composition || prod.subtitle || "Standard formulation"}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="font-mono font-black text-sm text-[#0b2341]">
                  ₹{Number(prod.customer_price || prod.mrp || 0).toFixed(2)}
                </span>
                <button
                  onClick={() => handleBuyNow(prod)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ⚡ Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
