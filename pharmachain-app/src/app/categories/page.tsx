"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categoriesAPI, productsAPI, CategoryItem, ProductItem } from "@/lib/api";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";
import { usePlatform } from "@/lib/platform";

// Safe string extractor helper
const getSafeString = (val: any): string => {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") return val.name || val.slug || val.title || "";
  return String(val);
};

// Helper function to return a distinctive medical icon & color theme for each category
function getCategoryTheme(name: any, index: number) {
  const lower = getSafeString(name).toLowerCase();

  if (lower.includes("inject") || lower.includes("infusion")) {
    return {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-600",
      badge: "bg-blue-100 text-blue-800",
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 5l-2-2m-1.5 1.5l2 2m-3-1l-6.5 6.5m0 0L7 11l-4 4 2 2 4-4-1-1 6.5-6.5m0 0l2 2M5 19l-3 3m13-13l1-1" />
        </svg>
      ),
    };
  }
  if (lower.includes("tablet") || lower.includes("pill")) {
    return {
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-600",
      badge: "bg-purple-100 text-purple-800",
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" strokeWidth="2" />
          <path strokeLinecap="round" strokeWidth="2" d="M6 6l12 12" />
        </svg>
      ),
    };
  }
  if (lower.includes("capsule")) {
    return {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-[#C00065]",
      badge: "bg-rose-100 text-[#C00065]",
      icon: (
        <svg className="w-5 h-5 text-[#C00065]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.5 3.5a4.95 4.95 0 017 7l-7 7a4.95 4.95 0 01-7-7l7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 12.5l3-3" />
        </svg>
      ),
    };
  }
  if (lower.includes("syrup") || lower.includes("liquid") || lower.includes("oral")) {
    return {
      bg: "bg-pink-50",
      border: "border-pink-200",
      text: "text-pink-600",
      badge: "bg-pink-100 text-pink-800",
      icon: (
        <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 2h4m-3 0v3m2-3v3M7 8h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2zM9 13h4m-4 4h2" />
        </svg>
      ),
    };
  }
  if (lower.includes("nutra") || lower.includes("supplement") || lower.includes("vitamin")) {
    return {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-600",
      badge: "bg-emerald-100 text-emerald-800",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    };
  }
  if (lower.includes("skin") || lower.includes("derma") || lower.includes("cream") || lower.includes("gel")) {
    return {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-600",
      badge: "bg-amber-100 text-amber-800",
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    };
  }
  if (lower.includes("cardio") || lower.includes("heart") || lower.includes("hyper")) {
    return {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
      badge: "bg-red-100 text-red-800",
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    };
  }
  if (lower.includes("diabet") || lower.includes("sugar") || lower.includes("metabolic")) {
    return {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-600",
      badge: "bg-teal-100 text-teal-800",
      icon: (
        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    };
  }

  // Rotating fallback color themes
  const fallbacks = [
    {
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-600",
      badge: "bg-indigo-100 text-indigo-800",
    },
    {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-600",
      badge: "bg-cyan-100 text-cyan-800",
    },
    {
      bg: "bg-teal-50",
      border: "border-teal-200",
      text: "text-teal-600",
      badge: "bg-teal-100 text-teal-800",
    },
    {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-[#C00065]",
      badge: "bg-rose-100 text-[#C00065]",
    },
  ];

  const theme = fallbacks[index % fallbacks.length];
  return {
    ...theme,
    icon: (
      <svg className={`w-5 h-5 ${theme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  };
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: 1,
    name: "Tablets",
    slug: "tablet",
    description: "Oral solid formulations with high bioavailability, multi-layered matrix, and sustained delivery profiles.",
    product_count: 24,
  },
  {
    id: 2,
    name: "Capsules",
    slug: "capsule",
    description: "Hard and soft gelatin capsules, enteric-coated pellets, and controlled-release micro-granules.",
    product_count: 18,
  },
  {
    id: 3,
    name: "Injectables",
    slug: "injectable",
    description: "Sterile IV, IM, and infusion vials manufactured in automated WHO-GMP Class 100 cleanrooms.",
    product_count: 14,
  },
  {
    id: 4,
    name: "Syrups & Suspensions",
    slug: "syrup",
    description: "Palatable pediatric and adult liquid oral formulations, bronchodilators, and nutritional tonics.",
    product_count: 16,
  },
  {
    id: 5,
    name: "Pain & Fever Care",
    slug: "pain",
    description: "Fast-acting analgesics, antipyretics, NSAIDs, and joint inflammation management therapies.",
    product_count: 12,
  },
  {
    id: 6,
    name: "Antibiotics & Anti-infectives",
    slug: "antibiotic",
    description: "Broad-spectrum beta-lactams, cephalosporins, macrolides, and systemic antimicrobial agents.",
    product_count: 15,
  },
  {
    id: 7,
    name: "Vitamins & Supplements",
    slug: "nutraceuticals",
    description: "Clinical grade multivitamins, zinc, antioxidant boosters, and therapeutic mineral complexes.",
    product_count: 20,
  },
  {
    id: 8,
    name: "Diabetes Care",
    slug: "diabetic",
    description: "Anti-diabetic formulations, glycaemic regulators, metformin combinations, and metabolic stabilizers.",
    product_count: 11,
  },
  {
    id: 9,
    name: "Cardiovascular & Hypertension",
    slug: "cardiac",
    description: "Cardio-protective agents, ACE inhibitors, beta-blockers, and lipid-lowering statin formulations.",
    product_count: 9,
  },
  {
    id: 10,
    name: "Gastro & Acid Reflux",
    slug: "gastro",
    description: "Proton pump inhibitors, antacids, digestive prokinetics, and gastro-mucosal barrier protectors.",
    product_count: 13,
  },
  {
    id: 11,
    name: "Derma & Skincare",
    slug: "skincare",
    description: "Topical dermatological creams, antifungal ointments, hydrogels, and skin barrier therapies.",
    product_count: 10,
  },
  {
    id: 12,
    name: "Respiratory Care",
    slug: "respiratory",
    description: "Cough syrups, anti-histamines, bronchodilators, and respiratory relief formulations.",
    product_count: 8,
  },
];

export default function CategoriesPage() {
  const router = useRouter();
  const platform = usePlatform();
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [catsData, prodsData] = await Promise.allSettled([
          categoriesAPI.list(),
          productsAPI.list(),
        ]);
        if (isMounted) {
          if (catsData.status === "fulfilled" && catsData.value && catsData.value.length > 0) {
            setCategories(catsData.value);
          } else {
            setCategories(DEFAULT_CATEGORIES);
          }
          if (prodsData.status === "fulfilled") {
            setProducts(prodsData.value || []);
          }
        }
      } catch (err) {
        console.error("Failed to load categories page data:", err);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter categories by search
  const filteredCategories = categories.filter((cat) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const catName = getSafeString(cat.name).toLowerCase();
    const catDesc = getSafeString(cat.description).toLowerCase();
    const catSlug = getSafeString(cat.slug).toLowerCase();
    return (
      catName.includes(q) ||
      catDesc.includes(q) ||
      catSlug.includes(q)
    );
  });

  // Calculate product count per category
  const getProductCount = (cat: CategoryItem) => {
    const slug = getSafeString(cat.slug || cat.name).toLowerCase();
    const catNameLower = getSafeString(cat.name).toLowerCase();
    const count = products.filter((p) => {
      const pCat = getSafeString((p as any).category_name || p.category).toLowerCase();
      const pCatId = (p as any).category_id || (p.category && typeof p.category === "object" ? (p.category as any).id : undefined);
      return (pCat && (pCat === slug || pCat === catNameLower)) || (cat.id !== undefined && pCatId === cat.id);
    }).length;
    return count > 0 ? count : (cat as any).product_count || 0;
  };

  const pageContent = (
    <div className="px-4 py-3 space-y-4 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF5F9] via-[#FFFFFF] to-[#F1F6FD] border border-pink-100/80 p-4 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#C00065] animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C00065]">
            EVVAI Formulary Catalog
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-[#0B2545] tracking-tight mt-1">
          Therapeutic Classifications
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Explore verified pharmaceutical categories, WHO-GMP certified compositions, and targeted clinical medicines.
        </p>

        {/* Search Box */}
        <div className="relative mt-3.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category or indication (e.g., injectables, pain)..."
            className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#C00065] focus:ring-2 focus:ring-pink-100 transition-all font-medium shadow-2xs"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categories Count & Status */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-extrabold text-[#0B2545]">
          {loading ? "Loading categories..." : `${filteredCategories.length} Categories Found`}
        </span>
        <Link
          href="/products/"
          className="text-xs font-bold text-[#C00065] hover:underline flex items-center space-x-1"
        >
          <span>All Products Catalog</span>
          <span>→</span>
        </Link>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs animate-pulse flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="space-y-3 pb-6">
          {filteredCategories.map((cat, idx) => {
            const theme = getCategoryTheme(cat.name, idx);
            const pCount = getProductCount(cat);

            return (
              <div
                key={cat.id || cat.slug || idx}
                onClick={() => router.push(`/products/?category=${encodeURIComponent(cat.slug || cat.name)}`)}
                className="bg-white rounded-2xl p-4 border border-slate-200/85 hover:border-slate-300 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start space-x-3.5">
                  {/* Category Icon */}
                  <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.border} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs`}>
                    {theme.icon}
                  </div>

                  {/* Category Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#0B2545] group-hover:text-[#C00065] transition-colors truncate">
                        {cat.name}
                      </h3>
                      {pCount > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge} shrink-0`}>
                          {pCount} {pCount === 1 ? "Product" : "Products"}
                        </span>
                      )}
                    </div>

                    {/* Description just like in Admin Categories */}
                    <p className="text-xs text-slate-600 font-normal leading-relaxed mt-1 line-clamp-2">
                      {cat.description || "WHO-GMP compliant formulations, clinical quality medicines, and verified therapeutics for patient care."}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Slug: <code className="text-[#0B2545] font-mono">{cat.slug || cat.name.toLowerCase()}</code>
                  </span>
                  <span className="font-bold text-[#C00065] flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Browse Medicines</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-pink-50 text-[#C00065] flex items-center justify-center mx-auto text-xl font-black">
            ?
          </div>
          <h4 className="text-sm font-extrabold text-[#0B2545]">
            No matching categories found
          </h4>
          <p className="text-xs text-slate-500">
            Try searching with a different term or clear the filter.
          </p>
          <button
            onClick={() => setSearch("")}
            className="px-4 py-2 bg-[#0B2545] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );

  if (platform.isNative || platform.isMobile) {
    return (
      <MobileAppShell
        activeTab="home"
        headerTitle="Therapeutic Categories"
        showBack={true}
        onBack={() => router.push("/")}
      >
        {pageContent}
      </MobileAppShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pageContent}
      </main>
      <FooterSection />
    </div>
  );
}
