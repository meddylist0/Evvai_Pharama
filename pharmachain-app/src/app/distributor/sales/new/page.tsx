"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  INITIAL_LOCAL_BUYERS,
  INITIAL_PRODUCTS,
  LocalBuyer,
  Product,
  SecondaryInvoice,
  SecondaryInvoiceItem,
  INITIAL_SECONDARY_INVOICES,
} from "@/data/mockData";

function CreateSecondaryInvoicePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialBuyerId = searchParams.get("buyerId") || "";

  const [buyers, setBuyers] = useState<LocalBuyer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(initialBuyerId);

  // Line items state
  const [lineItems, setLineItems] = useState<SecondaryInvoiceItem[]>([
    {
      productId: INITIAL_PRODUCTS[0]?.id || "P001",
      productName: INITIAL_PRODUCTS[0]?.name || "Zene Melatonin Oral Spray",
      composition: INITIAL_PRODUCTS[0]?.composition || "Melatonin Oral Formulation",
      batchNo: INITIAL_PRODUCTS[0]?.batchNo || "EV2026-Z01",
      expiryDate: INITIAL_PRODUCTS[0]?.expiryDate || "12/2028",
      quantity: 10,
      tradePrice: 320,
      mrp: INITIAL_PRODUCTS[0]?.mrp || 450,
      total: 3200,
    },
  ]);

  const [paymentMode, setPaymentMode] = useState<SecondaryInvoice["paymentMode"]>("CREDIT_15_DAYS");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [generatedInvoice, setGeneratedInvoice] = useState<SecondaryInvoice | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Load buyers and products from localStorage or defaults
    try {
      const savedBuyers = localStorage.getItem("pharmalink_local_buyers");
      setBuyers(savedBuyers ? JSON.parse(savedBuyers) : INITIAL_LOCAL_BUYERS);
      const savedProducts = localStorage.getItem("pharmalink_products");
      setProducts(savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS);
    } catch (e) {
      setBuyers(INITIAL_LOCAL_BUYERS);
      setProducts(INITIAL_PRODUCTS);
    }
  }, []);

  useEffect(() => {
    if (buyers.length > 0 && !selectedBuyerId) {
      setSelectedBuyerId(buyers[0].id);
    }
  }, [buyers, selectedBuyerId]);

  const selectedBuyer = buyers.find((b) => b.id === selectedBuyerId);

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.name,
      composition: prod.composition,
      batchNo: prod.batchNo,
      expiryDate: prod.expiryDate,
      mrp: prod.mrp,
      tradePrice: Math.round(prod.distributorPrice * 1.15), // Default trade price 15% above distributor purchase price
      total: Math.round(prod.distributorPrice * 1.15) * updated[index].quantity,
    };
    setLineItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...lineItems];
    const safeQty = Math.max(1, qty);
    updated[index].quantity = safeQty;
    updated[index].total = updated[index].tradePrice * safeQty;
    setLineItems(updated);
  };

  const handleTradePriceChange = (index: number, price: number) => {
    const updated = [...lineItems];
    const safePrice = Math.max(0, price);
    updated[index].tradePrice = safePrice;
    updated[index].total = safePrice * updated[index].quantity;
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    const defaultProd = products[0] || INITIAL_PRODUCTS[0];
    setLineItems([
      ...lineItems,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        composition: defaultProd.composition,
        batchNo: defaultProd.batchNo,
        expiryDate: defaultProd.expiryDate,
        quantity: 10,
        tradePrice: Math.round(defaultProd.distributorPrice * 1.15),
        mrp: defaultProd.mrp,
        total: Math.round(defaultProd.distributorPrice * 1.15) * 10,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const gstAmount = Math.round(subtotal * 0.12); // 12% GST
  const grandTotal = subtotal + gstAmount;

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBuyer) {
      setStatusMsg({ type: "error", text: "Please select a valid local buyer (RMP Doctor or Chemist shop)." });
      return;
    }

    if (lineItems.length === 0) {
      setStatusMsg({ type: "error", text: "Please add at least one formulation to the invoice." });
      return;
    }

    const actualPaid = paymentMode === "CASH" || paymentMode === "UPI" ? grandTotal : paidAmount;
    const balance = grandTotal - actualPaid;

    const newInvoice: SecondaryInvoice = {
      id: `SINV-${Date.now().toString().slice(-4)}`,
      invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      buyerId: selectedBuyer.id,
      buyerName: selectedBuyer.name,
      buyerType: selectedBuyer.type,
      villageTown: selectedBuyer.villageTown,
      items: lineItems,
      totalAmount: grandTotal,
      paidAmount: actualPaid,
      balanceAmount: balance,
      paymentMode,
      invoiceDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      status: balance === 0 ? "PAID" : actualPaid > 0 ? "PARTIAL" : "CREDIT_PENDING",
    };

    // Save invoice to localStorage
    try {
      const existingInvoicesStr = localStorage.getItem("pharmalink_secondary_invoices");
      const existingInvoices: SecondaryInvoice[] = existingInvoicesStr
        ? JSON.parse(existingInvoicesStr)
        : INITIAL_SECONDARY_INVOICES;
      const updatedInvoices = [newInvoice, ...existingInvoices];
      localStorage.setItem("pharmalink_secondary_invoices", JSON.stringify(updatedInvoices));

      // Update buyer outstanding credit if balance > 0
      if (balance > 0) {
        const updatedBuyers = buyers.map((b) =>
          b.id === selectedBuyer.id ? { ...b, currentOutstanding: b.currentOutstanding + balance } : b
        );
        setBuyers(updatedBuyers);
        localStorage.setItem("pharmalink_local_buyers", JSON.stringify(updatedBuyers));
      }
    } catch (err) {
      console.error(err);
    }

    setGeneratedInvoice(newInvoice);
    setStatusMsg({ type: "success", text: `✓ B2B Tax Invoice '${newInvoice.invoiceNo}' generated successfully!` });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-violet-100/60 px-3 py-1 rounded-full border border-violet-200">
              B2B Sales Invoicing • RMP Doctors & Retail Counters
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Generate Secondary Sales GST Invoice
          </h1>
          <p className="text-xs text-slate-500">
            Issue tax compliant sales invoices with batch numbers & credit payment terms to your local doctor network.
          </p>
        </div>

        <button
          onClick={() => router.push("/distributor/sales")}
          className="border border-slate-200 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-2xl text-xs transition-all shrink-0 cursor-pointer text-slate-700"
        >
          ← View All Secondary Invoices
        </button>
      </div>

      {/* Status Msg */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border transition-all ${statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Invoice Generator Form */}
      <form onSubmit={handleCreateInvoice} className="space-y-6">
        {/* Buyer Selection Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-[#0b2341] border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>1. Select Local Buyer / RMP Doctor</span>
            <a href="/distributor/buyers" className="text-xs text-blue-600 font-bold hover:underline">
              + Register New Buyer
            </a>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Select Registered Doctor / Chemist *</label>
              <select
                value={selectedBuyerId}
                onChange={(e) => setSelectedBuyerId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-[#0b2341]"
              >
                {buyers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.type.replace("_", " ")}) - {b.villageTown}
                  </option>
                ))}
              </select>
            </div>

            {selectedBuyer && (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#0b2341] text-xs">{selectedBuyer.name}</span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedBuyer.type}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Reg/DL: {selectedBuyer.licenseNo} | Mob: {selectedBuyer.mobile}</div>
                <div className="text-[11px] text-slate-500">
                  Location: {selectedBuyer.villageTown}, {selectedBuyer.district} | Outstanding Credit:{" "}
                  <span className="font-bold text-rose-600">₹{selectedBuyer.currentOutstanding.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulations & Items Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-[#0b2341]">2. Formulations & Batch Line Items</h3>
            <button
              type="button"
              onClick={handleAddLineItem}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              + Add Item Line
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Formulation Product *</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-white font-bold text-[#0b2341]"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (MRP: ₹{p.mrp})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Batch & Expiry</label>
                    <div className="font-mono font-bold text-[#0b2341] bg-white p-2.5 rounded-xl border border-slate-200 text-[11px]">
                      {item.batchNo} ({item.expiryDate})
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Quantity (Units)</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl p-2 bg-white font-bold text-center text-[#0b2341]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Trade Price (₹/unit)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.tradePrice}
                      onChange={(e) => handleTradePriceChange(idx, Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl p-2 bg-white font-bold text-center text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200/50 text-[11px]">
                  <span className="text-slate-500">Composition: {item.composition} | MRP: ₹{item.mrp}</span>
                  <div className="flex items-center space-x-4">
                    <span className="font-black text-[#0b2341] text-xs">Total: ₹{item.total.toLocaleString("en-IN")}</span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Terms & Summary Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-sm font-black text-[#0b2341] border-b border-slate-100 pb-3">3. Commercials & Credit Payment Terms</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Mode / Credit Terms *</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-[#0b2341]"
                >
                  <option value="CREDIT_15_DAYS">💳 15 Days Credit Term (Post-Dated Payment)</option>
                  <option value="CREDIT_30_DAYS">💳 30 Days Credit Term (Monthly Statement)</option>
                  <option value="UPI">📱 Instant UPI / QR Scan</option>
                  <option value="CASH">💵 Cash on Delivery (COD)</option>
                </select>
              </div>

              {(paymentMode === "CREDIT_15_DAYS" || paymentMode === "CREDIT_30_DAYS") && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Down Payment Received Today (₹)</label>
                  <input
                    type="number"
                    min={0}
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-bold text-emerald-700"
                  />
                </div>
              )}
            </div>

            {/* Calculations Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Trade Cost):</span>
                <span className="font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable Pharma GST (12%):</span>
                <span className="font-bold">₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#0b2341] pt-2 border-t border-slate-200">
                <span>Grand Total Amount:</span>
                <span>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs text-rose-600 font-bold">
                <span>Credit Balance Due:</span>
                <span>
                  ₹
                  {(
                    grandTotal - (paymentMode === "CASH" || paymentMode === "UPI" ? grandTotal : paidAmount)
                  ).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white font-bold py-4 rounded-2xl shadow-xs transition-all text-sm cursor-pointer mt-4"
          >
            ✓ Generate & Issue B2B GST Tax Invoice
          </button>
        </div>
      </form>

      {/* Generated Invoice View Modal */}
      {generatedInvoice && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 uppercase">
                  B2B TAX INVOICE • {generatedInvoice.status}
                </span>
                <h2 className="text-xl font-black text-[#0b2341] mt-2">{generatedInvoice.invoiceNo}</h2>
                <p className="text-xs text-slate-500">Date: {generatedInvoice.invoiceDate}</p>
              </div>
              <button
                onClick={() => setGeneratedInvoice(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Billed To / From */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px]">Issued By (Distributor)</span>
                <div className="font-bold text-[#0b2341] mt-0.5">PharmaLink Wholesale Distributor</div>
                <div className="text-[11px] text-slate-500">GSTIN: 36AAACA1234F1Z9</div>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px]">Billed To (Local Buyer / RMP)</span>
                <div className="font-bold text-[#0b2341] mt-0.5">{generatedInvoice.buyerName}</div>
                <div className="text-[11px] text-slate-500">Location: {generatedInvoice.villageTown}</div>
              </div>
            </div>

            {/* Invoice Line Items */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-600 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch & Exp</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {generatedInvoice.items.map((it, i) => (
                    <tr key={i}>
                      <td className="p-3">
                        <div className="font-bold text-[#0b2341]">{it.productName}</div>
                        <div className="text-[10px] text-slate-400">{it.composition}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px]">{it.batchNo} ({it.expiryDate})</td>
                      <td className="p-3 text-center font-bold">{it.quantity}</td>
                      <td className="p-3 text-right font-mono">₹{it.tradePrice}</td>
                      <td className="p-3 text-right font-bold font-mono">₹{it.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl">
              <div>
                <div className="text-xs text-slate-300">Payment Terms: <span className="font-bold text-amber-400">{generatedInvoice.paymentMode.replace("_", " ")}</span></div>
                <div className="text-xs text-slate-300">Outstanding Due: <span className="font-bold text-rose-400">₹{generatedInvoice.balanceAmount.toLocaleString("en-IN")}</span></div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grand Total</span>
                <span className="text-2xl font-black text-emerald-400">₹{generatedInvoice.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                🖨️ Print / Download PDF
              </button>
              <button
                onClick={() => {
                  const text = encodeURIComponent(
                    `*PharmaLink B2B Invoice*\nInvoice No: ${generatedInvoice.invoiceNo}\nBuyer: ${generatedInvoice.buyerName}\nTotal Amount: ₹${generatedInvoice.totalAmount}\nDue Balance: ₹${generatedInvoice.balanceAmount}\nPayment Terms: ${generatedInvoice.paymentMode}`
                  );
                  window.open(`https://wa.me/?text=${text}`, "_blank");
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                📲 Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateSecondaryInvoicePageWrapper() {
  return (
    <Suspense fallback={<div className="text-center py-16"><div className="animate-spin w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div><p className="text-xs font-bold text-slate-500">Loading...</p></div>}>
      <CreateSecondaryInvoicePageInner />
    </Suspense>
  );
}
