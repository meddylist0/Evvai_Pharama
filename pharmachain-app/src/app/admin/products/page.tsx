"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { productsAPI, ProductItem } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [editFormData, setEditFormData] = useState({
    name: "",
    composition: "",
    pack_size: "",
    subtitle: "",
    category_name: "Wellness & Sleep",
    mrp: 0,
    customer_price: 0,
    distributor_price: 0,
    bulk_price: 0,
    bulk_moq: 50,
    stock: 0,
    batch_no: "",
    expiry_date: "",
    image: "",
    status: "active",
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.list(undefined, undefined, true);
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(INITIAL_PRODUCTS as any);
      }
    } catch (err) {
      console.warn("Failed fetching products from API, using fallback:", err);
      setProducts(INITIAL_PRODUCTS as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.composition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const catName = p.category_name || (p as any).category;
    if (categoryFilter !== "all" && catName !== categoryFilter) return false;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handleOpenEdit = (prod: ProductItem) => {
    setEditingProduct(prod);
    setEditFormData({
      name: prod.name || "",
      composition: prod.composition || "",
      pack_size: prod.pack_size || (prod as any).packSize || "",
      subtitle: prod.subtitle || "",
      category_name: prod.category_name || (prod as any).category || "Wellness & Sleep",
      mrp: prod.mrp || 0,
      customer_price: prod.customer_price || (prod as any).customerPrice || prod.display_price || 0,
      distributor_price: prod.distributor_price || (prod as any).distributorPrice || 0,
      bulk_price: prod.bulk_price || (prod as any).bulkPrice || 0,
      bulk_moq: prod.bulk_moq || (prod as any).bulkMoq || 50,
      stock: prod.stock || 0,
      batch_no: prod.batch_no || (prod as any).batchNo || "",
      expiry_date: prod.expiry_date || (prod as any).expiryDate || "",
      image: prod.image || "",
      status: prod.status || "active",
    });
    setIsEditModalOpen(true);
  };

  const handleEditImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WebP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditFormData((prev) => ({ ...prev, image: (e.target?.result as string) || "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSubmitLoading(true);
    setStatusMsg(null);

    try {
      const updated = await productsAPI.update(editingProduct.id, {
        name: editFormData.name,
        composition: editFormData.composition,
        pack_size: editFormData.pack_size,
        subtitle: editFormData.subtitle,
        mrp: Number(editFormData.mrp),
        customer_price: Number(editFormData.customer_price),
        distributor_price: Number(editFormData.distributor_price),
        bulk_price: Number(editFormData.bulk_price),
        bulk_moq: Number(editFormData.bulk_moq),
        stock: Number(editFormData.stock),
        batch_no: editFormData.batch_no,
        expiry_date: editFormData.expiry_date,
        image: editFormData.image || undefined,
        status: editFormData.status,
      });

      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updated } : p)));
      setIsEditModalOpen(false);
      setEditingProduct(null);
      setStatusMsg({ type: "success", text: `Formulation '${editFormData.name}' updated successfully in database!` });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update product." });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number, prodName: string) => {
    if (!confirm(`Are you sure you want to permanently delete '${prodName}' from the database?`)) return;
    try {
      await productsAPI.delete(id, true);
      setProducts(products.filter((p) => p.id !== id));
      setStatusMsg({ type: "success", text: `Product '${prodName}' permanently deleted.` });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to delete product." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Formulation Master Catalog
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              API Synced
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Pharmaceutical Product Pipeline Management
          </h1>
          <p className="text-xs text-slate-500">
            Create formulations with high-res pack images, WHO-GMP batch credentials, SKU codes, and multi-tier pricing.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-[#0b2341] hover:bg-[#12315a] text-white px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <span>+ Add New Formulation</span>
        </Link>
      </div>

      {/* Status Alerts */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
        <input
          type="text"
          placeholder="Search by formulation name, composition, SKU..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 font-medium w-full sm:w-80 focus:bg-white focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-0">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-bold text-[11px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set(products.map((p) => p.category_name || (p as any).category).filter(Boolean))).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

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

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Loading catalog from database...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px]">
                  <th className="py-3.5 px-4">Formulation / Pack</th>
                  <th className="py-3.5 px-4">Active Salt Composition</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">MRP</th>
                  <th className="py-3.5 px-4">Distributor Rate</th>
                  <th className="py-3.5 px-4">Stock Units</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400 font-semibold text-xs">
                      No formulations found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((prod) => (
                    <tr key={prod.id || prod.sku} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Thumbnail & Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-2xs">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-xl">💊</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-[#0b2341] leading-tight text-xs">{prod.name}</div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="font-mono text-[10px] text-blue-700 font-bold">{prod.sku}</span>
                              <span className="text-[10px] text-slate-400">•</span>
                              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                                {prod.pack_size || (prod as any).packSize || "Standard Pack"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium max-w-[180px] truncate">{prod.composition}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700">
                          {prod.category_name || (prod as any).category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{prod.mrp.toFixed(2)}</td>
                      <td className="py-3 px-4 font-black text-emerald-700">₹{(prod.distributor_price || (prod as any).distributorPrice || prod.display_price).toFixed(2)}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{prod.stock.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${prod.status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}>
                          {prod.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1"
                          title="Edit Formulation"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1"
                          title="Delete Product"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
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
              {filtered.length > 0 ? (
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filtered.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filtered.length}</span> formulations
                </span>
              ) : (
                <span>0 formulations found</span>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-1.5 mt-3 sm:mt-0">
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
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${currentPage === pageNum
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

      {/* Edit Formulation Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-6 p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-blue-800 uppercase bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  Update Formulation Master
                </span>
                <h2 className="text-xl font-black text-[#0b2341] tracking-tight mt-1">
                  Edit: {editingProduct.name} ({editingProduct.sku})
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              {/* Product Image Edit & Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">Formulation Pack Image</label>
                  {editFormData.image && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, image: "" })}
                      className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 shrink-0 overflow-hidden flex items-center justify-center p-1 shadow-2xs">
                    {editFormData.image ? (
                      <img src={editFormData.image} alt="Product" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">💊</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleEditImageUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-bold text-[11px] text-slate-700 cursor-pointer shadow-2xs"
                      >
                        📁 Choose Image File
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="Or paste image URL (https://...)"
                      value={editFormData.image}
                      onChange={(e) => setEditFormData({ ...editFormData, image: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white text-[11px] font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Formulation Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold cursor-pointer"
                  >
                    <option value="active">Active (Available for orders)</option>
                    <option value="disabled">Disabled (Hidden from catalog)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Therapeutic Category</label>
                  <select
                    value={editFormData.category_name}
                    onChange={(e) => setEditFormData({ ...editFormData, category_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
                  >
                    {Array.from(new Set(products.map((p) => p.category_name || (p as any).category).filter(Boolean))).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Packaging Form</label>
                  <input
                    type="text"
                    required
                    value={editFormData.pack_size}
                    onChange={(e) => setEditFormData({ ...editFormData, pack_size: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Active Chemical Composition</label>
                <input
                  type="text"
                  required
                  value={editFormData.composition}
                  onChange={(e) => setEditFormData({ ...editFormData, composition: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium"
                />
              </div>

              {/* Pricing Matrix Inputs */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormData.mrp}
                    onChange={(e) => setEditFormData({ ...editFormData, mrp: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormData.customer_price}
                    onChange={(e) => setEditFormData({ ...editFormData, customer_price: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Distributor B2B (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormData.distributor_price}
                    onChange={(e) => setEditFormData({ ...editFormData, distributor_price: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Bulk Tier (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormData.bulk_price}
                    onChange={(e) => setEditFormData({ ...editFormData, bulk_price: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white font-bold text-blue-700"
                  />
                </div>
              </div>

              {/* Inventory & Batch Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Available Stock</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editFormData.stock}
                    onChange={(e) => setEditFormData({ ...editFormData, stock: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={editFormData.batch_no}
                    onChange={(e) => setEditFormData({ ...editFormData, batch_no: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    required
                    value={editFormData.expiry_date}
                    onChange={(e) => setEditFormData({ ...editFormData, expiry_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {submitLoading ? "Updating Database..." : "Commit Changes to Live Database"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
