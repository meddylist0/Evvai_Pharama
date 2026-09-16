"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductItem } from "@/lib/api";
import { getProductImageUrl } from "@/lib/packagingUtils";
import { useCart } from "@/context/CartContext";
import { MobileHeader } from "@/components/mobile/MobileHeader";

interface MobileProductDetailProps {
  product: ProductItem;
  onBack?: () => void;
}

export const MobileProductDetail: React.FC<MobileProductDetailProps> = ({
  product,
  onBack,
}) => {
  const router = useRouter();
  const { addToCart, cartCount } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "composition" | "dosage" | "safety">("about");
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const price = Number(product.customer_price || product.display_price || product.mrp || 0);
  const mrp = Number(product.mrp || price * 1.2);
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const inStock = (product.stock ?? product.total_stock ?? 10) > 0;

  // Primary image plus gallery alternatives
  const primaryImg = getProductImageUrl(product);
  const galleryImages = [
    primaryImg,
    "/images/pharma_scientist_microscope.jpg",
    "/images/pharma_cleanroom_exact.jpg",
  ];

  // Wishlist check
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_wishlist");
        if (raw) {
          const list: number[] = JSON.parse(raw);
          setIsWishlisted(list.includes(product.id));
        }
      } catch {}
    }
  }, [product.id]);

  const toggleWishlist = () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_wishlist");
        let list: number[] = raw ? JSON.parse(raw) : [];
        if (list.includes(product.id)) {
          list = list.filter((id) => id !== product.id);
          setIsWishlisted(false);
        } else {
          list.push(product.id);
          setIsWishlisted(true);
        }
        localStorage.setItem("pharmalink_wishlist", JSON.stringify(list));
      } catch {}
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: product.brand_name || product.name,
          text: `Check out ${product.brand_name || product.name} on EVVAI Pharmaceuticals`,
          url: window.location.href,
        });
      } catch {}
    } else {
      // Fallback copy to clipboard
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        setAddedToast("Product link copied to clipboard");
        setTimeout(() => setAddedToast(null), 2000);
      }
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToast(`Added ${quantity} x ${product.brand_name || product.name} to cart`);
    setTimeout(() => setAddedToast(null), 2200);
  };

  const trustBadges = [
    { label: "Genuine Product", icon: "🛡️" },
    { label: "Secure Packaging", icon: "📦" },
    { label: "Quality Assured", icon: "🔬" },
    { label: "Dedicated Support", icon: "📞" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col relative select-none">
      {/* 1. Mobile Header with Back, Title, Share, Wishlist, Cart */}
      <MobileHeader
        title="Product Details"
        showBack={true}
        onBack={onBack ? onBack : () => router.back()}
        rightAction={
          <div className="flex items-center space-x-1">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#0B2545] active:scale-95 transition-all cursor-pointer"
              aria-label="Share product"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>

            {/* Wishlist Heart Button */}
            <button
              onClick={toggleWishlist}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-rose-500 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle wishlist"
            >
              <svg
                className={`w-5 h-5 transition-colors ${
                  isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-600"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Cart Shortcut with Badge */}
            <Link
              href="/customer/checkout"
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-[#0B2545] active:scale-95 transition-all cursor-pointer"
              aria-label="View Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-1 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#A71380] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        }
      />

      {/* Floating Toast Notification */}
      {addedToast && (
        <div className="fixed top-16 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-[#0B2545] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between border border-blue-900/40">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                ✓
              </span>
              <span>{addedToast}</span>
            </div>
            <Link
              href="/customer/checkout"
              className="text-[#f1a4dc] hover:text-white text-[11px] font-bold underline"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}

      {/* Main Scrollable Content (with padding for bottom sticky action bar) */}
      <main className="flex-1 w-full max-w-lg mx-auto pb-28 space-y-4 pt-2">
        {/* 2. Product Gallery Card (Screen 5 Reference) */}
        <div className="bg-white px-4 py-4 border-b border-slate-200/80 space-y-3">
          {/* Main Selected Image */}
          <div className="w-full h-64 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
            <img
              src={galleryImages[selectedImageIndex]}
              alt={product.brand_name || product.name}
              className="w-full h-full object-contain transition-all duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/product_nxtnerve.png";
              }}
            />
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-[#A71380] text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center justify-center space-x-2.5">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`w-14 h-14 rounded-xl bg-slate-50 border-2 p-1 transition-all overflow-hidden cursor-pointer ${
                  selectedImageIndex === idx
                    ? "border-[#A71380] shadow-xs scale-105"
                    : "border-slate-200 opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/product_nxtnerve.png";
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 3. Product Title, Pack Size, Price & Stock Info */}
        <div className="bg-white px-4 py-4 border-y border-slate-200/80 space-y-2.5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#A71380] bg-pink-50 px-2 py-0.5 rounded-md">
                {product.category_name || product.category || "Pharmaceutical"}
              </span>
              <h1 className="text-lg font-black text-[#0B2545] mt-1 leading-snug">
                {product.brand_name || product.name}
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                {product.pack_size || "Standard Packaging"} • {product.generic_name || product.composition}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2 pt-0.5">
            <div className="flex items-center text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
              <span>★</span>
              <span className="ml-1">4.8</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              (128 verified reviews)
            </span>
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline space-x-2 pt-1 border-t border-slate-100">
            <span className="text-xl font-black text-[#0B2545]">
              ₹{price}
            </span>
            {mrp > price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{Math.round(mrp)}
              </span>
            )}
            {discount > 0 && (
              <span className="text-xs font-black text-[#A71380]">
                {discount}% OFF
              </span>
            )}
            <span className="ml-auto text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● In Stock
            </span>
          </div>

          {/* Short Description */}
          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            {product.description ||
              "High-strength pharmaceutical formulation developed under stringent WHO-GMP guidelines to ensure optimal bio-availability, purity, and clinical efficacy."}
          </p>
        </div>

        {/* 4. Clinical Trust Badges (Screen 5 Reference) */}
        <div className="px-4">
          <div className="grid grid-cols-2 gap-2">
            {trustBadges.map((tb) => (
              <div
                key={tb.label}
                className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center space-x-2"
              >
                <span className="text-base">{tb.icon}</span>
                <span className="text-xs font-bold text-slate-800">
                  {tb.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Clinical Specification Tabs (About, Composition, Dosage, Safety) */}
        <div className="bg-white border-y border-slate-200/80 p-4 space-y-3">
          {/* Tab Pill Headers */}
          <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-2 overflow-x-auto no-scrollbar">
            {[
              { id: "about", label: "About" },
              { id: "composition", label: "Composition" },
              { id: "dosage", label: "Dosage" },
              { id: "safety", label: "Safety Info" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#A71380] text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="text-xs text-slate-600 leading-relaxed space-y-2 pt-1">
            {activeTab === "about" && (
              <div className="space-y-2">
                <p>
                  <strong>{product.brand_name || product.name}</strong> is manufactured in our certified facility using high-purity API grades. Formulated specifically for healthcare practitioners, hospitals, and licensed pharmacies.
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">SKU / Item Code:</span>
                    <span className="font-bold text-slate-800">{product.sku || `EVV-MED-${product.id}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Dosage Form:</span>
                    <span className="font-bold text-slate-800">{product.dosage_form || "Solid / Injectable"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Packaging Unit:</span>
                    <span className="font-bold text-slate-800">{product.pack_size || "Box Pack"}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "composition" && (
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Active Pharmaceutical Ingredients (API):</p>
                <div className="p-3 bg-pink-50/70 border border-pink-100 rounded-xl">
                  <p className="font-bold text-[#A71380]">
                    {product.composition || product.generic_name || "Mecobalamin / Multi-component formulation"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Complies with Indian Pharmacopoeia (IP) / British Pharmacopoeia (BP) standards.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "dosage" && (
              <div className="space-y-2">
                <p>
                  <strong>Recommended Administration:</strong> As directed by the registered medical practitioner or consulting physician.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                  <li>Store in a cool, dry place away from direct sunlight.</li>
                  <li>Do not freeze unless explicitly labeled for cold-chain storage.</li>
                  <li>Keep out of reach of children.</li>
                </ul>
              </div>
            )}

            {activeTab === "safety" && (
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                  <strong>Schedule H Prescription Drug Warning:</strong> To be sold by retail on the prescription of a Registered Medical Practitioner only.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 6. Bottom Sticky CTA Bar (Screen 5 Reference) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_20px_rgba(11,37,69,0.08)] pb-[env(safe-area-inset-bottom,12px)]">
        <div className="max-w-lg mx-auto flex items-center space-x-3">
          {/* Quantity Controls [-] Qty [+] */}
          <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 shrink-0">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-black text-slate-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex-1 h-11 bg-gradient-to-r from-[#A71380] to-[#800E62] hover:from-[#8e0f6c] hover:to-[#6b0b52] text-white font-extrabold text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Add to Cart • ₹{price * quantity}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
