"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  productsAPI,
  ordersAPI,
  getStoredUser,
  StoredUser,
  ProductItem,
  OrderData,
} from "@/lib/api";
import { getProductImageUrl } from "@/lib/packagingUtils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { MobileOrderTracking } from "./MobileOrderTracking";

const HERO_SLIDES = [
  {
    id: 0,
    badge: "TRUSTED CARE",
    titleLine1: "Trusted Medicines.",
    titleLine2: "Better Health.",
    titleColor2: "text-[#C00065]",
    subtitle: "High-quality, affordable and trusted pharmaceutical products for a healthier tomorrow.",
    ctaText: "Explore Products",
    ctaLink: "/products/",
    cursiveLine1: "A Healthier Tomorrow",
    cursiveLine2: "In Your Hands",
    swooshColor: "text-[#C00065]",
    btnBg: "bg-[#C00065] hover:bg-[#a60057]",
    image: "/images/doctor_onboarding.jpg",
    bgGradient: "from-[#FDEBF4] via-[#FFFFFF] to-[#E3EFFD]",
  },
  {
    id: 1,
    badge: "WHO-GMP CERTIFIED",
    titleLine1: "100% Genuine.",
    titleLine2: "Quality Assured.",
    titleColor2: "text-[#C00065]",
    subtitle: "Direct batch traceability, lab tested certifications & hospital-grade authentic formulations.",
    ctaText: "View Catalog",
    ctaLink: "/products/",
    cursiveLine1: "100% Genuine Quality",
    cursiveLine2: "Batch Guaranteed",
    swooshColor: "text-[#C00065]",
    btnBg: "bg-[#C00065] hover:bg-[#a60057]",
    image: "/images/product_nxtnerve.png",
    bgGradient: "from-[#FDEBF4] via-[#FFFFFF] to-[#E3EFFD]",
  },
  {
    id: 2,
    badge: "EXPERT ASSISTANCE",
    titleLine1: "Pharmacist Care.",
    titleLine2: "At Your Fingertips.",
    titleColor2: "text-[#C00065]",
    subtitle: "Free dosage guidance, prescription assistance and dedicated priority customer support.",
    ctaText: "Consult Now",
    ctaLink: "/contact/",
    cursiveLine1: "24/7 Support & Care",
    cursiveLine2: "Always Near You",
    swooshColor: "text-[#C00065]",
    btnBg: "bg-[#C00065] hover:bg-[#a60057]",
    image: "/images/doctor_onboarding.jpg",
    bgGradient: "from-[#FDEBF4] via-[#FFFFFF] to-[#E3EFFD]",
  },
];

