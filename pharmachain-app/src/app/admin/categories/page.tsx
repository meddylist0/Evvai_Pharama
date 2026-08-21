"use client";

import React, { useState, useEffect } from "react";
import { categoriesAPI, productsAPI, CategoryData, ProductItem } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catActive, setCatActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const fetchCategoriesData = async () => {
    try {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        categoriesAPI.list(),
        productsAPI.list(),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err: any) {
      console.error("Error loading categories:", err);
      setStatusMsg({ type: "error", text: err.message || "Failed to load categories from API." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatDesc("");
    setCatActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryData) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description || "");
    setCatActive(cat.is_active);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setSubmitting(true);
    setStatusMsg(null);

    try {
      if (editingCategory) {
        // Update Category API call
        const updated = await categoriesAPI.update(editingCategory.id, {
          name: catName,
          slug: catSlug || undefined,
          description: catDesc,
          is_active: catActive,
        });
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setStatusMsg({ type: "success", text: `✓ Category '${updated.name}' updated successfully!` });
      } else {
        // Create Category API call
        const created = await categoriesAPI.create({
          name: catName,
          slug: catSlug || undefined,
          description: catDesc,
          is_active: catActive,
        });
        setCategories((prev) => [...prev, created]);
        setStatusMsg({ type: "success", text: `✓ New therapeutic category '${created.name}' created in DB!` });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to save category." });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategoryStatus = async (cat: CategoryData) => {
    try {
      const updated = await categoriesAPI.update(cat.id, {
        is_active: !cat.is_active,
      });
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setStatusMsg({
        type: "success",
        text: `✓ Category '${cat.name}' ${updated.is_active ? "enabled" : "disabled"}!`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update category status." });
    }
  };

  const handleDeleteCategory = async (cat: CategoryData) => {
    if (!confirm(`Are you sure you want to permanently delete category '${cat.name}'?`)) return;
    try {
      await categoriesAPI.delete(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setStatusMsg({ type: "success", text: `✓ Category '${cat.name}' permanently deleted.` });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to delete category." });
    }
  };

  // Helper to count formulations per category
  const getProductCount = (cat: CategoryData) => {
    const cName = cat.name.toLowerCase();
    const cSlug = cat.slug.toLowerCase();
    return products.filter((p) => {
      const pCat = (p.category_name || (p as any).category || "").toLowerCase();
      return pCat === cName || pCat === cSlug || (p as any).category_id === cat.id;
    }).length;
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = filteredCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Live Database API • Taxonomy & Therapeutic Categories
          </span>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Therapeutic Category Management
          </h1>
          <p className="text-xs text-slate-500">
            Organize pharmaceutical formulations into therapeutic categories stored directly in the backend PostgreSQL database.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-extrabold px-5 py-3 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Add New Category</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Search & Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
        <input
          type="text"
          placeholder="Search by category name, slug, or description..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 bg-slate-50 font-medium w-full sm:w-80 focus:bg-white focus:outline-none"
        />

        <div className="flex items-center space-x-4">
          <div className="text-slate-500 font-bold text-xs">
            Total Categories: <span className="text-[#0b2341]">{filteredCategories.length}</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
            <p className="font-bold text-xs">Fetching Therapeutic Categories from Database...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold text-xs">
            No therapeutic categories found. Click "+ Add New Category" to create one.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                    <th className="py-3.5 px-5">ID & Slug</th>
                    <th className="py-3.5 px-5">Category Name</th>
                    <th className="py-3.5 px-5">Therapeutic Description</th>
                    <th className="py-3.5 px-5 whitespace-nowrap">Live Formulations</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCategories.map((c) => {
                    const count = getProductCount(c);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-mono font-bold text-blue-600">#CAT-{String(c.id).padStart(3, "0")}</div>
                          <span className="text-[10px] text-slate-400 font-mono">{c.slug}</span>
                        </td>
                        <td className="py-4 px-5 font-bold text-[#0b2341] text-sm">{c.name}</td>
                        <td className="py-4 px-5 text-slate-600 font-medium max-w-xs truncate">
                          {c.description || "Standard therapeutic group"}
                        </td>
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="inline-flex items-center space-x-1.5 bg-blue-50/80 border border-blue-200/80 text-blue-900 px-3 py-1.5 rounded-xl text-xs font-black shadow-2xs whitespace-nowrap">
                            <span className="bg-blue-600 text-white rounded-lg px-2 py-0.5 text-[11px] font-black">
                              {count}
                            </span>
                            <span className="font-bold text-[11px] text-slate-700">
                              {count === 1 ? "Formulation" : "Formulations"}
                            </span>
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`font-extrabold px-3 py-1 rounded-full text-[10px] border ${
                              c.is_active
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {c.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(c)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1"
                            title="Edit Category"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => toggleCategoryStatus(c)}
                            className={`border px-2.5 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 ${
                              c.is_active
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                            }`}
                            title={c.is_active ? "Disable Category" : "Enable Category"}
                          >
                            <span>{c.is_active ? "Disable" : "Enable"}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1"
                            title="Delete Category"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
              <div>
                {filteredCategories.length > 0 ? (
                  <span>
                    Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredCategories.length)}</span> of{" "}
                    <span className="font-bold text-[#0b2341]">{filteredCategories.length}</span> categories
                  </span>
                ) : (
                  <span>0 categories found</span>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                    title="Previous Page"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === pageNum
                          ? "bg-[#0b2341] text-white border-[#0b2341] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                    title="Next Page"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0b2341]">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Add New Therapeutic Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiology or Diabetology"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Slug (URL Identifier)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if left blank"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Therapeutic Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of formulations under this category..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={catActive}
                  onChange={(e) => setCatActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="catActive" className="text-slate-700 font-bold cursor-pointer">
                  Active (Visible in Storefront & Catalog)
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white font-bold py-3.5 rounded-xl mt-3 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? "Saving to Database..." : editingCategory ? "Update Category" : "Save Therapeutic Category"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
