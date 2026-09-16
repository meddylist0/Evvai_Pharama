"use client";

import React, { useState, useEffect } from "react";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { productsAPI, pricingAPI, ProductItem } from "@/lib/api";

export default function AdminPricingPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Configure Modal State
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mrp, setMrp] = useState<number>(0);
  const [customerPrice, setCustomerPrice] = useState<number>(0);
  const [distributorPrice, setDistributorPrice] = useState<number>(0);
  const [bulkPrice, setBulkPrice] = useState<number>(0);
  const [bulkMoq, setBulkMoq] = useState<number>(50);
  const [saving, setSaving] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const data = await productsAPI.list(undefined, undefined, true);
      if (data && data.length > 0) {
        const normalized = data.map((p: any) => ({
          ...p,
          mrp: p.mrp ?? 0,
          customer_price: p.customer_price ?? p.customerPrice ?? 0,
          distributor_price: p.distributor_price ?? p.distributorPrice ?? 0,
          bulk_price: p.bulk_price ?? p.bulkPrice ?? 0,
          bulk_moq: p.bulk_moq ?? p.bulkMoq ?? 50,
        }));
        setProducts(normalized);
      } else if (process.env.NODE_ENV === "development") {
        // Development local fallback when DB has no products
        const normalizedMock = (INITIAL_PRODUCTS as any[]).map((p) => ({
          ...p,
          mrp: p.mrp ?? 0,
          customer_price: p.customerPrice ?? p.customer_price ?? 0,
          distributor_price: p.distributorPrice ?? p.distributor_price ?? 0,
          bulk_price: p.bulkPrice ?? p.bulk_price ?? 0,
          bulk_moq: p.bulkMoq ?? p.bulk_moq ?? 50,
        }));
        setProducts(normalizedMock);
      } else {
        // Production: Empty state when no products exist in DB
        setProducts([]);
      }
    } catch (err: any) {
      console.error("Failed fetching products from API:", err);
      if (process.env.NODE_ENV === "development") {
        console.warn("Backend offline, using development mock fallback.");
        const normalizedMock = (INITIAL_PRODUCTS as any[]).map((p) => ({
          ...p,
          mrp: p.mrp ?? 0,
          customer_price: p.customerPrice ?? p.customer_price ?? 0,
          distributor_price: p.distributorPrice ?? p.distributor_price ?? 0,
          bulk_price: p.bulkPrice ?? p.bulk_price ?? 0,
          bulk_moq: p.bulkMoq ?? p.bulk_moq ?? 50,
        }));
        setProducts(normalizedMock);
      } else {
        setProducts([]);
        setStatusMsg({
          type: "error",
          text: err.message || "Failed to connect to database. Please check backend connection.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    const handleGlobalSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setSearchTerm(q);
      setCurrentPage(1);
    };
    window.addEventListener("pharmalink_admin_search", handleGlobalSearch);
    return () => window.removeEventListener("pharmalink_admin_search", handleGlobalSearch);
  }, []);

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.composition?.toLowerCase().includes(term) ||
      p.category_name?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleOpenConfigure = (p: ProductItem) => {
    setSelectedProduct(p);
    setMrp(p.mrp || 0);
    setCustomerPrice(p.customer_price ?? (p as any).customerPrice ?? 0);
    setDistributorPrice(p.distributor_price ?? (p as any).distributorPrice ?? 0);
    setBulkPrice(p.bulk_price ?? (p as any).bulkPrice ?? 0);
    setBulkMoq(p.bulk_moq ?? (p as any).bulkMoq ?? 50);
    setIsModalOpen(true);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSaving(true);
    setStatusMsg(null);

    try {
      const updated = await pricingAPI.update(selectedProduct.id, {
        mrp: Number(mrp),
        customer_price: Number(customerPrice),
        distributor_price: Number(distributorPrice),
        bulk_price: Number(bulkPrice),
        bulk_moq: Number(bulkMoq),
      });

      // Update state locally with the updated product
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? {
              ...p,
              mrp: updated.mrp ?? Number(mrp),
              customer_price: updated.customer_price ?? Number(customerPrice),
              distributor_price: updated.distributor_price ?? Number(distributorPrice),
              bulk_price: updated.bulk_price ?? Number(bulkPrice),
              bulk_moq: updated.bulk_moq ?? Number(bulkMoq),
              display_price: updated.display_price ?? Number(customerPrice),
            }
            : p
        )
      );

      setIsModalOpen(false);
      setSelectedProduct(null);
      setStatusMsg({
        type: "success",
        text: `Pricing matrix for '${updated.name || selectedProduct.name}' updated successfully in database!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to update pricing rates in database.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4" suppressHydrationWarning>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
              Multi-Tier Role Pricing Rules & Bulk Configurator
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
              ● Live Database Connected
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Pricing Rules Manager
          </h1>
          <p className="text-xs text-slate-500">
            Configure MRP, Retail Customer Rate, Wholesale Distributor Rate, and Bulk MOQ Rate directly in the database.
          </p>
        </div>

        <button
          onClick={loadProducts}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-[5px] text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shrink-0 disabled:opacity-50"
          suppressHydrationWarning
        >
          <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh DB Data</span>
        </button>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-[5px] text-xs font-bold border flex items-center justify-between transition-all ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          <div className="flex items-center space-x-2">
            <span>{statusMsg.type === "success" ? "✓" : "⚠"}</span>
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-3 cursor-pointer"
            suppressHydrationWarning
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs text-xs" suppressHydrationWarning>
        <input
          type="text"
          placeholder="Search by SKU, formulation name, composition, or category..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border border-slate-200 rounded-[5px] px-4 py-2 bg-slate-50 font-medium w-full sm:w-96 focus:bg-white focus:outline-none"
          suppressHydrationWarning
        />

        <div className="flex items-center space-x-3" suppressHydrationWarning>
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-[4px] px-2 py-1.5 bg-slate-50 font-bold text-[#0b2341]"
              suppressHydrationWarning
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-[6px] border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-[#A71380] border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Loading live product pricing catalog from database...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px]">
                  <th className="py-3.5 px-4">SKU / Code</th>
                  <th className="py-3.5 px-4">Formulation Name</th>
                  <th className="py-3.5 px-4">MRP (₹)</th>
                  <th className="py-3.5 px-4">Retail Customer Rate</th>
                  <th className="py-3.5 px-4">Distributor Wholesale</th>
                  <th className="py-3.5 px-4">Bulk MOQ Rate</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold text-xs">
                      No products found matching &apos;{searchTerm}&apos;.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((p) => {
                    const custPrice = p.customer_price ?? (p as any).customerPrice ?? 0;
                    const distPrice = p.distributor_price ?? (p as any).distributorPrice ?? 0;
                    const bulkP = p.bulk_price ?? (p as any).bulkPrice ?? 0;
                    const bulkM = p.bulk_moq ?? (p as any).bulkMoq ?? 50;
                    const mrpVal = p.mrp || 0;

                    const custDiscount = mrpVal > 0 && custPrice < mrpVal
                      ? Math.round(((mrpVal - custPrice) / mrpVal) * 100)
                      : 0;

                    const distDiscount = mrpVal > 0 && distPrice < mrpVal
                      ? Math.round(((mrpVal - distPrice) / mrpVal) * 100)
                      : 0;

                    return (
                      <tr key={p.id || p.sku} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#A71380] whitespace-nowrap">
                          {p.sku}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-[#0b2341] block text-sm">{p.name}</span>
                          {p.composition && (
                            <span className="text-[10px] text-slate-400 truncate max-w-xs block font-medium">
                              {p.composition}
                            </span>
                          )}
                          {p.pack_size && (
                            <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono mt-0.5 inline-block">
                              Pack: {p.pack_size}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 line-through font-mono font-medium whitespace-nowrap">
                          ₹{mrpVal.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-black text-slate-900 text-sm font-mono">
                            ₹{custPrice.toFixed(2)}
                          </div>
                          {custDiscount > 0 && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block mt-0.5">
                              {custDiscount}% OFF MRP
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-[#A71380] font-black font-mono text-sm">
                            ₹{distPrice.toFixed(2)}
                          </div>
                          {distDiscount > 0 && (
                            <span className="text-[9px] font-bold text-[#A71380] bg-[#F8EAF4] px-1.5 py-0.2 rounded border border-[#F3D0E9] inline-block mt-0.5">
                              {distDiscount}% Wholesale
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-emerald-700 font-black font-mono text-sm">
                            ₹{bulkP.toFixed(2)}
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">
                            MOQ: ≥{bulkM} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenConfigure(p)}
                            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-3.5 py-2 rounded-[5px] font-extrabold text-[11px] shadow-sm shadow-[#A71380]/20 transition-all cursor-pointer inline-flex items-center space-x-1.5"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            <span>Configure</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
            <div>
              {filteredProducts.length > 0 ? (
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filteredProducts.length}</span> products
                </span>
              ) : (
                <span>0 products found</span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="First Page"
                >
                  «
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
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
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-[4px] font-bold text-[11px] transition-all cursor-pointer ${currentPage === pageNum
                          ? "bg-[#A71380] text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                >
                  Next ›
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="Last Page"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configure Pricing Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-md w-full shadow-2xl border border-slate-200 space-y-6 p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-[#A71380] uppercase bg-[#F8EAF4] px-2 py-0.5 rounded">
                  Configure Multi-Tier Pricing (Database)
                </span>
                <h2 className="text-lg font-black text-[#0b2341] mt-1">
                  {selectedProduct.name}
                </h2>
                <p className="text-[11px] text-slate-400 font-mono">SKU: {selectedProduct.sku}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-bold font-mono text-sm focus:bg-white focus:border-[#A71380] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Retail Customer Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={customerPrice}
                    onChange={(e) => setCustomerPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-bold font-mono text-sm focus:bg-white focus:border-[#A71380] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0b2341] mb-1">
                    Distributor Wholesale (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={distributorPrice}
                    onChange={(e) => setDistributorPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-bold font-mono text-sm text-[#A71380] focus:bg-white focus:border-[#A71380] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-700 mb-1">
                    Bulk Tier Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-bold font-mono text-sm text-emerald-900 focus:bg-white focus:border-[#A71380] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bulk Minimum Order Qty (MOQ Units)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={bulkMoq}
                  onChange={(e) => setBulkMoq(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-bold font-mono text-sm focus:bg-white focus:border-[#A71380] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white py-3.5 rounded-[5px] font-extrabold text-xs shadow-md shadow-[#A71380]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                <span>{saving ? "Saving to Database..." : "Save Pricing Matrix in Database"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
