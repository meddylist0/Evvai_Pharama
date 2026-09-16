"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productsAPI, ProductItem } from "@/lib/api";
import { getProductImageUrl, getCategoryFallbackImage } from "@/lib/packagingUtils";
import { usePlatform } from "@/lib/platform";
import { MobileProductList } from "@/components/mobile";

export default function CustomerCatalogPage() {
  const router = useRouter();
  const platform = usePlatform();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || platform.isNative || platform.isMobile) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#FDF8FB]" />}>
        <MobileProductList />
      </React.Suspense>
    );
  }

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "price-low" | "price-high" | "discount">("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [productQuantities, setProductQuantities] = useState<{ [key: number]: number }>({});
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productsAPI.list();
        setProducts(data || []);
      } catch (err) {
        console.error("Failed loading catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();

    // Listen to global header search
    const handleGlobalSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setSearchTerm(q);
      setCurrentPage(1);
    };
    window.addEventListener("pharmalink_customer_search", handleGlobalSearch);
    return () => window.removeEventListener("pharmalink_customer_search", handleGlobalSearch);
  }, []);

  const getQty = (id: number) => productQuantities[id] || 1;
  const setQty = (id: number, val: number) => {
    setProductQuantities((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  const [toastNotification, setToastNotification] = useState<{
    product: ProductItem;
    quantity: number;
    unitPrice: number;
  } | null>(null);



  const handleAddToCart = (product: ProductItem, quantity = 1) => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("pharmalink_cart");
      let cart: any[] = saved ? JSON.parse(saved) : [];
      const existing = cart.find((it) => it.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({ product, quantity });
      }
      localStorage.setItem("pharmalink_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));

      const unitPrice = Number(product.customer_price || product.display_price || product.mrp || 0);

      // Trigger top-right floating toast
      setToastNotification({
        product,
        quantity,
        unitPrice,
      });

      // Auto-hide toast after 2 seconds
      setTimeout(() => {
        setToastNotification((current) => (current?.product.id === product.id ? null : current));
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyNow = (product: ProductItem, quantity = 1) => {
    handleAddToCart(product, quantity);
    router.push(`/customer/checkout?buy_now_id=${product.id}`);
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category_name).filter((c): c is string => Boolean(c)))
  );

  const filteredProducts = products
    .filter((p) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        p.name?.toLowerCase().includes(term) ||
        p.composition?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category_name?.toLowerCase().includes(term);

      if (!matchesSearch) return false;
      if (categoryFilter !== "all" && p.category_name !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const priceA = Number(a.customer_price || a.display_price || a.mrp || 0);
      const priceB = Number(b.customer_price || b.display_price || b.mrp || 0);
      if (sortBy === "price-low") return priceA - priceB;
      if (sortBy === "price-high") return priceB - priceA;
      if (sortBy === "discount") return (b.discount_percentage || 0) - (a.discount_percentage || 0);
      return 0;
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginated = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
            WHO-GMP Certified Products
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● {products.length} Products Live
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          Browse Pharmaceutical & Healthcare Products
        </h1>

      </div>

      {statusMsg && (
        <div className="p-4 rounded-[5px] text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          {statusMsg}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs text-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box + Category Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search formulations by name, composition, SKU, or therapy..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full border border-slate-200 rounded-[5px] pl-9 pr-8 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 border border-slate-200 rounded-[5px] px-3 py-2.5 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-[#A71380] cursor-pointer"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort + View Mode Controls */}
          <div className="flex items-center space-x-2 shrink-0 self-end lg:self-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-200 rounded-[5px] px-3 py-2.5 bg-slate-50 font-bold text-slate-700 focus:outline-none focus:border-[#A71380] cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>

            {/* Grid / List Switcher */}
            <div className="flex items-center border border-slate-200 rounded-[5px] overflow-hidden bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`p-1.5 rounded-[4px] transition-all cursor-pointer ${viewMode === "grid" ? "bg-[#A71380] text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List View"
                className={`p-1.5 rounded-[4px] transition-all cursor-pointer ${viewMode === "list" ? "bg-[#A71380] text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Display Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-[6px] text-center border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#A71380] border-t-transparent mb-2"></div>
          <p className="font-bold text-xs text-slate-500">Loading catalog formulations...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-[6px] text-center border border-slate-200 space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="font-bold text-slate-800 text-sm">No Formulations Found</h3>
          <p className="text-xs text-slate-400">
            No products matched &quot;{searchTerm}&quot;. Try adjusting your search or category filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("all");
            }}
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white text-xs font-bold px-4 py-2 rounded-[5px] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((prod) => {
            const price = Number(prod.customer_price || prod.display_price || prod.mrp || 0);
            const mrp = Number(prod.mrp || (price > 0 ? price * 1.25 : 100));
            const qty = getQty(prod.id);
            const imageUrl = getProductImageUrl(prod);

            return (
              <div
                key={prod.id}
                className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between shadow-2xs"
              >
                <div className="relative h-48 bg-slate-50 overflow-hidden flex items-center justify-center p-3 group border-b border-slate-100">
                  <img
                    src={imageUrl}
                    alt={prod.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getCategoryFallbackImage(
                        prod.category_name || (prod as any).category,
                        prod.pack_size || (prod as any).packSize
                      );
                    }}
                    className="w-full h-full object-contain rounded-[5px] group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-[#0b2341]/90 backdrop-blur-xs text-white text-[9px] font-extrabold px-2.5 py-1 rounded-md z-10 shadow-2xs">
                    {prod.category_name || (prod as any).category || "Healthcare"}
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>SKU: {prod.sku}</span>
                      {prod.stock > 0 ? (
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

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-slate-200 rounded-[5px] overflow-hidden bg-slate-50">
                        <button
                          onClick={() => setQty(prod.id, qty - 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-0.5 font-mono font-bold text-xs text-[#0b2341]">{qty}</span>
                        <button
                          onClick={() => setQty(prod.id, qty + 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAddToCart(prod, qty)}
                        disabled={prod.stock <= 0}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 py-2 rounded-[5px] text-xs font-bold cursor-pointer disabled:opacity-50 transition-all"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleBuyNow(prod, qty)}
                        disabled={prod.stock <= 0}
                        className="bg-[#A71380] hover:bg-[#8E0F6D] text-white py-2 rounded-[5px] text-xs font-extrabold shadow-sm shadow-[#A71380]/20 cursor-pointer disabled:opacity-50 transition-all"
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
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Formulation & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Active Composition</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4">Price (₹)</th>
                  <th className="py-3.5 px-4 text-right">Order Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((prod) => {
                  const price = Number(prod.customer_price || prod.display_price || prod.mrp || 0);
                  const mrp = Number(prod.mrp || (price > 0 ? price * 1.25 : 100));
                  const inStock = prod.stock > 0;
                  const qty = getQty(prod.id);
                  const imageUrl = getProductImageUrl(prod);

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Formulation & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={imageUrl}
                            alt={prod.name}
                            className="w-10 h-10 rounded-[5px] object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-[#0b2341] tracking-tight whitespace-nowrap">
                              {prod.name}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">SKU: {prod.sku}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="bg-[#F8EAF4] text-[#A71380] text-[10px] font-bold px-2.5 py-0.5 rounded-[4px] border border-[#F3D0E9]">
                          {prod.category_name || "Healthcare"}
                        </span>
                      </td>

                      {/* Composition */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-medium max-w-[180px] truncate">
                        {prod.composition || prod.subtitle || "-"}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {inStock ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            <span>In Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            <span>Out of Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-black text-xs text-[#0b2341] font-mono">₹{price.toFixed(2)}</div>
                        {mrp > price && (
                          <span className="text-[10px] text-slate-400 line-through font-mono block">
                            MRP ₹{mrp.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleAddToCart(prod, qty)}
                            disabled={!inStock}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 px-3 py-1.5 rounded-[5px] text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => handleBuyNow(prod, qty)}
                            disabled={!inStock}
                            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-4 py-1.5 rounded-[5px] text-xs font-extrabold shadow-sm shadow-[#A71380]/20 transition-all cursor-pointer disabled:opacity-40"
                          >
                            Buy Now
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {filteredProducts.length > 0 && (
        <div className="bg-slate-50/80 px-6 py-4 rounded-[6px] border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-slate-500">
              Showing <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of{" "}
              <span className="font-bold text-slate-800">{filteredProducts.length}</span> formulations
            </span>

            <div className="flex items-center space-x-1.5 text-slate-500">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Items per page"
                className="bg-white border border-slate-200 rounded-[4px] px-2 py-1 font-bold text-slate-700 focus:outline-none focus:border-[#A71380]"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={15}>15</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
              className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              ‹ Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((pageNum, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && pageNum - prev > 1;
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-[4px] font-bold transition-all cursor-pointer ${currentPage === pageNum
                        ? "bg-[#A71380] text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
              className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* TOP-RIGHT SLEEK COMPACT GREEN TOAST BAR */}
      {toastNotification && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2.5 text-xs font-bold border border-emerald-500/80 backdrop-blur-xs transition-all">
            <span className="w-5 h-5 rounded-full bg-white text-emerald-700 flex items-center justify-center font-black text-[11px] shrink-0">
              ✓
            </span>
            <span className="tracking-tight">
              Added <strong className="font-extrabold text-white">'{toastNotification.product.name}'</strong> to cart!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
