"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { productsAPI, ProductItem } from "@/lib/api";

export default function CustomerCatalogPage() {
  const router = useRouter();
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

  const getProductImageUrl = (prod: ProductItem) => {
    if (prod.image && prod.image.trim().length > 0) {
      if (prod.image.startsWith("http") || prod.image.startsWith("/")) return prod.image;
      return `/images/${prod.image}`;
    }
    const name = (prod.name || "").toLowerCase();
    if (name.includes("zene") || name.includes("melatonin")) return "/images/product_zene.png";
    if (name.includes("nxtnerve") || name.includes("b12")) return "/images/product_nxtnerve.png";
    if (name.includes("bilevia")) return "/images/product_bilevia.jpg";
    if (name.includes("evi ova")) return "/images/product_evi_ova.jpg";
    if (name.includes("gestogen")) return "/images/product_gestogen.jpg";
    if (name.includes("nxtlife")) return "/images/product_nxtlife.jpg";
    return "/images/dolotab_blister.jpg";
  };

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
      setStatusMsg(`✓ Added ${quantity} × '${product.name}' to cart!`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyNow = (product: ProductItem, quantity = 1) => {
    handleAddToCart(product, quantity);
    router.push("/customer/checkout");
  };

  const categories = Array.from(new Set(products.map((p) => p.category_name).filter(Boolean)));

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
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            WHO-GMP Certified Formulations Catalog
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● {products.length} Formulations Live
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          Browse Pharmaceutical & Healthcare Formulations
        </h1>
        <p className="text-xs text-slate-500">
          Real-time formulation inventory with verified batch testing, composition details, and express dispatch.
        </p>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          {statusMsg}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box + Category Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Search by brand name, active composition, SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-blue-600 transition-all"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Select Dropdown */}
            <div className="w-full sm:w-auto shrink-0">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 font-bold text-slate-700 text-xs cursor-pointer focus:outline-none focus:bg-white focus:border-blue-600 transition-all"
              >
                <option value="all">📁 All Categories ({products.length})</option>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category_name === cat).length;
                  return (
                    <option key={cat} value={cat!}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Sort & View Mode Selector */}
          <div className="flex items-center space-x-2 shrink-0 self-end lg:self-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 font-bold text-slate-700 text-xs cursor-pointer focus:outline-none focus:bg-white"
            >
              <option value="popular">Sort: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>

            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2.5 text-xs font-bold cursor-pointer ${viewMode === "grid" ? "bg-[#0b2341] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
              >
                ▦ Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2.5 text-xs font-bold cursor-pointer ${viewMode === "list" ? "bg-[#0b2341] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
              >
                ☰ Table
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Content */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading formulations catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="font-bold text-[#0b2341] text-base">No Formulations Found</h3>
          <p className="text-xs text-slate-400">No products matched your search "{searchTerm}".</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("all");
            }}
            className="bg-[#0b2341] text-white px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
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
                className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-2xs"
              >
                <div className="relative h-44 bg-slate-100/70 overflow-hidden flex items-center justify-center p-3">
                  <img src={imageUrl} alt={prod.name} className="w-full h-full object-cover rounded-2xl" />
                  <div className="absolute top-3 left-3 bg-[#0b2341]/85 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                    {prod.category_name || "Healthcare"}
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
                      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
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
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleBuyNow(prod, qty)}
                        disabled={prod.stock <= 0}
                        className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white py-2 rounded-xl text-xs font-extrabold shadow-2xs cursor-pointer disabled:opacity-50 transition-all"
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
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
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
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
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
                        <span className="bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
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
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => handleBuyNow(prod, qty)}
                            disabled={!inStock}
                            className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer disabled:opacity-40"
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

      {/* Pagination Bar */}
      {filteredProducts.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-xs font-medium text-slate-600">
          <div>
            Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-bold text-[#0b2341]">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of{" "}
            <span className="font-bold text-[#0b2341]">{filteredProducts.length}</span> items
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 font-bold"
            >
              ‹ Prev
            </button>
            <span className="px-3 py-1.5 font-bold text-[#0b2341]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 font-bold"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
