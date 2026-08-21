"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { productsAPI, ordersAPI, categoriesAPI, ProductItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ProductCatalogProps {
  activeRole?: "guest" | "retail" | "distributor" | "admin";
  onAddToCart?: (productName: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  activeRole: propRole,
  onAddToCart,
}) => {
  const { user, isAuthenticated } = useAuth();
  const catalogTopRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Modals state
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<ProductItem | null>(null);
  const [selectedCheckoutProduct, setSelectedCheckoutProduct] = useState<ProductItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(user?.full_name || "Guest Customer");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("Apollo Healthcare Network, Road No. 36, Jubilee Hills, Hyderabad 500033");
  const [paymentMethod, setPaymentMethod] = useState("UPI / Online NetBanking");
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Fetch live products & categories from Python FastAPI backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData] = await Promise.all([
        productsAPI.list(),
        categoriesAPI.list().catch(() => [])
      ]);

      if (prodsData && prodsData.length > 0) {
        setProducts(prodsData);
      } else if (process.env.NODE_ENV === 'development') {
        // Development-only mock fallback when backend returns empty
        setProducts(INITIAL_PRODUCTS as any);
      } else {
        // Production: show empty state, not fake data
        setProducts([]);
      }

      // Dynamic Categories
      const dynamicCats = new Set<string>(["All"]);
      if (catsData && catsData.length > 0) {
        catsData.forEach((c: any) => dynamicCats.add(c.name));
      }
      if (prodsData && prodsData.length > 0) {
        prodsData.forEach((p: any) => {
          const cName = p.category_name || p.category;
          if (cName) dynamicCats.add(cName);
        });
      }
      setCategories(Array.from(dynamicCats));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("Backend not running, using mock fallback (development only):", err);
        setProducts(INITIAL_PRODUCTS as any);
      } else {
        console.error("Failed to fetch products:", err);
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.composition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const catName = p.category_name || (p as any).category;
    const matchesCategory =
      selectedCategory === "All" || catName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    catalogTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStartCheckout = (prod: ProductItem) => {
    setSelectedDetailProduct(null);
    setSelectedCheckoutProduct(prod);
    setOrderQuantity(user?.role === "DISTRIBUTOR" && prod.bulk_moq ? prod.bulk_moq : 1);
    setOrderSuccess(null);
    setOrderError(null);
    if (user) {
      setCustomerName(user.full_name);
    }
  };

  const handleCompleteCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckoutProduct) return;

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      if (isAuthenticated) {
        // Real API Order Creation
        const orderRes = await ordersAPI.create({
          items: [{ product_id: selectedCheckoutProduct.id, quantity: orderQuantity }],
          customer_name: customerName,
          customer_phone: phone,
          delivery_address: address,
          delivery_city: "Hyderabad",
          delivery_state: "Telangana",
          delivery_pincode: "500081",
          payment_method: paymentMethod,
        });

        setOrderSuccess(orderRes.order_code);
      } else {
        // Not authenticated — do not generate fake order codes
        setOrderError("Please log in to place an order. Guest checkout is not available.");
        setOrderSubmitting(false);
        return;
      }

      if (onAddToCart) {
        onAddToCart(selectedCheckoutProduct.name);
      }
    } catch (err: any) {
      console.error("Order failed:", err);
      setOrderError(err.message || "Failed to create order. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <section ref={catalogTopRef} className="space-y-6 my-6">
      {/* Search Bar & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-[#0b2341]">
              Formulation Pipeline ({filteredProducts.length} Formulations)
            </h2>
            {user && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                Active Tier: {user.role}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            WHO-GMP certified generic and specialized pharmaceutical products connected to FastAPI backend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search formulation, composition, SKU..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium w-full sm:w-64"
          />

          <div className="flex items-center space-x-1 text-slate-500 font-medium text-xs">
            <span className="text-[11px] text-slate-400">Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 font-bold text-[#0b2341] text-xs cursor-pointer focus:outline-none"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`text-xs px-4 py-2 rounded-full font-extrabold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
              selectedCategory === cat
                ? "bg-[#0b2341] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading EVVAI Pharma formulations from database...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <span className="text-3xl">💊</span>
              <p className="text-sm font-bold text-slate-600">No formulations found</p>
              <p className="text-xs text-slate-400">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((prod) => {
                const displayPrice = prod.display_price || prod.mrp;
                const priceLabel =
                  prod.role_price_label ||
                  (user?.role === "DISTRIBUTOR" ? "Distributor B2B Rate" : "Retail Customer Price");
                const catName = prod.category_name || (prod as any).category || "Formulation";

                return (
                  <div
                    key={prod.id || prod.sku}
                    className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div
                        onClick={() => setSelectedDetailProduct(prod)}
                        className="block cursor-pointer"
                      >
                        <div className="h-56 overflow-hidden bg-white relative p-4 flex items-center justify-center border-b border-slate-100 group-hover:bg-slate-50/50 transition-colors">
                          <img
                            src={prod.image || "/images/product_zene.png"}
                            alt={prod.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
                          />
                          <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold text-[#0b2341] shadow-2xs border border-slate-200">
                            {catName}
                          </span>
                          <span className="absolute bottom-3 left-3 bg-[#0b2341]/80 text-white px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold">
                            {prod.sku}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <h3
                            onClick={() => setSelectedDetailProduct(prod)}
                            className="text-base font-extrabold text-[#0b2341] group-hover:text-blue-600 transition-colors cursor-pointer leading-snug truncate"
                          >
                            {prod.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{prod.subtitle}</p>
                        </div>

                        <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Composition:</span>
                            <span className="font-bold text-slate-700 text-right truncate max-w-[170px]">
                              {prod.composition}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Packaging:</span>
                            <span className="font-bold text-slate-700">{prod.pack_size || (prod as any).packSize}</span>
                          </div>
                          <div className="flex justify-between items-baseline pt-1">
                            <div>
                              <span className="text-slate-400 font-medium text-[10px] block">{priceLabel}</span>
                              <span className="text-base font-black text-emerald-700">₹{displayPrice.toFixed(2)}</span>
                            </div>
                            {prod.bulk_moq && (
                              <div className="text-right">
                                <span className="text-slate-400 text-[10px] block">Bulk Tier MOQ</span>
                                <span className="font-bold text-[#0b2341]">{prod.bulk_moq} units</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setSelectedDetailProduct(prod)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                          >
                            📖 Details
                          </button>

                          <button
                            onClick={() => handleStartCheckout(prod)}
                            className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-extrabold px-3.5 py-2 rounded-xl flex items-center space-x-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                          >
                            <span>⚡ Order Now</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interactive Pagination Control Bar */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-200/90 shadow-2xs text-xs">
              <div className="text-slate-500 font-semibold">
                Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of{" "}
                <span className="font-bold text-[#0b2341]">{filteredProducts.length}</span> formulations
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(1)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold"
                    title="First Page"
                  >
                    «
                  </button>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold text-slate-700"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center ${
                            currentPage === pageNum
                              ? "bg-[#0b2341] text-white shadow-xs"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-1 text-slate-400 font-bold">...</span>;
                    }
                    return null;
                  })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold text-slate-700"
                  >
                    Next ›
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold"
                    title="Last Page"
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 1. READ MORE / PRODUCT DETAILS MODAL */}
      {selectedDetailProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6 p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-blue-800 uppercase bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {selectedDetailProduct.category_name || (selectedDetailProduct as any).category} • Specification
                </span>
                <h2 className="text-2xl font-black text-[#0b2341] tracking-tight mt-1">
                  {selectedDetailProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedDetailProduct(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64 rounded-2xl overflow-hidden bg-white border border-slate-200 p-4 flex items-center justify-center">
                <img
                  src={selectedDetailProduct.image || "/images/product_zene.png"}
                  alt={selectedDetailProduct.name}
                  className="max-h-full max-w-full object-contain drop-shadow-xs"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#f7f6f4] p-4 rounded-2xl border border-[#e8e6e2] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Active SKU:</span>
                    <span className="font-mono font-bold text-blue-700">{selectedDetailProduct.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Batch Number:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedDetailProduct.batch_no || (selectedDetailProduct as any).batchNo || "EV2026-B1"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Pack Configuration:</span>
                    <span className="font-bold text-slate-800">{selectedDetailProduct.pack_size || (selectedDetailProduct as any).packSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Stock Status:</span>
                    <span className="font-bold text-emerald-700">Available ({selectedDetailProduct.stock} units)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-[#0b2341] block">Therapeutic Indication:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedDetailProduct.subtitle || selectedDetailProduct.description}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">MRP: ₹{selectedDetailProduct.mrp.toFixed(2)}</span>
                <span className="text-xl font-black text-[#0b2341] block">
                  {selectedDetailProduct.role_price_label}: ₹{selectedDetailProduct.display_price?.toFixed(2) || selectedDetailProduct.mrp.toFixed(2)}
                </span>
                {selectedDetailProduct.bulk_price && (
                  <span className="text-emerald-700 font-bold block">
                    Bulk Tier Rate: ₹{selectedDetailProduct.bulk_price.toFixed(2)} for ≥{selectedDetailProduct.bulk_moq} units MOQ
                  </span>
                )}
              </div>

              <button
                onClick={() => handleStartCheckout(selectedDetailProduct)}
                className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-xl font-extrabold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
              >
                ⚡ Proceed to Order Now &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CHECKOUT MODAL */}
      {selectedCheckoutProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6 p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Instant Order Booking
                </span>
                <h2 className="text-xl font-black text-[#0b2341] tracking-tight mt-1">
                  Checkout: {selectedCheckoutProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCheckoutProduct(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orderError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-semibold">
                {orderError}
              </div>
            )}

            {orderSuccess ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-black text-[#0b2341]">Order Created Successfully!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your order for <strong>{selectedCheckoutProduct.name}</strong> has been registered in PharmaLink backend.
                </p>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block font-mono text-xs font-bold text-blue-900">
                  Order Reference: {orderSuccess}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCheckoutProduct(null);
                      setOrderSuccess(null);
                    }}
                    className="bg-[#0b2341] text-white px-6 py-2.5 rounded-xl font-bold text-xs cursor-pointer hover:bg-[#12315a]"
                  >
                    Done & Back to Catalog
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCompleteCheckout} className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Selected Item:</span>
                    <span className="font-extrabold text-[#0b2341]">{selectedCheckoutProduct.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Unit Price:</span>
                    <span className="font-bold text-emerald-700">
                      ₹{(selectedCheckoutProduct.display_price || selectedCheckoutProduct.mrp).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">SKU / Code:</span>
                    <span className="font-mono text-blue-700 font-bold">{selectedCheckoutProduct.sku}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Order Quantity (Units)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer / Contact Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium cursor-pointer"
                    >
                      <option value="UPI / Online NetBanking">UPI / Online NetBanking</option>
                      <option value="Credit / Debit Card">Credit / Debit Card</option>
                      <option value="B2B Wholesale Credit (30 Days)">B2B Wholesale Credit (30 Days)</option>
                      <option value="Cash on Delivery">Cash on Delivery</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Address</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex justify-between items-center">
                  <span className="font-bold text-blue-900 text-xs">Total Order Value:</span>
                  <span className="text-base font-black text-blue-950 font-mono">
                    ₹{((selectedCheckoutProduct.display_price || selectedCheckoutProduct.mrp) * orderQuantity).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCheckoutProduct(null)}
                    className="w-1/3 border border-slate-300 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="w-2/3 bg-[#0b2341] hover:bg-[#12315a] text-white py-3 rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {orderSubmitting ? "Creating Order..." : "Confirm & Place Order"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
