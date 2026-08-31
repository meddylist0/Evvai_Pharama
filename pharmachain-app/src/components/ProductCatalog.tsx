"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { productsAPI, ordersAPI, categoriesAPI, ProductItem } from "@/lib/api";
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
  const { user, isAuthenticated } = useAuth();
  const catalogTopRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["All Therapeutic Areas"]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Therapeutic Areas");
  const [selectedDosageForm, setSelectedDosageForm] = useState("All Forms");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Selected formulation for Deep Technical Specification Sheet Drawer/Modal
  const [selectedSpecProduct, setSelectedSpecProduct] = useState<ProductItem | null>(null);

  // Commercial Batch Procurement / RFQ Modal state
  const [selectedInquiryProduct, setSelectedInquiryProduct] = useState<ProductItem | null>(null);
  const [batchQuantity, setBatchQuantity] = useState(100);
  const [institutionName, setInstitutionName] = useState(user?.company_name || user?.full_name || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [inquiryType, setInquiryType] = useState<"commercial_po" | "third_party" | "export_dossier" | "sample_request">("commercial_po");
  const [deliveryLocation, setDeliveryLocation] = useState("Central Distribution Warehouse, Hyderabad");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [rfqSubmitting, setRfqSubmitting] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState<string | null>(null);
  const [rfqError, setRfqError] = useState<string | null>(null);

  // Synchronize user fields
  useEffect(() => {
    if (user) {
      setInstitutionName(user.company_name || user.full_name || "");
      if (user.phone) setContactPhone(user.phone);
    }
  }, [user]);

  // Fetch live formulations from backend
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
          mrp: p.mrp ?? 0,
          customer_price: p.customer_price ?? p.customerPrice ?? 0,
          distributor_price: p.distributor_price ?? p.distributorPrice ?? 0,
          bulk_price: p.bulk_price ?? p.bulkPrice ?? 0,
          bulk_moq: p.bulk_moq ?? p.bulkMoq ?? 50,
          display_price: p.display_price ?? p.customer_price ?? p.customerPrice ?? p.mrp ?? 0,
          dosage_form: p.dosage_form || p.form || "Oral Solid / Tablet",
          pharmacopeia: p.pharmacopeia || "IP / BP / USP",
          dossier_status: "CTD Dossier Ready (WHO-GMP)",
        }));
        setProducts(normalized);
      } else if (process.env.NODE_ENV === 'development') {
        const normalizedMock = (INITIAL_PRODUCTS as any[]).map((p) => ({
          ...p,
          mrp: p.mrp ?? 0,
          customer_price: p.customerPrice ?? p.customer_price ?? 0,
          distributor_price: p.distributorPrice ?? p.distributor_price ?? 0,
          bulk_price: p.bulkPrice ?? p.bulk_price ?? 0,
          bulk_moq: p.bulkMoq ?? p.bulk_moq ?? 50,
          display_price: p.customerPrice ?? p.customer_price ?? p.mrp ?? 0,
          dosage_form: (p as any).dosage_form || "Oral Solid / Tablet",
          pharmacopeia: "IP / USP",
          dossier_status: "WHO-GMP Certified",
        }));
        setProducts(normalizedMock);
      } else {
        setProducts([]);
      }

      // Dynamic Categories
      const dynamicCats = new Set<string>(["All Therapeutic Areas"]);
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
      if (process.env.NODE_ENV === 'development') {
        setProducts(INITIAL_PRODUCTS as any);
      } else {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  // Extract unique dosage forms
  const dosageForms = ["All Forms", "Tablets & Capsules", "Injectables & Vials", "Oral Liquids", "Topicals & Ointments"];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.composition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const catName = p.category_name || (p as any).category;
    const matchesCategory =
      selectedCategory === "All Therapeutic Areas" || catName === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    catalogTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleStartInquiry = (prod: ProductItem) => {
    setSelectedSpecProduct(null);
    setRfqSuccess(null);
    setRfqError(null);

    // If unauthenticated, redirect directly to Login / B2B Onboarding
    if (!user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("pharmalink_pending_order_product_id", String(prod.id));
      }
      router.push("/login?redirect=/catalog");
      return;
    }

    // Logged in distributor / institution
    setSelectedInquiryProduct(prod);
    setBatchQuantity(prod.bulk_moq || 50);
    setInstitutionName(user.company_name || user.full_name || "");
    setContactPhone(user.phone || "");
  };

  const handleCompleteInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiryProduct) return;

    if (!institutionName.trim() || !contactPhone.trim() || !deliveryLocation.trim()) {
      setRfqError("Please complete the required institution name, phone number, and delivery location.");
      return;
    }

    setRfqSubmitting(true);
    setRfqError(null);

    try {
      // Create actual B2B Purchase Order / Commercial Batch Allocation in FastAPI backend
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

      if (onAddToCart) {
        onAddToCart(selectedInquiryProduct.name);
      }
    } catch (err: any) {
      console.error("Commercial RFQ failed:", err);
      setRfqError(err.message || "Failed to submit commercial allocation request. Please try again.");
    } finally {
      setRfqSubmitting(false);
    }
  };

  return (
    <section ref={catalogTopRef} className="space-y-6 my-4">
      {/* Corporate Manufacturer Banner */}
      <div className="bg-[#0b2341] text-white p-6 md:p-8 rounded-[6px] border border-[#16365c] shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider">
              WHO-GMP & Schedule M Certified Facility
            </span>
            <span className="text-[10px] text-slate-300 font-mono">
              DCGI Form 25 / 28 Validated
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Finished Dosage Formulations (FDF) Portfolio
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            High-potency commercial therapeutics manufactured under strict cGMP guidelines. Available for domestic institutional tenders, hospital supply networks, PCD franchise distribution, and global export dossiers.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>CTD / eCTD Dossiers</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Stability Tested (Zone IVb)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Batch Release COA</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Third-Party & P2P Supply</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulation Search & Therapeutic Filter Bar */}
      <div className="bg-white p-5 rounded-[6px] border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search by Active Molecule (INN), Formulation Name, or SKU..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-[6px] pl-3.5 pr-4 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#0b2341] font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Showing {filteredProducts.length} Formulations
            </span>
          </div>
        </div>

        {/* Therapeutic Area Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-[5px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#0b2341] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Manufacturer Formulation Master Table */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-[6px] border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-[#0b2341] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-xs font-bold text-slate-500">Querying formulation database and pharmacopeia records...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[6px] border border-slate-200 text-slate-400 space-y-2">
          <span className="text-3xl block">🧪</span>
          <p className="text-sm font-bold text-slate-700">No formulations found matching criteria</p>
          <p className="text-xs text-slate-500">Please adjust your search terms or therapeutic category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-[6px] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Formulation / Active Molecule</th>
                    <th className="py-3.5 px-4">Therapeutic Class</th>
                    <th className="py-3.5 px-4">Composition & Strength</th>
                    <th className="py-3.5 px-4">Pack Configuration</th>
                    <th className="py-3.5 px-4">Pharmacopeia / Regulatory</th>
                    <th className="py-3.5 px-4 text-right">Commercial Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedProducts.map((prod) => {
                    const isDist = user?.role === "DISTRIBUTOR";
                    const b2bRate = prod.distributor_price || prod.customer_price || prod.mrp;
                    const moq = prod.bulk_moq || 50;

                    return (
                      <tr key={prod.id || prod.sku} className="hover:bg-blue-50/40 transition-colors group">
                        {/* Product Name & SKU */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <Link
                              href={`/catalog/${prod.id}`}
                              className="w-11 h-11 rounded-[4px] bg-slate-100 border border-slate-200 p-1 flex items-center justify-center shrink-0 hover:border-blue-400 transition-colors"
                            >
                              <img
                                src={prod.image || "/images/product_zene.png"}
                                alt={prod.name}
                                className="max-h-full max-w-full object-contain"
                              />
                            </Link>
                            <div>
                              <Link
                                href={`/catalog/${prod.id}`}
                                className="font-extrabold text-sm text-[#0b2341] hover:text-blue-700 transition-colors text-left block"
                              >
                                {prod.name}
                              </Link>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">
                                SKU: {prod.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Therapeutic Category */}
                        <td className="py-4 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-[4px] bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold">
                            {prod.category_name || (prod as any).category || "Therapeutics"}
                          </span>
                        </td>

                        {/* Composition */}
                        <td className="py-4 px-4">
                          <div className="max-w-[200px]">
                            <span className="font-bold text-slate-900 block truncate">
                              {prod.composition}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {prod.subtitle || "Standard Formulation"}
                            </span>
                          </div>
                        </td>

                        {/* Pack Size */}
                        <td className="py-4 px-4">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-[3px] border border-slate-200">
                            {prod.pack_size || (prod as any).packSize || "10 x 10 Alu-Alu"}
                          </span>
                        </td>

                        {/* Regulatory Status */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-[3px] border border-emerald-200 inline-block">
                              ✓ WHO-GMP cGMP
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              COA: {prod.batch_no || "EVV-2026-B1"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/catalog/${prod.id}`}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-[5px] text-xs font-bold transition-all cursor-pointer inline-block"
                            >
                              Dossier Specs
                            </Link>
                            <button
                              onClick={() => handleStartInquiry(prod)}
                              className="bg-[#0b2341] hover:bg-[#12315a] text-white px-3.5 py-1.5 rounded-[5px] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Procure Batch &rarr;
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Corporate Pagination Control Bar */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-[6px] border border-slate-200 shadow-2xs text-xs">
              <div className="text-slate-500 font-medium">
                Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of{" "}
                <span className="font-bold text-[#0b2341]">{filteredProducts.length}</span> formulations
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
                    className="border border-slate-200 rounded-[4px] px-2 py-1 bg-slate-50 font-bold text-[#0b2341] text-xs cursor-pointer focus:outline-none"
                  >
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center space-x-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(1)}
                      className="px-2.5 py-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold"
                      title="First Page"
                    >
                      «
                    </button>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                      className="px-3 py-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold text-slate-700"
                    >
                      ‹ Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-7 h-7 rounded-[4px] font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center ${
                              currentPage === pageNum
                                ? "bg-[#0b2341] text-white shadow-xs"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="px-1 text-slate-400 font-bold">...</span>;
                      }
                      return null;
                    })}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                      className="px-3 py-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold text-slate-700"
                    >
                      Next ›
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className="px-2.5 py-1 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs font-bold"
                      title="Last Page"
                    >
                      »
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Institutional Procurement / B2B Batch RFQ Modal */}
      {selectedInquiryProduct && (() => {
        const prod = selectedInquiryProduct;
        const b2bRate = prod.distributor_price || prod.customer_price || prod.mrp || 0;
        const estTotal = b2bRate * batchQuantity;

        return (
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
                    Commercial Allocation: {prod.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedInquiryProduct(null)}
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
                    Your allocation request for <strong>{prod.name} ({batchQuantity} units)</strong> has been logged with the EVVAI Pharma Key Account Manager.
                  </p>
                  <div className="bg-slate-50 p-3 rounded-[6px] border border-slate-200 inline-block font-mono text-xs font-bold text-blue-900">
                    PO Reference Number: {rfqSuccess}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedInquiryProduct(null);
                        setRfqSuccess(null);
                      }}
                      className="bg-[#0b2341] text-white px-5 py-2 rounded-[5px] font-bold text-xs cursor-pointer hover:bg-[#12315a]"
                    >
                      Done & Return to Portfolio
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCompleteInquiry} className="space-y-3.5 text-xs">
                  {/* Item Specs Box */}
                  <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Formulation SKU:</span>
                      <span className="font-mono font-bold text-blue-700">{prod.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Composition:</span>
                      <span className="font-bold text-slate-800">{prod.composition}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Pack Configuration:</span>
                      <span className="font-bold text-slate-800">{prod.pack_size || (prod as any).packSize || "Standard Box"}</span>
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
                      onClick={() => setSelectedInquiryProduct(null)}
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
        );
      })()}

      {/* End of ProductCatalog */}
    </section>
  );
};
