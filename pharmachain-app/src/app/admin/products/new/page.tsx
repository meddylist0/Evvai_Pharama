"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { productsAPI, categoriesAPI } from "@/lib/api";
import {
  calculatePriceFromDiscount,
  formatINR,
  getGlobalPricingSettings,
  GlobalPricingSettings,
  DEFAULT_PRICING_SETTINGS,
} from "@/lib/pricingUtils";
import {
  parsePackagingConfig,
  calculateStockBreakdown,
  cartonsToPacks,
  formatPacks,
  formatTablets,
  formatStrips,
  formatCartons,
  getCategoryFallbackImage,
} from "@/lib/packagingUtils";

export default function NewProductFormPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Global Settings Loaded from Admin Settings
  const [globalPricing, setGlobalPricing] = useState<GlobalPricingSettings>(DEFAULT_PRICING_SETTINGS);

  // Active Image Tab & Drag/Drop state
  const [imageTab, setImageTab] = useState<"file" | "url" | "presets">("file");
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Form State with deterministic initial SSR values
  const [form, setForm] = useState({
    name: "",
    sku: "SKU-PRD-1001",
    category_id: "1",
    composition: "",
    packSize: "10 × 10 Blister Pack",
    subtitle: "",
    description: "",
    mrp: "580",
    customerPrice: "493.00",
    distributorPrice: "377.00",
    bulkPrice: "319.00",
    bulkMoq: "50",
    initialStock: "500",
    lowStockThreshold: "50",
    batchNo: "BATCH-2026-A1",
    expiryDate: "12/2028",
    image: "",
    status: "active",
  });

  // Packaging Configuration State
  const [packsPerCarton, setPacksPerCarton] = useState<number>(50); // Packs per Master Carton
  const [stripsPerPack, setStripsPerPack] = useState<number>(10);   // Strips per Saleable Pack
  const [tabletsPerStrip, setTabletsPerStrip] = useState<number>(10); // Tablets/Capsules per Strip

  // Opening Batch & Stock Inwarding State
  const [hasOpeningStock, setHasOpeningStock] = useState<boolean>(true);
  const [stockEntryMode, setStockEntryMode] = useState<"cartons" | "packs">("cartons");
  const [cartonsReceived, setCartonsReceived] = useState<number>(10); // Master Cartons Received
  const [packsDirectInput, setPacksDirectInput] = useState<number>(500); // Direct Saleable Packs Received
  const [mfgDate, setMfgDate] = useState<string>("08/2026");

  // Active Wizard Step (1: Identity, 2: Pricing, 3: Stock & Batch, 4: Image & Publish)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Calculated discount percentages based on global pricing
  const custDiscountPct = globalPricing.defaultCustDiscount || 15;
  const distDiscountPct = globalPricing.defaultDistDiscount || 35;
  const bulkDiscountPct = globalPricing.defaultBulkDiscount || 45;

  // Calculated Total Stock Packs
  const currentTotalPacks = stockEntryMode === "cartons"
    ? cartonsReceived * packsPerCarton
    : packsDirectInput;

  // Curated High-Resolution Pharma Product Presets (Local files for max reliability)
  const presetImages = [
    {
      label: "Blister Strip Box",
      url: "/uploads/products/accelerant-300.jpg",
      category: "Tablets",
    },
    {
      label: "Pharmaceutical Bottle",
      url: "/uploads/products/zene_melatonin_spray.png",
      category: "Syrups & Liquids",
    },
    {
      label: "Capsules Pack",
      url: "/uploads/products/evglip-met.jpg",
      category: "Capsules",
    },
    {
      label: "Injectable Vial",
      url: "/uploads/products/nxtnerve_b12_injection.png",
      category: "Injectables",
    },
    {
      label: "Topical Ointment",
      url: "/uploads/products/nxtlife-foaming.jpg",
      category: "Topical",
    },
    {
      label: "Health Supplement",
      url: "/uploads/products/ev-d3.jpg",
      category: "Nutraceuticals",
    },
  ];

  // Load Categories & Pricing Rules on Mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoadingCategories(true);
        const cats = await categoriesAPI.list();
        if (isMounted && Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
          setForm((prev) => ({ ...prev, category_id: String(cats[0].id) }));
        } else if (isMounted) {
          // Default Fallback Categories
          const fallbackCats = [
            { id: 1, name: "Cardiology & Vascular" },
            { id: 2, name: "Anti-Infectives & Antibiotics" },
            { id: 3, name: "Pain Management & Analgesics" },
            { id: 4, name: "Gastroenterology & Antacids" },
            { id: 5, name: "Vitamins & Supplements" },
            { id: 6, name: "Dermatology & Topical" },
            { id: 7, name: "Respiratory & Allergy" },
          ];
          setCategories(fallbackCats);
        }
      } catch (err) {
        console.warn("Failed to load categories:", err);
        if (isMounted) {
          setCategories([
            { id: 1, name: "Cardiology & Vascular" },
            { id: 2, name: "Anti-Infectives & Antibiotics" },
            { id: 3, name: "Pain Management & Analgesics" },
            { id: 4, name: "Gastroenterology & Antacids" },
            { id: 5, name: "Vitamins & Supplements" },
            { id: 6, name: "Dermatology & Topical" },
            { id: 7, name: "Respiratory & Allergy" },
          ]);
        }
      } finally {
        if (isMounted) setLoadingCategories(false);
      }

      try {
        const settings = getGlobalPricingSettings();
        if (isMounted) setGlobalPricing(settings);
      } catch (err) {
        console.warn("Failed loading pricing settings", err);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update selling prices automatically when printed MRP changes
  const handleMRPChange = (mrpVal: string) => {
    const mrpNum = parseFloat(mrpVal) || 0;
    const custPrice = calculatePriceFromDiscount(mrpNum, custDiscountPct);
    const distPrice = calculatePriceFromDiscount(mrpNum, distDiscountPct);
    const bulkPrice = calculatePriceFromDiscount(mrpNum, bulkDiscountPct);

    setForm((prev) => ({
      ...prev,
      mrp: mrpVal,
      customerPrice: custPrice > 0 ? custPrice.toFixed(2) : "",
      distributorPrice: distPrice > 0 ? distPrice.toFixed(2) : "",
      bulkPrice: bulkPrice > 0 ? bulkPrice.toFixed(2) : "",
    }));
  };

  // Image Upload File Handler
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 5MB limit. Please select a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: reader.result as string }));
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop Handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!form.name.trim()) {
        setErrorMsg("Product Brand Name is required.");
        return;
      }
      if (!form.sku.trim()) {
        setErrorMsg("Product SKU Code is required.");
        return;
      }
      if (!form.composition.trim()) {
        setErrorMsg("Active Formula / Ingredients details are required.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const mrp = parseFloat(form.mrp) || 0;
      if (mrp <= 0) {
        setErrorMsg("Product MRP must be greater than ₹0.00.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (hasOpeningStock) {
        if (!form.batchNo.trim()) {
          setErrorMsg("Batch Number is required when adding initial stock.");
          return;
        }
        if (!form.expiryDate.trim()) {
          setErrorMsg("Expiry Date (MM/YYYY) is required when adding initial stock.");
          return;
        }
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Final Validation
    if (!form.name.trim()) {
      setErrorMsg("Product Brand Name is required.");
      return;
    }
    if (!form.sku.trim()) {
      setErrorMsg("SKU Code is required.");
      return;
    }
    if (!form.composition.trim()) {
      setErrorMsg("Active Formula / Ingredients details are required.");
      return;
    }

    const mrp = parseFloat(form.mrp) || 0;
    const custPrice = parseFloat(form.customerPrice) || 0;
    const distPrice = parseFloat(form.distributorPrice) || 0;
    const bulkPrice = parseFloat(form.bulkPrice) || 0;
    const bulkMoq = parseInt(form.bulkMoq) || 50;

    if (mrp <= 0) {
      setErrorMsg("Printed MRP must be greater than ₹0.00.");
      return;
    }
    if (custPrice > mrp || distPrice > mrp || bulkPrice > mrp) {
      setErrorMsg("Selling price cannot exceed printed MRP.");
      return;
    }

    if (hasOpeningStock) {
      if (!form.batchNo.trim()) {
        setErrorMsg("Batch Number is required for initial stock.");
        return;
      }
      if (!form.expiryDate.trim()) {
        setErrorMsg("Expiry Date (MM/YYYY) is required for initial stock.");
        return;
      }
    }

    try {
      setSubmitting(true);

      const selectedCategoryObj = categories.find((c) => String(c.id) === String(form.category_id));
      const selectedCatName = selectedCategoryObj?.name || "";
      const finalImage = form.image.trim() || getCategoryFallbackImage(selectedCatName, form.packSize);

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        subtitle: form.subtitle.trim() || undefined,
        composition: form.composition.trim(),
        pack_size: form.packSize.trim() || `${stripsPerPack} × ${tabletsPerStrip} Tablets Pack`,
        description: form.description.trim() || undefined,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        mrp: mrp,
        customer_price: custPrice,
        distributor_price: distPrice,
        bulk_price: bulkPrice,
        bulk_moq: bulkMoq,
        stock: hasOpeningStock ? currentTotalPacks : 0,
        low_stock_threshold: parseInt(form.lowStockThreshold) || 50,
        batch_no: hasOpeningStock ? (form.batchNo.trim() || undefined) : undefined,
        expiry_date: hasOpeningStock ? (form.expiryDate.trim() || undefined) : undefined,
        image: finalImage,
        status: form.status || "active",
      };

      await productsAPI.create(payload);

      setSubmitted(true);
      setTimeout(() => {
        router.push("/admin/products");
      }, 1600);
    } catch (err: any) {
      console.error("Failed to register product:", err);
      setErrorMsg(err.message || "Failed to register product in catalog.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Basic Info", subtitle: "Brand & Ingredients" },
    { num: 2, label: "Price & Margins", subtitle: "MRP & Discount Tiers" },
    { num: 3, label: "Stock & Batch", subtitle: "Batch Code & Quantity" },
    { num: 4, label: "Photo & Publish", subtitle: "Image & Final Save" },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs" suppressHydrationWarning>
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-extrabold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
              Add New Product
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
              Step {currentStep} of 4
            </span>
          </div>
          <h1 className="text-xl font-black text-[#0b2341] tracking-tight">
            Add New Medicine / Product
          </h1>
          <p className="text-xs text-slate-500">
            Fill in product details, pricing, batch stock, and upload a product photo to add it to your store.
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/products")}
          className="text-xs font-bold text-slate-600 hover:text-[#0b2341] border border-slate-300 px-3.5 py-2 rounded-lg transition-all shrink-0 cursor-pointer hover:bg-slate-50"
          suppressHydrationWarning
        >
          &larr; Back to Products
        </button>
      </div>

      {/* Step Progress Bar & Wizard Indicators */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3" suppressHydrationWarning>
        {/* Progress Info Header */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A71380] animate-pulse"></span>
            Wizard Navigation
          </span>
          <span className="text-[#0b2341] font-extrabold font-mono text-[11px]">
            {Math.round(((currentStep - 1) / 3) * 100)}% Complete
          </span>
        </div>

        {/* Dynamic Fill Line */}
        <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#0b2341] via-[#A71380] to-[#E2127A] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(12, (currentStep / 4) * 100)}%` }}
          />
        </div>

        {/* Step Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {stepsList.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (isCompleted || isActive) setCurrentStep(s.num);
                }}
                className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all ${isActive
                  ? "bg-gradient-to-br from-[#F8EAF4] to-pink-50/40 border-[#A71380] ring-2 ring-[#A71380]/20 shadow-xs"
                  : isCompleted
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:border-emerald-300 cursor-pointer"
                    : "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                  }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 transition-all ${isActive
                    ? "bg-[#A71380] text-white shadow-xs"
                    : isCompleted
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                    }`}
                >
                  {isCompleted ? "✓" : s.num}
                </span>
                <div className="min-w-0">
                  <span className={`text-xs font-black block leading-tight truncate ${isActive ? "text-[#0b2341]" : "text-slate-700"}`}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate font-medium">{s.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-3 shadow-2xs animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full mx-auto flex items-center justify-center text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-black text-[#0b2341]">Product Added Successfully!</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            <strong className="text-slate-900">{form.name}</strong> (SKU: {form.sku}) has been saved and is now visible in your store catalog.
          </p>
          <span className="text-xs font-bold text-emerald-700 block pt-2 animate-pulse">
            Redirecting to Product List...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs">
              <span>⚠️ {errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-600 font-black ml-2 hover:text-rose-900 cursor-pointer"
                suppressHydrationWarning
              >
                ✕
              </button>
            </div>
          )}

          {/* STEP 1: BASIC PRODUCT INFO & INGREDIENTS */}
          {currentStep === 1 && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4 text-xs animate-in fade-in duration-200" suppressHydrationWarning>
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0b2341] flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#F8EAF4] text-[#A71380] text-[11px] font-black flex items-center justify-center">1</span>
                    <span>💊 Basic Product Info &amp; Active Ingredients</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Enter product brand name, category, and formula details.</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded">Step 1 of 4</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medicine / Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CardioVas 20mg"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-semibold text-xs"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code (Product ID) *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-mono font-bold text-xs"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-semibold text-xs focus:outline-none focus:border-[#A71380] cursor-pointer"
                    suppressHydrationWarning
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
                  <label className="block font-bold text-slate-700 mb-1">Active Salt / Formula Ingredients *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rosuvastatin Calcium 20mg"
                    value={form.composition}
                    onChange={(e) => setForm({ ...form, composition: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-semibold text-xs"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pack Format &amp; Size</label>
                  <input
                    type="text"
                    value={form.packSize}
                    onChange={(e) => setForm({ ...form, packSize: e.target.value })}
                    placeholder="10 × 10 Tablets Pack"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium text-xs"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtitle / Short Note (Optional)</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="e.g. Daily Health Formula"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium text-xs"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description &amp; Usage Instructions</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter details about dosage, therapeutic actions, and administration instructions..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium text-xs"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#0b2341] hover:bg-[#163861] text-white px-6 py-2.5 rounded-lg font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <span>Next: Price &amp; Margins</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PRICING, DISCOUNTS & STATUS */}
          {currentStep === 2 && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-xs animate-in fade-in duration-200" suppressHydrationWarning>
              {/* Step Header */}
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-[#F8EAF4] text-[#A71380] text-xs font-black flex items-center justify-center border border-[#F3D0E9]">
                    2
                  </span>
                  <h3 className="text-base font-black text-[#0b2341] tracking-tight">
                    🏷️ Product Pricing &amp; Role Rates
                  </h3>
                </div>
                <span className="text-[10px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-1 rounded-full shrink-0">
                  Step 2 of 4
                </span>
              </div>

              {/* Hero Printed MRP Input Banner */}
              <div className="bg-gradient-to-r from-[#0b2341] via-[#12315a] to-[#0b2341] text-white p-5 sm:p-6 rounded-xl shadow-lg border border-[#1e4577] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 z-10">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider bg-[#A71380] text-white px-3 py-1 rounded-[4px] shadow-xs">
                      Master Printed Box MRP
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-[4px]">
                      ⚡ Live Auto-Recalculate
                    </span>
                  </div>
                </div>

                {/* MRP Numeric Input Box */}
                <div className="w-full md:w-60 shrink-0 z-10">
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-extrabold text-xl select-none">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={form.mrp}
                      onChange={(e) => handleMRPChange(e.target.value)}
                      className="w-full border-2 border-slate-700 bg-slate-900/90 text-white pl-9 pr-4 py-2.5 rounded-lg font-mono font-black text-2xl focus:outline-none focus:border-[#A71380] focus:ring-2 focus:ring-[#A71380]/40 text-right shadow-inner transition-all"
                      placeholder="0.00"
                      suppressHydrationWarning
                    />
                  </div>
                </div>

                {/* Ambient glow accent */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#A71380]/20 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* 4-Tier High-Visibility Persona Rate Cards Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#0b2341] uppercase tracking-wider">
                    ⚡ Multi-Tier Selling Rates (Per Pack)
                  </span>
                  <span className="text-xs font-extrabold text-[#A71380] bg-[#F8EAF4] px-2.5 py-0.5 rounded-[4px] border border-[#F3D0E9]">
                    Global Rules Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: B2C Retail Customer */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                        Retail B2C
                      </span>
                      <span className="text-[11px] font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-[4px]">
                        {custDiscountPct}% OFF
                      </span>
                    </div>
                    <div className="text-2xl font-black text-blue-950 font-mono tracking-tight my-1">
                      ₹{parseFloat(form.customerPrice || "0").toFixed(2)}
                    </div>
                  </div>

                  {/* Card 2: Retailer PTR (Trade Rate) */}
                  <div className="bg-[#F8EAF4] border border-[#F3D0E9] rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-[#A71380]">
                        Retailer PTR
                      </span>
                      <span className="text-[11px] font-black text-[#A71380] bg-white border border-[#F3D0E9] px-2 py-0.5 rounded-[4px] uppercase">
                        PTR Trade (+12%)
                      </span>
                    </div>
                    <div className="text-2xl font-black text-[#A71380] font-mono tracking-tight my-1">
                      ₹{(parseFloat(form.distributorPrice || "0") * 1.12).toFixed(2)}
                    </div>
                  </div>

                  {/* Card 3: Wholesale Distributor (B2B) */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                        Distributor B2B
                      </span>
                      <span className="text-[11px] font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-[4px]">
                        {distDiscountPct}% MARGIN
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-950 font-mono tracking-tight my-1">
                      ₹{parseFloat(form.distributorPrice || "0").toFixed(2)}
                    </div>
                  </div>

                  {/* Card 4: Bulk Order Tier */}
                  <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-purple-900">
                        Bulk Tier ({form.bulkMoq} MOQ)
                      </span>
                      <span className="text-[11px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-[4px]">
                        {bulkDiscountPct}% OFF
                      </span>
                    </div>
                    <div className="text-2xl font-black text-purple-950 font-mono tracking-tight my-1">
                      ₹{parseFloat(form.bulkPrice || "0").toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Price Step-Down Pipeline Ribbon */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono border border-slate-800 shadow-xs">
                <span className="text-xs text-slate-300 font-extrabold uppercase tracking-wider shrink-0 flex items-center space-x-1">
                  <span>📊 Step-Down Rate Flow:</span>
                </span>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 text-xs">
                  <span className="bg-slate-800 text-white px-2.5 py-1 rounded-md font-bold">
                    MRP: ₹{parseFloat(form.mrp || "0").toFixed(2)}
                  </span>
                  <span className="text-slate-500 font-bold">➔</span>
                  <span className="bg-blue-950 text-blue-200 px-2.5 py-1 rounded-md font-bold border border-blue-800">
                    B2C: ₹{parseFloat(form.customerPrice || "0").toFixed(2)}
                  </span>
                  <span className="text-slate-500 font-bold">➔</span>
                  <span className="bg-[#5c0a47] text-[#F3D0E9] px-2.5 py-1 rounded-md font-bold border border-[#A71380]/40">
                    PTR: ₹{(parseFloat(form.distributorPrice || "0") * 1.12).toFixed(2)}
                  </span>
                  <span className="text-slate-500 font-bold">➔</span>
                  <span className="bg-emerald-950 text-emerald-200 px-2.5 py-1 rounded-md font-black border border-emerald-800">
                    B2B: ₹{parseFloat(form.distributorPrice || "0").toFixed(2)}
                  </span>
                  <span className="text-slate-500 font-bold">➔</span>
                  <span className="bg-purple-950 text-purple-200 px-2.5 py-1 rounded-md font-black border border-purple-800">
                    Bulk: ₹{parseFloat(form.bulkPrice || "0").toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Controls: MOQ & Visibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2">
                  <label className="block font-black text-[#0b2341] text-xs">
                    Bulk Order Minimum Quantity (MOQ) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.bulkMoq}
                      onChange={(e) => setForm({ ...form, bulkMoq: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-mono font-bold text-xs text-[#0b2341] focus:outline-none focus:border-[#A71380]"
                      suppressHydrationWarning
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-[#A71380] font-black uppercase">
                      Packs
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2">
                  <label className="block font-black text-[#0b2341] text-xs">
                    Catalog Store Visibility *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold text-xs text-[#0b2341] cursor-pointer focus:outline-none focus:border-[#A71380]"
                    suppressHydrationWarning
                  >
                    <option value="active">🟢 Active (Published to Store Catalog)</option>
                    <option value="disabled">🔴 Disabled (Draft / Hidden from Store)</option>
                  </select>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-extrabold text-xs cursor-pointer transition-colors"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#0b2341] hover:bg-[#163861] text-white px-6 py-2.5 rounded-lg font-extrabold text-xs cursor-pointer shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <span>Next: Stock &amp; Batch Details</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: STOCK & BATCH INWARDING */}
          {currentStep === 3 && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-4 text-xs animate-in fade-in duration-200" suppressHydrationWarning>
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0b2341] flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#F8EAF4] text-[#A71380] text-[11px] font-black flex items-center justify-center">3</span>
                    <span>📦 Initial Stock &amp; Batch Details</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Enter initial stock quantity, batch number, and expiry date.</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded">Step 3 of 4</span>
              </div>

              {/* Packaging Breakdown Config */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-extrabold text-[#0b2341] text-xs">📐 Pack Units Breakdown</span>
                  <span className="text-[10px] font-mono text-[#A71380] font-bold bg-[#F8EAF4] px-2 py-0.5 rounded border border-[#F3D0E9]">
                    Primary Unit: Saleable Pack
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Packs per Carton *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={packsPerCarton}
                      onChange={(e) => setPacksPerCarton(Math.max(Number(e.target.value), 1))}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-xs focus:outline-none focus:border-[#A71380]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Strips per Pack *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={stripsPerPack}
                      onChange={(e) => setStripsPerPack(Math.max(Number(e.target.value), 1))}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-xs focus:outline-none focus:border-[#A71380]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tablets per Strip *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={tabletsPerStrip}
                      onChange={(e) => setTabletsPerStrip(Math.max(Number(e.target.value), 1))}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-xs focus:outline-none focus:border-[#A71380]"
                    />
                  </div>
                </div>
              </div>

              {/* Opening Stock Toggle */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-[#0b2341] block">Add Initial Stock Now</span>
                  <span className="text-[10px] text-slate-500">Enable if you have ready stock to add to your warehouse inventory.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOpeningStock}
                    onChange={(e) => setHasOpeningStock(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A71380]"></div>
                </label>
              </div>

              {hasOpeningStock ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Batch Number *</label>
                      <input
                        type="text"
                        required={hasOpeningStock}
                        value={form.batchNo}
                        onChange={(e) => setForm({ ...form, batchNo: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                        placeholder="e.g. BATCH-2026-A1"
                        suppressHydrationWarning
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Manufacturing Date (MFG) *</label>
                      <input
                        type="text"
                        required={hasOpeningStock}
                        placeholder="MM/YYYY (e.g. 08/2026)"
                        value={mfgDate}
                        onChange={(e) => setMfgDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                        suppressHydrationWarning
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Expiry Date (EXP) *</label>
                      <input
                        type="text"
                        required={hasOpeningStock}
                        placeholder="MM/YYYY (e.g. 12/2028)"
                        value={form.expiryDate}
                        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-[#0b2341] text-xs">📦 Stock Quantity Entry</span>
                      <div className="flex bg-white rounded p-0.5 border border-slate-200 shrink-0">
                        <button
                          type="button"
                          onClick={() => setStockEntryMode("cartons")}
                          className={`px-2.5 py-1 rounded text-[10px] font-extrabold cursor-pointer ${stockEntryMode === "cartons" ? "bg-[#0b2341] text-white" : "text-slate-600"
                            }`}
                        >
                          By Cartons
                        </button>
                        <button
                          type="button"
                          onClick={() => setStockEntryMode("packs")}
                          className={`px-2.5 py-1 rounded text-[10px] font-extrabold cursor-pointer ${stockEntryMode === "packs" ? "bg-[#0b2341] text-white" : "text-slate-600"
                            }`}
                        >
                          By Packs
                        </button>
                      </div>
                    </div>

                    {stockEntryMode === "cartons" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Master Cartons Received *</label>
                          <input
                            type="number"
                            min="1"
                            value={cartonsReceived}
                            onChange={(e) => setCartonsReceived(Math.max(Number(e.target.value), 0))}
                            className="w-full border border-[#F3D0E9] rounded-lg p-2 bg-white font-mono font-bold text-xs text-[#A71380] focus:outline-none"
                          />
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Calculated Stock</span>
                          <span className="text-sm font-black text-[#0b2341] font-mono">
                            {(cartonsReceived * packsPerCarton).toLocaleString("en-IN")} Saleable Packs
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Saleable Packs Received *</label>
                        <input
                          type="number"
                          min="1"
                          value={packsDirectInput}
                          onChange={(e) => setPacksDirectInput(Math.max(Number(e.target.value), 0))}
                          className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono font-bold text-xs text-[#0b2341] focus:outline-none"
                          placeholder="500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-semibold text-xs">
                  ℹ️ Product will be saved with <strong>0 stock</strong>. You can add stock later anytime.
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Low Stock Alert Limit (Packs)</label>
                <input
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-xs"
                  suppressHydrationWarning
                />
                <span className="text-[9px] text-slate-400 block mt-1">Shows alert badge when stock drops below this limit</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-bold text-xs cursor-pointer"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#0b2341] hover:bg-[#163861] text-white px-6 py-2.5 rounded-lg font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <span>Next: Photo &amp; Save</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PACK IMAGE UPLOAD & FINAL SAVE */}
          {currentStep === 4 && (
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-2xs space-y-5 text-xs animate-in fade-in duration-200" suppressHydrationWarning>
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0b2341] flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-[#F8EAF4] text-[#A71380] text-[11px] font-black flex items-center justify-center">4</span>
                    <span>🖼️ Product Photo &amp; Final Save</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Upload product photo, select preset image, and preview live store card before saving.</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded">Step 4 of 4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Upload & Preset Options (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Selector Tabs */}
                  <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageTab("file")}
                      className={`flex-1 py-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${imageTab === "file"
                        ? "bg-white text-[#0b2341] shadow-2xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab("url")}
                      className={`flex-1 py-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${imageTab === "url"
                        ? "bg-white text-[#0b2341] shadow-2xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      🔗 Image URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab("presets")}
                      className={`flex-1 py-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${imageTab === "presets"
                        ? "bg-white text-[#A71380] shadow-2xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      🖼️ Presets
                    </button>
                  </div>

                  {/* File Upload Area */}
                  {imageTab === "file" && (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver
                        ? "border-[#A71380] bg-[#F8EAF4]/60 scale-[0.99]"
                        : "border-slate-300 hover:border-[#A71380]/60 bg-slate-50/50 hover:bg-slate-50"
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
                      <div className="w-12 h-12 rounded-full bg-[#F8EAF4] text-[#A71380] flex items-center justify-center mx-auto mb-2 text-xl font-bold shadow-2xs border border-[#F3D0E9]">
                        📷
                      </div>
                      <p className="font-extrabold text-slate-800 text-xs">Click to browse or drag &amp; drop photo here</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports PNG, JPG, WEBP formats up to 5MB</p>

                      {form.image && (
                        <div className="mt-3 inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-bold">
                          <span>✓ Custom Image Loaded</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm({ ...form, image: "" });
                            }}
                            className="text-emerald-900 font-black ml-1 hover:text-rose-600"
                          >
                            ✕ Clear
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Direct Web URL Input */}
                  {imageTab === "url" && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block font-bold text-slate-700 text-xs">Direct Web Link (HTTP / HTTPS URL)</label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:bg-white text-xs font-mono"
                      />
                      <p className="text-[10px] text-slate-400">Enter a direct public image link to embed high quality product photos.</p>
                    </div>
                  )}

                  {/* Preset Images Gallery */}
                  {imageTab === "presets" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                          Select from Standard Stock Photos:
                        </span>
                        {form.image && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, image: "" })}
                            className="text-[10px] font-bold text-rose-600 hover:underline"
                          >
                            Reset Selection
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {presetImages.map((preset, idx) => {
                          const isSelected = form.image === preset.url;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setForm({ ...form, image: preset.url })}
                              className={`group relative p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isSelected
                                ? "border-[#A71380] bg-[#F8EAF4] ring-2 ring-[#A71380]/30 shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs"
                                }`}
                            >
                              <div className="h-20 w-full rounded-lg overflow-hidden bg-slate-100 mb-1.5 relative">
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-[#A71380] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-2xs">
                                    ✓
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className={`text-[11px] font-extrabold block truncate leading-tight ${isSelected ? "text-[#A71380]" : "text-slate-800"}`}>
                                  {preset.label}
                                </span>
                                <span className="text-[9px] text-slate-400 block truncate font-medium">{preset.category}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Store Live Card Preview (5 cols) */}
                <div className="md:col-span-5 border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <span className="text-[10px] font-black text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2 py-0.5 rounded border border-[#F3D0E9]">
                        ⚡ Store Preview
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {form.sku || "SKU-PRD-1001"}
                      </span>
                    </div>

                    {/* Image Preview Box */}
                    <div className="h-44 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-200/90 shadow-2xs p-3 relative group">
                      {form.image ? (
                        <img
                          src={form.image}
                          alt={form.name}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-center space-y-1">
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-300 mx-auto flex items-center justify-center text-2xl font-bold">
                            💊
                          </div>
                          <span className="text-xs text-slate-400 font-bold block">No Photo Attached</span>
                          <span className="text-[10px] text-slate-400 block">Select a preset or upload image above</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 space-y-1">
                      <h4 className="font-black text-[#0b2341] text-sm truncate">{form.name || "Product Brand Name"}</h4>
                      <p className="text-[11px] text-slate-600 font-semibold truncate">{form.composition || "Active Salt Formula"}</p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 pt-0.5">
                        <span className="bg-slate-200/80 px-2 py-0.5 rounded font-mono font-bold">{form.packSize || "10 × 10 Pack"}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                          {hasOpeningStock ? `${currentTotalPacks} Packs Stock` : "No Stock"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200/90 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Printed MRP</span>
                      <span className="font-bold text-slate-400 line-through">₹{parseFloat(form.mrp || "0").toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#0b2341] font-extrabold">Distributor B2B Rate</span>
                      <span className="font-black text-[#A71380] text-sm">₹{parseFloat(form.distributorPrice || "0").toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Customer Rate: ₹{parseFloat(form.customerPrice || "0").toFixed(2)}</span>
                      <span className="text-emerald-600 font-extrabold">{distDiscountPct}% B2B MARGIN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-lg font-bold text-xs cursor-pointer"
                >
                  &larr; Back
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#A71380] hover:bg-[#8E0F6D] text-white py-3 rounded-lg font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Product to Database...</span>
                    </>
                  ) : (
                    <span>🚀 Save &amp; Publish Product</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
