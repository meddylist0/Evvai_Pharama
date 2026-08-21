"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { productsAPI, categoriesAPI } from "@/lib/api";

export default function NewProductFormPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State with deterministic initial SSR values
  const [form, setForm] = useState({
    name: "",
    sku: "SKU-PRD-2026-X",
    category_id: "",
    composition: "",
    packSize: "10 × 10 Blister Pack",
    subtitle: "",
    description: "",
    mrp: "580",
    customerPrice: "480",
    distributorPrice: "360",
    bulkPrice: "320",
    bulkMoq: "50",
    initialStock: "2500",
    lowStockThreshold: "100",
    batchNo: "BATCH-2026-A1",
    expiryDate: "12/2028",
    image: "",
    status: "active",
  });

  // Image Upload Mode: 'file' | 'url' | 'presets'
  const [imageTab, setImageTab] = useState<"file" | "url" | "presets">("file");
  const [dragOver, setDragOver] = useState(false);

  const presetImages = [
    { label: "Blister Tablets Pack", url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60" },
    { label: "Medicine Bottle", url: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60" },
    { label: "Capsules & Pills", url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60" },
    { label: "Injectable Ampoules", url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=500&auto=format&fit=crop&q=60" },
  ];

  // Client-side initialization: fresh SKU, Batch No & load live categories
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      sku: `SKU-PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      batchNo: `BATCH-${new Date().getFullYear()}-A${Math.floor(1 + Math.random() * 9)}`,
    }));

    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await categoriesAPI.list();
        if (data && data.length > 0) {
          setCategories(data);
          setForm((prev) => ({ ...prev, category_id: String(data[0].id) }));
        }
      } catch (err) {
        console.error("Failed loading categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);


  // Handle image file selection / drag-and-drop
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WebP, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be under 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setForm((prev) => ({ ...prev, image: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim()) {
      setErrorMsg("Formulation Name is required.");
      return;
    }
    if (!form.sku.trim()) {
      setErrorMsg("SKU Code is required.");
      return;
    }
    if (!form.composition.trim()) {
      setErrorMsg("Active Composition is required.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        subtitle: form.subtitle.trim() || undefined,
        composition: form.composition.trim(),
        pack_size: form.packSize.trim() || "10 × 10 Blister Pack",
        description: form.description.trim() || undefined,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        mrp: parseFloat(form.mrp) || 0,
        customer_price: parseFloat(form.customerPrice) || 0,
        distributor_price: parseFloat(form.distributorPrice) || 0,
        bulk_price: parseFloat(form.bulkPrice) || 0,
        bulk_moq: parseInt(form.bulkMoq) || 50,
        stock: parseInt(form.initialStock) || 0,
        low_stock_threshold: parseInt(form.lowStockThreshold) || 100,
        batch_no: form.batchNo.trim() || undefined,
        expiry_date: form.expiryDate.trim() || undefined,
        image: form.image.trim() || undefined,
        status: form.status || "active",
      };

      await productsAPI.create(payload);

      setSubmitted(true);
      setTimeout(() => {
        router.push("/admin/products");
      }, 1600);
    } catch (err: any) {
      console.error("Failed to register product:", err);
      setErrorMsg(err.message || "Failed to register product in master catalog.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Enterprise Formulation Entry
          </span>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Create & Register New Formulation Product
          </h1>
          <p className="text-xs text-slate-500">
            Publish pharmaceutical products with verified WHO-GMP batch credentials, multi-tier pricing, and high-resolution pack images.
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/products")}
          className="text-xs font-bold text-slate-600 hover:text-[#0b2341] border border-slate-300 px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer"
        >
          &larr; Back to Catalog
        </button>
      </div>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-10 text-center space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full mx-auto flex items-center justify-center text-3xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-black text-[#0b2341]">Formulation Published to Database!</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            <strong className="text-slate-900">{form.name}</strong> (SKU: {form.sku}) has been registered in the master catalog and is now live for B2B Wholesale Distributors and Retail Buyers.
          </p>
          <span className="text-xs font-bold text-emerald-700 block pt-2 animate-pulse">
            Redirecting to Product Management Catalog...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-2xs">
              <span>⚠️ {errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-600 font-black ml-2 hover:text-rose-900 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Basic Formulation Details */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
                <h3 className="text-sm font-extrabold text-[#0b2341] border-b border-slate-100 pb-2.5 flex items-center space-x-2">
                  <span>💊 1. Formulation Identity & Composition</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Brand / Formulation Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CardioVas XR 20mg"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Therapeutic Category *</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-semibold text-xs focus:outline-none focus:border-blue-600 cursor-pointer"
                    >
                      {loadingCategories ? (
                        <option>Loading categories...</option>
                      ) : (
                        categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Active Salt / Composition *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rosuvastatin Calcium 20mg IP"
                      value={form.composition}
                      onChange={(e) => setForm({ ...form, composition: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-semibold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Packaging Size & Format</label>
                    <input
                      type="text"
                      value={form.packSize}
                      onChange={(e) => setForm({ ...form, packSize: e.target.value })}
                      placeholder="10 × 10 Tablets Blister Pack"
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Tagline / Subtitle (Optional)</label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="e.g. Lipid Management Formulation"
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Clinical Indications / Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide details about dosage, therapeutic actions, and administration instructions..."
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium text-xs"
                  />
                </div>
              </div>

              {/* Section 2: Multi-Tier Role Pricing Rules */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
                <h3 className="text-sm font-extrabold text-[#0b2341] border-b border-slate-100 pb-2.5 flex items-center space-x-2">
                  <span>🏷️ 2. Multi-Tier Role Pricing & Bulk MOQ Rules</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">MRP (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.mrp}
                      onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Retail Buyer Rate (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.customerPrice}
                      onChange={(e) => setForm({ ...form, customerPrice: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Distributor Rate (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.distributorPrice}
                      onChange={(e) => setForm({ ...form, distributorPrice: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-blue-900 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Bulk Tier Rate (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.bulkPrice}
                      onChange={(e) => setForm({ ...form, bulkPrice: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-emerald-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Bulk Order MOQ (Units)</label>
                    <input
                      type="number"
                      value={form.bulkMoq}
                      onChange={(e) => setForm({ ...form, bulkMoq: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Catalog Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-xs cursor-pointer"
                    >
                      <option value="active">Active (Available in Catalog)</option>
                      <option value="disabled">Disabled (Draft / Hidden)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Batch, Stock & Storage Details */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
                <h3 className="text-sm font-extrabold text-[#0b2341] border-b border-slate-100 pb-2.5 flex items-center space-x-2">
                  <span>📦 3. Initial Batch & Cleanroom Inventory</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Batch Lot Code *</label>
                    <input
                      type="text"
                      required
                      value={form.batchNo}
                      onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Expiry Date *</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YYYY"
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">Initial Stock Units *</label>
                    <input
                      type="number"
                      required
                      value={form.initialStock}
                      onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Low Stock Alert Threshold (Units)</label>
                  <input
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Right 1 Col: Image Upload & Live Preview Card */}
            <div className="space-y-6">
              {/* Product Image Upload Box */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-[#0b2341] flex items-center space-x-1.5">
                    <span>🖼️ Product Image</span>
                  </h3>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Image Upload Source Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setImageTab("file")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      imageTab === "file" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("url")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      imageTab === "url" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("presets")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      imageTab === "presets" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Presets
                  </button>
                </div>

                {/* Tab 1: Upload File Drag & Drop */}
                {imageTab === "file" && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      dragOver ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-slate-400 bg-slate-50/60"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageFile(e.target.files[0]);
                        }
                      }}
                    />
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                      📷
                    </div>
                    <p className="font-bold text-slate-800 text-xs">Click or drag image here</p>
                    <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP up to 5MB</p>
                  </div>
                )}

                {/* Tab 2: Custom Image URL */}
                {imageTab === "url" && (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700 text-[11px]">Direct Image Web Link</label>
                    <input
                      type="url"
                      placeholder="https://example.com/product-pack.jpg"
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium text-xs"
                    />
                  </div>
                )}

                {/* Tab 3: Preset Pharmaceutical Images */}
                {imageTab === "presets" && (
                  <div className="grid grid-cols-2 gap-2">
                    {presetImages.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm({ ...form, image: preset.url })}
                        className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                          form.image === preset.url
                            ? "border-blue-600 bg-blue-50/60 font-bold text-blue-900"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-7 h-7 rounded-md object-cover" />
                        <span className="text-[10px] leading-tight truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Preview Box */}
                {form.image && (
                  <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Uploaded Preview
                    </span>
                    <div className="relative w-full h-36 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                      <img src={form.image} alt="Product Preview" className="w-full h-full object-contain p-2" />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Catalog Card Preview */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">
                  Live Catalog Card Preview
                </span>

                <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <div className="h-32 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                    {form.image ? (
                      <img src={form.image} alt={form.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center text-slate-300 space-y-1">
                        <div className="text-2xl">💊</div>
                        <span className="text-[10px] font-bold">No Image Uploaded</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-blue-600 font-bold block">{form.sku || "SKU-CODE"}</span>
                    <h4 className="font-extrabold text-[#0b2341] text-sm leading-tight truncate">
                      {form.name || "Formulation Brand Name"}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{form.composition || "Active Formulation Ingredients"}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Distributor Rate</span>
                      <span className="text-sm font-black text-blue-900">₹{parseFloat(form.distributorPrice || "0").toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">MRP Rate</span>
                      <span className="text-xs font-bold text-slate-500 line-through">₹{parseFloat(form.mrp || "0").toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Publishing to Master Database...</span>
                    </>
                  ) : (
                    <span>🚀 Save & Publish Product</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/admin/products")}
                  className="w-full py-3 rounded-2xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
