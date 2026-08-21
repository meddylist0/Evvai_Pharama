"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/data/mockData";

interface Props {
  product: Product;
  relatedProducts: Product[];
}

export const ProductDetailClientView: React.FC<Props> = ({ product, relatedProducts }) => {
  const [quantity, setQuantity] = useState(10);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Net Banking / NEFT");
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Price tier logic
  const isBulk = quantity >= product.bulkMoq;
  const unitPrice = isBulk ? product.bulkPrice : product.distributorPrice;
  const subtotal = unitPrice * quantity;
  const gst = subtotal * 0.18; // 18% Pharma GST
  const grandTotal = subtotal + gst;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `EVV-ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderSuccess(orderId);
  };

  return (
    <div className="space-y-12">
      {/* 2-Column Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Image Box */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-3xl p-8 flex flex-col items-center justify-center relative shadow-xs min-h-[440px]">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
              WHO-GMP Certified
            </span>
            <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
              {product.sku}
            </span>
          </div>

          <div className="h-72 sm:h-80 w-full flex items-center justify-center p-4">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300 drop-shadow-md"
            />
          </div>

          <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Batch: <strong className="font-mono text-slate-800">{product.batchNo}</strong></span>
            <span>Expiry: <strong className="text-slate-800">{product.expiryDate}</strong></span>
            <span>In Stock: <strong className="text-emerald-700 font-bold">{product.stock.toLocaleString()} units</strong></span>
          </div>
        </div>

        {/* Right Column: Specifications & Commercial Procurement Box */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-[#A71380] uppercase tracking-wider bg-pink-50 border border-pink-200 px-3 py-1 rounded-full inline-block">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-[#0b2341] tracking-tight leading-tight">
              {product.name}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {product.subtitle}
            </p>
          </div>

          {/* Clinical Specification Matrix */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-3 shadow-2xs text-xs">
            <h3 className="font-black text-[#0b2341] text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              Formulation Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Active Composition</span>
                <span className="font-bold text-slate-800">{product.composition}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Pack Presentation</span>
                <span className="font-bold text-slate-800">{product.packSize}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Therapeutic Classification</span>
                <span className="font-bold text-slate-800">{product.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Storage Condition</span>
                <span className="font-bold text-slate-800">Store below 25°C, protect from moisture</span>
              </div>
            </div>
          </div>

          {/* Pricing & Dynamic Calculator Card */}
          <div className="bg-[#0b2341] text-white rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-700/80 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Standard Retail MRP</span>
                <span className="text-sm line-through text-slate-400 font-bold">₹{product.mrp.toFixed(2)}</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">₹{unitPrice.toFixed(2)}</span>
                  <span className="text-xs text-slate-300">/ unit ({isBulk ? "Bulk Tier" : "B2B Wholesaler"})</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 rounded">
                  Bulk MOQ: {product.bulkMoq}+ units @ ₹{product.bulkPrice}
                </span>
              </div>
            </div>

            {/* Quantity Selector & Live Order Estimator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">Procurement Quantity (Units):</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 5))}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-20 text-center bg-slate-800 border border-slate-700 text-white font-bold rounded-lg py-1 text-sm font-mono"
                  />
                  <button
                    onClick={() => setQuantity((q) => q + 5)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cost Summary Breakdown */}
              <div className="bg-slate-900/60 rounded-2xl p-3.5 space-y-1 text-xs font-mono border border-slate-800 text-slate-300">
                <div className="flex justify-between"><span>Base Amount:</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-400"><span>Pharma GST (18% HSN 3004):</span><span>+₹{gst.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-emerald-400 text-sm pt-1 border-t border-slate-800">
                  <span>Estimated Total:</span><span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Order Button */}
            <button
              onClick={() => {
                setOrderSuccess(null);
                setOrderModalOpen(true);
              }}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>⚡ Order Now / Request Wholesale Dispatch</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Related Formulations Carousel / Grid */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#0b2341]">Related EVVAI Formulations</h2>
            <p className="text-xs text-slate-500">Explore complementary healthcare and therapeutic medicines.</p>
          </div>
          <Link href="/catalog" className="text-xs font-bold text-blue-700 hover:underline">
            View All 12 Products &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {relatedProducts.map((p) => (
            <Link
              key={p.id}
              href={`/catalog/${p.id}`}
              className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group p-4 space-y-3"
            >
              <div className="h-44 bg-white rounded-2xl p-2 flex items-center justify-center border border-slate-100">
                <img
                  src={p.image}
                  alt={p.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform drop-shadow-xs"
                />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-[#A71380] uppercase tracking-wider">{p.category}</span>
                <h3 className="text-sm font-extrabold text-[#0b2341] group-hover:text-blue-600 transition-colors line-clamp-1">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-1">{p.composition}</p>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-black text-emerald-700">₹{p.distributorPrice} <span className="text-[10px] text-slate-400 font-normal">B2B</span></span>
                  <span className="text-[11px] font-bold text-[#0b2341] group-hover:translate-x-0.5 transition-transform">Details &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Checkout Drawer Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-8 space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  Commercial Purchase Order
                </span>
                <h2 className="text-xl font-black text-[#0b2341] tracking-tight mt-1">
                  {product.name}
                </h2>
              </div>
              <button
                onClick={() => setOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orderSuccess ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 text-2xl font-bold">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#0b2341]">Purchase Order Confirmed!</h3>
                  <p className="text-xs text-slate-500 font-medium">Confirmation ID: <strong className="font-mono text-blue-700">{orderSuccess}</strong></p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left space-y-1.5 font-mono">
                  <div className="flex justify-between"><span>SKU:</span><span className="font-bold text-slate-800">{product.sku}</span></div>
                  <div className="flex justify-between"><span>Quantity Ordered:</span><span className="font-bold text-slate-800">{quantity} units</span></div>
                  <div className="flex justify-between"><span>Payment Method:</span><span className="font-bold text-slate-800">{paymentMethod}</span></div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-emerald-700"><span>Grand Total (with GST):</span><span>₹{grandTotal.toFixed(2)}</span></div>
                </div>
                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
                >
                  Done & Back to Details
                </button>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 font-mono">
                  <div className="flex justify-between text-slate-600"><span>Units:</span><span className="font-bold">{quantity} units</span></div>
                  <div className="flex justify-between text-slate-600"><span>Unit Rate:</span><span className="font-bold">₹{unitPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200"><span>Grand Total (inc 18% GST):</span><span>₹{grandTotal.toFixed(2)}</span></div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Hospital / Buyer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apollo Healthcare / Dr. Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold"
                    >
                      <option value="Net Banking / NEFT">Net Banking / NEFT</option>
                      <option value="UPI / Instant QR">UPI / Instant QR</option>
                      <option value="30-Day B2B Credit">30-Day B2B Credit Line</option>
                      <option value="Cheque on Delivery">Cheque on Delivery</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Destination Address</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter dispatch warehouse or hospital receiving bay address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white py-3.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer mt-2"
                >
                  Confirm & Dispatch Order &rarr;
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