export const MobileCustomerDashboard: React.FC = () => {
  const router = useRouter();
  const { addToCart, updateQuantity, removeFromCart, cartItems, cartCount } = useCart();
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState<OrderData | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const stored = authUser || getStoredUser();
        if (isMounted) setUser(stored);

        const [prodsRes, ordersRes] = await Promise.allSettled([
          productsAPI.list(),
          ordersAPI.getMyOrders(),
        ]);

        if (isMounted) {
          if (prodsRes.status === "fulfilled") setProducts(prodsRes.value || []);
          if (ordersRes.status === "fulfilled") setOrders(ordersRes.value || []);
        }
      } catch (err) {
        console.error("Failed to load customer dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [authUser]);

  // Auto-scroll banner slides every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Touch swipe support for hero slides
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (diff > 40) {
      // Swiped left -> next slide
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    } else if (diff < -40) {
      // Swiped right -> prev slide
      setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    }
  };

  // Dynamic Greeting based on current local time
  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const dynamicGreeting = getDynamicGreeting();

  // Wishlist toggle
  const toggleWishlist = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Cart quantity lookup helper
  const getProductCartQty = (productId: number) => {
    const found = cartItems.find((it) => it.product && it.product.id === productId);
    return found ? found.quantity : 0;
  };

  const handleAddToCart = (e: React.MouseEvent, prod: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(prod, 1);
    showToast(`Added ${prod.brand_name || prod.name} to cart`);
  };

  const handleIncrement = (e: React.MouseEvent, prod: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQty = getProductCartQty(prod.id);
    updateQuantity(prod.id, currentQty + 1);
  };

  const handleDecrement = (e: React.MouseEvent, prod: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQty = getProductCartQty(prod.id);
    if (currentQty <= 1) {
      removeFromCart(prod.id);
      showToast(`Removed from cart`);
    } else {
      updateQuantity(prod.id, currentQty - 1);
    }
  };

  const showToast = (msg: string) => {
    setAddedToast(msg);
    setTimeout(() => {
      setAddedToast(null);
    }, 2200);
  };

  // User Greeting Info
  const effectiveUser = user || authUser;
  const rawName = effectiveUser?.full_name || "Arun";
  const firstName = rawName.trim().split(" ")[0] || "Arun";

  // Active Order info
  const latestOrder = orders.length > 0 ? orders[0] : null;

  // Fallback demo order if user has no placed order yet
  const displayOrder = latestOrder || {
    id: 78452,
    order_code: "EVV-ORD-78452",
    order_status: "Shipped",
    total_amount: 879,
    items: [{ id: 1 }, { id: 2 }, { id: 3 }],
    created_at: new Date().toISOString(),
  };

  // Helper for order status stage calculation (0 = Confirmed, 1 = Packed, 2 = Shipped, 3 = Delivered)
  const getOrderProgressStage = (orderStatus: string = "") => {
    const s = orderStatus.toLowerCase();
    if (s.includes("deliver")) return 3;
    if (s.includes("ship") || s.includes("transit")) return 2;
    if (s.includes("pack")) return 1;
    return 0; // Confirmed
  };

  const currentStage = getOrderProgressStage(displayOrder.order_status);

  // If user tapped live tracking
  if (trackingOrder) {
    return (
      <MobileOrderTracking
        order={trackingOrder}
        onBack={() => setTrackingOrder(null)}
      />
    );
  }

  // Recommended Products Fallback list if API returns empty
  const defaultRecommendedProducts = [
    {
      id: 101,
      name: "NXTNERVe B12 Injection",
      brand_name: "NXTNERVe B12 Injection",
      composition: "Mecobalamin 1500 mcg",
      customer_price: 245,
      mrp: 290,
      discount: "16% OFF",
      rating: 4.8,
      reviews: 128,
      image_url: "/images/product_nxtnerve.png",
      slug: "nxtnerve-b12-injection",
    },
    {
      id: 102,
      name: "NXTLife Glutathione",
      brand_name: "NXTLife Glutathione",
      composition: "Glutathione 600 mg",
      customer_price: 320,
      mrp: 380,
      discount: "16% OFF",
      rating: 4.7,
      reviews: 96,
      image_url: "/images/product_nxtlife.jpg",
      slug: "nxtlife-glutathione",
    },
    {
      id: 103,
      name: "EvD3 Nano Shots",
      brand_name: "EvD3 Nano Shots",
      composition: "Vitamin D3 60000 IU",
      customer_price: 180,
      mrp: 220,
      discount: "16% OFF",
      rating: 4.6,
      reviews: 72,
      image_url: "/images/product_evd3.jpg",
      slug: "evd3-nano-shots",
    },
  ];

  const displayProducts = products.length > 0 ? products : defaultRecommendedProducts;
  const currentSlideData = HERO_SLIDES[activeSlide];

  return (
    <MobileAppShell activeTab="home" hideHeader={true}>
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-14 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-[#0B2545] text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-xl flex items-center justify-between border border-blue-900/40">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </span>
              <span className="truncate max-w-[200px]">{addedToast}</span>
            </div>
            <Link
              href="/customer/checkout/"
              className="text-[#f1a4dc] hover:text-white text-[11px] font-bold underline shrink-0 ml-2"
            >
              Checkout →
            </Link>
          </div>
        </div>
      )}

      <div className="px-4 pt-3 pb-6 space-y-4 font-sans bg-[#FAFBFD]">
        {/* 1. TOP BRAND HEADER ROW (Exact Match to Screenshot) */}
        <header className="flex items-center justify-between pt-1">
          {/* Left: EVVAI Logo & Tagline */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/images/evvai_icon.png"
                alt="EVVAI Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/pharmachain_logo.png";
                }}
              />
            </div>
            <div>
              <span className="text-[13px] font-black text-[#0B2545] tracking-tight block leading-tight uppercase font-sans">
                EVVAI
              </span>
              <span className="text-[8px] font-bold text-[#0B2545] tracking-wider block uppercase -mt-0.5">
                PHARMACEUTICALS
              </span>
              <span className="text-[7.5px] font-semibold text-[#C00065] block leading-none">
                Your Care is our Medicine !
              </span>
            </div>
          </Link>

          {/* Right: Dynamic Time Greeting, Notification & Cart */}
          <div className="flex items-center space-x-3">
            {/* Dynamic Greeting Pill */}
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-medium block leading-tight">
                {dynamicGreeting}
              </span>
              <span className="text-xs font-black text-[#0B2545] flex items-center justify-end space-x-0.5 leading-tight">
                <span>{firstName}</span>
                <span>👋</span>
              </span>
            </div>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => router.push("/customer/orders/")}
              className="relative p-2 text-slate-700 hover:text-[#0B2545] active:scale-90 transition-transform cursor-pointer"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                3
              </span>
            </button>

            {/* Shopping Cart Icon with Badge */}
            <Link
              href="/customer/checkout/"
              className="relative p-2 text-slate-700 hover:text-[#0B2545] active:scale-90 transition-transform"
              aria-label="Cart"
            >
              <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#C00065] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {cartCount > 0 ? cartCount : 2}
              </span>
            </Link>
          </div>
        </header>

        {/* 2. SEARCH BAR WITH SCANNER (Exact Match to Screenshot) */}
        <div className="relative">
          <div className="flex items-center w-full h-11 px-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] focus-within:border-[#C00065] transition-colors">
            <svg className="w-4.5 h-4.5 text-slate-400 shrink-0 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/products/?q=${encodeURIComponent(searchQuery)}`);
                }
              }}
              placeholder="Search medicines, salts, brands..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden font-medium"
            />
            {/* Viewfinder / Barcode Scanner Icon */}
            <button
              type="button"
              onClick={() => router.push("/products/")}
              className="p-1 text-slate-400 hover:text-slate-600 active:scale-90 transition-transform shrink-0 cursor-pointer"
              title="Scan Prescription"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2m-10 0H5a2 2 0 01-2-2v-2" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3. HERO PROMO BANNER CAROUSEL (3 Auto-Scrolling Slides) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`relative rounded-[24px] bg-gradient-to-r ${currentSlideData.bgGradient} p-4.5 overflow-hidden border border-pink-100/80 shadow-[0_4px_20px_rgba(192,0,101,0.05)] min-h-[170px] transition-all duration-500`}
        >
          {/* Subtle Ambient Glow Arch on Right */}
          <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-white/60 to-transparent pointer-events-none -z-0" />

          {/* Cursive Slogan on Top Right (Clear of Image) */}
          <div className="absolute top-2 right-2.5 z-20 text-right pointer-events-none select-none max-w-[130px]">
            <div className="inline-block transform -rotate-2">
              <span
                style={{ fontFamily: "'Caveat', 'Dancing Script', cursive, sans-serif" }}
                className="text-[#C00065] text-[11.5px] sm:text-xs font-bold tracking-tight block leading-[1.15] italic drop-shadow-2xs"
              >
                {currentSlideData.cursiveLine1}<br />
                {currentSlideData.cursiveLine2}
              </span>
              {/* Curved Swoosh Underline */}
              <svg className={`w-20 h-2 ${currentSlideData.swooshColor} ml-auto mt-0.5 opacity-90`} viewBox="0 0 100 10" fill="none">
                <path d="M2 3 Q 50 10, 98 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            {/* Left Texts & Action Button */}
            <div className="w-[58%] space-y-1 pr-1 z-10">
              <span className="text-[9.5px] font-black tracking-[0.2em] text-[#C00065] uppercase block font-sans">
                {currentSlideData.badge}
              </span>
              <h2 className="text-lg sm:text-xl font-black leading-[1.15] tracking-tight">
                <span className="text-[#0B2545] block">{currentSlideData.titleLine1}</span>
                <span className={`${currentSlideData.titleColor2} block`}>{currentSlideData.titleLine2}</span>
              </h2>
              <p className="text-[10px] text-slate-600 font-medium leading-tight max-w-[195px] pt-0.5 line-clamp-2">
                {currentSlideData.subtitle}
              </p>

              <div className="pt-2">
                <Link
                  href={currentSlideData.ctaLink}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full ${currentSlideData.btnBg} text-white text-[11px] font-extrabold shadow-xs active:scale-95 transition-all`}
                >
                  <span>{currentSlideData.ctaText}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Right: Slide Image (Optimized height for slide 1 & 3 doctor vs slide 2 product) */}
            <div
              className={`absolute right-1 bottom-0 flex items-end justify-end pointer-events-none select-none z-10 ${
                currentSlideData.id === 1
                  ? "w-[36%] max-w-[125px] h-[112px]"
                  : "w-[33%] max-w-[110px] h-[94px]"
              }`}
            >
              <img
                key={currentSlideData.id}
                src={currentSlideData.image}
                alt="Banner Feature"
                className="max-h-full max-w-full object-contain object-bottom pointer-events-none drop-shadow-sm animate-in fade-in duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/doctor_onboarding.jpg";
                }}
              />
            </div>
          </div>

          {/* Interactive Carousel Dots */}
          <div className="flex items-center justify-center space-x-1.5 mt-3 relative z-10">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${activeSlide === idx ? "w-4 bg-[#C00065]" : "w-1.5 bg-pink-300/80"
                  }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* 4. SIX CATEGORY ICON TILES (Exact 1:1 Match to Screenshot) */}
        <div className="grid grid-cols-6 gap-1.5 pt-1">
          {/* 1. Tablets */}
          <Link
            href="/products/?category=tablets"
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-[18px] bg-[#FAF5FF] text-[#A71380] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-[#A71380]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)" />
                <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
              </svg>
            </div>
            <span className="text-[10.5px] font-bold text-[#0B2545] text-center leading-tight mt-1.5">
              Tablets
            </span>
          </Link>

          {/* 2. Injectables (Clean Crisp Medical Syringe) */}
          <Link
            href="/products/?category=injectables"
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-[18px] bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {/* Plunger Thumb Rest */}
                <path d="m18 2 4 4" />
                {/* Plunger Shaft */}
                <path d="m17 7 3-3" />
                {/* Syringe Barrel */}
                <path d="M19 9 8.7 19.3c-.4.4-1 .4-1.4 0l-2.6-2.6c-.4-.4-.4-1 0-1.4L15 5" />
                {/* Measurement Mark */}
                <path d="m9 11 4 4" />
                {/* Needle Tip */}
                <path d="m5 19-3 3" />
                {/* Top Flange */}
                <path d="m14 4 6 6" />
              </svg>
            </div>
            <span className="text-[10.5px] font-bold text-[#0B2545] text-center leading-tight mt-1.5">
              Injectables
            </span>
          </Link>

          {/* 3. Syrups */}
          <Link
            href="/products/?category=syrups"
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-[18px] bg-[#FFF0F4] text-[#E11D48] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-[#E11D48]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2h6v3H9z" />
                <path d="M9 5h6l3 5v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10l3-5z" />
                <path d="M14 14h3v4h-3z" />
              </svg>
            </div>
            <span className="text-[10.5px] font-bold text-[#0B2545] text-center leading-tight mt-1.5">
              Syrups
            </span>
          </Link>

          {/* 4. Capsules */}
          <Link
            href="/products/?category=capsules"
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-[18px] bg-[#FAF5FF] text-[#A71380] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-[#A71380]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)" />
                <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
              </svg>
            </div>
            <span className="text-[10.5px] font-bold text-[#0B2545] text-center leading-tight mt-1.5">
              Capsules
            </span>
          </Link>

          {/* 5. Ayurvedic / Twin Leaves */}
          <Link
            href="/products/?category=ayurvedic"
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-[18px] bg-[#EBFDF5] text-[#059669] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {/* Left Leaf */}
                <path d="M9.5 20.5C6.5 18.5 5 14.5 6 10c3-.5 6 1 7.5 4.5" />
                {/* Right Leaf */}
                <path d="M10 21C10 15 13.5 10 20 8c0 5.5-3 10-7 13" />
                {/* Right Leaf Center Vein */}
                <path d="M10 21c3-3 5.5-6.5 7.5-10" />
              </svg>
            </div>
            <span className="text-[10.5px] font-bold text-[#0B2545] text-center leading-tight mt-1.5">
              Ayurvedic
            </span>
          </Link>

          {/* 6. All Categories */}
          <Link
            href="/categories/"
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-[18px] bg-[#FAF5FF] text-[#A71380] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-[#A71380]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="2" />
                <rect x="14" y="3.5" width="6.5" height="6.5" rx="2" />
                <rect x="3.5" y="14" width="6.5" height="6.5" rx="2" />
                <rect x="14" y="14" width="6.5" height="6.5" rx="2" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-[#0B2545] text-center leading-tight mt-1.5">
              All<br />Categories
            </span>
          </Link>
        </div>

        {/* 5. "YOUR ORDER IS ON THE WAY" LIVE ORDER TRACKER CARD (Exact Match to Screenshot) */}
        <div className="rounded-2xl bg-[#FFF5F8] border border-[#FCE7F3] p-3.5 shadow-[0_2px_10px_rgba(192,0,101,0.03)] space-y-2.5">
          <div className="flex items-center justify-between">
            {/* Left: Truck Icon + Order Details */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#FCE7F3] text-[#C00065] flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4l3 3v5a1 1 0 01-1 1h-1" />
                </svg>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-[#0B2545] leading-tight truncate">
                  Your Order is on the way
                </h4>
                <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5">
                  {displayOrder.order_code || `EVV-ORD-${displayOrder.id}`} •{" "}
                  {(displayOrder.items && displayOrder.items.length) || 3} items • ₹
                  {Number(displayOrder.total_amount || 879).toLocaleString("en-IN")} •{" "}
                  {displayOrder.created_at
                    ? new Date(displayOrder.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    : "12 Sep 2026"}
                </p>
              </div>
            </div>

            {/* Right: Track Order Outline Pill Button */}
            <button
              onClick={() => {
                if (latestOrder) {
                  setTrackingOrder(latestOrder);
                } else {
                  router.push("/customer/orders/");
                }
              }}
              className="px-3 py-1.5 rounded-full border border-[#C00065] bg-white text-[#C00065] hover:bg-[#C00065] hover:text-white text-[11px] font-extrabold flex items-center space-x-1 shrink-0 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <span>Track Order</span>
              <span>→</span>
            </button>
          </div>

          {/* Stepper with 4 Stages */}
          <div className="pt-1 px-1">
            <div className="flex items-center justify-between relative">
              {/* Stepper Line Behind */}
              <div className="absolute top-2 left-4 right-4 h-0.5 bg-pink-200 -z-0" />
              <div
                className="absolute top-2 left-4 h-0.5 bg-[#C00065] -z-0 transition-all"
                style={{
                  width:
                    currentStage === 3
                      ? "calc(100% - 32px)"
                      : currentStage === 2
                        ? "calc(66% - 16px)"
                        : currentStage === 1
                          ? "calc(33% - 8px)"
                          : "0%",
                }}
              />

              {/* 4 Nodes */}
              {[
                { name: "Confirmed", stage: 0 },
                { name: "Packed", stage: 1 },
                { name: "Shipped", stage: 2 },
                { name: "Delivered", stage: 3 },
              ].map((step) => {
                const isPassed = currentStage >= step.stage;

                return (
                  <div key={step.name} className="flex flex-col items-center z-10">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black transition-all ${isPassed
                        ? "bg-[#C00065] text-white ring-2 ring-pink-100 shadow-2xs"
                        : "bg-white border-2 border-slate-300 text-transparent"
                        }`}
                    >
                      {isPassed ? "✓" : ""}
                    </div>
                    <span
                      className={`text-[9px] font-bold mt-1 block ${isPassed ? "text-[#0B2545]" : "text-slate-400"
                        }`}
                    >
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6. "RECOMMENDED FOR YOU" SECTION (Exact Match to Screenshot) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-black text-[#0B2545] tracking-tight">
              Recommended for You
            </h3>
            <Link
              href="/products/"
              className="text-xs font-bold text-[#C00065] hover:underline flex items-center space-x-0.5"
            >
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          {/* 3 Cards Row / Horizontal Scroll */}
          <div className="grid grid-cols-3 gap-2.5">
            {displayProducts.slice(0, 3).map((prod) => {
              const imgUrl = (prod as any).image_url || getProductImageUrl(prod as ProductItem);
              const price = Number(
                (prod as any).customer_price || (prod as any).display_price || prod.mrp || 245
              );
              const mrp = Number(prod.mrp || Math.round(price * 1.18));
              const discountStr =
                (prod as any).discount ||
                `${Math.max(5, Math.round(((mrp - price) / mrp) * 100))}% OFF`;
              const rating = (prod as any).rating || 4.8;
              const reviews = (prod as any).reviews || 128;
              const isWishlisted = wishlist.includes(prod.id);
              const cartQty = getProductCartQty(prod.id);

              return (
                <div
                  key={prod.id}
                  onClick={() =>
                    router.push(
                      `/products/${(prod as any).slug || prod.id}/`
                    )
                  }
                  className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between active:scale-[0.98] transition-all cursor-pointer relative group"
                >
                  {/* Top: Wishlist Heart Icon */}
                  <button
                    onClick={(e) => toggleWishlist(e, prod.id)}
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-[#C00065] hover:scale-110 active:scale-90 transition-transform"
                    aria-label="Wishlist"
                  >
                    {isWishlisted ? (
                      <svg className="w-4 h-4 fill-current text-[#C00065]" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>

                  {/* Product Image */}
                  <div className="w-full h-20 rounded-xl bg-slate-50/70 overflow-hidden flex items-center justify-center p-1.5 mb-1.5">
                    <img
                      src={imgUrl}
                      alt={prod.brand_name || prod.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/product_nxtnerve.png";
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-0.5">
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight line-clamp-1">
                      {prod.brand_name || prod.name}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-medium line-clamp-1">
                      {prod.composition || (prod as any).dosage_form || "Formulation"}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center space-x-1 pt-0.5">
                      <span className="text-amber-500 text-[10px] leading-none">★</span>
                      <span className="text-[9.5px] font-bold text-slate-700">
                        {rating}
                      </span>
                      <span className="text-[8.5px] text-slate-400">
                        ({reviews})
                      </span>
                    </div>

                    {/* Price Row */}
                    <div className="flex items-center space-x-1 pt-0.5 flex-wrap">
                      <span className="text-[11.5px] font-black text-[#0B2545]">
                        ₹{price}
                      </span>
                      <span className="text-[9.5px] text-slate-400 line-through">
                        ₹{mrp}
                      </span>
                      <span className="text-[8.5px] font-black text-[#C00065] bg-pink-50 px-1 py-0.2 rounded">
                        {discountStr}
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="mt-2">
                    {cartQty > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-between bg-[#C00065] text-white rounded-xl shadow-xs overflow-hidden h-7 px-1"
                      >
                        <button
                          onClick={(e) => handleDecrement(e, prod as ProductItem)}
                          className="w-5 h-full flex items-center justify-center font-bold text-xs active:scale-90"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-[10.5px] font-black">
                          {cartQty}
                        </span>
                        <button
                          onClick={(e) => handleIncrement(e, prod as ProductItem)}
                          className="w-5 h-full flex items-center justify-center font-bold text-xs active:scale-90"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleAddToCart(e, prod as ProductItem)}
                        className="w-full h-7 rounded-xl border border-[#C00065] bg-white text-[#C00065] hover:bg-[#C00065] hover:text-white text-[10px] font-extrabold flex items-center justify-center space-x-1 active:scale-95 transition-all shadow-2xs cursor-pointer"
                      >
                        <span>🛒</span>
                        <span>Add to Cart</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. FOUR TRUST & QUALITY BADGES (Exact Match to Screenshot) */}
        <div className="rounded-2xl bg-[#F0F6FD]/80 border border-blue-100/80 p-3 shadow-2xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* 1. WHO-GMP */}
            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-[9.5px] font-extrabold text-[#0B2545] leading-tight">
                WHO-GMP<br />Certified
              </span>
            </div>

            {/* 2. 100% Genuine */}
            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#059669]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-[9.5px] font-extrabold text-[#0B2545] leading-tight">
                100% Genuine<br />Products
              </span>
            </div>

            {/* 3. Pan-India Delivery */}
            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-[#0284C7] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#0284C7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4l3 3v5a1 1 0 01-1 1h-1" />
                </svg>
              </div>
              <span className="text-[9.5px] font-extrabold text-[#0B2545] leading-tight">
                Pan-India<br />Delivery
              </span>
            </div>

            {/* 4. Dedicated Support */}
            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-[#C00065] flex items-center justify-center">
                <svg className="w-4 h-4 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-[9.5px] font-extrabold text-[#0B2545] leading-tight">
                Dedicated<br />Support
              </span>
            </div>
          </div>
        </div>

        {/* 8. "NEED HELP?" DOCTOR ASSISTANCE CARD (Exact Match to Screenshot) */}
        <div className="rounded-2xl bg-[#FFF5F8] border border-[#FCE7F3] p-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            {/* Illustrated Doctor Avatar */}
            <div className="w-12 h-12 rounded-2xl bg-white border border-pink-100 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
              <img
                src="/images/Evvai_animated.png"
                alt="Pharmacist Support"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/pharma_scientist_microscope.jpg";
                }}
              />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-[#0B2545] leading-tight">
                Need Help?
              </h4>
              <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                Talk to our Pharmacist for expert advice
              </p>
            </div>
          </div>

          <Link
            href="/contact/"
            className="px-3.5 py-2 rounded-full bg-[#C00065] hover:bg-[#a60057] text-white text-xs font-black shadow-xs active:scale-95 transition-all shrink-0 flex items-center space-x-1"
          >
            <span>Chat Now</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </MobileAppShell>
  );
};
