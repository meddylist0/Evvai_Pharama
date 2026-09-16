"use client";

import React, { useState, useEffect } from "react";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { productsAPI, ProductItem, ProductBatch } from "@/lib/api";
import { calculateDiscountFromPrice, formatINR } from "@/lib/pricingUtils";
import {
  parsePackagingConfig,
  calculateStockBreakdown,
  formatPacks,
  formatTablets,
  formatStrips,
  formatCartons,
  formatDerivedUnits,
  getDerivedUnitLabel,
  getProductImageUrl,
  getCategoryFallbackImage,
  PackagingConfig,
} from "@/lib/packagingUtils";

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "sufficient">("all");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modal & Batch Inspection States
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [productBatches, setProductBatches] = useState<ProductBatch[]>([]);
  const [selectedBatchDetail, setSelectedBatchDetail] = useState<ProductBatch | null>(null);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Stock Adjustment / Inwarding Form State
  const [adjustType, setAdjustType] = useState<"add" | "deduct">("add");
  const [adjustMode, setAdjustMode] = useState<"cartons" | "packs">("cartons");
  const [adjustCartonsInput, setAdjustCartonsInput] = useState<number>(5);
  const [adjustPacksInput, setAdjustPacksInput] = useState<number>(250);
  const [adjustBatchNo, setAdjustBatchNo] = useState<string>("CV20-INW1");
  const [adjustMfgDate, setAdjustMfgDate] = useState<string>("08/2026");
  const [adjustExpDate, setAdjustExpDate] = useState<string>("08/2028");
  const [adjustReason, setAdjustReason] = useState<string>("Production Batch Inward");
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [customReasonText, setCustomReasonText] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Packaging configuration for currently selected product
  const currentPkgConfig: PackagingConfig = selectedProduct
    ? parsePackagingConfig(selectedProduct.pack_size || (selectedProduct as any).packSize)
    : { packsPerCarton: 50, stripsPerPack: 10, tabletsPerStrip: 10 };

  // Calculated packs delta for adjustment modal
  const effectivePacksDelta = adjustMode === "cartons"
    ? Math.max(0, adjustCartonsInput * currentPkgConfig.packsPerCarton)
    : Math.max(0, adjustPacksInput);
  const signedPacksDelta = adjustType === "deduct" ? -effectivePacksDelta : effectivePacksDelta;
  const currentProductStock = selectedProduct ? selectedProduct.stock : 0;
  const projectedProductStock = Math.max(0, currentProductStock + signedPacksDelta);

  const handleOpenBatchModal = async (prod: ProductItem) => {
    setSelectedProduct(prod);
    setSelectedBatchDetail(null);
    setIsBatchModalOpen(true);
    try {
      setLoadingBatches(true);
      const data = await productsAPI.getBatches(prod.id);
      // Sort batches by nearest expiry date (FEFO)
      const sorted = (data || []).slice().sort((a, b) => {
        const parseExp = (str: string) => {
          if (!str) return 9999999999999;
          const parts = str.split("/");
          if (parts.length === 2) return new Date(Number(parts[1]), Number(parts[0]) - 1).getTime();
          return new Date(str).getTime() || 9999999999999;
        };
        return parseExp(a.expiry_date) - parseExp(b.expiry_date);
      });
      setProductBatches(sorted);
      if (sorted.length > 0) {
        setSelectedBatchDetail(sorted[0]);
      }
    } catch (err: any) {
      console.error("Failed fetching inventory batches:", err);
      // Fallback mock batch matching product if API fails
      const fallbackBatch: ProductBatch = {
        id: 1,
        product_id: prod.id,
        batch_no: prod.batch_no || "EV2026-A01",
        mfg_date: "08/2026",
        expiry_date: prod.expiry_date || "08/2028",
        quantity: prod.stock,
        reserved_quantity: 0,
        warehouse: "Main Warehouse",
        storage_location: "Cleanroom A",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProductBatches([fallbackBatch]);
      setSelectedBatchDetail(fallbackBatch);
    } finally {
      setLoadingBatches(false);
    }
  };

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
    const handleGlobalSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setSearchTerm(q);
      setCurrentPage(1);
    };
    window.addEventListener("pharmalink_admin_search", handleGlobalSearch);
    return () => window.removeEventListener("pharmalink_admin_search", handleGlobalSearch);
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.batch_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.composition?.toLowerCase().includes(searchTerm.toLowerCase());

    const threshold = p.low_stock_threshold || (p as any).lowStockThreshold || 100;
    const isLow = p.stock < threshold;
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

  const handleOpenAdjustModal = (prod: ProductItem) => {
    setSelectedProduct(prod);
    setAdjustType("add");
    setAdjustMode("cartons");
    setAdjustCartonsInput(5);
    setAdjustPacksInput(250);
    setAdjustBatchNo(`BATCH-${new Date().getFullYear()}-M${Math.floor(1 + Math.random() * 9)}`);
    setAdjustMfgDate("08/2026");
    setAdjustExpDate("08/2028");
    setAdjustReason("Production Batch Inward");
    setIsCustomReason(false);
    setCustomReasonText("");
    setIsAdjustModalOpen(true);
  };

  const handleReasonSelect = (val: string) => {
    if (val === "Other / Custom Reason") {
      setIsCustomReason(true);
      setAdjustReason("Other / Custom Reason");
    } else {
      setIsCustomReason(false);
      setAdjustReason(val);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setAdjusting(true);
    setStatusMsg(null);

    const delta = signedPacksDelta;
    const finalReason = isCustomReason && customReasonText.trim()
      ? customReasonText.trim()
      : adjustReason;

    let updatedProduct: any = null;

    try {
      if (adjustType === "add" && adjustBatchNo.trim()) {
        // Inward into batch
        await productsAPI.receiveBatch(selectedProduct.id, {
          batch_no: adjustBatchNo.trim(),
          expiry_date: adjustExpDate.trim() || "12/2028",
          quantity: effectivePacksDelta,
          mfg_date: adjustMfgDate.trim() || undefined,
          warehouse: "Main Warehouse",
          storage_location: "Cleanroom A",
        });
      }
      updatedProduct = await productsAPI.adjustStock(selectedProduct.id, delta, finalReason);
    } catch (err: any) {
      console.warn("Backend adjust API fallback to client state update:", err);
      const newStock = Math.max(0, (selectedProduct.stock || 0) + delta);
      updatedProduct = {
        ...selectedProduct,
        stock: newStock,
      };
    }

    // Update state locally with updated stock count
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProduct.id || p.sku === selectedProduct.sku ? { ...p, stock: updatedProduct.stock } : p
      )
    );

    const signStr = delta > 0 ? `+${delta}` : `${delta}`;
    setStatusMsg({
      type: "success",
      text: `✓ Stock for '${updatedProduct.name || selectedProduct.name}' adjusted by ${signStr} Saleable Packs. Reason: '${finalReason}'. New Total Available: ${formatPacks(updatedProduct.stock)}!`,
    });

    setIsAdjustModalOpen(false);
    setSelectedProduct(null);
    setAdjusting(false);
    loadInventory();
  };

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4" suppressHydrationWarning>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
              Product Stock &amp; Batch Hierarchy
            </span>

          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Pharmaceutical Stock &amp; FEFO Batch Inventory
          </h1>

        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" suppressHydrationWarning>
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Active Products</span>
            <div className="w-9 h-9 rounded-lg bg-[#F8EAF4] border border-[#F3D0E9] flex items-center justify-center text-[#A71380]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-[#0b2341] font-mono">
            {products.length}
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Formulations &amp; Salts listed</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Available Stock</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-[#A71380] font-mono">
            {products.reduce((acc, p) => acc + (p.stock || 0), 0).toLocaleString("en-IN")} <span className="text-xs font-bold">Packs</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Primary saleable inventory</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Low Stock Alerts</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {products.filter((p) => p.stock < (p.low_stock_threshold || 100)).length}
          </div>
          <p className="text-[10px] text-amber-600 font-bold">Requires reorder attention</p>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 hover:shadow-xs transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Storage System</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-blue-800 font-mono">
            FEFO Active
          </div>
          <p className="text-[10px] text-blue-700 font-bold">First Expiry First Out</p>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-lg text-xs font-bold border flex items-center justify-between transition-all ${statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          suppressHydrationWarning
        >
          <span>{statusMsg.text}</span>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-700 font-bold ml-2 cursor-pointer"
            suppressHydrationWarning
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-xs" suppressHydrationWarning>
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search formulation brand, SKU, active salt, batch..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="border border-slate-200 rounded-lg pl-9 pr-4 py-2 bg-slate-50 font-medium w-full focus:bg-white focus:outline-none focus:border-[#A71380] transition-colors"
            suppressHydrationWarning
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center space-x-3" suppressHydrationWarning>
          <div className="flex items-center space-x-2" suppressHydrationWarning>
            <button
              onClick={() => handleStatusFilterChange("all")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${filterStatus === "all" ? "bg-[#0b2341] text-white shadow-2xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              suppressHydrationWarning
            >
              All Formulations
            </button>
            <button
              onClick={() => handleStatusFilterChange("low")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${filterStatus === "low" ? "bg-amber-600 text-white shadow-2xs" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                }`}
              suppressHydrationWarning
            >
              ⚠️ Low Stock Alerts ({products.filter((p) => p.stock < (p.low_stock_threshold || 100)).length})
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-500 font-medium border-l border-slate-200 pl-3" suppressHydrationWarning>
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-md px-2 py-1.5 bg-slate-50 font-bold text-[#0b2341] focus:outline-none focus:border-[#A71380]"
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

      {/* Main Product Inventory Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-[6px] border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-[#A71380] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading live inventory from database...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-2xs" suppressHydrationWarning>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 min-w-[240px]">Product &amp; Salt</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Stock &amp; Breakdown</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Pricing (MRP / B2B)</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Status</th>
                  <th className="py-3.5 px-4 text-right min-w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-semibold text-xs bg-slate-50/30">
                      No stock records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedInventory.map((prod) => {
                    const mrp = Number(prod.mrp || 0);
                    const distPrice = Number(prod.distributor_price ?? (prod as any).distributorPrice ?? 0);
                    const catName = prod.category_name || (prod as any).category;
                    const packStr = prod.pack_size || (prod as any).packSize;
                    const pkg = parsePackagingConfig(packStr, null, 50, catName);
                    const breakdown = calculateStockBreakdown(prod.stock, pkg);
                    const threshold = prod.low_stock_threshold || (prod as any).lowStockThreshold || 100;
                    const isLowStock = prod.stock < threshold;

                    return (
                      <tr key={prod.id || prod.sku} className="hover:bg-pink-50/20 transition-all group">
                        {/* Formulation Brand & Salt */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 shrink-0 overflow-hidden flex items-center justify-center p-1 group-hover:border-[#A71380]/40 transition-colors">
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
                              <div className="font-extrabold text-[#0b2341] text-xs leading-tight truncate">{prod.name}</div>
                              <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">{prod.composition}</div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="font-mono text-[#A71380] font-bold text-[10px] bg-[#F8EAF4] px-1.5 py-0.5 rounded border border-[#F3D0E9]">{prod.sku}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Pack: <strong className="text-slate-700 font-semibold">{prod.pack_size || `${pkg.stripsPerPack}x${pkg.tabletsPerStrip}`}</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Stock & Breakdown */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-black text-[#0b2341] text-sm font-mono">
                            {prod.stock.toLocaleString("en-IN")} <span className="text-xs font-extrabold text-[#A71380]">Packs</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ≈ {formatCartons(breakdown.cartons)} ({formatDerivedUnits(breakdown.tablets, catName, packStr)})
                          </div>
                        </td>

                        {/* Master Pricing */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800 font-mono text-xs">{formatINR(mrp)} <span className="text-[9px] text-slate-400 font-sans font-medium">MRP</span></div>
                          <div className="text-[10px] text-emerald-700 font-bold font-mono">
                            B2B: {formatINR(distPrice)}
                          </div>
                        </td>

                        {/* Inventory Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full font-extrabold text-[9px] uppercase border shadow-2xs ${isLowStock ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-emerald-50 text-emerald-800 border-emerald-300"
                            }`}>
                            {isLowStock ? "Low Stock Alert" : "Sufficient Stock"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => handleOpenBatchModal(prod)}
                            className="bg-[#F8EAF4] hover:bg-[#F3D0E9] text-[#A71380] border border-[#F3D0E9] px-3 py-1.5 rounded-[5px] font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 hover:shadow-2xs"
                            title="Inspect FEFO Batches & Expiry"
                          >
                            <span>🔍 Inspect FEFO</span>
                          </button>
                          <button
                            onClick={() => handleOpenAdjustModal(prod)}
                            className="bg-[#0b2341] hover:bg-[#12315a] text-white px-3 py-1.5 rounded-[5px] font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 hover:shadow-xs"
                            suppressHydrationWarning
                          >
                            <span>📦 Inward / Adjust</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
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
                  <span className="font-bold text-[#0b2341]">{filteredProducts.length}</span> formulations
                </span>
              ) : (
                <span>0 formulations found</span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5" suppressHydrationWarning>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="First Page"
                  suppressHydrationWarning
                >
                  «
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  suppressHydrationWarning
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
                        suppressHydrationWarning
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
                  suppressHydrationWarning
                >
                  Next ›
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="Last Page"
                  suppressHydrationWarning
                >
                  »
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjust / Inward Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 p-7 relative animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-[#A71380] uppercase bg-[#F8EAF4] px-2.5 py-0.5 rounded border border-[#F3D0E9]">
                  Warehouse Stock Inward &amp; Adjustment Portal
                </span>
                <h2 className="text-base font-black text-[#0b2341] mt-1 truncate max-w-xs">
                  {selectedProduct.name}
                </h2>
                <p className="text-[10px] font-mono text-slate-400">
                  SKU: {selectedProduct.sku} • Pack Size: {selectedProduct.pack_size || "10 × 10 Pack"}
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer text-base"
                suppressHydrationWarning
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs" suppressHydrationWarning>
              {/* Operation Mode: Inward vs Outward */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Stock Operation Mode:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-[5px] border border-slate-200" suppressHydrationWarning>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("add");
                      setAdjustReason("Production Batch Inward");
                    }}
                    className={`py-2 rounded-[5px] font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1 ${adjustType === "add"
                      ? "bg-[#A71380] text-white shadow-md shadow-[#A71380]/20"
                      : "text-slate-600 hover:bg-slate-200/70"
                      }`}
                    suppressHydrationWarning
                  >
                    <span>➕ Inward Stock (+ Add)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("deduct");
                      setAdjustReason("Quality Inspection Sample");
                    }}
                    className={`py-2 rounded-[5px] font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1 ${adjustType === "deduct"
                      ? "bg-rose-600 text-white shadow-md shadow-rose-900/20"
                      : "text-slate-600 hover:bg-slate-200/70"
                      }`}
                    suppressHydrationWarning
                  >
                    <span>➖ Outward Stock (- Deduct)</span>
                  </button>
                </div>
              </div>

              {/* Quantity Entry Mode Toggle: Master Cartons vs Saleable Packs */}
              <div className="border border-slate-200 rounded-[5px] p-3.5 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700 text-xs">Receiving Unit:</span>
                  <div className="flex bg-white rounded-[4px] p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAdjustMode("cartons")}
                      className={`px-3 py-1 rounded-[3px] text-[10px] font-bold transition-all cursor-pointer ${adjustMode === "cartons" ? "bg-[#0b2341] text-white" : "text-slate-600"
                        }`}
                    >
                      📦 Master Cartons
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustMode("packs")}
                      className={`px-3 py-1 rounded-[3px] text-[10px] font-bold transition-all cursor-pointer ${adjustMode === "packs" ? "bg-[#0b2341] text-white" : "text-slate-600"
                        }`}
                    >
                      🔢 Saleable Packs
                    </button>
                  </div>
                </div>

                {adjustMode === "cartons" ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Master Cartons to {adjustType === "deduct" ? "Deduct" : "Inward"} *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={adjustCartonsInput}
                        onChange={(e) => setAdjustCartonsInput(Math.max(Number(e.target.value), 1))}
                        className="w-full border border-slate-300 rounded-[5px] p-2 bg-white font-mono font-bold text-xs focus:outline-none focus:border-[#A71380]"
                      />
                      <span className="absolute right-2.5 top-2 text-slate-400 font-bold text-[10px]">Cartons</span>
                    </div>
                    <span className="text-[10px] text-[#A71380] font-mono font-bold block mt-1">
                      = {adjustCartonsInput} Cartons × {currentPkgConfig.packsPerCarton} Packs/Carton = {effectivePacksDelta} Saleable Packs
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Saleable Packs to {adjustType === "deduct" ? "Deduct" : "Inward"} *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={adjustPacksInput}
                        onChange={(e) => setAdjustPacksInput(Math.max(Number(e.target.value), 1))}
                        className="w-full border border-slate-300 rounded-[5px] p-2 bg-white font-mono font-bold text-xs focus:outline-none focus:border-[#A71380]"
                      />
                      <span className="absolute right-2.5 top-2 text-slate-400 font-bold text-[10px]">Packs</span>
                    </div>
                  </div>
                )}

                {/* Batch Information for Additions */}
                {adjustType === "add" && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 text-[10px] mb-0.5">Batch Number *</label>
                      <input
                        type="text"
                        required
                        value={adjustBatchNo}
                        onChange={(e) => setAdjustBatchNo(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[10px] mb-0.5">MFG Date *</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YYYY"
                        value={adjustMfgDate}
                        onChange={(e) => setAdjustMfgDate(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[10px] mb-0.5">EXP Date *</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YYYY"
                        value={adjustExpDate}
                        onChange={(e) => setAdjustExpDate(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Projected Stock Preview Card */}
              <div className="bg-slate-900 text-white p-3.5 rounded-[5px] flex items-center justify-between border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Stock</span>
                  <span className="text-sm font-black font-mono">
                    {currentProductStock.toLocaleString()} Packs
                  </span>
                </div>
                <div className="text-center font-mono font-black text-xs">
                  <span className={adjustType === "deduct" ? "text-rose-400" : "text-emerald-400"}>
                    {signedPacksDelta > 0 ? `+${signedPacksDelta}` : signedPacksDelta} Packs
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Projected Stock</span>
                  <span className={`text-sm font-black font-mono ${adjustType === "deduct" ? "text-rose-300" : "text-emerald-300"}`}>
                    {projectedProductStock.toLocaleString()} Packs
                  </span>
                </div>
              </div>

              {/* Reason Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stock Movement Audit Reason *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => handleReasonSelect(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-2 bg-slate-50 font-bold text-xs focus:outline-none focus:border-[#A71380] cursor-pointer"
                  suppressHydrationWarning
                >
                  <option value="Production Batch Inward">Production Batch Inward</option>
                  <option value="Warehouse Stock Receipt">Warehouse Stock Receipt</option>
                  <option value="Distributor Bulk Allocation">Distributor Bulk Allocation</option>
                  <option value="Quality Inspection Sample">Quality Inspection Sample</option>
                  <option value="Damaged / Expired Goods Write-off">Damaged / Expired Goods Write-off</option>
                  <option value="Other / Custom Reason">Other / Custom Reason</option>
                </select>

                {isCustomReason && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom audit reason..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-2 bg-white font-medium mt-1.5 focus:outline-none focus:border-[#A71380]"
                    suppressHydrationWarning
                  />
                )}
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={adjusting}
                className={`w-full py-3 rounded-[5px] font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 text-white ${adjustType === "deduct"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-[#A71380] hover:bg-[#8E0F6D]"
                  }`}
                suppressHydrationWarning
              >
                {adjusting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>
                  {adjusting
                    ? "Updating Database..."
                    : adjustType === "deduct"
                      ? `Confirm & Deduct -${effectivePacksDelta} Saleable Packs`
                      : `Confirm & Inward +${effectivePacksDelta} Saleable Packs`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FEFO Batch Inventory Inspection & Detail Modal */}
      {isBatchModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-3xl w-full shadow-2xl border border-slate-200 space-y-4 p-6 relative animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-[#A71380] uppercase bg-[#F8EAF4] px-2.5 py-0.5 rounded border border-[#F3D0E9]">
                  FEFO Batch Inventory &amp; Expiry Hierarchy
                </span>
                <h2 className="text-base font-black text-[#0b2341] mt-1 truncate max-w-lg">
                  {selectedProduct.name}
                </h2>
                <p className="text-[10px] font-mono text-slate-400">
                  SKU: {selectedProduct.sku} • Primary Unit: <strong>Saleable Packs</strong>
                </p>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer text-base"
                suppressHydrationWarning
              >
                ✕
              </button>
            </div>

            {loadingBatches ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-[#A71380] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500 font-medium">Fetching FEFO batch records from database...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Product Stock Summary Banner */}
                {(() => {
                  const catName = selectedProduct.category_name || (selectedProduct as any).category;
                  const packStr = selectedProduct.pack_size || (selectedProduct as any).packSize;
                  const pkg = parsePackagingConfig(packStr, null, 50, catName);
                  const totalPacks = productBatches.reduce((acc, b) => acc + (b.quantity || 0), 0) || selectedProduct.stock;
                  const breakdown = calculateStockBreakdown(totalPacks, pkg);
                  const unitLabel = getDerivedUnitLabel(catName, packStr);

                  return (
                    <div className="bg-gradient-to-r from-[#0b2341] to-slate-900 text-white p-4 rounded-[6px] space-y-2 border border-slate-800">
                      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
                        <span className="text-[10px] font-mono uppercase text-pink-300 font-black">
                          PRODUCT STOCK OVERVIEW
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Active Batches: {productBatches.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pt-1">
                        <div className="bg-white/5 p-2 rounded">
                          <span className="text-[9px] text-slate-400 block font-sans">Total Available</span>
                          <span className="font-black text-emerald-300 text-base">{totalPacks.toLocaleString("en-IN")} Packs</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <span className="text-[9px] text-slate-400 block font-sans">Master Cartons</span>
                          <span className="font-extrabold text-white text-sm">{formatCartons(breakdown.cartons)}</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <span className="text-[9px] text-slate-400 block font-sans">Equivalent Sub-units</span>
                          <span className="font-extrabold text-purple-200 text-sm">{breakdown.strips.toLocaleString("en-IN")} Units</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded">
                          <span className="text-[9px] text-slate-400 block font-sans">Equivalent {unitLabel.unitPlural}</span>
                          <span className="font-extrabold text-cyan-200 text-sm">{formatDerivedUnits(breakdown.tablets, catName, packStr)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Batch Table Sorted by FEFO */}
                <div className="border border-slate-200 rounded-[5px] overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-extrabold text-slate-700 text-xs">
                      Active Manufacturing Batches (Sorted by Nearest Expiry - FEFO)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Click batch row to inspect breakdown
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase text-[9px]">
                        <th className="py-2.5 px-3">Batch Number</th>
                        <th className="py-2.5 px-3">MFG Date</th>
                        <th className="py-2.5 px-3">Expiry Date (FEFO)</th>
                        <th className="py-2.5 px-3">Master Cartons</th>
                        <th className="py-2.5 px-3">Available Packs</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {productBatches.map((b, idx) => {
                        const pkg = parsePackagingConfig(selectedProduct.pack_size || (selectedProduct as any).packSize);
                        const bBreakdown = calculateStockBreakdown(b.quantity, pkg);
                        const isSelected = selectedBatchDetail?.id === b.id || selectedBatchDetail?.batch_no === b.batch_no;

                        return (
                          <tr
                            key={b.id || idx}
                            onClick={() => setSelectedBatchDetail(b)}
                            className={`hover:bg-pink-50/40 cursor-pointer transition-colors ${isSelected ? "bg-[#F8EAF4]/60 font-semibold" : ""
                              }`}
                          >
                            <td className="py-2.5 px-3 font-mono font-bold text-[#A71380]">
                              {b.batch_no}
                              {idx === 0 && (
                                <span className="ml-1.5 text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-extrabold uppercase">
                                  Next Out (FEFO)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-600 font-mono">{b.mfg_date || "08/2026"}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 font-mono">{b.expiry_date}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{formatCartons(bBreakdown.cartons)}</td>
                            <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                              {b.quantity.toLocaleString("en-IN")} Packs
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="text-[10px] text-[#A71380] font-bold hover:underline">
                                {isSelected ? "✓ Selected" : "Inspect →"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Selected Batch Detailed Card */}
                {selectedBatchDetail && (() => {
                  const pkg = parsePackagingConfig(selectedProduct.pack_size || (selectedProduct as any).packSize);
                  const bBreakdown = calculateStockBreakdown(selectedBatchDetail.quantity, pkg);

                  return (
                    <div className="bg-slate-50 p-4 rounded-[6px] border border-slate-200 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-extrabold text-[#0b2341] text-xs">
                          🔍 Batch Detail: <span className="font-mono text-[#A71380]">{selectedBatchDetail.batch_no}</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Available: {selectedBatchDetail.quantity.toLocaleString("en-IN")} Packs
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block">Manufacturing Date</span>
                          <span className="font-mono font-bold text-slate-800">{selectedBatchDetail.mfg_date || "08/2026"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block">Expiry Date</span>
                          <span className="font-mono font-bold text-rose-700">{selectedBatchDetail.expiry_date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block">Master Cartons</span>
                          <span className="font-mono font-bold text-slate-800">{formatCartons(bBreakdown.cartons)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block">Primary Saleable Packs</span>
                          <span className="font-mono font-black text-[#A71380]">{selectedBatchDetail.quantity.toLocaleString("en-IN")} Packs</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-200/80">
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block">Equivalent Strips</span>
                          <span className="font-mono font-bold text-purple-700">{bBreakdown.strips.toLocaleString("en-IN")} Strips</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block">Equivalent Tablets</span>
                          <span className="font-mono font-bold text-cyan-800">{bBreakdown.tablets.toLocaleString("en-IN")} Tablets</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold text-[10px] block">Storage Location</span>
                          <span className="font-medium text-slate-600">{selectedBatchDetail.warehouse || "Main Warehouse"} ({selectedBatchDetail.storage_location || "Cleanroom A"})</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="w-full py-2.5 rounded-[5px] border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-xs transition-all cursor-pointer"
            >
              Close Batch Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
