"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { productsAPI, ordersAPI, categoriesAPI, ProductItem } from "@/lib/api";
import { getProductImageUrl, getCategoryFallbackImage } from "@/lib/packagingUtils";
import { useAuth } from "@/context/AuthContext";

interface ProductCatalogProps {
  activeRole?: "guest" | "retail" | "distributor" | "admin";
  onAddToCart?: (productName: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  activeRole: propRole,
  onAddToCart,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const catalogTopRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "All Categories",
    "Pain & Fever Care",
    "Sleep & Mind Care",
    "Heart & Blood Pressure",
    "Infections & Immunity",
    "Stomach & Digestion",
    "Cough, Cold & Breathing",
  ]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedDosageForm, setSelectedDosageForm] = useState("All Forms");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"featured" | "price_low" | "price_high" | "name">("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modals state
  const [selectedSpecProduct, setSelectedSpecProduct] = useState<ProductItem | null>(null);
  const [selectedInquiryProduct, setSelectedInquiryProduct] = useState<ProductItem | null>(null);
  const [batchQuantity, setBatchQuantity] = useState(100);
  const [institutionName, setInstitutionName] = useState(user?.company_name || user?.full_name || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [inquiryType, setInquiryType] = useState<"commercial_po" | "third_party" | "export_dossier" | "sample_request">("commercial_po");
  const [deliveryLocation, setDeliveryLocation] = useState("Central Distribution Warehouse, Hyderabad");
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState<string | null>(null);
  const [rfqError, setRfqError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setInstitutionName(user.company_name || user.full_name || "");
      if (user.phone) setContactPhone(user.phone);
    }
  }, [user]);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData] = await Promise.all([
        productsAPI.list(),
        categoriesAPI.list().catch(() => [])
      ]);

      if (prodsData && prodsData.length > 0) {
        const normalized = prodsData.map((p: any) => ({
          ...p,
          mrp: p.mrp || p.customer_price * 1.25 || 150,
          customer_price: p.customer_price ?? p.customerPrice ?? 120,
          distributor_price: p.distributor_price ?? p.distributorPrice ?? 90,
          bulk_price: p.bulk_price ?? p.bulkPrice ?? 80,
          bulk_moq: p.bulk_moq ?? p.bulkMoq ?? 50,
          display_price: p.customer_price ?? p.customerPrice ?? p.mrp ?? 120,
          dosage_form: p.dosage_form || p.form || "Tablet / Capsule",
          rating: 4.8 + (p.id % 3) * 0.1,
          reviews_count: 45 + (p.id * 12) % 200,
        }));
        setProducts(normalized);
      } else {
        const normalizedMock = (INITIAL_PRODUCTS as any[]).map((p, idx) => ({
          ...p,
          mrp: p.mrp || Math.round((p.customerPrice || 100) * 1.2),
          customer_price: p.customerPrice ?? 120,
          distributor_price: p.distributorPrice ?? 90,
          bulk_price: p.bulkPrice ?? 80,
          bulk_moq: p.bulkMoq ?? 50,
          display_price: p.customerPrice ?? 120,
          dosage_form: (p as any).dosage_form || "Tablet",
          rating: 4.7 + (idx % 3) * 0.1,
          reviews_count: 38 + idx * 19,
        }));
        setProducts(normalizedMock);
      }

      // Categories setup
      const dynamicCats = new Set<string>([
        "All Categories",
        "Pain & Fever Care",
        "Sleep & Mind Care",
        "Heart & Blood Pressure",
        "Infections & Immunity",
        "Stomach & Digestion",
        "Cough, Cold & Breathing",
      ]);

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
      setProducts(INITIAL_PRODUCTS as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const dosageFormsList = [
    "All Forms",
    "Tablets & Capsules",
    "Sublingual Sprays",
    "Injectables & Vials",
    "Oral Syrups",
    "Ointments & Creams",
  ];

  // Filtering & Sorting
  let filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.composition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const catName = p.category_name || p.category;
    const matchesCategory =
      selectedCategory === "All Categories" || catName === selectedCategory;

    const formName = p.dosage_form || p.form || "";
    const matchesDosageForm =
      selectedDosageForm === "All Forms" || formName.toLowerCase().includes(selectedDosageForm.toLowerCase());

    const matchesStock = !inStockOnly || ((p as any).stock_quantity ?? 100) > 0;

    return matchesSearch && matchesCategory && matchesDosageForm && matchesStock;
  });

  if (sortBy === "price_low") {
    filteredProducts.sort((a, b) => (a.customer_price || a.mrp || 0) - (b.customer_price || b.mrp || 0));
  } else if (sortBy === "price_high") {
    filteredProducts.sort((a, b) => (b.customer_price || b.mrp || 0) - (a.customer_price || a.mrp || 0));
  } else if (sortBy === "name") {
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleStartInquiry = (prod: ProductItem) => {
    setSelectedSpecProduct(null);
    setRfqSuccess(null);
    setRfqError(null);

    if (!user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pharmalink_pending_order_product_id", String(prod.id));
      }
      router.push("/login?redirect=/catalog");
      return;
    }

    setSelectedInquiryProduct(prod);
    setBatchQuantity(prod.bulk_moq || 50);
    setInstitutionName(user.company_name || user.full_name || "");
    setContactPhone(user.phone || "");
  };

  const handleCompleteInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiryProduct) return;

    if (!institutionName.trim() || !contactPhone.trim() || !deliveryLocation.trim()) {
      setRfqError("Please enter your institution name, phone number, and delivery address.");
      return;
    }

    setRfqSubmitting(true);
    setRfqError(null);

    try {
      const orderRes = await ordersAPI.create({
        items: [{ product_id: selectedInquiryProduct.id, quantity: batchQuantity }],
        customer_name: institutionName.trim(),
        customer_phone: contactPhone.trim(),
        delivery_address: `${deliveryLocation.trim()} | Terms: ${inquiryType.toUpperCase()}`,
        delivery_city: "Hyderabad",
        delivery_state: "Telangana",
        delivery_pincode: "500081",
        payment_method: "B2B Wholesale Credit (30 Days)",
      });

      setRfqSuccess(orderRes.order_code);
      if (onAddToCart) onAddToCart(selectedInquiryProduct.name);
    } catch (err: any) {
      setRfqError(err.message || "Failed to submit batch order. Please try again.");
    } finally {
      setRfqSubmitting(false);
    }
  };
  return (
    <div ref={catalogTopRef} className="min-h-screen bg-[#F8FAFC] pb-16 text-[#0F172A] font-sans">

      {/* ── 1. HERO SECTION (WITH CRISP FACILITY IMAGE & MODERN LEFT SIDE) ── */}
      <section className="relative w-full bg-gradient-to-r from-[#FFF5F9] via-[#FAF5FF] to-[#F1F5F9] overflow-hidden border-b border-pink-100/80 min-h-[500px] md:min-h-[540px] flex items-center mb-8 shadow-xs">
        {/* Soft background ambient glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#A71380]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-[#FCE7F3]/60 blur-2xl pointer-events-none" />

        {/* Right Side Facility Image - 100% CRYSTAL CLEAR & SHARP BUILDING & LOGO */}
        <div className="absolute top-0 right-0 w-full md:w-[56%] lg:w-[52%] xl:w-[50%] h-full z-0 pointer-events-none overflow-hidden hidden md:block">
          <img
            src="/images/contact-hero.png"
            alt="EVVAI Pharmaceuticals Corporate Facility"
            className="w-full h-full object-cover object-[78%_center] opacity-100 brightness-[1.02] contrast-[1.02]"
          />
          {/* Subtle edge blend strictly on the far-left boundary */}
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#FFF5F9] to-transparent pointer-events-none" />

          {/* Top Right Floating Quote Card with Cursive / Serif Typography */}
          <div className="absolute top-6 right-6 lg:right-8 z-20 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3 shadow-lg border border-pink-100/80 max-w-[270px] hidden lg:block pointer-events-auto hover:shadow-xl transition-all">
            <p className="text-sm md:text-[15px] font-serif italic font-semibold text-[#0B2545] leading-snug">
              &ldquo;Pure Formulations for Better Lives&rdquo;
            </p>
            <div className="pt-1.5 flex items-center space-x-2">
              <span className="w-5 h-[2px] bg-[#A71380] rounded-full" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#A71380]">
                EVVAI PHARMA
              </span>
            </div>
          </div>
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left Content Column */}
            <div className="md:col-span-8 lg:col-span-7 xl:col-span-6 space-y-5">
              
              {/* Kicker Pill */}
              <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-md border border-[#F3D0E9] px-3.5 py-1.5 rounded-full shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#A71380] animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#A71380] font-mono">
                  WHO-GMP &amp; ISO ACCREDITED CATALOG
                </span>
              </div>

              {/* Main Heading */}
              <div className="space-y-1.5">
                <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black text-[#0B2545] leading-[1.08] tracking-tight">
                  Explore EVVAI <br />
                  <span className="bg-gradient-to-r from-[#A71380] via-[#C02693] to-[#740B58] bg-clip-text text-transparent">
                    Healthcare Products
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed font-medium max-w-xl">
                  Discover our comprehensive portfolio of advanced therapeutic formulations, neurology medicines, sterile injectables, and high-purity clinical treatments engineered with unmatched analytical precision.
                </p>
              </div>

              {/* Direct Integrated Search Bar inside Hero */}
              <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-[#F3D0E9] shadow-md flex flex-col sm:flex-row items-center gap-2 max-w-xl">
                <div className="relative flex-grow w-full">
                  <input
                    type="text"
                    placeholder="Search by product name, active API, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 border-none focus:ring-0 outline-none bg-transparent placeholder:text-slate-400"
                  />
                  <svg className="absolute left-3.5 top-3 w-4 h-4 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("catalog-products-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#740B58] text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer uppercase tracking-wider flex items-center justify-center space-x-1.5 shrink-0"
                >
                  <span>Search</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* 4 Unique Glass Trust Badges with Vector SVGs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 max-w-xl">
                {/* 1. WHO-GMP */}
                <div className="bg-white/85 backdrop-blur-sm border border-emerald-200/80 rounded-2xl p-3 text-center space-y-1 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200/60 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight">WHO-GMP</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Certified Facility</p>
                  </div>
                </div>

                {/* 2. 100% Quality */}
                <div className="bg-white/85 backdrop-blur-sm border border-blue-200/80 rounded-2xl p-3 text-center space-y-1 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200/60 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 18h8" />
                      <path d="M3 22h18" />
                      <path d="M14 22a7 7 0 1 0 0-14h-1" />
                      <path d="M9 14h2" />
                      <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
                      <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight">100% Quality</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Analytical Tested</p>
                  </div>
                </div>

                {/* 3. Pan-India */}
                <div className="bg-white/85 backdrop-blur-sm border border-purple-200/80 rounded-2xl p-3 text-center space-y-1 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-200/60 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                      <path d="M15 18H9" />
                      <path d="M19 18h2a1 1 0 0 0 1-1v-5.5a1.5 1.5 0 0 0-.44-1.06L18.5 7.38A1.5 1.5 0 0 0 17.44 7H14v11h1" />
                      <circle cx="7" cy="18" r="2" />
                      <circle cx="17" cy="18" r="2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight">Pan-India</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Express Supply</p>
                  </div>
                </div>

                {/* 4. Direct B2B */}
                <div className="bg-white/85 backdrop-blur-sm border border-pink-200/80 rounded-2xl p-3 text-center space-y-1 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-default">
                  <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#A71380] flex items-center justify-center mx-auto border border-pink-200/60 group-hover:scale-110 transition-transform">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      <path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h4.78" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-[#0B2545] leading-tight">Direct B2B</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Wholesale Pricing</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <div id="catalog-products-section" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6">

        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium pt-1">
          <Link href="/" className="hover:text-[#A71380] transition-colors flex items-center space-x-1">
            <svg className="w-3.5 h-3.5 text-[#A71380]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-[#0B2545] font-bold">Pharma Products Store</span>
        </nav>

        {/* Amazon-Style E-Commerce Control Bar (View Mode, Sorting & Counter) */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2 text-[#0B2545] font-bold">
            <span>Showing</span>
            <span className="bg-[#F8EAF4] text-[#A71380] px-2.5 py-0.5 rounded-full border border-[#F3D0E9] font-mono">
              {filteredProducts.length} Products
            </span>
            {selectedCategory !== "All Categories" && (
              <span className="text-slate-500 font-normal">in &quot;{selectedCategory}&quot;</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center space-x-1 bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${viewMode === "grid"
                  ? "bg-[#0B2545] text-white shadow-2xs"
                  : "text-[#475569] hover:text-[#0B2545]"
                  }`}
                title="Grid View Cards"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Grid View</span>
              </button>

              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${viewMode === "list"
                  ? "bg-[#0B2545] text-white shadow-2xs"
                  : "text-[#475569] hover:text-[#0B2545]"
                  }`}
                title="List View Cards"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>List View</span>
              </button>
            </div>

            {/* In Stock Filter Toggle */}
            <label className="flex items-center space-x-2 text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-[#A71380] focus:ring-[#A71380] w-4 h-4 cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>

            {/* Sort Select */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 bg-[#F8FAFC] font-bold text-[#0B2545] text-xs cursor-pointer focus:outline-none focus:border-[#A71380]"
              >
                <option value="featured">Featured / Popular</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN 2-COLUMN LAYOUT (SIDEBAR FILTERS + AMAZON-STYLE PRODUCT CARDS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR FILTERS */}
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">

            {/* Category Filter List */}
            <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B2545] border-b border-[#E2E8F0] pb-2 flex items-center justify-between">
                <span>Health Categories</span>
                <span className="text-[10px] text-[#A71380] font-mono font-bold">{categories.length - 1}</span>
              </h3>

              <div className="space-y-1 text-xs">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-all cursor-pointer flex items-center justify-between ${isSelected
                        ? "bg-[#A71380] text-white font-bold shadow-2xs"
                        : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0B2545]"
                        }`}
                    >
                      <span className="truncate pr-2">{cat}</span>
                      {isSelected && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>



          </div>

          {/* RIGHT COLUMN: AMAZON-STYLE USER-FRIENDLY PRODUCT CARDS GRID / LIST */}
          <div className="lg:col-span-9 space-y-6">

            {loading ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#E2E8F0]">
                <div className="animate-spin w-8 h-8 border-3 border-[#A71380] border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-xs font-bold text-[#475569]">Loading products catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-[#E2E8F0] text-[#475569] space-y-3">
                <span className="text-4xl block">🔍</span>
                <h3 className="text-base font-bold text-[#0B2545]">No products found</h3>
                <p className="text-xs text-[#475569]">Try searching for another product name or reset your category filters.</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All Categories");
                    setSelectedDosageForm("All Forms");
                  }}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide inline-block cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* STRIKING MODERN PRODUCT GRID CARDS (CLEAN & NON-NESTED) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((prod) => {
                  const mrp = (prod as any).mrp || Math.round((prod.customer_price || 120) * 1.25);
                  const isDistributor = user?.role === "DISTRIBUTOR" || user?.role === "ADMIN";
                  const price = isDistributor ? (prod.distributor_price || prod.customer_price || 120) : (prod.customer_price || 120);
                  const discountPct = Math.round(((mrp - price) / mrp) * 100);

                  return (
                    <div
                      key={prod.id || prod.sku}
                      onClick={() => router.push(`/products/${prod.id}`)}
                      className="bg-white border border-slate-200 hover:border-[#A71380] rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all duration-200 hover:shadow-lg group cursor-pointer"
                    >
                      <div>
                        {/* Header Category & Stock Pill */}
                        <div className="flex items-center justify-between pb-2 text-xs">
                          <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2 py-0.5 rounded">
                            {prod.category_name || (prod as any).category || "Therapeutics"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>In Stock</span>
                          </span>
                        </div>

                        {/* Product Image Display (Clean, no inner border frame) */}
                        <div className="w-full h-48 rounded-xl bg-slate-50 flex items-center justify-center p-3">
                          <img
                            src={getProductImageUrl(prod)}
                            alt={prod.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getCategoryFallbackImage(
                                prod.category_name || (prod as any).category,
                                prod.pack_size || (prod as any).packSize
                              );
                            }}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Product Title & Composition */}
                        <div className="pt-3 space-y-1">
                          <h3 className="text-base font-black text-slate-900 group-hover:text-[#A71380] transition-colors leading-tight line-clamp-1">
                            {prod.name}
                          </h3>

                          {prod.composition && (
                            <p className="text-xs text-[#A71380] font-semibold line-clamp-1">
                              {prod.composition}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Primary Action Link */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Rate</span>
                            <div className="flex items-baseline space-x-1.5">
                              <span className="text-lg font-black text-slate-900 font-mono">₹{price.toLocaleString("en-IN")}</span>
                              {mrp > price && (
                                <span className="text-xs text-slate-400 line-through font-mono">₹{mrp.toLocaleString("en-IN")}</span>
                              )}
                            </div>
                          </div>
                          {mrp > price && (
                            <span className="text-[10px] font-black text-[#A71380] bg-[#F8EAF4] px-2 py-0.5 rounded">
                              {discountPct}% OFF
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/products/${prod.id}`}
                          className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider text-center block"
                        >
                          <span>View Details &amp; Order Now</span>
                          <span>&rarr;</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* HIGH-CLASS HORIZONTAL LIST VIEW CARDS (CLEAN & NON-NESTED) */
              <div className="space-y-4">
                {paginatedProducts.map((prod) => {
                  const mrp = (prod as any).mrp || Math.round((prod.customer_price || 120) * 1.25);
                  const isDistributor = user?.role === "DISTRIBUTOR" || user?.role === "ADMIN";
                  const price = isDistributor ? (prod.distributor_price || prod.customer_price || 120) : (prod.customer_price || 120);
                  const discountPct = Math.round(((mrp - price) / mrp) * 100);

                  return (
                    <div
                      key={prod.id || prod.sku}
                      onClick={() => router.push(`/products/${prod.id}`)}
                      className="bg-white border border-slate-200 hover:border-[#A71380] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-200 hover:shadow-lg group cursor-pointer"
                    >
                      {/* Left: Product Image Box */}
                      <div className="w-full md:w-48 h-40 rounded-xl bg-slate-50 flex items-center justify-center p-3 shrink-0">
                        <img
                          src={getProductImageUrl(prod)}
                          alt={prod.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getCategoryFallbackImage(
                              prod.category_name || (prod as any).category,
                              prod.pack_size || (prod as any).packSize
                            );
                          }}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Middle: Product Details */}
                      <div className="flex-1 space-y-2 text-left w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A71380] bg-[#F8EAF4] px-2 py-0.5 rounded inline-block">
                          {prod.category_name || (prod as any).category || "Therapeutics"}
                        </span>

                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#A71380] transition-colors leading-tight">
                          {prod.name}
                        </h3>

                        {prod.composition && (
                          <p className="text-xs text-[#A71380] font-semibold">
                            {prod.composition}
                          </p>
                        )}
                      </div>

                      {/* Right: Pricing & Order Action Column */}
                      <div className="w-full md:w-56 space-y-3 flex flex-col justify-center shrink-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">
                              Rate
                            </span>
                            <div className="flex items-baseline space-x-1.5">
                              <span className="text-lg font-black text-slate-900 font-mono">
                                ₹{price.toLocaleString("en-IN")}
                              </span>
                              {mrp > price && (
                                <span className="text-xs text-slate-400 line-through font-mono">
                                  ₹{mrp.toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </div>
                          {mrp > price && (
                            <span className="text-[10px] font-black text-[#A71380] bg-[#F8EAF4] px-2 py-0.5 rounded">
                              {discountPct}% OFF
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/products/${prod.id}`}
                          className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider text-center block"
                        >
                          <span>View Details &amp; Order Now</span>
                          <span>&rarr;</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredProducts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs text-xs">
                <div className="text-slate-500 font-medium">
                  Showing <span className="font-bold text-[#0B2545]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0B2545]">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of{" "}
                  <span className="font-bold text-[#0B2545]">{filteredProducts.length}</span> products
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
                    <span className="text-[11px] text-slate-400">Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-[#E2E8F0] rounded-xl px-2.5 py-1 bg-[#F8FAFC] font-bold text-[#0B2545] text-xs cursor-pointer focus:outline-none"
                    >
                      <option value={6}>6</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                    </select>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center space-x-1">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage(Math.max(currentPage - 1, 1));
                          catalogTopRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold text-[#0B2545]"
                      >
                        ‹ Prev
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            catalogTopRef.current?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center ${currentPage === pageNum
                            ? "bg-[#0B2545] text-white shadow-xs"
                            : "border border-[#E2E8F0] bg-white text-[#0B2545] hover:bg-[#F8FAFC]"
                            }`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage(Math.min(currentPage + 1, totalPages));
                          catalogTopRef.current?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold text-[#0B2545]"
                      >
                        Next ›
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* RIGHT-SIDE SLIDE-OVER OFFCANVAS DRAWER: Technical Specification Sheet */}
        {selectedSpecProduct && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Dark Blur Overlay Backdrop */}
            <div
              onClick={() => setSelectedSpecProduct(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            />

            {/* Right-Side Offcanvas Drawer Panel */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300 p-6 md:p-8 space-y-6">

                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-black text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
                        TECHNICAL DOSSIER SPECIFICATION SHEET
                      </span>
                      <h2 className="text-xl font-black text-[#0B2545] tracking-tight mt-2">
                        {selectedSpecProduct.name}
                      </h2>
                    </div>
                    <button
                      onClick={() => setSelectedSpecProduct(null)}
                      className="text-slate-400 hover:text-slate-800 font-black text-2xl p-1.5 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Product Thumbnail & Quick Info */}
                  <div className="flex items-center space-x-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={getProductImageUrl(selectedSpecProduct)}
                        alt={selectedSpecProduct.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="space-y-1 text-xs">
                      <span className="font-mono text-[10px] font-bold text-slate-400">SKU: {selectedSpecProduct.sku}</span>
                      <h4 className="font-black text-[#0B2545]">{selectedSpecProduct.name}</h4>
                      <p className="text-[#A71380] font-bold text-[11px]">{selectedSpecProduct.composition}</p>
                    </div>
                  </div>

                  {/* Technical Specifications Specs List */}
                  <div className="space-y-3 pt-2 text-xs">
                    <h3 className="font-black text-slate-800 uppercase tracking-wider text-[11px]">Quality &amp; Regulatory Parameters</h3>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-semibold">Active Ingredient (INN):</span>
                        <span className="font-black text-[#0B2545]">{selectedSpecProduct.composition}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-semibold">Dosage Form:</span>
                        <span className="font-extrabold text-slate-800">{selectedSpecProduct.dosage_form}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-semibold">Pack Configuration:</span>
                        <span className="font-mono font-bold text-slate-800">{selectedSpecProduct.pack_size || selectedSpecProduct.packSize}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-semibold">Pharmacopeia Standard:</span>
                        <span className="font-black text-[#A71380]">{selectedSpecProduct.pharmacopeia || "IP / BP / USP"}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 font-semibold">GMP Certification:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">WHO-GMP &amp; ISO 9001:2015</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">COA Dossier Status:</span>
                        <span className="font-bold text-emerald-600">✓ Verified &amp; Ready for PO</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setSelectedSpecProduct(null)}
                    className="w-1/3 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleStartInquiry(selectedSpecProduct)}
                    className="w-2/3 bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#730B58] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-[#A71380]/20 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>Place Wholesale Order</span>
                    <span>&rarr;</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* RIGHT-SIDE SLIDE-OVER OFFCANVAS DRAWER: Institutional B2B Wholesale Order Form */}
        {selectedInquiryProduct && (() => {
          const prod = selectedInquiryProduct;
          const b2bRate = prod.customer_price || prod.distributor_price || 120;
          const estTotal = b2bRate * batchQuantity;

          return (
            <div className="fixed inset-0 z-50 overflow-hidden">
              {/* Dark Blur Backdrop */}
              <div
                onClick={() => setSelectedInquiryProduct(null)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
              />

              {/* Right-Side Offcanvas Drawer Panel */}
              <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md md:max-w-lg bg-white shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300 p-6 md:p-8 space-y-6">

                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black text-[#A71380] uppercase bg-[#F8EAF4] px-2.5 py-0.5 rounded-full border border-[#F3D0E9]">
                            Place Wholesale Order
                          </span>
                          {user && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Verified ({user.role})
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-black text-[#0B2545] tracking-tight mt-1.5">
                          {prod.name}
                        </h2>
                      </div>
                      <button
                        onClick={() => setSelectedInquiryProduct(null)}
                        className="text-slate-400 hover:text-slate-800 font-black text-2xl p-1.5 rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    {rfqError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl font-bold">
                        {rfqError}
                      </div>
                    )}

                    {rfqSuccess ? (
                      <div className="space-y-5 text-center py-8">
                        <div className="w-16 h-16 bg-[#F8EAF4] border-2 border-[#F3D0E9] text-[#A71380] rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-md">
                          ✓
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-[#0B2545]">Wholesale Order Placed!</h3>
                          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                            Your bulk batch order for <strong>{prod.name} ({batchQuantity} units)</strong> has been processed successfully.
                          </p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block font-mono text-xs font-black text-[#A71380] shadow-2xs">
                          Order Ref Code: {rfqSuccess}
                        </div>
                        <div className="pt-4">
                          <button
                            onClick={() => {
                              setSelectedInquiryProduct(null);
                              setRfqSuccess(null);
                            }}
                            className="w-full bg-[#0B2545] hover:bg-[#07192e] text-white py-3.5 rounded-xl font-black text-xs cursor-pointer uppercase tracking-wider shadow-md"
                          >
                            Return to Store
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleCompleteInquiry} className="space-y-4 text-xs">
                        {/* Selected Product Summary Card */}
                        <div className="bg-gradient-to-r from-slate-50 to-[#F8EAF4]/30 p-4 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Product SKU:</span>
                            <span className="font-mono font-black text-[#A71380]">{prod.sku}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Active Molecule:</span>
                            <span className="font-black text-[#0B2545]">{prod.composition}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-bold">Pack Configuration:</span>
                            <span className="font-bold text-slate-800">{prod.pack_size || (prod as any).packSize || "Standard Box"}</span>
                          </div>
                        </div>

                        {/* Order Form Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-black text-slate-800 mb-1">Order Category *</label>
                            <select
                              value={inquiryType}
                              onChange={(e) => setInquiryType(e.target.value as any)}
                              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#A71380] cursor-pointer"
                            >
                              <option value="commercial_po">Commercial Purchase Order</option>
                              <option value="third_party">Third-Party Manufacturing</option>
                              <option value="export_dossier">Export Regulatory Order</option>
                              <option value="sample_request">Evaluation Sample Request</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-black text-slate-800 mb-1">Batch Quantity (Units) *</label>
                            <input
                              type="number"
                              required
                              min={1}
                              value={batchQuantity}
                              onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-black font-mono text-[#0B2545] focus:bg-white focus:outline-none focus:border-[#A71380]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-black text-slate-800 mb-1">Hospital / Entity Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Apollo Pharmacy / Hospital"
                              value={institutionName}
                              onChange={(e) => setInstitutionName(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#A71380]"
                            />
                          </div>
                          <div>
                            <label className="block font-black text-slate-800 mb-1">Contact Phone *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. +91 9876543210"
                              value={contactPhone}
                              onChange={(e) => setContactPhone(e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#A71380]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-black text-slate-800 mb-1">Delivery Address / Central DC *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Hyderabad Central DC Warehouse"
                            value={deliveryLocation}
                            onChange={(e) => setDeliveryLocation(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>

                        {/* Order Price Estimate Banner */}
                        <div className="p-4 bg-gradient-to-r from-[#F8EAF4] to-[#F3D0E9]/30 border border-[#F3D0E9] rounded-2xl flex justify-between items-center">
                          <div>
                            <span className="font-black text-[#A71380] text-xs block">Estimated Order Total</span>
                            <span className="text-[10px] text-slate-500 font-semibold">Includes GST &amp; Batch Dispatch</span>
                          </div>
                          <span className="text-lg font-black text-[#0B2545] font-mono">
                            ₹{estTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Submit Action Buttons */}
                        <div className="flex items-center space-x-3 pt-3 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => setSelectedInquiryProduct(null)}
                            className="w-1/3 border border-slate-200 py-3.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={rfqSubmitting}
                            className="w-2/3 bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#730B58] text-white py-3.5 rounded-xl font-black shadow-md shadow-[#A71380]/20 cursor-pointer disabled:opacity-50 uppercase tracking-wider text-xs"
                          >
                            {rfqSubmitting ? "Submitting Order..." : "Confirm & Place Order"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
