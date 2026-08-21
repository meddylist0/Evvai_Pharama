"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getStoredUser, StoredUser, productsAPI, ProductItem, categoriesAPI } from "@/lib/api";

export default function DistributorCatalogPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>(["All"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [addedItemName, setAddedItemName] = useState<string | null>(null);
  const [poCartCount, setPoCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshCartCount = () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_distributor_po_cart");
        if (raw) {
          const cart = JSON.parse(raw);
          setPoCartCount(Array.isArray(cart) ? cart.length : 0);
        }
      } catch (e) { }
    }
  };

  useEffect(() => {
    refreshCartCount();
    setUser(getStoredUser());
    const load = async () => {
      try {
        const [prods, cats] = await Promise.all([
          productsAPI.list(),
          categoriesAPI.list().catch(() => [])
        ]);
        if (prods) setProducts(prods);
        if (cats && cats.length > 0) {
          setCategoriesList(["All", ...cats.map((c: any) => c.name)]);
        }
      } catch (err) {
        console.warn("Failed fetching catalog:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isApproved = user?.kyc_status === "APPROVED";

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.composition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || p.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToPO = (prod: ProductItem) => {
    setAddedItemName(prod.name);
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pharmalink_distributor_po_cart");
        let cart: { product: ProductItem; quantity: number }[] = raw ? JSON.parse(raw) : [];
        const idx = cart.findIndex((it) => it.product.id === prod.id);
        const qty = prod.bulk_moq || 50;
        if (idx >= 0) {
          cart[idx].quantity += qty;
        } else {
          cart.push({ product: prod, quantity: qty });
        }
        localStorage.setItem("pharmalink_distributor_po_cart", JSON.stringify(cart));
        setPoCartCount(cart.length);
      } catch (e) { }
    }
    setTimeout(() => setAddedItemName(null), 3000);
  };

  if (!isApproved) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-2xs max-w-3xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl mx-auto flex items-center justify-center text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-black text-[#0b2341]">
          B2B Wholesale Catalog Locked
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your account is currently under Drug License & GST verification by the Admin. Wholesale pricing and Bulk PO creation will be unlocked once approved.
        </p>
        <div className="pt-2">
          <Link
            href="/distributor/dashboard"
            className="inline-block bg-[#0b2341] hover:bg-[#12315a] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-xs"
          >
            Check KYC Verification Status &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner matching Corporate Navy #0b2341 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200 inline-block">
            WHO-GMP Certified Wholesale Sheet
          </span>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight">
            Formulation Catalog & Tiered Pricing Sheet
          </h1>
          <p className="text-xs text-slate-500">
            Wholesale discounted prices and tiered MOQ bulk rates for approved stockists and hospital distributors.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            href="/distributor/orders/new"
            className="bg-[#0b2341] hover:bg-[#12315a] text-white px-5 py-3 rounded-xl font-extrabold text-xs transition-all shadow-xs flex items-center space-x-2 cursor-pointer whitespace-nowrap"
          >
            <span>🛒 {poCartCount > 0 ? `View PO Cart (${poCartCount})` : "+ Create Bulk PO"} &rarr;</span>
          </Link>
        </div>
      </div>

      {addedItemName && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-2xl font-bold flex items-center justify-between shadow-2xs animate-fade-in">
          <span>✓ Added <strong>{addedItemName}</strong> to Purchase Order Cart!</span>
          <Link
            href="/distributor/orders/new"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center space-x-1"
          >
            <span>Proceed to Checkout / PO &rarr;</span>
          </Link>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${selectedCategory === cat
                ? "bg-[#0b2341] text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative shrink-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search formulation, SKU, composition..."
            className="border border-slate-200 rounded-xl px-4 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium w-full sm:w-72"
          />
        </div>
      </div>

      {/* Catalog Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50 whitespace-nowrap">
                <th className="py-3.5 px-4">Formulation & SKU</th>
                <th className="py-3.5 px-4">Composition</th>
                <th className="py-3.5 px-4">Pack Size</th>
                <th className="py-3.5 px-4">MRP (₹)</th>
                <th className="py-3.5 px-4">B2B Rate (₹)</th>
                <th className="py-3.5 px-4">Bulk MoQ Rate (₹)</th>
                <th className="py-3.5 px-4">Stock Availability</th>
                <th className="py-3.5 px-4 text-right">Order Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-bold text-[#0b2341] block text-sm">{prod.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{prod.sku}</span>
                  </td>

                  <td className="py-4 px-4 text-slate-600 font-medium">{prod.composition}</td>

                  <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{prod.pack_size || "Standard"}</td>

                  <td className="py-4 px-4 text-slate-400 line-through whitespace-nowrap">₹{prod.mrp.toFixed(2)}</td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-black text-blue-600 text-sm block">₹{(prod.distributor_price || prod.display_price || prod.mrp).toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Standard B2B</span>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-black text-emerald-700 text-sm block">₹{(prod.bulk_price || prod.distributor_price || prod.display_price || prod.mrp).toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      ≥{prod.bulk_moq || 20} units MOQ
                    </span>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-800 text-xs block">{prod.stock} Units</span>
                    <span className="text-[10px] text-emerald-700 font-bold">● High Availability</span>
                  </td>

                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleAddToPO(prod)}
                      className="bg-[#0b2341] hover:bg-[#12315a] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
                    >
                      <span>+ Add to PO</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

