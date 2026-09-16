"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { productsAPI, ProductItem } from "@/lib/api";
import { getProductImageUrl } from "@/lib/packagingUtils";
import { useCart } from "@/context/CartContext";
import { MobileAppShell } from "@/components/mobile/MobileAppShell";

const MobileProductListContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams?.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams?.get("category") || "all"
  );
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "discount">("popular");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Sync category param from URL if present
  useEffect(() => {
    const cat = searchParams?.get("category");
    if (cat) setSelectedCategory(cat.toLowerCase());
    const q = searchParams?.get("q");
    if (q) setSearchTerm(q);
  }, [searchParams]);

  // Load wishlist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_wishlist");
        if (raw) setWishlistIds(JSON.parse(raw));
      } catch { }
    }
  }, []);

  // Fetch products from real API with reliable offline mockData fallback
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productsAPI.list();
        if (isMounted) {
          if (data && data.length > 0) {
            setProducts(data);
          } else {
            const { INITIAL_PRODUCTS } = await import("@/data/mockData");
            setProducts(
              INITIAL_PRODUCTS.map((p, idx) => ({
                id: idx + 1,
                name: p.name,
                brand_name: p.name,
                composition: p.composition,
                generic_name: p.composition,
                pack_size: p.packSize,
                category_name: p.category,
                category: p.category,
                customer_price: p.customerPrice || p.mrp,
                display_price: p.customerPrice || p.mrp,
                mrp: p.mrp,
                stock: p.stock || 25,
                image: p.image,
              })) as unknown as ProductItem[]
            );
          }
        }
      } catch (err) {
        console.error("Failed to load products in mobile product list:", err);
        if (isMounted) {
          const { INITIAL_PRODUCTS } = await import("@/data/mockData");
          setProducts(
            INITIAL_PRODUCTS.map((p, idx) => ({
              id: idx + 1,
              name: p.name,
              brand_name: p.name,
              composition: p.composition,
              generic_name: p.composition,
              pack_size: p.packSize,
              category_name: p.category,
              category: p.category,
              customer_price: p.customerPrice || p.mrp,
              display_price: p.customerPrice || p.mrp,
              mrp: p.mrp,
              stock: p.stock || 25,
              image: p.image,
            })) as unknown as ProductItem[]
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleWishlist = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      if (typeof window !== "undefined") {
        localStorage.setItem("pharmalink_wishlist", JSON.stringify(next));
      }
      return next;
    });
  };

  const handleAddToCart = (e: React.MouseEvent, product: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAddedToast(`Added ${product.brand_name || product.name} to cart`);
    setTimeout(() => setAddedToast(null), 2000);
  };

  const categoryChips = [
    { id: "all", label: "All" },
    { id: "injectable", label: "Injectables" },
    { id: "tablet", label: "Tablets" },
    { id: "syrup", label: "Syrups" },
    { id: "capsule", label: "Capsules" },
  ];

  // Filtering & Sorting Logic
  const filteredProducts = useMemo(() => {
    // Helper to safely extract category string from potentially object-typed fields
    const safeCatStr = (val: any): string => {
      if (typeof val === "string") return val;
      if (val && typeof val === "object" && val.name) return String(val.name);
      return "";
    };

    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== "all") {
          const cat = safeCatStr(p.category_name || p.category).toLowerCase();
          const pack = (p.pack_size || "").toLowerCase();
          const name = (p.name || "").toLowerCase();
          const match =
            cat.includes(selectedCategory) ||
            pack.includes(selectedCategory) ||
            name.includes(selectedCategory);
          if (!match) return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const name = (p.brand_name || p.name || "").toLowerCase();
          const generic = (p.generic_name || p.composition || "").toLowerCase();
          const cat = safeCatStr(p.category_name).toLowerCase();
          return name.includes(q) || generic.includes(q) || cat.includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.customer_price || a.display_price || a.mrp || 0);
        const priceB = Number(b.customer_price || b.display_price || b.mrp || 0);
        const mrpA = Number(a.mrp || priceA);
        const mrpB = Number(b.mrp || priceB);
        const discA = mrpA > priceA ? (mrpA - priceA) / mrpA : 0;
        const discB = mrpB > priceB ? (mrpB - priceB) / mrpB : 0;

        if (sortBy === "price-low") return priceA - priceB;
        if (sortBy === "price-high") return priceB - priceA;
        if (sortBy === "discount") return discB - discA;
        return (b.id || 0) - (a.id || 0); // popular default
      });
  }, [products, selectedCategory, searchTerm, sortBy]);

  return (
    <MobileAppShell
      headerTitle="Products"
      showBack={true}
      activeTab="products"
      rightAction={
        <Link
          href="/customer/checkout/"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#0B2545] hover:text-[#A71380] active:scale-90 transition-all relative cursor-pointer"
          aria-label="Shopping Cart"
        >
          <svg className="w-6 h-6 text-[#0B2545]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </Link>
      }
    >
      {/* Toast Notification */}
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

      {/* Top Search & Filter Bar (Matching Image 1) */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 space-y-2.5 sticky top-14 z-30 shadow-2xs">
        {/* Search Input Box with Search Icon and Filter Sliders on Right */}
        <div className="relative flex items-center">
          <svg
            className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full h-11 pl-10 pr-11 bg-[#F1F5F9]/80 border border-slate-200/80 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#A71380] transition-all font-medium"
          />

          {/* Filter Sliders Button inside search bar on the right (Matching Image 1) */}
          <button
            onClick={() => setShowFilterSheet(true)}
            className="absolute right-2 w-7 h-7 flex items-center justify-center text-[#0B2545] hover:text-[#A71380] active:scale-90 transition-all cursor-pointer"
            aria-label="Filter products"
            title="Filter by category"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Horizontal Category Filter Pills (Matching Image 1: All active dark plum pill, others light) */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
          {categoryChips.map((chip) => {
            const active = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${active
                    ? "bg-[#580B43] text-white shadow-xs"
                    : "bg-transparent text-slate-600 hover:text-[#0B2545]"
                  }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Results Counter & Sort bar */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>
          Showing <strong className="text-slate-800">{filteredProducts.length}</strong> medicines
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="ml-2 text-[10.5px] font-bold text-[#A71380] underline cursor-pointer"
            >
              (Show all {products.length})
            </button>
          )}
        </span>
        <button
          onClick={() => setShowSortSheet(true)}
          className="flex items-center space-x-1 font-bold text-[#0B2545] hover:text-[#A71380] cursor-pointer"
        >
          <span>Sort: {sortBy === "popular" ? "Popular" : sortBy === "price-low" ? "Price: Low to High" : sortBy === "price-high" ? "Price: High to Low" : "Discount"}</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Main Product List (Screen 4 Reference Layout) */}
      <div className="px-4 pb-6 space-y-3">
        {loading ? (
          /* Skeletons */
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs animate-pulse flex items-center space-x-3.5">
              <div className="w-22 h-22 bg-slate-200 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/3 pt-1" />
              </div>
            </div>
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((prod, idx) => {
            const imgUrl = getProductImageUrl(prod);
            const price = Number(prod.customer_price || prod.display_price || prod.mrp || 0);
            const mrp = Number(prod.mrp || price * 1.2);
            const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
            const isWishlisted = wishlistIds.includes(prod.id);
            const inStock = (prod.stock ?? prod.total_stock ?? 10) > 0;

            const pastelBgs = [
              "bg-[#FFF0F6] border-[#FFE0ED]",
              "bg-[#F0FDF4] border-[#DCFCE7]",
              "bg-[#FFF7ED] border-[#FFEDD5]",
              "bg-[#FFF1F2] border-[#FFE4E6]",
            ];
            const pastelStyle = pastelBgs[idx % pastelBgs.length];

            const productHref = `/products/${prod.id}/`;
            return (
              <Link
                key={prod.id}
                href={productHref}
                className="bg-white rounded-2xl p-3 border border-slate-100 shadow-2xs flex items-center space-x-3.5 active:scale-[0.99] transition-all relative cursor-pointer group block text-inherit no-underline"
              >
                {/* Product Image Thumbnail with pastel tint (Matching Image 1) */}
                <div className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border flex items-center justify-center p-1.5 shrink-0 overflow-hidden relative ${pastelStyle}`}>
                  <img
                    src={imgUrl}
                    alt={prod.brand_name || prod.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/product_nxtnerve.png";
                    }}
                  />
                  {!inStock && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                      <span className="text-[8px] font-black text-white uppercase tracking-wider">
                        Out of stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Details Section (Matching Image 1) */}
                <div className="flex-1 min-w-0 pr-0.5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold text-[#0B2545] leading-snug line-clamp-1">
                      {prod.brand_name || prod.name}
                    </h3>

                    {/* Wishlist Heart Icon (Top right, matching Image 1) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(e, prod.id);
                      }}
                      className="w-7 h-7 -mt-1 -mr-1 flex items-center justify-center text-slate-400 hover:text-rose-500 active:scale-90 transition-all cursor-pointer z-10"
                      aria-label="Save to wishlist"
                    >
                      <svg
                        className={`w-4.5 h-4.5 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-400"
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.9"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Composition / Generic */}
                  <p className="text-xs font-normal text-slate-500 line-clamp-1 mt-0.5">
                    {prod.composition || prod.generic_name || prod.pack_size || "Pharmaceutical Formulation"}
                  </p>

                  {/* Rating: Yellow Star + Score (Matching Image 1) */}
                  <div className="flex items-center space-x-1 mt-1 text-xs">
                    <span className="text-amber-500 font-bold">★ 4.8</span>
                    <span className="text-slate-400 font-normal">(128)</span>
                  </div>

                  {/* Price & Discount Line (Matching Image 1: ₹245 ₹290 16% OFF) */}
                  <div className="flex items-center space-x-2 mt-2 pt-1 border-t border-slate-50/80">
                    <span className="text-base font-bold text-[#0B2545]">
                      ₹{price}
                    </span>
                    {mrp > price && (
                      <span className="text-xs text-slate-400 line-through font-normal">
                        ₹{Math.round(mrp)}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="text-[10px] font-bold text-[#D81B60] bg-[#FCE4EC] px-2 py-0.5 rounded-md">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          /* Empty State */
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              🔍
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              No Formulations Found
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              We couldn&apos;t find any medicines matching &ldquo;{searchTerm || selectedCategory}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-[#0B2545] text-white rounded-xl text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Sort Bottom Sheet */}
      {showSortSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowSortSheet(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom,20px)]">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h3 className="text-sm font-extrabold text-[#0B2545] mb-3">
              Sort Formulations By
            </h3>
            <div className="space-y-2">
              {[
                { id: "popular", label: "Most Popular / Recommended" },
                { id: "price-low", label: "Price: Low to High" },
                { id: "price-high", label: "Price: High to Low" },
                { id: "discount", label: "Biggest Discount (%)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSortBy(opt.id as any);
                    setShowSortSheet(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${sortBy === opt.id
                      ? "bg-[#F8EAF4] text-[#A71380]"
                      : "text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Bottom Sheet */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowFilterSheet(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 pb-[env(safe-area-inset-bottom,20px)]">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-[#0B2545]">
                Filter by Category
              </h3>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setShowFilterSheet(false);
                }}
                className="text-xs font-bold text-[#A71380]"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categoryChips.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedCategory(opt.id);
                    setShowFilterSheet(false);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${selectedCategory === opt.id
                      ? "bg-[#A71380] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </MobileAppShell>
  );
};

export const MobileProductList: React.FC = () => {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#FDF8FB]" />}>
      <MobileProductListContent />
    </React.Suspense>
  );
};
