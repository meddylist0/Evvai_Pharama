"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, CartItem } from "@/context/CartContext";
import { getProductImageUrl } from "@/lib/packagingUtils";

interface MobileCartViewProps {
  onProceedToCheckout: () => void;
}

export const MobileCartView: React.FC<MobileCartViewProps> = ({
  onProceedToCheckout,
}) => {
  const router = useRouter();
  const {
    cartItems,
    cartCount,
    subtotal,
    gst,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load wishlist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_wishlist");
        if (raw) setWishlistIds(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const toggleWishlist = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      if (typeof window !== "undefined") {
        localStorage.setItem("pharmalink_wishlist", JSON.stringify(next));
      }
      return next;
    });
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/products/");
    }
  };

  const pastelBgs = [
    "bg-[#FFF0F6] border-[#FFE0ED]",
    "bg-[#F0FDF4] border-[#DCFCE7]",
    "bg-[#FFF7ED] border-[#FFEDD5]",
    "bg-[#FFF1F2] border-[#FFE4E6]",
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col select-none relative pb-6">
      {/* 1. Custom Header matching user screenshot: [← Cart (3)] on left, [Trash] on right */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 pt-[env(safe-area-inset-top,8px)] transition-all">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: Exact back arrow with horizontal stem + Cart (count) */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBack}
              className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-[#0B2545] hover:text-[#A71380] active:scale-90 transition-all cursor-pointer"
              aria-label="Go Back"
            >
              <svg className="w-6 h-6 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-black text-[#0B2545] tracking-tight">
              Cart ({cartCount})
            </h1>
          </div>

          {/* Right: Trash icon in navy outline */}
          {cartCount > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-9 h-9 -mr-1 rounded-xl flex items-center justify-center text-[#0B2545] hover:text-rose-600 active:scale-90 transition-all cursor-pointer"
              title="Clear all cart items"
              aria-label="Clear cart"
            >
              <svg className="w-5 h-5 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-3 space-y-3">
        {cartItems.length > 0 ? (
          <>
            {/* Cart Items List matching user screenshot */}
            <div className="space-y-3">
              {cartItems.map((it, idx) => {
                const { product, quantity } = it;
                const imgUrl = getProductImageUrl(product);
                const unitPrice = Number(
                  product.customer_price || product.display_price || product.mrp || 0
                );
                const isWishlisted = wishlistIds.includes(product.id);
                const pastelStyle = pastelBgs[idx % pastelBgs.length];

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex items-center space-x-3.5 relative"
                  >
                    {/* Left: Square Thumbnail with pastel background tint */}
                    <div className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border flex items-center justify-center p-1.5 shrink-0 overflow-hidden relative ${pastelStyle}`}>
                      <img
                        src={imgUrl}
                        alt={product.brand_name || product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/product_nxtnerve.png";
                        }}
                      />
                    </div>

                    {/* Right: Details & Quantity Stepper */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      {/* Brand Name & Heart Wishlist Icon */}
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-black text-[#0B2545] leading-snug line-clamp-1 pr-1">
                          {product.brand_name || product.name}
                        </h3>

                        <button
                          onClick={(e) => toggleWishlist(e, product.id)}
                          className="w-7 h-7 -mt-1 -mr-1 flex items-center justify-center text-rose-500 hover:scale-110 active:scale-90 transition-all cursor-pointer"
                          aria-label="Save to wishlist"
                        >
                          <svg
                            className={`w-4.5 h-4.5 ${
                              isWishlisted ? "fill-rose-500 text-rose-500" : "text-rose-500"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-sm font-black text-[#0B2545] mt-0.5">
                        ₹{unitPrice}
                      </div>

                      {/* Pack size / Generic */}
                      <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                        {product.pack_size || product.composition || "5 x 2ml Ampoules"}
                      </div>

                      {/* Quantity Stepper: [- 1 +] on bottom right */}
                      <div className="flex items-center border border-slate-200/90 rounded-xl bg-white shadow-2xs px-1 py-0.5 ml-auto self-end mt-1">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-sm font-black text-[#0B2545] hover:text-[#A71380] active:scale-90 transition-all cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs font-black text-[#0B2545]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-sm font-black text-[#0B2545] hover:text-[#A71380] active:scale-90 transition-all cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Details Section matching user screenshot */}
            <div className="pt-3">
              <h2 className="text-base font-black text-[#0B2545] mb-2.5">
                Price Details
              </h2>

              <div className="space-y-2 text-sm text-slate-700 font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Subtotal</span>
                  <span className="font-black text-[#0B2545]">₹{subtotal}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">GST (18%)</span>
                  <span className="font-black text-[#0B2545]">₹{gst}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-base font-black text-[#0B2545]">
                  <span className="text-base font-black text-[#0B2545]">Total</span>
                  <span className="text-xl font-black text-[#0B2545]">₹{total}</span>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Proceed to Checkout CTA Button */}
            <div className="pt-4">
              <button
                onClick={onProceedToCheckout}
                className="w-full h-13 rounded-2xl bg-[#9E0059] hover:bg-[#85004B] text-white font-bold text-base flex items-center justify-center space-x-2 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <span>→</span>
              </button>
            </div>
          </>
        ) : (
          /* Empty Cart State */
          <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center space-y-4 my-8 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-pink-50 text-[#A71380] flex items-center justify-center text-2xl mx-auto">
              🛒
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B2545]">
                Your Cart is Empty
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Explore our catalog of verified pharmaceutical products and add formulations to your cart.
              </p>
            </div>
            <Link
              href="/products/"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#0B2545] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
            >
              <span>Explore Products</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </main>

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <h4 className="text-sm font-extrabold text-[#0B2545]">
              Clear Shopping Cart?
            </h4>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove all items from your cart?
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
