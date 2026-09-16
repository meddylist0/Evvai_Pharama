import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productsAPI, categoriesAPI, ProductItem, CategoryItem } from "@/lib/api";
import { getProductImageUrl } from "@/lib/packagingUtils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { MobileOnboarding } from "@/components/mobile/MobileOnboarding";

export const MobileHomeView: React.FC = () => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if first-time user has seen onboarding or forced via URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const force = window.location.search.includes("onboarding=true");
      const completed = localStorage.getItem("evvai_onboarding_completed");
      if (force || !completed) {
        setShowOnboarding(true);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [prodsData, catsData] = await Promise.allSettled([
          productsAPI.list(),
          categoriesAPI.list(),
        ]);
        if (isMounted) {
          if (prodsData.status === "fulfilled") setProducts(prodsData.value || []);
          if (catsData.status === "fulfilled") setCategories(catsData.value || []);
        }
      } catch (err) {
        console.error("Failed to load data for mobile home:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAddedToast(`Added ${product.brand_name || product.name} to cart`);
    setTimeout(() => {
      setAddedToast(null);
    }, 2200);
  };

  const toggleWishlist = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const dosageCategories = [
    {
      name: "Injectables",
      query: "injectable",
      icon: (
        <svg className="w-6 h-6 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 5l-2-2m-1.5 1.5l2 2m-3-1l-6.5 6.5m0 0L7 11l-4 4 2 2 4-4-1-1 6.5-6.5m0 0l2 2M5 19l-3 3m13-13l1-1" />
        </svg>
      ),
      bg: "bg-[#EEF4FF]",
    },
    {
      name: "Tablets",
      query: "tablet",
      icon: (
        <svg className="w-6 h-6 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth="2" />
          <path strokeLinecap="round" strokeWidth="2" d="M6.5 6.5l11 11" />
        </svg>
      ),
      bg: "bg-[#F5F0FF]",
    },
    {
      name: "Syrups",
      query: "syrup",
      icon: (
        <svg className="w-6 h-6 text-[#DB2777]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 2h4m-3 0v3m2-3v3M7 8h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2zM9 13h4m-4 4h2" />
        </svg>
      ),
      bg: "bg-[#FFF0F6]",
    },
    {
      name: "Capsules",
      query: "capsule",
      icon: (
        <svg className="w-6 h-6 text-[#E11D48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 3.5a4.95 4.95 0 017 7l-7 7a4.95 4.95 0 01-7-7l7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 12.5l3-3" />
        </svg>
      ),
      bg: "bg-[#FFF0F4]",
    },
  ];

  const popularTherapeuticCategories = [
    {
      name: "Pain & Fever Care",
      line1: "Pain &",
      line2: "Fever Care",
      query: "pain",
      icon: (
        <svg className="w-6 h-6 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343a7.975 7.975 0 012.344 5.657 8 8 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.004 11c-.5 1-1.5 1.5-2.125 5.121z" />
        </svg>
      ),
      bg: "bg-[#FFF1EE]",
    },
    {
      name: "Antibiotics",
      line1: "Antibiotics",
      query: "antibiotic",
      icon: (
        <svg className="w-6 h-6 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      bg: "bg-[#FFF8E6]",
    },
    {
      name: "Vitamins & Supplements",
      line1: "Vitamins &",
      line2: "Supplements",
      query: "nutraceuticals",
      icon: (
        <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      bg: "bg-[#EBFDF5]",
    },
    {
      name: "Diabetes Care",
      line1: "Diabetes",
      line2: "Care",
      query: "diabetic",
      icon: (
        <svg className="w-6 h-6 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      bg: "bg-[#EEF7FF]",
    },
  ];

  const defaultPopularCategories = [
    {
      title: "Capsules",
      count: "Timed & Sustained",
      query: "capsules",
      theme: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-[#C00065]",
        icon: (
          <svg className="w-4.5 h-4.5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 3.5a4.95 4.95 0 017 7l-7 7a4.95 4.95 0 01-7-7l7-7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 12.5l3-3" />
          </svg>
        ),
      },
    },
    {
      title: "Injections",
      count: "IV & IM Vials",
      query: "injections",
      theme: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 5l-2-2m-1.5 1.5l2 2m-3-1l-6.5 6.5m0 0L7 11l-4 4 2 2 4-4-1-1 6.5-6.5m0 0l2 2M5 19l-3 3m13-13l1-1" />
          </svg>
        ),
      },
    },
    {
      title: "Nutraceuticals",
      count: "Health Boosters",
      query: "nutraceuticals",
      theme: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        ),
      },
    },
    {
      title: "Skincare",
      count: "Derma Solutions",
      query: "skincare",
      theme: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        ),
      },
    },
    {
      title: "Tablets",
      count: "Oral Dosage",
      query: "tablet",
      theme: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.5" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M6 6l12 12" />
          </svg>
        ),
      },
    },
    {
      title: "Syrups",
      count: "Liquid Oral",
      query: "syrup",
      theme: {
        bg: "bg-pink-50",
        border: "border-pink-200",
        text: "text-pink-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 2h4m-3 0v3m2-3v3M7 8h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2zM9 13h4m-4 4h2" />
          </svg>
        ),
      },
    },
  ];

  // Helper to get category icon and theme for dynamic categories
  const getDynamicCategoryTheme = (catName: string, idx: number) => {
    const lower = catName.toLowerCase();
    if (lower.includes("capsule")) {
      return {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-[#C00065]",
        icon: (
          <svg className="w-4.5 h-4.5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 3.5a4.95 4.95 0 017 7l-7 7a4.95 4.95 0 01-7-7l7-7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 12.5l3-3" />
          </svg>
        ),
      };
    }
    if (lower.includes("inject")) {
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 5l-2-2m-1.5 1.5l2 2m-3-1l-6.5 6.5m0 0L7 11l-4 4 2 2 4-4-1-1 6.5-6.5m0 0l2 2M5 19l-3 3m13-13l1-1" />
          </svg>
        ),
      };
    }
    if (lower.includes("nutra") || lower.includes("supplement") || lower.includes("vitamin")) {
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        ),
      };
    }
    if (lower.includes("skin") || lower.includes("derma") || lower.includes("cream")) {
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        ),
      };
    }
    if (lower.includes("tablet") || lower.includes("pill")) {
      return {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.5" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="M6 6l12 12" />
          </svg>
        ),
      };
    }
    if (lower.includes("syrup") || lower.includes("oral")) {
      return {
        bg: "bg-pink-50",
        border: "border-pink-200",
        text: "text-pink-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 2h4m-3 0v3m2-3v3M7 8h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2zM9 13h4m-4 4h2" />
          </svg>
        ),
      };
    }

    const fallbacks = [
      {
        bg: "bg-teal-50",
        border: "border-teal-200",
        text: "text-teal-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
      },
      {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-600",
        icon: (
          <svg className="w-4.5 h-4.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
      },
    ];
    return fallbacks[idx % fallbacks.length];
  };

  // Top 6 featured formulations for mobile home showcase
  const featuredList = products.slice(0, 6);

  if (showOnboarding) {
    return <MobileOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <MobileAppShell
      activeTab="home"
      showSearch={true}
      searchPlaceholder="Search medicines, categories..."
      onSearch={(q) => {
        setSearchQuery(q);
        if (q.trim().length > 1) {
          router.push(`/products/?q=${encodeURIComponent(q)}`);
        }
      }}
    >
      {/* Added to Cart Floating Toast */}
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
              href="/customer/checkout/"
              className="text-[#f1a4dc] hover:text-white text-[11px] font-bold underline"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}

      <div className="px-4 py-3 space-y-4">
        {/* Logged-in Customer Quick Strip */}
        {isAuthenticated && user && (
          <div className="bg-gradient-to-r from-[#0B2545] via-[#133E68] to-[#1E4A7A] text-white rounded-2xl p-3 px-3.5 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#A71380] text-white font-black text-xs flex items-center justify-center shadow-xs">
                {(user.full_name?.[0] || "C").toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] text-slate-300 font-medium leading-none">Welcome back,</p>
                <p className="text-xs font-bold text-white mt-0.5 leading-tight">{user.full_name || "Customer"}</p>
              </div>
            </div>
            <Link
              href="/customer/dashboard/"
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-bold transition-all flex items-center space-x-1"
            >
              <span>Dashboard</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {/* 1. Hero Promo Banner Card (Executive Pharmaceutical Design) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EBF5FB] via-[#F2F8FD] to-[#E3F2FC] border border-[#CFE4F6] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-3 z-10">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/90 border border-blue-200 text-[#0B2545] text-[9.5px] font-bold uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B2545]" />
                <span>WHO-GMP Quality</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#0B2545] leading-tight tracking-tight">
                Your Partner
                <br />
                in Better Health
              </h2>
              <p className="text-[11.5px] text-slate-600 mt-1.5 leading-snug font-medium">
                Trusted medicines.
                <br />
                Brighter tomorrows.
              </p>
              <Link
                href="/products/"
                className="inline-flex items-center space-x-1.5 mt-3.5 px-4 py-2 bg-[#0B2545] text-white rounded-full text-xs font-bold shadow-xs hover:bg-[#163863] active:scale-95 transition-all"
              >
                <span>Explore Products</span>
                <span>→</span>
              </Link>
            </div>

            {/* Visual Healthcare Graphic */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden relative shadow-sm border border-blue-200/50">
              <img
                src="/images/plant_sphere_health.jpg"
                alt="Your Partner in Better Health"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>

        {/* 2. Quick Dosage Categories Row (Real Medical SVG Icons) */}
        <div>
          <div className="grid grid-cols-4 gap-2">
            {dosageCategories.map((cat) => (
              <Link
                key={cat.name}
                href={`/products/?category=${cat.query}`}
                className="flex flex-col items-center justify-start group active:scale-95 transition-all"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${cat.bg} flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform`}>
                  {cat.icon}
                </div>
                <span className="text-[11.5px] font-bold text-slate-700 text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Popular Categories (Exact match to Reference Design) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-extrabold text-[#0B2545] tracking-tight">
              Popular Categories
            </h3>
            <button
              type="button"
              onClick={() => setShowAllCategories(true)}
              className="text-xs font-extrabold text-[#C00065] hover:text-[#9e0052] transition-colors cursor-pointer active:scale-95"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {popularTherapeuticCategories.map((item) => (
              <Link
                key={item.name}
                href={`/products/?category=${encodeURIComponent(item.query)}`}
                className="flex flex-col items-center justify-start group active:scale-95 transition-all"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${item.bg} flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform`}>
                  {item.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-700 text-center leading-[1.15]">
                  <div>{item.line1}</div>
                  {item.line2 && <div>{item.line2}</div>}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 4. Trust & WHO-GMP Badge Banner (Matching reference image) */}
        <div className="rounded-2xl bg-gradient-to-r from-[#E6FFFA] via-[#F0FDFA] to-[#E0F2FE] border border-teal-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <h4 className="text-sm font-black text-[#0B2545] leading-tight">
              WHO-GMP Certified
            </h4>
            <p className="text-[10px] text-teal-800 font-semibold mt-0.5">
              Quality You Can Trust
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-700 border border-teal-400/40 flex items-center justify-center shadow-2xs shrink-0">
            <svg className="w-6 h-6 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* 3. Featured Products Horizontal Scroll / Grid (Matching Screenshot) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-extrabold text-[#0B2545] tracking-tight">
              Featured Products
            </h3>
            <Link
              href="/products/"
              className="text-xs font-bold text-[#C00065] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-2.5 border border-slate-200 animate-pulse space-y-2">
                  <div className="w-full h-20 bg-slate-200 rounded-xl" />
                  <div className="h-2.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : featuredList.length > 0 ? (
            <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
              {featuredList.map((prod) => {
                const imgUrl = getProductImageUrl(prod);
                const price = Number(prod.customer_price || prod.display_price || prod.mrp || 0);
                const mrp = Number(prod.mrp || price * 1.19);
                const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 16;
                const isWishlisted = wishlist.includes(prod.id);

                return (
                  <div
                    key={prod.id}
                    onClick={() => router.push(`/products/${prod.slug || prod.id}/`)}
                    className="min-w-[145px] max-w-[155px] sm:min-w-[165px] bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between active:scale-98 transition-all relative group cursor-pointer shrink-0"
                  >
                    {/* Wishlist Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleWishlist(e, prod.id)}
                      className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-2xs"
                      aria-label="Wishlist"
                    >
                      <svg
                        className={`w-4 h-4 ${isWishlisted ? "text-rose-500 fill-rose-500" : "text-rose-400"}`}
                        fill={isWishlisted ? "currentColor" : "none"}
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

                    {/* Product Image */}
                    <div className="w-full h-24 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-1.5 mb-1.5">
                      <img
                        src={imgUrl}
                        alt={prod.brand_name || prod.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/product_nxtnerve.png";
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="space-y-0.5">
                      <h4 className="text-[11px] font-black text-[#0B2545] leading-tight line-clamp-1">
                        {prod.brand_name || prod.name}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 line-clamp-1">
                        {prod.composition || prod.generic_name || "Mecobalamin 1500 mcg"}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center space-x-1 text-[9.5px] pt-0.5">
                        <span className="text-amber-500 font-bold">★ 4.8</span>
                        <span className="text-slate-400 font-medium">(128)</span>
                      </div>

                      {/* Price Strip */}
                      <div className="flex items-center space-x-1 pt-1">
                        <span className="text-xs font-black text-[#0B2545]">
                          ₹{price}
                        </span>
                        {mrp > price && (
                          <span className="text-[9.5px] text-slate-400 line-through">
                            ₹{Math.round(mrp)}
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-[#C00065] bg-pink-50 px-1 py-0.2 rounded">
                          {discount}% OFF
                        </span>
                      </div>

                      {/* Add to Cart Outlined Button */}
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, prod)}
                        className="w-full mt-2 py-1.5 rounded-xl border border-[#C00065] text-[#C00065] hover:bg-pink-50 active:scale-95 text-[10px] font-bold flex items-center justify-center space-x-1 transition-all shadow-2xs cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>



        {/* 6. Distributor Partner Card */}
        <div className="rounded-2xl bg-[#0B2545] text-white p-4 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#f1a4dc]">
              Pharma Distribution
            </span>
            <h4 className="text-sm font-black mt-1 leading-snug">
              Are you a Retailer or Distributor?
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              Get bulk order margins, credit limits, and priority logistics.
            </p>
            <Link
              href="/partners"
              className="inline-block mt-3 px-3.5 py-1.5 rounded-xl bg-[#A71380] hover:bg-[#8e0f6c] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              Partner with EVVAI →
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic All Categories Bottom Sheet Modal */}
      {showAllCategories && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowAllCategories(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-250 max-h-[85vh] flex flex-col pb-[env(safe-area-inset-bottom,24px)]">
            {/* Handle Drag Bar */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-[#0B2545]">
                  Therapeutic Categories
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {categories.length} verified pharmaceutical classifications
                </p>
              </div>
              <button
                onClick={() => setShowAllCategories(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Search Categories */}
            <div className="py-3">
              <div className="relative">
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories (e.g. injectables, sleep)..."
                  className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#A71380] transition-all font-medium"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Categories List */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 pb-2">
              {categories
                .filter((cat) =>
                  categorySearch.trim() === ""
                    ? true
                    : cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                    (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()))
                )
                .map((cat, idx) => {
                  const colorThemes = [
                    { bg: "bg-pink-50 border-pink-200 text-[#A71380]", badge: "bg-pink-100 text-[#A71380]" },
                    { bg: "bg-blue-50 border-blue-200 text-blue-800", badge: "bg-blue-100 text-blue-700" },
                    { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", badge: "bg-emerald-100 text-emerald-700" },
                    { bg: "bg-amber-50 border-amber-200 text-amber-800", badge: "bg-amber-100 text-amber-700" },
                    { bg: "bg-purple-50 border-purple-200 text-purple-800", badge: "bg-purple-100 text-purple-700" },
                    { bg: "bg-teal-50 border-teal-200 text-teal-800", badge: "bg-teal-100 text-teal-700" },
                  ];
                  const theme = colorThemes[idx % colorThemes.length];

                  return (
                    <button
                      key={cat.id || cat.slug}
                      onClick={() => {
                        setShowAllCategories(false);
                        router.push(`/products/?category=${encodeURIComponent(cat.slug)}`);
                      }}
                      className="w-full p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-left transition-all flex items-start space-x-3 group active:scale-[0.99] cursor-pointer shadow-2xs"
                    >
                      <div className={`w-10 h-10 rounded-xl ${theme.bg} border flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-extrabold text-[#0B2545] truncate group-hover:text-[#A71380] transition-colors">
                            {cat.name}
                          </h4>
                          <span className="text-slate-400 text-xs group-hover:translate-x-0.5 transition-transform">
                            →
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </MobileAppShell>
  );
};
