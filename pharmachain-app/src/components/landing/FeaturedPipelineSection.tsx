"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { productsAPI, ProductItem } from "@/lib/api";

interface DisplayProduct {
  id: string | number;
  name: string;
  category: string;
  categoryFilter: "all" | "tablets" | "injections" | "sprays";
  subtitle: string;
  composition: string;
  packSize: string;
  dosageForm: string;
  image: string;
  badge: string;
  price?: number;
  mrp?: number;
  stock?: number;
  highlightTag?: string;
}

export const FeaturedPipelineSection: React.FC = () => {
  type CategoryTab = "all" | "tablets" | "injections" | "sprays" | "immunity" | "gastro" | "nerve";
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");

  // Helper function to format rich dosage forms from formulation names & categories
  const formatDosageForm = (name: string, category: string, dosageForm?: string | null) => {
    const existing = (dosageForm || "").trim();
    if (existing && !["oral solid", "solid", "oral solid tablets"].includes(existing.toLowerCase())) {
      return existing;
    }
    const n = (name || "").toLowerCase();
    const c = (category || "").toLowerCase();

    if (n.includes("zene") || n.includes("spray") || c.includes("spray")) return "Sublingual Oral Spray";
    if (n.includes("nxtnerve") || n.includes("injection") || c.includes("injection")) return "Sterile Injection (2ml)";
    if (n.includes("nxtlife") || n.includes("glutathione")) return "Film-Coated Tablet";
    if (n.includes("bilevia") || n.includes("udca")) return "Film-Coated Tablet (ALU-ALU)";
    if (n.includes("evd3") || n.includes("nano") || n.includes("shot")) return "Oral Nano Liquid (5ml)";
    if (n.includes("fervon") || n.includes("iron")) return "Solid Film Tablet";
    return "Certified Formulation";
  };

  // Default Fallback Products
  const fallbackProducts: DisplayProduct[] = [
    {
      id: "prod-1",
      name: "Zene Melatonin Oral Spray",
      category: "Sleep Support",
      categoryFilter: "sprays",
      subtitle: "Mint-flavored spray designed for rapid absorption and peaceful, natural sleep.",
      composition: "Melatonin Sublingual Formula",
      packSize: "30ml Spray Bottle",
      dosageForm: "Sublingual Oral Spray",
      image: "/images/product_zene.png",
      badge: "Fast Acting",
      highlightTag: "Top Seller",
      price: 299,
      mrp: 350,
    },
    {
      id: "prod-2",
      name: "NXTNERve B12 Injection (1500 mcg)",
      category: "Nerve & Energy Care",
      categoryFilter: "injections",
      subtitle: "Sterile Vitamin B12 (Mecobalamin) injection supporting nerve health and vitality.",
      composition: "Mecobalamin 1500mcg / 2ml",
      packSize: "5 × 2ml Ampoules / Box",
      dosageForm: "Sterile Injection (2ml)",
      image: "/images/product_nxtnerve.png",
      badge: "Aseptic Cleanroom",
      highlightTag: "Critical Care",
      price: 450,
      mrp: 520,
    },
    {
      id: "prod-3",
      name: "NXTLife-600 Glutathione",
      category: "Skin & Immunity Care",
      categoryFilter: "tablets",
      subtitle: "Master antioxidant formulation with Vitamin C for skin radiance and daily immunity.",
      composition: "L-Glutathione 600mg + Vitamin C",
      packSize: "30 Tablets / Pack",
      dosageForm: "Film-Coated Tablet",
      image: "/images/product_nxtlife.jpg",
      badge: "High Purity",
      highlightTag: "Doctor Choice",
      price: 899,
      mrp: 1100,
    },
    {
      id: "prod-4",
      name: "Bilevia UDCA 300mg",
      category: "Liver & Gastro Care",
      categoryFilter: "tablets",
      subtitle: "High-purity Ursodeoxycholic acid formulation supporting healthy liver and bile flow.",
      composition: "Ursodeoxycholic Acid 300mg",
      packSize: "10 × 10 ALU-ALU Pack",
      dosageForm: "Film-Coated Tablet (ALU-ALU)",
      image: "/images/product_bilevia.jpg",
      badge: "Gastro Standard",
      price: 640,
      mrp: 750,
    },
    {
      id: "prod-5",
      name: "EvD3 Vitamin D3 Nano Shots",
      category: "Bone & Joint Health",
      categoryFilter: "sprays",
      subtitle: "Ready-to-drink sugar-free oral nano solution with rapid absorption for strong bones.",
      composition: "Cholecalciferol 60,000 IU",
      packSize: "4 × 5ml Oral Bottles",
      dosageForm: "Oral Nano Liquid (5ml)",
      image: "/images/product_evd3.jpg",
      badge: "High Potency",
      price: 199,
      mrp: 240,
    },
    {
      id: "prod-6",
      name: "Fervon-XT Iron & Zinc",
      category: "Haematinic & Vitality",
      categoryFilter: "tablets",
      subtitle: "Gentle iron and zinc formula with Vitamin C to improve haemoglobin without stomach upset.",
      composition: "Ferrous Ascorbate + Folic Acid",
      packSize: "10 × 10 ALU-ALU Pack",
      dosageForm: "Solid Film Tablet",
      image: "/images/product_fervon.jpg",
      badge: "Gentle on Stomach",
      price: 320,
      mrp: 380,
    },
  ];

  // Initialize directly with fallbackProducts so items are immediately visible
  const [productsList, setProductsList] = useState<DisplayProduct[]>(fallbackProducts);

  useEffect(() => {
    let isMounted = true;

    productsAPI
      .list()
      .then((apiItems: ProductItem[]) => {
        if (!isMounted) return;
        if (apiItems && apiItems.length > 0) {
          const mapped: DisplayProduct[] = apiItems.map((p) => {
            const rawCat = p.category_name || (typeof p.category === "string" ? p.category : (p.category as any)?.name || "");
            const catLower = String(rawCat || "").toLowerCase();
            const dosageLower = String(p.dosage_form || p.form || "").toLowerCase();

            let filterCat: "all" | "tablets" | "injections" | "sprays" = "tablets";
            if (catLower.includes("injection") || dosageLower.includes("injection") || dosageLower.includes("ampoule")) {
              filterCat = "injections";
            } else if (catLower.includes("spray") || catLower.includes("drop") || dosageLower.includes("spray") || dosageLower.includes("liquid")) {
              filterCat = "sprays";
            }

            const category = typeof rawCat === "string" && rawCat ? rawCat : "Pharmaceutical";

            return {
              id: p.id,
              name: p.name,
              category: category,
              categoryFilter: filterCat,
              subtitle: p.subtitle || p.description || `${p.name} certified formulation.`,
              composition: p.composition || "Active Pharma Ingredient",
              packSize: p.pack_size || p.packSize || "Standard Pack",
              dosageForm: formatDosageForm(p.name, category, p.dosage_form || p.form),
              image: p.image || "/images/product_nxtlife.jpg",
              badge: "WHO-GMP Certified",
              price: p.display_price || p.customer_price || p.mrp,
              mrp: p.mrp,
              stock: p.stock,
            };
          });
          setProductsList(mapped);
        }
      })
      .catch(() => {
        // Keeps default fallbackProducts on error
      });
  }, []);

  const activeProducts = productsList.length > 0 ? productsList : fallbackProducts;

  const filteredProducts =
    activeTab === "all"
      ? activeProducts
      : activeProducts.filter((p) => {
        const cat = String(p.category || "").toLowerCase();
        const name = String(p.name || "").toLowerCase();
        const dosage = String(p.dosageForm || "").toLowerCase();

        if (activeTab === "tablets") return p.categoryFilter === "tablets" || dosage.includes("tablet") || dosage.includes("capsule");
        if (activeTab === "injections") return p.categoryFilter === "injections" || dosage.includes("injection") || dosage.includes("ampoule");
        if (activeTab === "sprays") return p.categoryFilter === "sprays" || dosage.includes("spray") || dosage.includes("liquid") || dosage.includes("shot");
        if (activeTab === "immunity") return cat.includes("skin") || cat.includes("immunity") || name.includes("glutathione");
        if (activeTab === "gastro") return cat.includes("liver") || cat.includes("gastro") || name.includes("udca") || name.includes("bilevia");
        if (activeTab === "nerve") return cat.includes("nerve") || cat.includes("vitality") || cat.includes("energy") || name.includes("b12");
        return p.categoryFilter === activeTab;
      });

  // Limit landing page to maximum 4 featured products as requested
  const displayedProducts = filteredProducts.slice(0, 4);

  return (
    <section id="catalog" className="my-16 sm:my-24 relative z-10">
      {/* ── Section Header with Gradient Eyebrow ──────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#F8EAF4] to-[#FDF4FB] border border-[#F3D0E9] px-3.5 py-1 rounded-full shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#A71380] animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#A71380]">
              FEATURED PHARMACEUTICAL RANGE
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B2545] tracking-tight">
            Certified Formulations for <span className="text-[#A71380] bg-clip-text text-transparent bg-gradient-to-r from-[#A71380] to-[#8E0F6D]">Better Health</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#475569] max-w-2xl leading-relaxed">
            WHO-GMP certified, laboratory-verified formulations with 100% batch traceability and guaranteed supply chain integrity.
          </p>
        </div>

        {/* Header Action Link */}
        <Link
          href="/products"
          className="group inline-flex items-center space-x-2 bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6B0B52] text-white px-5 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all duration-200 shadow-md shadow-[#A71380]/20 hover:shadow-lg hover:shadow-[#A71380]/30 hover:-translate-y-0.5 shrink-0 self-start md:self-auto"
        >
          <span>Explore All Products</span>
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </Link>
      </div>

      {/* ── Interactive Category Filter Tabs with Crisp Vector SVG Icons ─────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center space-x-2 ${activeTab === "all"
            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20 scale-100"
            : "bg-white text-[#475569] hover:text-[#0B2545] border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>All Formulations</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
            {activeProducts.length}
          </span>
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("tablets")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center space-x-2 ${activeTab === "tablets"
            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20"
            : "bg-white text-[#475569] hover:text-[#0B2545] border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="8" width="12" height="8" rx="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 8v8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>Tablets &amp; Capsules</span>
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("injections")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center space-x-2 ${activeTab === "injections"
            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20"
            : "bg-white text-[#475569] hover:text-[#0B2545] border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 5l-4 4m0 0l-2-2m2 2l2 2m-4-4l-3 3m0 0l-2-2m2 2l-4 4m0 0L3 19l2 2 4-5m-6 3l3-3" />
          </svg>
          <span>Sterile Injections</span>
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("sprays")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center space-x-2 ${activeTab === "sprays"
            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20"
            : "bg-white text-[#475569] hover:text-[#0B2545] border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span>Sprays &amp; Drops</span>
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("immunity")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center space-x-2 ${activeTab === "immunity"
            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20"
            : "bg-white text-[#475569] hover:text-[#0B2545] border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Skin &amp; Immunity</span>
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("gastro")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center space-x-2 ${activeTab === "gastro"
            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20"
            : "bg-white text-[#475569] hover:text-[#0B2545] border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Gastro &amp; Liver</span>
        </button>

        <button
          suppressHydrationWarning
          onClick={() => setActiveTab("nerve")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center space-x-2 ${activeTab === "nerve"
            ? "bg-[#0B2545] text-white shadow-md shadow-[#0B2545]/20"
            : "bg-white text-[#475569] hover:text-[#0B2545] border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Nerve &amp; Energy</span>
        </button>
      </div>

      {/* ── Dynamic Product Cards Grid (Limit 4 Max on Landing Page) ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {displayedProducts.map((prod) => {
          const price = prod.price || prod.mrp || 299;
          const mrp = prod.mrp || price * 1.2;
          const discountPct = Math.round(((mrp - price) / mrp) * 100);

          return (
            <div
              key={prod.id}
              className="bg-white rounded-3xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 group border border-slate-200 hover:border-[#A71380] shadow-xs hover:shadow-xl hover:-translate-y-1 relative flex-1 cursor-pointer"
            >
              <div className="space-y-3">
                {/* Top Category & Stock Indicator (Clean, No Heavy Borders) */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2.5 py-0.5 rounded-md">
                    {prod.category}
                  </span>

                  <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock</span>
                  </span>
                </div>

                {/* Clean Product Image Stage (No nested border boxes inside) */}
                <Link
                  href={`/products/${prod.id}`}
                  className="block w-full h-48 rounded-2xl bg-slate-50/70 group-hover:bg-[#F8EAF4]/30 p-4 flex items-center justify-center relative transition-colors duration-300"
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-108 transition-transform duration-300"
                  />
                </Link>

                {/* Title & Composition Subtext (Clean Typography without box clutter) */}
                <div className="space-y-1 pt-1">
                  <Link href={`/products/${prod.id}`}>
                    <h3 className="text-sm sm:text-base font-black text-[#0B2545] group-hover:text-[#A71380] transition-colors leading-snug line-clamp-1">
                      {prod.name}
                    </h3>
                  </Link>
                  <p className="text-[11px] font-medium text-slate-500 truncate">
                    {prod.composition || prod.dosageForm} • {prod.packSize}
                  </p>
                </div>
              </div>

              {/* Clean Pricing & Action Button */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Price</span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-lg font-black text-[#0B2545] font-mono">₹{price}</span>
                      {mrp > price && (
                        <span className="text-xs text-slate-400 line-through font-mono">₹{Math.round(mrp)}</span>
                      )}
                    </div>
                  </div>
                  {mrp > price && (
                    <span className="text-[10px] font-extrabold text-[#A71380] bg-[#F8EAF4] px-2 py-0.5 rounded-md">
                      {discountPct}% OFF
                    </span>
                  )}
                </div>

                <Link
                  href={`/products/${prod.id}`}
                  className="w-full bg-[#0B2545] group-hover:bg-[#A71380] text-white py-3 rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider text-center block"
                >
                  <span>View Details &amp; Order</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>




      {/* ── Quality Guarantee Strip at Bottom ─────────────────────── */}
      <div className="mt-12 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80">
          {/* 1. WHO-GMP */}
          <div className="flex items-center space-x-3.5 pt-3 sm:pt-0 sm:px-3 first:pt-0 first:pl-0">
            <div className="w-11 h-11 rounded-2xl bg-[#F8EAF4] border border-[#F3D0E9] flex items-center justify-center shrink-0 shadow-2xs text-[#A71380]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0B2545]">WHO-GMP Certified</h4>
              <p className="text-[11px] text-slate-500 font-medium">Standard manufacturing protocols</p>
            </div>
          </div>

          {/* 2. 100% Lab Tested */}
          <div className="flex items-center space-x-3.5 pt-3 sm:pt-0 sm:px-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0B2545]">100% Batch Tested</h4>
              <p className="text-[11px] text-slate-500 font-medium">Verified purity &amp; analytical COA</p>
            </div>
          </div>

          {/* 3. Cold-Chain Monitored */}
          <div className="flex items-center space-x-3.5 pt-3 sm:pt-0 sm:px-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0 shadow-2xs text-cyan-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0B2545]">Cold-Chain Monitored</h4>
              <p className="text-[11px] text-slate-500 font-medium">2°C to 8°C thermal safety</p>
            </div>
          </div>

          {/* 4. Pan-India Delivery */}
          <div className="flex items-center space-x-3.5 pt-3 sm:pt-0 sm:px-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0B2545]">Fast Pan-India Supply</h4>
              <p className="text-[11px] text-slate-500 font-medium">Express transit &amp; live tracking</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
