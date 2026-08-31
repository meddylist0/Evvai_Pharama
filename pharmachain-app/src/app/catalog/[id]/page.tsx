"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";
import { productsAPI, ordersAPI, ProductItem } from "@/lib/api";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Commercial Batch Procurement Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
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

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await productsAPI.list().catch(() => []);
        const list = (data && data.length > 0) ? data : (INITIAL_PRODUCTS as any[]);

        const normalizedList: ProductItem[] = list.map((p: any) => ({
          ...p,
          mrp: p.mrp ?? 0,
          customer_price: p.customer_price ?? p.customerPrice ?? 0,
          distributor_price: p.distributor_price ?? p.distributorPrice ?? 0,
          bulk_price: p.bulk_price ?? p.bulkPrice ?? 0,
          bulk_moq: p.bulk_moq ?? p.bulkMoq ?? 50,
          display_price: p.display_price ?? p.customer_price ?? p.customerPrice ?? p.mrp ?? 0,
          dosage_form: p.dosage_form || p.form || "Oral Solid / Tablet",
          pharmacopeia: "IP / BP / USP",
          dossier_status: "CTD Dossier Ready (WHO-GMP)",
        }));

        setAllProducts(normalizedList);

        const found = normalizedList.find(
          (p) => String(p.id) === String(productId) || p.sku?.toLowerCase() === String(productId).toLowerCase()
        );

        if (found) {
          setProduct(found);
          setBatchQuantity(found.bulk_moq || 50);
        } else if (normalizedList.length > 0) {
          setProduct(normalizedList[0]);
          setBatchQuantity(normalizedList[0].bulk_moq || 50);
        }
      } catch (err) {
        console.error("Failed to load product detail:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleStartOrder = () => {
    if (!product) return;
    setRfqSuccess(null);
    setRfqError(null);

    // If not logged in, directly redirect to login with return path
    if (!user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pharmalink_pending_order_product_id", String(product.id));
      }
      router.push(`/login?redirect=/catalog/${productId}`);
      return;
    }

    // Logged in user: open order form
    setShowOrderModal(true);
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!institutionName.trim() || !contactPhone.trim() || !deliveryLocation.trim()) {
      setRfqError("Please complete the required institution name, phone number, and delivery location.");
      return;
    }

    setRfqSubmitting(true);
    setRfqError(null);

    try {
      const orderRes = await ordersAPI.create({
        items: [{ product_id: product.id, quantity: batchQuantity }],
        customer_name: institutionName.trim(),
        customer_phone: contactPhone.trim(),
        delivery_address: `${deliveryLocation.trim()} | Supply Terms: ${inquiryType.toUpperCase()}`,
        delivery_city: "Hyderabad",
        delivery_state: "Telangana",
        delivery_pincode: "500081",
        payment_method: "B2B Wholesale Credit (30 Days)",
      });

      setRfqSuccess(orderRes.order_code);
    } catch (err: any) {
      console.error("Commercial RFQ failed:", err);
      setRfqError(err.message || "Failed to submit commercial allocation request. Please try again.");
    } finally {
      setRfqSubmitting(false);
    }
  };

  const relatedProducts = allProducts
    .filter((p) => String(p.id) !== String(product?.id))
    .slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-24 text-center flex-1 w-full">
          <div className="animate-spin w-10 h-10 border-3 border-[#0b2341] border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Loading Technical Product Dossier from database...</p>
        </main>
        <FooterSection />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center flex-1 w-full space-y-4">
          <span className="text-4xl block">🧪</span>
          <h2 className="text-xl font-black text-[#0b2341]">Formulation Dossier Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested formulation ID does not match active manufacturing records.
          </p>
          <Link
            href="/catalog"
            className="inline-block bg-[#0b2341] text-white px-5 py-2.5 rounded-[6px] text-xs font-bold"
          >
            &larr; Back to Formulation Portfolio
          </Link>
        </main>
        <FooterSection />
      </div>
    );
  }

  const rate = product.distributor_price || product.customer_price || product.mrp || 0;
  const estTotal = rate * batchQuantity;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Breadcrumbs Navigation */}
        <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-[#0b2341] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-[#0b2341] transition-colors">Formulation Portfolio</Link>
          <span>/</span>
          <span className="text-[#0b2341] font-bold truncate">{product.name}</span>
        </nav>

        {/* Hero Header Section */}
        <div className="bg-white border border-slate-200 rounded-[6px] p-6 md:p-8 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Product Image */}
            <div className="lg:col-span-4 h-64 rounded-[6px] bg-slate-50 border border-slate-200 p-4 flex items-center justify-center relative">
              <img
                src={product.image || "/images/product_zene.png"}
                alt={product.name}
                className="max-h-full max-w-full object-contain drop-shadow-xs"
              />
              <span className="absolute top-3 left-3 bg-[#0b2341] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-[3px]">
                {product.sku}
              </span>
            </div>

            {/* Formulation Key Data */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-[4px] text-[10px] font-extrabold uppercase tracking-wider">
                    ✓ WHO-GMP & cGMP Certified
                  </span>
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-[4px] text-[10px] font-extrabold uppercase">
                    {product.category_name || (product as any).category || "Therapeutics"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Batch COA: {product.batch_no || "EVV-2026-B1"}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-[#0b2341] tracking-tight">
                  {product.name}
                </h1>
                <p className="text-xs md:text-sm font-semibold text-slate-600">
                  {product.composition}
                </p>
              </div>

              {/* Quick Specs Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-[6px] border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Pharmacopeia</span>
                  <span className="font-bold text-slate-800">IP / BP / USP</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Pack Configuration</span>
                  <span className="font-bold text-slate-800">{product.pack_size || (product as any).packSize || "10 x 10 Alu-Alu"}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Shelf Life</span>
                  <span className="font-bold text-slate-800">24 - 36 Months</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block font-medium">Commercial Rate</span>
                  <span className="font-black text-emerald-700 font-mono text-sm">₹{rate.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={handleStartOrder}
                  className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-[6px] text-xs font-black shadow-md transition-all cursor-pointer flex items-center space-x-2"
                >
                  <span>⚡ Book Batch Now / Order Now &rarr;</span>
                </button>
                <a
                  href={`mailto:commercial@evvaipharma.com?subject=Institutional Quotation Request: ${product.name} (SKU: ${product.sku})`}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-5 py-3 rounded-[6px] text-xs font-bold transition-all cursor-pointer"
                >
                  📥 Request Formal Tender Quote
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Section: Technical Dossier + Related Products Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Manufacturing Details, Quality Specs & Clinical Indication (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Manufacturing Process & Technology Flow */}
            <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <span className="text-base">🏭</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#0b2341]">
                  How This Product Is Manufactured (cGMP Flow)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Step 1 */}
                <div className="p-3.5 rounded-[6px] bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-[#0b2341]">
                    <span className="w-5 h-5 rounded-full bg-[#0b2341] text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Raw Material & Active Molecule Assay</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    Active Pharmaceutical Ingredients (APIs) and pharmaceutical-grade excipients undergo HPLC purity testing and heavy-metal screening for &gt;99.5% potency before release.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-[6px] bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-[#0b2341]">
                    <span className="w-5 h-5 rounded-full bg-[#0b2341] text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Cleanroom Processing & Precision Tooling</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    Formulated in ISO Class 7 cleanrooms with HEPA filtration, automated rapid mixer granulators, and fluid bed dryers with automated weight uniformity control.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 rounded-[6px] bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-[#0b2341]">
                    <span className="w-5 h-5 rounded-full bg-[#0b2341] text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Tropical Alu-Alu Blistering</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    Packaged in multi-layer cold-formable tropical aluminum foil providing absolute barrier properties against environmental moisture, oxygen, and UV light degradation.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-[6px] bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2 font-bold text-[#0b2341]">
                    <span className="w-4 h-4 rounded-full bg-[#0b2341] text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Analytical Batch Release & COA Sign-off</span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11px]">
                    Dissolution kinetics, disintegration profiling, and microbial testing validated by the Quality Control team before issuing the QP Certificate of Analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Technical Specification Matrix */}
            <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <span className="text-base">📋</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#0b2341]">
                  Technical Product Dossier Matrix
                </h3>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Generic / INN Formulation:</span>
                  <span className="font-bold text-slate-800">{product.name}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Active Ingredients & Strength:</span>
                  <span className="font-bold text-slate-800">{product.composition}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Therapeutic Category:</span>
                  <span className="font-bold text-blue-800">{product.category_name || (product as any).category}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Pharmacopeial Standard:</span>
                  <span className="font-bold text-slate-800">IP / BP / USP Compliant</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Primary & Secondary Packaging:</span>
                  <span className="font-bold text-slate-800">{product.pack_size || (product as any).packSize || "10 x 10 Alu-Alu"} in UV-Coated Mono Carton</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Storage Instructions:</span>
                  <span className="font-bold text-slate-800">Store below 25°C in a dry place. Protect from direct sunlight.</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-500 font-medium">Regulatory Certifications:</span>
                  <span className="font-bold text-emerald-700">WHO-GMP, Schedule M, DCGI Approved Form 25/28</span>
                </div>
              </div>
            </div>

            {/* 3. Clinical Indications */}
            <div className="bg-white border border-slate-200 rounded-[6px] p-6 shadow-2xs space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <span className="text-base">💊</span>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#0b2341]">
                  Therapeutic Indication & Clinical Pharmacology
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                {product.subtitle || product.description || "Indicated for therapeutic management in authorized clinical protocols as approved by the Drugs Controller General of India (DCGI). Prescribed and dispensed under registered medical supervision."}
              </p>
            </div>
          </div>

          {/* Right Column: Related Products Sidebar (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Related Formulations Card */}
            <div className="bg-white border border-slate-200 rounded-[6px] p-5 shadow-2xs space-y-3.5 text-xs">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <h4 className="font-extrabold text-[#0b2341] text-xs uppercase tracking-wider">
                  Related Formulations
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">Portfolio</span>
              </div>

              <div className="space-y-2.5">
                {relatedProducts.map((rel) => {
                  const rPrice = rel.distributor_price || rel.customer_price || rel.mrp || 0;
                  return (
                    <Link
                      key={rel.id || rel.sku}
                      href={`/catalog/${rel.id}`}
                      className="block p-3 rounded-[6px] bg-slate-50/80 hover:bg-blue-50/50 hover:border-blue-300 border border-slate-200 transition-all space-y-1 group"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-slate-400 font-bold">{rel.sku}</span>
                        <span className="text-emerald-700 font-bold font-mono">₹{rPrice.toFixed(2)}</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-[#0b2341] group-hover:text-blue-700 transition-colors truncate">
                        {rel.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 truncate">{rel.composition}</p>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/catalog"
                  className="text-blue-700 hover:text-blue-900 font-bold text-xs inline-flex items-center space-x-1"
                >
                  <span>View All Formulations</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Institutional Tender Supply Card */}
            <div className="bg-[#0b2341] text-white rounded-[6px] p-5 shadow-md space-y-3 text-xs">
              <span className="text-[10px] font-extrabold uppercase text-blue-300 block tracking-wider">
                Institutional Supply Desk
              </span>
              <h4 className="font-black text-sm text-white leading-snug">
                Contract Manufacturing & Tender Allocation
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Direct batch allocations, loan licensing, third-party P2P manufacturing, and international COPP documentation for government and private hospital networks.
              </p>
              <div className="pt-1">
                <Link
                  href="/contact"
                  className="block text-center bg-white hover:bg-slate-100 text-[#0b2341] font-bold py-2 rounded-[5px] text-xs transition-all"
                >
                  Contact Key Account Manager &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Commercial Batch Procurement / PO Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[6px] max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 md:p-8 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold text-blue-900 uppercase bg-blue-50 px-2 py-0.5 rounded-[4px] border border-blue-200">
                    Institutional Procurement & Batch Allocation
                  </span>
                  {user && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[4px] border border-emerald-200">
                      ✓ Verified Account ({user.role})
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-[#0b2341] tracking-tight mt-1">
                  Commercial Allocation: {product.name}
                </h2>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-700 font-black text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {rfqError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-[6px] font-semibold">
                {rfqError}
              </div>
            )}

            {rfqSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-black text-[#0b2341]">Commercial Batch Order Registered!</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your allocation request for <strong>{product.name} ({batchQuantity} units)</strong> has been logged with the EVVAI Pharma Key Account Manager.
                </p>
                <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-200 inline-block font-mono text-xs font-bold text-blue-900">
                  PO Reference Number: {rfqSuccess}
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setShowOrderModal(false);
                      setRfqSuccess(null);
                    }}
                    className="bg-[#0b2341] text-white px-5 py-2 rounded-[5px] font-bold text-xs cursor-pointer hover:bg-[#12315a]"
                  >
                    Done & Return to Product Page
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCompleteOrder} className="space-y-3.5 text-xs">
                {/* Item Specs Box */}
                <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Formulation SKU:</span>
                    <span className="font-mono font-bold text-blue-700">{product.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Composition:</span>
                    <span className="font-bold text-slate-800">{product.composition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Pack Configuration:</span>
                    <span className="font-bold text-slate-800">{product.pack_size || (product as any).packSize || "Standard Box"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Inquiry / Supply Type *</label>
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value as any)}
                      className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="commercial_po">Commercial Purchase Order</option>
                      <option value="third_party">Third-Party / Contract Manufacturing</option>
                      <option value="export_dossier">Export Dossier & COPP Request</option>
                      <option value="sample_request">Regulatory Sample Evaluation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batch Order Quantity (Units) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={batchQuantity}
                      onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Institution / Distributor Entity *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apollo Healthcare / Sri Sai Pharma"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Mobile / Direct Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destination Central Warehouse / Port *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad Central DC / JNPT Port Export"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 font-medium"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-[5px] flex justify-between items-center">
                  <span className="font-bold text-blue-900 text-xs">Estimated Commercial Valuation:</span>
                  <span className="text-base font-black text-blue-950 font-mono">
                    ₹{estTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    className="w-1/3 border border-slate-300 py-2.5 rounded-[5px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rfqSubmitting}
                    className="w-2/3 bg-[#0b2341] hover:bg-[#12315a] text-white py-2.5 rounded-[5px] font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {rfqSubmitting ? "Submitting Request..." : "Confirm & Submit Batch PO"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <FooterSection />
    </div>
  );
}
