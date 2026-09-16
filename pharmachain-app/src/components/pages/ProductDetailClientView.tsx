"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductDetailProps {
  product: {
    id: string | number;
    name: string;
    category?: string;
    category_name?: string;
    subtitle?: string;
    composition?: string;
    packSize?: string;
    pack_size?: string;
    dosageForm?: string;
    dosage_form?: string;
    dosage?: string;
    uses?: string | string[];
    safety?: string;
    storage?: string;
    image?: string;
    images?: string[];
    batchNo?: string;
    expiryDate?: string;
    stock?: number;
    mrp: number;
    distributorPrice?: number;
    distributor_price?: number;
    customer_price?: number;
    bulkPrice?: number;
    bulk_price?: number;
    bulkMoq?: number;
    sku?: string;
    manufacturer?: string;
    consumeType?: string;
    returnPolicy?: string;
  };
  relatedProducts?: any[];
}

export const ProductDetailClientView: React.FC<ProductDetailProps> = ({
  product: initialProduct,
  relatedProducts = [],
}) => {
  const router = useRouter();
  const [currentProduct, setCurrentProduct] = useState<any>(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (initialProduct) {
      setCurrentProduct(initialProduct);
    }
  }, [initialProduct]);

  // Dynamic Gallery Images (uses product's actual image without hardcoded unrelated fallback images)
  const mainImg = currentProduct?.image || "/images/product_zene.png";
  const galleryImages: string[] =
    currentProduct?.images && currentProduct.images.length > 0
      ? currentProduct.images
      : [mainImg, mainImg, mainImg, mainImg];

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0] || mainImg);

  useEffect(() => {
    const newMain = currentProduct?.image || "/images/product_zene.png";
    const newImgs =
      currentProduct?.images && currentProduct.images.length > 0
        ? currentProduct.images
        : [newMain, newMain, newMain, newMain];
    setSelectedImage(newImgs[0] || newMain);
    setActiveImgIdx(0);
    setQuantity(1);
  }, [currentProduct]);

  const [activeTab, setActiveTab] = useState<"info" | "uses" | "dosage" | "reviews">("info");
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Net Banking / NEFT");
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Lock body scroll & listen to Escape key when off-canvas drawer is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOrderModalOpen(false);
      }
    };
    if (orderModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [orderModalOpen]);

  const price =
    currentProduct?.customer_price ||
    currentProduct?.distributor_price ||
    currentProduct?.distributorPrice ||
    currentProduct?.mrp ||
    120;
  const mrp = currentProduct?.mrp || Math.round(price * 1.25);
  const discountPct = Math.round(((mrp - price) / mrp) * 100);
  const subtotal = price * quantity;
  const gst = subtotal * 0.18;
  const grandTotal = subtotal + gst;

  const categoryName =
    currentProduct?.category_name || currentProduct?.category || "Pharmaceuticals";
  // Dynamic helper functions for Hero and Overview sections
  const kickerText = (() => {
    const form = (currentProduct?.dosage_form || currentProduct?.dosageForm || "").toLowerCase();
    const cat = (currentProduct?.category_name || currentProduct?.category || "").toLowerCase();
    if (form.includes("inject") || cat.includes("inject") || form.includes("ampoule") || form.includes("pfs")) {
      return "PRECISION IN EVERY AMPOULE";
    }
    if (form.includes("syrup") || form.includes("suspension") || form.includes("liquid")) {
      return "ADVANCED LIQUID FORMULATION";
    }
    if (form.includes("capsule")) {
      return "TARGETED CAPSULE TECHNOLOGY";
    }
    if (form.includes("cream") || form.includes("gel") || form.includes("ointment")) {
      return "DERMATOLOGICAL PRECISION";
    }
    return "CERTIFIED PHARMACEUTICAL EXCELLENCE";
  })();

  const renderHeroTitle = (name: string) => {
    if (!name) return <span>EVVAI PHARMA</span>;
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return <span className="text-[#0B2545]">{words[0]}</span>;
    }
    const mainPart = words.slice(0, -1).join(" ");
    const highlightPart = words[words.length - 1];
    return (
      <>
        <span className="text-[#0B2545]">{mainPart} </span>
        <span className="text-[#A71380]">{highlightPart}</span>
      </>
    );
  };

  const dynamicBenefit = (() => {
    const cat = (currentProduct?.category_name || currentProduct?.category || "").toLowerCase();
    const name = (currentProduct?.name || "").toLowerCase();
    if (name.includes("nerve") || cat.includes("neuro") || cat.includes("inject")) {
      return "Supports Nerve Health & Vitality";
    }
    if (cat.includes("cardio") || name.includes("cardio")) {
      return "Supports Cardiovascular Health";
    }
    if (cat.includes("gastro") || cat.includes("digest")) {
      return "Optimizes Digestive & Gut Health";
    }
    if (cat.includes("ortho") || name.includes("calcium") || name.includes("joint")) {
      return "Promotes Bone & Joint Strength";
    }
    if (cat.includes("anti") || name.includes("zene") || name.includes("cold") || name.includes("fever")) {
      return "Rapid Therapeutic Relief & Action";
    }
    return "Optimal Bioavailability & Recovery";
  })();

  const dynamicPills = (() => {
    const name = (currentProduct?.name || "").toLowerCase();
    const cat = (currentProduct?.category_name || currentProduct?.category || "").toLowerCase();
    if (name.includes("nerve") || cat.includes("neuro")) {
      return [
        { label: "Supports Nerve Regeneration", iconKey: "dna", color: "text-[#A71380]" },
        { label: "Helps Reduce Neuropathic Pain", iconKey: "bolt", color: "text-amber-500" },
        { label: "Improves Nerve Function", iconKey: "brain", color: "text-indigo-600" },
        { label: "Ideal for B12 Deficiency", iconKey: "shield", color: "text-emerald-600" },
      ];
    }
    if (cat.includes("inject") || name.includes("shot") || name.includes("ampoule")) {
      return [
        { label: "Instant Bio-Absorption", iconKey: "syringe", color: "text-blue-600" },
        { label: "Ultra-High Purity Assay", iconKey: "sparkles", color: "text-amber-500" },
        { label: "Zero Contamination Seal", iconKey: "shield", color: "text-emerald-600" },
        { label: "Rapid Clinical Action", iconKey: "bolt", color: "text-purple-600" },
      ];
    }
    return [
      { label: "Fever & Pain Relief", iconKey: "thermometer", color: "text-rose-500" },
      { label: "Fast Bioavailability", iconKey: "bolt", color: "text-amber-500" },
      { label: "Doctor Prescribed Formulation", iconKey: "stethoscope", color: "text-[#A71380]" },
      { label: "WHO-GMP Certified Batch", iconKey: "microscope", color: "text-blue-600" },
    ];
  })();

  const renderDynamicPillSvg = (iconKey: string) => {
    switch (iconKey) {
      case "dna":
        return (
          <svg className="w-4 h-4 text-[#A71380]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 15c6.667-6 13.333 0 20-6" />
            <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
            <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
            <path d="M17 6l-2.5-2.5" /><path d="M14 8l-4-4" /><path d="M7 17l-2.5-2.5" /><path d="M10 16l-4-4" />
          </svg>
        );
      case "bolt":
        return (
          <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        );
      case "brain":
        return (
          <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04z" />
          </svg>
        );
      case "shield":
        return (
          <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );
      case "syringe":
        return (
          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 2 4 4" />
            <path d="m17 7 3-3" />
            <path d="M19 9 8.7 19.3c-.4.4-1 .6-1.6.6H3v-4.1c0-.6.2-1.2.6-1.6L13.9 4" />
            <path d="m14 8 2 2" />
          </svg>
        );
      case "sparkles":
        return (
          <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
          </svg>
        );
      case "thermometer":
        return (
          <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            <circle cx="11.5" cy="17.5" r="1.5" fill="currentColor" />
          </svg>
        );
      case "stethoscope":
        return (
          <svg className="w-4 h-4 text-[#A71380]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3" />
            <path d="M13.5 8a4.5 4.5 0 0 1-9 0" />
            <path d="M9 12.5v3.5a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4v-1.5" />
            <circle cx="18" cy="12" r="2" />
            <path d="M3 3h3" /><path d="M12 3h3" />
          </svg>
        );
      case "microscope":
      default:
        return (
          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18h8" />
            <path d="M3 22h18" />
            <path d="M14 22a7 7 0 1 0 0-14h-1" />
            <path d="M9 14h2" />
            <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
            <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
          </svg>
        );
    }
  };

  const pack = currentProduct?.pack_size || currentProduct?.packSize || "Strip of 10 Tablets";

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `EVV-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderSuccess(orderId);
  };

  const handleSelectRelatedProduct = (rel: any) => {
    setCurrentProduct(rel);
    const relImg = rel.image || rel.images?.[0] || "/images/product_zene.png";
    setSelectedImage(relImg);
    setActiveImgIdx(0);
    setQuantity(1);
    if (rel.id) {
      router.push(`/products/${rel.id}`, { scroll: false });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-8 text-slate-800 font-sans">

      {/* ── DYNAMIC PRODUCT HERO BANNER SECTION (EXACT SCREENSHOT MATCH) ── */}
      <div className="relative rounded-3xl overflow-hidden border border-[#F3D0E9] shadow-sm bg-gradient-to-r from-[#FFF5F9] via-[#FAF0F8] to-[#F5EAF8]">
        {/* Soft Ambient Medical Light & Bokeh Orbs */}
        <div className="absolute right-0 top-0 w-[500px] h-full bg-gradient-to-l from-pink-200/40 via-purple-100/25 to-transparent pointer-events-none" />
        <div className="absolute right-20 -top-10 w-96 h-96 bg-[#A71380]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-40 bg-pink-300/20 rounded-full blur-2xl pointer-events-none" />

        {/* Shiny Floor Reflection Line */}
        <div className="absolute bottom-4 right-10 left-1/3 h-px bg-gradient-to-r from-transparent via-[#A71380]/20 to-transparent pointer-events-none" />

        <div className="relative z-10 px-6 sm:px-10 lg:px-12 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Hero Details: Kicker, Title, Subtitle, 3 Benefit Badges */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-4.5">
            {/* Kicker Pill */}
            <div>
              <span className="text-[11px] sm:text-xs font-black tracking-[0.2em] text-[#A71380] uppercase font-sans">
                {kickerText}
              </span>
            </div>

            {/* Main Hero Product Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-[#0B2545]">
              {renderHeroTitle(currentProduct?.name || "EVVAI Formulation")}
            </h1>

            {/* Hero Subtitle */}
            <p className="text-xs sm:text-sm lg:text-base text-slate-600 font-medium max-w-xl leading-relaxed">
              {currentProduct?.subtitle ||
                "Targeted Neurological Support for a Healthier Tomorrow"}
            </p>

            {/* 3 Circular Feature Pills (Matches Screenshot) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Pill 1 - High Purity Formulation (Flower SVG) */}
              <div className="flex items-center space-x-2.5 bg-white/95 backdrop-blur-sm border border-[#F3D0E9] px-4 py-2 rounded-full shadow-2xs text-xs font-bold text-slate-800 transition-all hover:border-[#A71380]/40">
                <span className="w-6 h-6 rounded-full bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.45 2.1-1.17 2.83A4 4 0 0 1 22 12a4 4 0 0 1-3.17 3.17A4 4 0 0 1 16 18a4 4 0 0 1-4 4 4 4 0 0 1-4-4c0-1.1.45-2.1 1.17-2.83A4 4 0 0 1 2 12a4 4 0 0 1 3.17-3.17A4 4 0 0 1 8 6a4 4 0 0 1 4-4zm0 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                  </svg>
                </span>
                <span className="text-[11px] sm:text-xs text-slate-800 font-bold">High Purity Formulation</span>
              </div>

              {/* Pill 2 - Doctor Trusted Worldwide (Shield SVG) */}
              <div className="flex items-center space-x-2.5 bg-white/95 backdrop-blur-sm border border-[#F3D0E9] px-4 py-2 rounded-full shadow-2xs text-xs font-bold text-slate-800 transition-all hover:border-[#A71380]/40">
                <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12.01l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.65z" />
                  </svg>
                </span>
                <span className="text-[11px] sm:text-xs text-slate-800 font-bold">Doctor Trusted Worldwide</span>
              </div>

              {/* Pill 3 - dynamicBenefit (DNA Helix SVG) */}
              <div className="flex items-center space-x-2.5 bg-white/95 backdrop-blur-sm border border-[#F3D0E9] px-4 py-2 rounded-full shadow-2xs text-xs font-bold text-slate-800 transition-all hover:border-[#A71380]/40">
                <span className="w-6 h-6 rounded-full bg-[#FCE7F3] text-[#A71380] flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 15c6.667-6 13.333 0 20-6" />
                    <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
                    <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
                    <path d="M17 6l-2.5-2.5" />
                    <path d="M14 8l-4-4" />
                    <path d="M7 17l-2.5-2.5" />
                    <path d="M10 16l-4-4" />
                  </svg>
                </span>
                <span className="text-[11px] sm:text-xs text-slate-800 font-bold">{dynamicBenefit}</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual & Script Tag */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center relative">
            {/* Elegant Script Tag at top right */}
            <div className="w-full text-center lg:text-right pb-2">
              <span className="font-serif italic text-2xl sm:text-3xl lg:text-4xl text-[#8E0F6D] select-none tracking-wide">
                Science for Better Lives
              </span>
            </div>

            {/* Product Image Stage (Seamless Floating with Ground Shadow) */}
            <div className="relative w-full max-w-md flex items-center justify-center lg:justify-end py-2">
              <div className="relative group">
                <img
                  src={mainImg}
                  alt={currentProduct?.name}
                  className="max-h-48 sm:max-h-56 lg:max-h-60 max-w-full object-contain drop-shadow-[0_15px_25px_rgba(167,19,128,0.18)] transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── BREADCRUMB TRAIL ─────────────────────────────────────────── */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium overflow-x-auto scrollbar-none pb-2 border-b border-slate-200">
        <Link href="/" className="hover:text-[#A71380] transition-colors flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 01-1 1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/products" className="hover:text-[#A71380] transition-colors">
          Products
        </Link>
        <span className="text-slate-300">/</span>
        <span className="hover:text-[#A71380] transition-colors">{categoryName}</span>
        <span className="text-slate-300">/</span>
        <span className="text-[#0B2545] font-extrabold truncate max-w-xs">{currentProduct?.name}</span>
      </nav>

      {/* ── MAIN 3-COLUMN PRODUCT DETAIL STAGE (EXACT SCREENSHOT LAYOUT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

        {/* ── LEFT COLUMN: Main Stage Image + Horizontal Thumbnails (lg:col-span-5) ── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Stage Image Display Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[420px] relative group shadow-2xs">
            {/* Pack tag badge */}
            <div className="absolute top-4 left-4 bg-[#A71380] text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono z-20 shadow-xs">
              {pack.includes("PFS") ? "1ml PFS" : "Genuine"}
            </div>

            {/* Wishlist Heart Icon */}
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#A71380] shadow-2xs transition-all cursor-pointer z-20"
              title="Add to Wishlist"
            >
              <svg
                className={`w-5 h-5 ${isWishlisted ? "text-[#A71380] fill-[#A71380]" : "currentColor"}`}
                fill={isWishlisted ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Product Image */}
            <img
              src={selectedImage}
              alt={currentProduct?.name}
              className="max-h-80 max-w-full object-contain group-hover:scale-105 transition-transform duration-300 relative z-10"
            />
          </div>

          {/* Horizontal Thumbnail Selector Row (Matches Screenshot Layout) */}
          <div className="grid grid-cols-4 gap-3">
            {galleryImages.slice(0, 4).map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveImgIdx(idx);
                  setSelectedImage(img);
                }}
                className={`h-20 rounded-2xl border-2 p-2 flex items-center justify-center bg-white transition-all cursor-pointer ${activeImgIdx === idx
                  ? "border-[#A71380] ring-2 ring-[#A71380]/20 shadow-md scale-102"
                  : "border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                  }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── MIDDLE COLUMN: Product Specifications & Add to Cart (lg:col-span-4) ── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Category Chip */}
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#F8EAF4] text-[#A71380] px-2.5 py-1 rounded-md font-mono border border-[#F3D0E9]">
              {categoryName}
            </span>
          </div>

          {/* Header Title & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] tracking-tight leading-tight">
              {currentProduct?.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {currentProduct?.composition || pack}
            </p>

            {/* Rating Stars & Reviews */}
            <div className="flex items-center space-x-2 pt-1 text-xs">
              <div className="flex items-center text-amber-400 text-sm font-bold">
                ★★★★★
              </div>
              <span className="font-extrabold text-slate-900 text-xs">4.8</span>
              <span className="text-slate-400 font-medium text-[11px]">(128 reviews)</span>
            </div>
          </div>

          {/* Quick Description */}
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {currentProduct?.subtitle ||
              "High-strength therapeutic formulation manufactured under WHO-GMP compliance to support overall clinical efficacy and patient well-being."}
          </p>

          {/* Pricing Box */}
          <div className="space-y-1 pt-1">
            <div className="flex items-baseline space-x-2 flex-wrap gap-y-1">
              <span className="text-3xl font-black text-[#0B2545] font-mono tracking-tight">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
              {mrp > price && (
                <>
                  <span className="text-sm text-slate-400 line-through font-mono">
                    ₹{(mrp * quantity).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-black text-[#A71380] bg-[#F8EAF4] px-2 py-0.5 rounded-md">
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
              <span>(Inclusive of all taxes)</span>
              {quantity > 1 && (
                <span className="font-semibold text-[#A71380] bg-[#F8EAF4] px-1.5 py-0.5 rounded">
                  ₹{price.toLocaleString("en-IN")} × {quantity} packs
                </span>
              )}
            </div>
          </div>

          {/* In Stock Badge & ETA */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2 text-emerald-700 font-extrabold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>In Stock</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Usually ships within 1–2 business days.
            </p>
          </div>

          {/* Quantity Stepper & Cart Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-900 font-black text-sm flex items-center justify-center hover:bg-slate-100 cursor-pointer shadow-2xs active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 text-center bg-transparent font-black font-mono text-slate-900 text-sm focus:outline-none"
              />
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-900 font-black text-sm flex items-center justify-center hover:bg-slate-100 cursor-pointer shadow-2xs active:scale-95"
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={() => {
                setOrderSuccess(null);
                setOrderModalOpen(true);
              }}
              className="flex-1 bg-[#A71380] hover:bg-[#8E0F6D] text-white py-3 px-5 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-[#A71380]/20 flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Add to Cart</span>
            </button>

            {/* Buy Now Button */}
            <button
              onClick={() => {
                setOrderSuccess(null);
                setOrderModalOpen(true);
              }}
              className="bg-white text-[#A71380] border-2 border-[#A71380] hover:bg-[#F8EAF4] py-2.5 px-6 rounded-xl text-xs font-extrabold transition-all cursor-pointer uppercase tracking-wider"
            >
              Buy Now
            </button>
          </div>

          {/* 4 Trust Badges Strip (Matches Screenshot) */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 text-[11px] text-slate-600 font-semibold">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">Genuine Products</span>
                <span className="text-[10px] text-slate-400 block font-normal">Quality Assured</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">Secure Packaging</span>
                <span className="text-[10px] text-slate-400 block font-normal">Safe Delivery</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-200 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </span>
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">Easy Returns</span>
                <span className="text-[10px] text-slate-400 block font-normal">Hassle Free</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              <div>
                <span className="font-bold text-slate-900 block text-[11px]">Dedicated Support</span>
                <span className="text-[10px] text-slate-400 block font-normal">Always Here</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: EVVAI BRAND PROMISE + NEED BULK ORDERS CARDS ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* EVVAI BRAND PROMISE CARD */}
          <div className="bg-[#F8EAF4]/60 border border-[#F3D0E9] rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="space-y-1 border-b border-[#F3D0E9] pb-3">
              <span className="text-xl font-black text-[#A71380] tracking-tight font-mono block">
                evvai
              </span>
              <h3 className="text-sm font-black text-[#0B2545]">
                Trusted by Doctors. Chosen by You.
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 font-medium">
              <div className="flex items-center space-x-2">
                <span className="text-[#A71380] font-black text-sm">✓</span>
                <span>High-quality &amp; affordable</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#A71380] font-black text-sm">✓</span>
                <span>Manufactured in WHO-GMP Facility</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#A71380] font-black text-sm">✓</span>
                <span>Analytical QA/QC Tested</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#A71380] font-black text-sm">✓</span>
                <span>Safe &amp; effective formulation</span>
              </div>
            </div>
          </div>

          {/* NEED BULK ORDERS CARD (MATCHES SCREENSHOT) */}
          <div className="bg-[#F8EAF4]/40 border border-[#F3D0E9] rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-[#0B2545]">Need Bulk Orders?</h4>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Get special pricing for distributors &amp; hospitals.
                </p>
              </div>
              <span className="p-2 bg-white rounded-xl border border-[#F3D0E9] text-[#A71380] text-base shrink-0 shadow-2xs">
                🏥
              </span>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center space-x-1.5 text-xs font-black text-[#A71380] hover:text-[#8E0F6D] group"
            >
              <span>Contact Sales</span>
              <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>
        </div>

      </div>

      {/* ── HORIZONTAL PRODUCT INFORMATION TABS SECTION (MATCHES SCREENSHOT) ── */}
      <div className="space-y-6 pt-4 border-t border-slate-200">
        {/* Underline Nav Tabs */}
        <div className="flex border-b border-slate-200 text-xs sm:text-sm font-bold gap-6 overflow-x-auto scrollbar-none pb-3">
          <button
            onClick={() => setActiveTab("info")}
            className={`transition-all cursor-pointer whitespace-nowrap pb-2 border-b-2 ${activeTab === "info"
              ? "border-[#A71380] text-[#A71380] font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("uses")}
            className={`transition-all cursor-pointer whitespace-nowrap pb-2 border-b-2 ${activeTab === "uses"
              ? "border-[#A71380] text-[#A71380] font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            Uses &amp; Indications
          </button>

          <button
            onClick={() => setActiveTab("dosage")}
            className={`transition-all cursor-pointer whitespace-nowrap pb-2 border-b-2 ${activeTab === "dosage"
              ? "border-[#A71380] text-[#A71380] font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            Dosage &amp; Admin
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`transition-all cursor-pointer whitespace-nowrap pb-2 border-b-2 ${activeTab === "reviews"
              ? "border-[#A71380] text-[#A71380] font-black"
              : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
          >
            Reviews (128)
          </button>
        </div>

        {/* Tab Content Panel (Dynamic according to activeTab) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">

          {/* Left Side: Dynamic Tab View Content */}
          <div className="lg:col-span-7 space-y-4">
            {activeTab === "info" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-sm font-black text-[#0B2545] mb-1.5">Product Overview</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {currentProduct?.name} is a certified pharmaceutical formulation manufactured under strict WHO-GMP guidelines.
                    Laboratory-tested for maximum purity, analytical stability, and active bioavailability.
                    Specifically prescribed for clinical therapy, symptom mitigation, and enhanced patient recovery.
                  </p>
                </div>

                {/* 4 Feature Icon Pills (Enhanced Vector Design) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {dynamicPills.map((pill, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-b from-[#FDF2F8] to-[#F8EAF4] border border-[#F3D0E9] p-3.5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 transition-all hover:shadow-xs hover:border-[#A71380]/40 group"
                    >
                      <span className="w-9 h-9 rounded-xl bg-white border border-[#F3D0E9] flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform shrink-0">
                        {renderDynamicPillSvg(pill.iconKey)}
                      </span>
                      <span className="text-[11px] font-extrabold text-[#0B2545] leading-snug">
                        {pill.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "uses" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-black text-[#0B2545]">Primary Uses &amp; Therapeutic Indications</h3>
                <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                  {Array.isArray(currentProduct?.uses) ? (
                    currentProduct.uses.map((useItem: any, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-[#A71380] font-black text-sm">✓</span>
                        <span>{useItem}</span>
                      </li>
                    ))
                  ) : currentProduct?.uses ? (
                    <li className="flex items-start space-x-2">
                      <span className="text-[#A71380] font-black text-sm">✓</span>
                      <span>{currentProduct.uses}</span>
                    </li>
                  ) : (
                    <>
                      <li className="flex items-start space-x-2">
                        <span className="text-[#A71380] font-black text-sm">✓</span>
                        <span><strong>Therapeutic Recovery &amp; Support:</strong> Promotes cellular repair and symptomatic stability under certified healthcare guidelines.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-[#A71380] font-black text-sm">✓</span>
                        <span><strong>Targeted Bio-Absorption:</strong> High active formulation designed for fast pharmacokinetic clearance and long-lasting efficacy.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-[#A71380] font-black text-sm">✓</span>
                        <span><strong>Doctor Recommended Regimen:</strong> Trusted across top healthcare institutions and clinics for zero-defect quality.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {activeTab === "dosage" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="text-sm font-black text-[#0B2545]">Recommended Dosage &amp; Administration</h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
                  {currentProduct?.dosage ? (
                    <p>• <strong>Prescribed Dosage:</strong> {currentProduct.dosage}</p>
                  ) : (
                    <>
                      <p>• <strong>Standard Adults Regimen:</strong> As prescribed by a certified medical practitioner.</p>
                      <p>• <strong>Specialist Administration:</strong> Follow strict clinical hygiene and manufacturer storage guidelines.</p>
                    </>
                  )}
                  <p>• <strong>Administration Mode:</strong> Take orally or administer via certified clinical protocol.</p>
                  <p className="text-rose-700 font-bold border-t border-slate-200 pt-2"> Important: Do not exceed the recommended daily dosage without medical advice.</p>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#0B2545]">Customer &amp; Doctor Ratings</h3>
                    <div className="flex items-center space-x-1.5 pt-0.5">
                      <span className="text-amber-400 font-black text-sm">★★★★★</span>
                      <span className="font-black text-xs text-slate-900">4.8 out of 5</span>
                      <span className="text-slate-400 text-[11px]">(128 ratings)</span>
                    </div>
                  </div>
                  <button className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs">
                    Write Review
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">Dr. Rajesh V. (MBBS, MD)</span>
                      <span className="text-amber-400 text-xs">★★★★★</span>
                    </div>
                    <p className="text-slate-600 italic">&quot;Highest analytical batch purity. Always reliable formulation and fast therapeutic response for my patients.&quot;</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">Apollo Med Store</span>
                      <span className="text-amber-400 text-xs">★★★★★</span>
                    </div>
                    <p className="text-slate-600 italic">&quot;Excellent blister packaging, prompt B2B delivery, and verified digital COA clearances.&quot;</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Key Information Table (Enhanced Premium Design) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/50 rounded-2xl p-5 border border-slate-200/90 space-y-3 text-xs shadow-2xs">
            <div className="flex items-center space-x-2 pb-1.5 border-b border-slate-200">
              <span className="w-2 h-2 rounded-full bg-[#A71380]" />
              <h3 className="text-xs font-black text-[#0B2545] uppercase tracking-wider">
                Key Information
              </h3>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-500 font-medium">Composition</span>
              <span className="font-extrabold text-slate-900 text-right max-w-[200px] truncate" title={currentProduct?.composition || "Active Therapeutic API"}>
                {currentProduct?.composition || "Active Therapeutic API"}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-500 font-medium">Dosage Form</span>
              <span className="font-bold text-slate-800">{currentProduct?.dosage_form || currentProduct?.dosageForm || "Injectable / Tablet"}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-500 font-medium">Pack Size</span>
              <span className="font-bold text-slate-800">{pack}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-500 font-medium">Category</span>
              <span className="font-black text-[#A71380] bg-[#F8EAF4] border border-[#F3D0E9] px-2.5 py-0.5 rounded-full text-[11px]">
                {categoryName}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-500 font-medium">Manufacturer</span>
              <span className="font-bold text-slate-800 text-right">{currentProduct?.manufacturer || "EVVAI Pharmaceuticals Pvt. Ltd."}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
              <span className="text-slate-500 font-medium">SKU</span>
              <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                {currentProduct?.sku || "EV-NXT-B12"}
              </span>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="text-slate-500 font-medium">Storage</span>
              <span className="font-medium text-slate-700 text-right text-[11px] max-w-[210px]">
                {currentProduct?.storage || "Store below 25°C. Protect from light."}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── RELATED PRODUCTS ROW (MATCHES SCREENSHOT) ───────────────────── */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0B2545] tracking-tight">Related Products</h2>
              <p className="text-xs text-slate-500 font-medium">
                Explore more {categoryName.toLowerCase()} and neurological care products
              </p>
            </div>
            <Link href="/products" className="text-xs font-bold text-[#A71380] hover:underline flex items-center space-x-1">
              <span>View All Products</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {/* Carousel container with Left/Right Buttons */}
          <div className="relative flex items-center gap-2 sm:gap-3">
            {/* Left Scroll Button */}
            <button
              onClick={() => {
                const el = document.getElementById("related-products-carousel");
                if (el) el.scrollBy({ left: -320, behavior: "smooth" });
              }}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-[#A71380] hover:border-[#A71380] shadow-xs flex items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-105 z-10"
              title="Previous"
            >
              &larr;
            </button>

            {/* Scrollable / Grid Cards */}
            <div
              id="related-products-carousel"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 overflow-x-auto scrollbar-none py-1"
            >
              {relatedProducts.slice(0, 4).map((rel) => {
                const relPrice = rel.customerPrice || rel.customer_price || rel.mrp || 85;
                const relMrp = rel.mrp || Math.round(relPrice * 1.2);
                const relDiscount = Math.round(((relMrp - relPrice) / relMrp) * 100);

                return (
                  <div
                    key={rel.id}
                    onClick={() => handleSelectRelatedProduct(rel)}
                    className="bg-white border border-slate-200/90 hover:border-[#A71380] rounded-2xl p-3 flex items-center gap-3 transition-all hover:shadow-md group cursor-pointer relative"
                  >
                    {/* Left: Image Container */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#F8EAF4]/30 rounded-xl p-2 flex items-center justify-center shrink-0 border border-[#F3D0E9]/40 group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={rel.image || "/images/product_zene.png"}
                        alt={rel.name}
                        className="max-h-full max-w-full object-contain drop-shadow-xs"
                      />
                    </div>

                    {/* Right: Details & Pricing & Cart */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-black text-xs sm:text-sm text-[#0B2545] group-hover:text-[#A71380] transition-colors truncate">
                        {rel.name}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-400 truncate">
                        {rel.composition || rel.subtitle || rel.pack_size || rel.packSize || "Clinical Formulation"}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="flex items-baseline space-x-1.5">
                            <span className="text-sm font-black text-[#0B2545] font-mono">
                              ₹{relPrice.toLocaleString("en-IN")}
                            </span>
                            {relMrp > relPrice && (
                              <span className="text-[10px] text-slate-400 line-through font-mono">
                                ₹{relMrp.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          {relDiscount > 0 && (
                            <span className="text-[10px] font-extrabold text-[#A71380] block">
                              {relDiscount}% OFF
                            </span>
                          )}
                        </div>

                        {/* Cart Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRelatedProduct(rel);
                            setOrderSuccess(null);
                            setOrderModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-xl bg-[#A71380] hover:bg-[#8E0F6D] text-white flex items-center justify-center shrink-0 shadow-2xs transition-all hover:scale-105 cursor-pointer"
                          title="Add to Cart"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => {
                const el = document.getElementById("related-products-carousel");
                if (el) el.scrollBy({ left: 320, behavior: "smooth" });
              }}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-[#A71380] hover:border-[#A71380] shadow-xs flex items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-105 z-10"
              title="Next"
            >
              &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── PARTNER WITH EVVAI PHARMA CTA BANNER (EXACT MATCH SCREENSHOT WITH FLOWER SVG) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F8EAF4] via-[#F3D0E9]/70 to-[#E0E7FF]/60 border border-[#F3D0E9] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
        {/* Background Botanical Flower Watermark SVG */}
        <svg
          className="absolute -right-10 -bottom-10 w-52 h-52 text-[#A71380]/10 pointer-events-none transform rotate-12"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.45 2.1-1.17 2.83A4 4 0 0 1 22 12a4 4 0 0 1-3.17 3.17A4 4 0 0 1 16 18a4 4 0 0 1-4 4 4 4 0 0 1-4-4c0-1.1.45-2.1 1.17-2.83A4 4 0 0 1 2 12a4 4 0 0 1 3.17-3.17A4 4 0 0 1 8 6a4 4 0 0 1 4-4zm0 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>

        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[#A71380] text-white flex items-center justify-center shrink-0 shadow-md">
            {/* Flower / Blossom SVG */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.45 2.1-1.17 2.83A4 4 0 0 1 22 12a4 4 0 0 1-3.17 3.17A4 4 0 0 1 16 18a4 4 0 0 1-4 4 4 4 0 0 1-4-4c0-1.1.45-2.1 1.17-2.83A4 4 0 0 1 2 12a4 4 0 0 1 3.17-3.17A4 4 0 0 1 8 6a4 4 0 0 1 4-4zm0 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </div>
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#A71380] font-mono block">
              PARTNER WITH EVVAI PHARMA
            </span>
            <h3 className="text-lg sm:text-xl font-black text-[#0B2545]">
              Let&apos;s Create a Healthier Future Together
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Whether you&apos;re a distributor, hospital, or healthcare provider — we&apos;d love to hear from you.
            </p>
          </div>
        </div>

        <Link
          href="/contact"
          className="relative z-10 bg-white border-2 border-[#A71380] text-[#A71380] hover:bg-[#A71380] hover:text-white px-6 py-3 rounded-xl text-xs font-extrabold transition-all shrink-0 uppercase tracking-wider flex items-center space-x-2 shadow-2xs group cursor-pointer"
        >
          <span>Get in Touch</span>
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </Link>
      </div>

      {/* ── 4 TRUST BADGES BOTTOM STRIP (WITH CRISP VECTOR ICONS) ────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">WHO-GMP</h4>
            <p className="text-[11px] text-slate-500 font-medium">Certified Facility</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18h8" />
              <path d="M3 22h18" />
              <path d="M14 22a7 7 0 1 0 0-14h-1" />
              <path d="M9 14h2" />
              <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
              <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">100% Quality</h4>
            <p className="text-[11px] text-slate-500 font-medium">Analytical Tested</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
              <path d="M15 18H9" />
              <path d="M19 18h2a1 1 0 0 0 1-1v-5.5a1.5 1.5 0 0 0-.44-1.06L18.5 7.38A1.5 1.5 0 0 0 17.44 7H14v11h1" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">Pan-India</h4>
            <p className="text-[11px] text-slate-500 font-medium">Express Supply</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#A71380] border border-[#F3D0E9] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h4.78" />
            </svg>
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">Better Health</h4>
            <p className="text-[11px] text-slate-500 font-medium">For All Lives</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT-SIDE OFF-CANVAS CHECKOUT DRAWER (ULTRA-SMOOTH SLIDE TRANSITION) ── */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-500 ease-in-out ${orderModalOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
      >
        {/* Dark Backdrop Blur Overlay */}
        <div
          onClick={() => setOrderModalOpen(false)}
          className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-500 ease-in-out cursor-pointer ${orderModalOpen ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Off-Canvas Slide Drawer Panel */}
        <div
          className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col justify-between transition-transform duration-500 ease-out border-l border-slate-200 ${orderModalOpen ? "translate-x-0" : "translate-x-full"
            }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Drawer Header with EVVAI Branding */}
          <div className="p-6 bg-gradient-to-br from-[#F8EAF4] via-white to-slate-50 border-b border-[#F3D0E9] relative space-y-2 shrink-0">
            <button
              onClick={() => setOrderModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer shadow-2xs transition-all hover:scale-105"
              title="Close Drawer"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-[#A71380] tracking-tight font-mono">
                evvai
              </span>
              <span className="text-[10px] font-extrabold text-[#A71380] uppercase bg-white px-2.5 py-0.5 rounded-full border border-[#F3D0E9] shadow-2xs">
                Direct Dispatch
              </span>
            </div>

            <div className="space-y-0.5 pt-1">
              <h2 className="text-lg font-black text-[#0B2545] tracking-tight leading-snug">
                {currentProduct?.name}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <span className="text-[#A71380] font-black">✓</span>
                <span>Trusted by Doctors. Chosen by You.</span>
              </p>
            </div>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {orderSuccess ? (
              <div className="space-y-6 text-center py-8 my-auto animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-[#F8EAF4] text-[#A71380] border-2 border-[#F3D0E9] rounded-3xl flex items-center justify-center mx-auto text-4xl font-black shadow-lg">
                  ✓
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[#0B2545]">Order Placed Successfully!</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Order Reference ID: <strong className="font-mono text-[#A71380] font-black text-sm">{orderSuccess}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto pt-2">
                    Your order has been registered in EVVAI dispatch system. Our support team will contact you shortly to confirm shipment.
                  </p>
                </div>
                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="w-full bg-[#0B2545] hover:bg-[#07192e] text-white py-3.5 rounded-xl font-bold text-xs cursor-pointer uppercase tracking-wider shadow-md transition-all"
                >
                  Done &amp; Back to Details
                </button>
              </div>
            ) : (
              <form id="drawer-checkout-form" onSubmit={handlePlaceOrder} className="space-y-5 text-xs">
                {/* Selected Item Summary Card */}
                <div className="bg-[#F8EAF4]/40 border border-[#F3D0E9] rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center space-x-3 border-b border-[#F3D0E9] pb-3">
                    <div className="w-14 h-14 bg-white rounded-xl p-1.5 border border-slate-200 flex items-center justify-center shrink-0">
                      <img
                        src={selectedImage}
                        alt={currentProduct?.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="font-black text-xs text-[#0B2545] truncate">{currentProduct?.name}</h4>
                      <p className="text-[11px] font-semibold text-slate-500">{pack}</p>
                      <p className="text-xs font-mono font-bold text-[#A71380]">₹{price.toFixed(2)} / pack</p>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span>Quantity Ordered:</span>
                      <span className="font-bold text-slate-900">{quantity} Packs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Item Subtotal:</span>
                      <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span className="font-bold text-slate-900">₹{gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-[#A71380] pt-2 border-t border-[#F3D0E9]">
                      <span>Grand Total Payable:</span>
                      <span className="text-sm">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Customer / Entity Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apollo Pharmacy / Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium text-xs focus:bg-white focus:border-[#A71380] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Contact Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium text-xs focus:bg-white focus:border-[#A71380] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Payment Option
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-xs focus:bg-white focus:border-[#A71380] focus:outline-none transition-all"
                    >
                      <option value="Net Banking / NEFT">Net Banking / NEFT Transfer</option>
                      <option value="UPI / Instant QR Code">UPI / Instant QR Code</option>
                      <option value="Cash / Cheque on Delivery">Cash / Cheque on Delivery (COD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Delivery Destination Address *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter complete delivery destination address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium text-xs focus:bg-white focus:border-[#A71380] focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Sticky Action Footer */}
          {!orderSuccess && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                type="submit"
                form="drawer-checkout-form"
                className="w-full bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#740B58] text-white py-3.5 px-6 rounded-xl font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                <span>Confirm &amp; Place Order (₹{grandTotal.toFixed(2)})</span>
                <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
