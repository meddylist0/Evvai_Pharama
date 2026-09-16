"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, productsAPI, ProductItem, categoriesAPI } from "@/lib/api";
import {
  parsePackagingConfig,
  calculateStockBreakdown,
  formatPacks,
  formatCartons,
  formatDerivedUnits,
  getDerivedUnitLabel,
  getProductImageUrl,
  getCategoryFallbackImage,
} from "@/lib/packagingUtils";

export default function DistributorCatalogPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(["All"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "price_low" | "price_high" | "stock">("name");
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [poCartCount, setPoCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const refreshCartCount = () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_distributor_po_cart");
        if (raw) {
          const cart = JSON.parse(raw);
          setPoCartCount(Array.isArray(cart) ? cart.length : 0);
        }
      } catch (e) { }
    }
  };

  useEffect(() => {
    refreshCartCount();
    setUser(getStoredUser());
    const load = async () => {
      try {
        setLoading(true);
        const [prods, cats] = await Promise.all([
          productsAPI.list(),
          categoriesAPI.list().catch(() => []),
        ]);
        if (prods) setProducts(prods);
        if (cats && cats.length > 0) {
          setCategoriesList(["All", ...cats.map((c: any) => c.name)]);
        }
      } catch (err) {
        console.warn("Failed fetching catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isApproved = user?.kyc_status === "APPROVED";

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      const cat = p.category_name || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.composition.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term);

        const matchesCategory =
          selectedCategory === "All" || p.category_name === selectedCategory;
        const matchesStock = stockFilter === "ALL" || p.stock > 0;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        const priceA = a.distributor_price || a.display_price || a.mrp;
        const priceB = b.distributor_price || b.display_price || b.mrp;
        if (sortBy === "price_low") return priceA - priceB;
        if (sortBy === "price_high") return priceB - priceA;
        if (sortBy === "stock") return b.stock - a.stock;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredProducts, currentPage, pageSize]);

  // Summary Metrics
  const inStockCount = useMemo(() => products.filter((p) => p.stock > 0).length, [products]);
  const totalStockPacks = useMemo(
    () => products.reduce((acc, p) => acc + (p.stock || 0), 0),
    [products]
  );

  const handleAddToPO = (prod: ProductItem) => {
    setAddedItemName(prod.name);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_distributor_po_cart");
        let cart: { product: ProductItem; quantity: number }[] = raw
          ? JSON.parse(raw)
          : [];
        const idx = cart.findIndex((it) => it.product.id === prod.id);
        const qty = prod.bulk_moq || 50;
        if (idx >= 0) {
          cart[idx].quantity += qty;
        } else {
          cart.push({ product: prod, quantity: qty });
        }
        localStorage.setItem(
          "pharmalink_distributor_po_cart",
          JSON.stringify(cart)
        );
        setPoCartCount(cart.length);
      } catch (e) { }
    }
    setTimeout(() => setAddedItemName(null), 3500);
  };

  if (!isApproved) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-8 shadow-xs max-w-3xl mx-auto text-center space-y-4 my-12">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full mx-auto flex items-center justify-center border border-amber-200 shadow-2xs">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-6V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[#0b2341] tracking-tight">
          B2B Wholesale Catalog Locked
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
          Your distributor account is currently under State Drug License & GST verification by Admin. Tiered wholesale pricing and Bulk Purchase Orders will unlock immediately once approved.
        </p>
        <div className="pt-2">
          <Link
            href="/distributor/dashboard"
            className="inline-flex items-center space-x-2 bg-[#0b2341] hover:bg-[#A71380] text-white font-extrabold text-xs px-6 py-3 rounded-lg transition-all shadow-xs"
          >
            <span>Check KYC Verification Status</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold uppercase bg-[#F8EAF4] text-[#A71380] px-2.5 py-0.5 rounded border border-[#F3D0E9]">
              Verified Quality Products
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Wholesale Rates
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-1.5">
            Wholesale Products Catalog &amp; Price Sheet
          </h1>
          {/* <p className="text-xs text-slate-500 mt-0.5">
            Wholesale rates, packaging breakdown, and bulk MOQ discounts for authorized stockists & hospital suppliers.
          </p> */}
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/distributor/orders/new"
            className="bg-[#0b2341] hover:bg-[#A71380] text-white px-4 py-2.5 rounded-lg font-extrabold text-xs transition-all shadow-xs flex items-center space-x-2 cursor-pointer whitespace-nowrap"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span>{poCartCount > 0 ? `View PO Cart (${poCartCount})` : "+ Create Bulk PO"}</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Success Notification Alert Banner */}
      {addedItemName && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-xl font-bold flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Added <strong>{addedItemName}</strong> to Purchase Order Cart!
            </span>
          </div>
          <Link
            href="/distributor/orders/new"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-md font-extrabold text-xs transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <span>Proceed to Checkout &rarr;</span>
          </Link>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            <span>Total Products</span>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="text-2xl font-black text-[#0b2341] font-mono">
            {products.length} <span className="text-xs font-normal text-slate-400">Products</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Across {categoriesList.length - 1} Categories
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            <span>In-Stock Products</span>
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {inStockCount} <span className="text-xs font-normal text-slate-400">Available</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            {totalStockPacks.toLocaleString("en-IN")} Total Stock Packs
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            <span>Wholesale Margins</span>
            <svg className="w-4 h-4 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h10M7 12h10m-8 5h8" />
            </svg>
          </div>
          <div className="text-2xl font-black text-[#A71380] font-mono">
            Up to 35% <span className="text-xs font-normal text-slate-400">Off MRP</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            + Extra Bulk MOQ Slab Discounts
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            <span>PO Cart Status</span>
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {poCartCount} <span className="text-xs font-normal text-slate-400">Line Items</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {poCartCount > 0 ? "Ready for checkout & PO generation" : "Cart empty"}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {categoriesList.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center space-x-2 ${isActive
                  ? "bg-[#0b2341] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono leading-none ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700 font-bold"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Controls: Stock Filter, Sort & Search */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          {/* Stock Filter Toggle */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            aria-label="Filter by Stock Availability"
            className="border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#A71380]"
          >
            <option value="ALL">All Factory Stock</option>
            <option value="IN_STOCK">In Stock Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort Catalog Items"
            className="border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#A71380]"
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="price_low">Rate: Low to High</option>
            <option value="price_high">Rate: High to Low</option>
            <option value="stock">Stock: High to Low</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search product name, code..."
              className="w-full border border-slate-200 rounded-lg pl-9 pr-7 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium text-xs"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 font-bold text-xs p-0.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs table-auto">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50 tracking-wider">
                <th className="py-3.5 px-4 w-[28%]">Product &amp; Item Code</th>
                <th className="py-3.5 px-3 w-[20%]">Active Ingredients</th>
                <th className="py-3.5 px-3 w-[18%]">Packing &amp; Box Details</th>
                <th className="py-3.5 px-3 w-[16%]">Wholesale Price</th>
                <th className="py-3.5 px-3 w-[10%]">Available Stock</th>
                <th className="py-3.5 px-4 text-right w-[8%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0b2341] border-t-transparent mb-2"></div>
                    <p>Loading Products Catalog...</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    <div className="space-y-1">
                      <svg className="w-8 h-8 mx-auto text-slate-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-slate-700 text-sm">No Products Found</p>
                      <p className="text-xs font-normal text-slate-400">
                        Try resetting your search filter or category selection above.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  const catName = prod.category_name || (prod as any).category;
                  const packStr = prod.pack_size || (prod as any).packSize;
                  const pkg = parsePackagingConfig(packStr, null, 50, catName);
                  const breakdown = calculateStockBreakdown(prod.stock, pkg);
                  const distRate = prod.distributor_price || prod.display_price || prod.mrp;
                  const bulkRate = prod.bulk_price || distRate;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Formulation & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                            <img
                              src={getProductImageUrl(prod)}
                              alt={prod.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getCategoryFallbackImage(
                                  prod.category_name || (prod as any).category,
                                  prod.pack_size || (prod as any).packSize
                                );
                              }}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-[#0b2341] text-xs block leading-snug truncate max-w-[200px]">
                              {prod.name}
                            </span>
                            <div className="flex items-center space-x-1.5 mt-0.5 flex-wrap gap-y-1">
                              <span className="text-[10px] text-[#A71380] font-mono font-bold bg-[#F8EAF4] px-1.5 py-0.2 rounded border border-[#F3D0E9]">
                                {prod.sku}
                              </span>
                              {prod.category_name && (
                                <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  {prod.category_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Composition */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium">
                        <div className="text-xs leading-snug line-clamp-2">
                          {prod.composition}
                        </div>
                      </td>

                      {/* Pack & Carton Multipliers */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 text-xs">
                          {prod.pack_size || `${pkg.stripsPerPack} × ${pkg.tabletsPerStrip} Pack`}
                        </div>
                        <div className="text-[10px] space-y-1 mt-1 font-mono">
                          <span className="bg-[#F8EAF4] text-[#A71380] px-2 py-0.5 rounded border border-[#F3D0E9] font-bold inline-flex items-center space-x-1">
                            <span>📦 1 Pack = {formatDerivedUnits(breakdown.tabletsPerPack, catName, packStr)} ({pkg.stripsPerPack} Strips)</span>
                          </span>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-bold block truncate max-w-[220px]">
                            🚚 1 Carton = {pkg.packsPerCarton} Packs ({formatDerivedUnits(breakdown.tabletsPerCarton, catName, packStr)})
                          </span>
                        </div>
                      </td>

                      {/* Pricing & Rates */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 line-through text-[10px]">
                              MRP: ₹{prod.mrp.toFixed(2)}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 rounded border border-emerald-200">
                              {Math.round(((prod.mrp - distRate) / prod.mrp) * 100)}% OFF
                            </span>
                          </div>
                          <div>
                            <span className="font-black text-[#A71380] text-sm font-mono">
                              ₹{distRate.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal ml-1">
                              / Pack
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block font-mono">
                            Bulk MOQ: ₹{bulkRate.toFixed(2)} (&ge;{prod.bulk_moq || 20} Packs)
                          </div>
                        </div>
                      </td>

                      {/* Factory Stock */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {prod.stock > 0 ? (
                          <div>
                            <span className="font-mono font-black text-slate-800 text-xs block">
                              {prod.stock.toLocaleString("en-IN")} Packs
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              ≈ {formatCartons(breakdown.cartons)} ({formatDerivedUnits(breakdown.tablets, catName, packStr)})
                            </span>
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                              ✓ Stocked
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-bold text-rose-600 block">
                              Out of Stock
                            </span>
                            <span className="text-[9px] font-medium text-slate-400">
                              Backorder Available
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleAddToPO(prod)}
                          className="bg-[#0b2341] hover:bg-[#A71380] text-white px-3.5 py-2 rounded-lg text-xs font-extrabold shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add to PO</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="bg-slate-50/90 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-slate-500">
                Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-slate-800">
                  {Math.min(currentPage * pageSize, filteredProducts.length)}
                </span>{" "}
                of <span className="font-bold text-slate-800">{filteredProducts.length}</span> products
              </span>

              <div className="flex items-center space-x-1.5 text-slate-500">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Formulations per page"
                  className="bg-white border border-slate-200 rounded-[4px] px-2.5 py-1 font-bold text-slate-700 focus:outline-none focus:border-[#0b2341]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
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
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                )
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-[4px] font-bold transition-all cursor-pointer ${currentPage === pageNum
                          ? "bg-[#0b2341] text-white shadow-xs"
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
      </div>
    </div>
  );
}
