"use client";

import React, { useState } from "react";
import { INITIAL_PRODUCTS, Product } from "@/data/mockData";

export default function AdminPricingPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [mrp, setMrp] = useState(500);
  const [customerPrice, setCustomerPrice] = useState(450);
  const [distributorPrice, setDistributorPrice] = useState(350);
  const [bulkPrice, setBulkPrice] = useState(320);

  const handleOpenConfigure = (p: Product) => {
    setSelectedProduct(p);
    setMrp(p.mrp);
    setCustomerPrice(p.customerPrice);
    setDistributorPrice(p.distributorPrice);
    setBulkPrice(p.bulkPrice);
    setIsModalOpen(true);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProduct.id
          ? {
            ...p,
            mrp: Number(mrp),
            customerPrice: Number(customerPrice),
            distributorPrice: Number(distributorPrice),
            bulkPrice: Number(bulkPrice),
          }
          : p
      )
    );

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
          Multi-Tier Role Pricing Rules & Bulk MOQ Configurator
        </span>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          Pricing Rules Manager
        </h1>
        <p className="text-xs text-slate-500">
          Configure MRP, Retail Customer rates, Wholesale Distributor prices, and Tiered Bulk MOQ rates.
        </p>
      </div>

      {/* Pricing Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                <th className="py-3.5 px-5">Product Name & SKU</th>
                <th className="py-3.5 px-5">MRP (₹)</th>
                <th className="py-3.5 px-5">Retail Customer Rate (₹)</th>
                <th className="py-3.5 px-5">Distributor Wholesale Rate (₹)</th>
                <th className="py-3.5 px-5">Bulk MoQ Rate (₹)</th>
                <th className="py-3.5 px-5 text-right">Pricing Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <span className="font-bold text-[#0b2341] text-sm block">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
                  </td>
                  <td className="py-4 px-5 text-slate-400 line-through font-mono">₹{p.mrp.toFixed(2)}</td>
                  <td className="py-4 px-5 text-slate-900 font-bold font-mono">₹{p.customerPrice.toFixed(2)}</td>
                  <td className="py-4 px-5 text-blue-600 font-extrabold font-mono text-sm">₹{p.distributorPrice.toFixed(2)}</td>
                  <td className="py-4 px-5 text-emerald-700 font-extrabold font-mono text-sm">
                    ₹{p.bulkPrice.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">(≥{p.bulkMoq})</span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => handleOpenConfigure(p)}
                      className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Configure Rates
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0b2341]">Configure Multi-Tier Pricing</h3>
                <p className="text-xs text-slate-500">{selectedProduct.name} ({selectedProduct.sku})</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Retail Rate (₹)</label>
                  <input
                    type="number"
                    value={customerPrice}
                    onChange={(e) => setCustomerPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Distributor B2B Rate (₹)</label>
                  <input
                    type="number"
                    value={distributorPrice}
                    onChange={(e) => setDistributorPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bulk MOQ Tier Rate (₹)</label>
                  <input
                    type="number"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-emerald-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white font-bold py-3.5 rounded-xl mt-3 shadow-xs cursor-pointer"
              >
                Save Tiered Rates
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
