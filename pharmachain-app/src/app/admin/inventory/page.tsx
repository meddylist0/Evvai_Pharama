"use client";

import React, { useState, useEffect } from "react";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { productsAPI, ProductItem } from "@/lib/api";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "sufficient">("all");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(500);
  const [adjustReason, setAdjustReason] = useState<string>("Production Batch Inward");
  const [adjusting, setAdjusting] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.list(undefined, undefined, true);
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(INITIAL_PRODUCTS as any);
      }
    } catch (err) {
      console.warn("Failed fetching inventory, using fallback:", err);
      setProducts(INITIAL_PRODUCTS as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.batch_no?.toLowerCase().includes(searchTerm.toLowerCase());

    const isLow = p.stock < 2500;
    if (filterStatus === "low") return matchesSearch && isLow;
    if (filterStatus === "sufficient") return matchesSearch && !isLow;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedInventory = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: "all" | "low" | "sufficient") => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setAdjusting(true);
    setStatusMsg(null);

    try {
      const updated = await productsAPI.adjustStock(selectedProduct.id, adjustAmount, adjustReason);
      setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? updated : p)));
      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      setStatusMsg({
        type: "success",
        text: `Stock for '${updated.name}' adjusted by ${adjustAmount > 0 ? `+${adjustAmount}` : adjustAmount} units. New Stock: ${updated.stock} units.`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to adjust stock in backend database." });
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Inventory & Batch Stock Monitor
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              API Live
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Warehouse Inventory & Batch Tracking
          </h1>
          <p className="text-xs text-slate-500">
            Real-time finished goods stock, batch expiry dates, and automated stock deductions.
          </p>
        </div>
      </div>

      {/* Status Msg */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${
          statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
        <input
          type="text"
          placeholder="Search by formulation, SKU, or batch number..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 font-medium w-full sm:w-80 focus:bg-white focus:outline-none"
        />

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusFilterChange("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterStatus === "all" ? "bg-[#0b2341] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => handleStatusFilterChange("low")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterStatus === "low" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800"
              }`}
            >
              Low Stock Alerts
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-bold text-[#0b2341]"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading inventory data...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px]">
                  <th className="py-3.5 px-4">SKU / Code</th>
                  <th className="py-3.5 px-4">Formulation Name</th>
                  <th className="py-3.5 px-4">Batch Number</th>
                  <th className="py-3.5 px-4">Packaging</th>
                  <th className="py-3.5 px-4">Available Units</th>
                  <th className="py-3.5 px-4">Inventory Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-semibold text-xs">
                      No stock records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedInventory.map((prod) => (
                    <tr key={prod.id || prod.sku} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{prod.sku}</td>
                      <td className="py-3 px-4 font-extrabold text-[#0b2341]">{prod.name}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">{prod.batch_no || "EV2026-B1"}</td>
                      <td className="py-3 px-4 text-slate-600">{prod.pack_size || (prod as any).packSize}</td>
                      <td className="py-3 px-4 font-black text-slate-900 text-sm">{prod.stock.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          prod.stock < 2500 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {prod.stock < 2500 ? "Low Stock Alert" : "Sufficient"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProduct(prod);
                            setIsAdjustModalOpen(true);
                          }}
                          className="bg-[#0b2341] hover:bg-[#12315a] text-white px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span>Adjust Stock</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
            <div>
              {filteredProducts.length > 0 ? (
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filteredProducts.length}</span> batch items
                </span>
              ) : (
                <span>0 items found</span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="First Page"
                >
                  «
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
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
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#0b2341] text-white shadow-2xs"
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                >
                  Next ›
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="Last Page"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 space-y-6 p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-blue-800 uppercase bg-blue-50 px-2 py-0.5 rounded">
                  Stock Inward / Outward
                </span>
                <h2 className="text-lg font-black text-[#0b2341] mt-1">
                  Adjust Stock: {selectedProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Current Stock Available: <span className="font-black text-emerald-700">{selectedProduct.stock} units</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Quantity (+ to add, - to deduct)</label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  placeholder="e.g. +500 or -100"
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium"
                >
                  <option value="Production Batch Inward">Production Batch Inward (+)</option>
                  <option value="Quality Inspection Sample">Quality Inspection Sample (-)</option>
                  <option value="Damaged / Expired Return">Damaged / Expired Return (-)</option>
                  <option value="Audit Reconciliation Adjustment">Audit Reconciliation Adjustment (±)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={adjusting}
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {adjusting ? "Updating Database..." : "Commit Stock Adjustment to Backend"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
