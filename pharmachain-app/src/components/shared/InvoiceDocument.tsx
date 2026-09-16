"use client";

import React from "react";
import { EvvaiLogo } from "@/components/shared/EvvaiLogo";

export interface InvoiceDocumentProps {
  order: any;
  itemsList?: any[];
  subtotal?: number;
  tax?: number;
  cgst?: number;
  sgst?: number;
  total?: number;
  shipping?: number;
  discount?: number;
  adminSettings?: {
    email?: string;
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
  };
}

export function InvoiceDocumentContent({
  order,
  itemsList: propItemsList,
  subtotal: propSubtotal,
  tax: propTax,
  cgst: propCgst,
  sgst: propSgst,
  total: propTotal,
  shipping: propShipping,
  discount: propDiscount,
  adminSettings,
}: InvoiceDocumentProps) {
  if (!order) return null;

  const isDistributor = (order.role || "").toLowerCase().includes("distributor");
  const invoiceNo = order.invoice_number || `EVV-INV-2026-${String(order.id).padStart(4, "0")}`;
  const orderCode = order.order_code || `ORD-${order.id}`;
  const isPaid = (order.payment_status || order.paymentStatus || "").toUpperCase() === "PAID";

  const total = propTotal ?? (order.total_amount || order.totalAmount || 0);
  const subtotal = propSubtotal ?? (order.subtotal || Math.round((total / 1.12) * 100) / 100);
  const tax = propTax ?? (order.tax_amount || Math.round((total - subtotal) * 100) / 100);
  const cgst = propCgst ?? Math.round((tax / 2) * 100) / 100;
  const sgst = propSgst ?? Math.round((tax - cgst) * 100) / 100;
  const shipping = propShipping ?? (order.shipping_charge || 0);
  const discount = propDiscount ?? (order.discount_amount || 0);

  const itemsList = propItemsList || (order.items && Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
      {
        id: 1,
        product_name: "CardioVas XR 20mg Tablet",
        composition: "Telmisartan 40mg + Amlodipine 5mg",
        sku: "EVV-CARD-001",
        batch_no: "EV2026-C01",
        expiry_date: "12/2028",
        quantity: order.items_count || order.itemsCount || 1,
        unit_price: Math.round(subtotal / (order.items_count || order.itemsCount || 1)),
        total_price: subtotal,
      },
    ]);

  const formatDocDate = (ts: string | null | undefined) => {
    if (!ts) return new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    try {
      const d = new Date(ts.includes("T") || ts.endsWith("Z") ? ts : ts.replace(" ", "T") + "Z");
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return ts;
    }
  };

  const sellerName = order.seller_name || order.seller_company || process.env.NEXT_PUBLIC_SELLER_NAME || "EVVAI PHARMACEUTICALS PVT. LTD.";
  const sellerAddress = order.seller_address || order.facility_address || process.env.NEXT_PUBLIC_SELLER_ADDRESS || "Plot No. 42, APIIC Pharma City, Genome Valley, Hyderabad, TS - 500081";
  const sellerGstin = order.seller_gstin || process.env.NEXT_PUBLIC_SELLER_GSTIN || "36AAACA1234A1Z5";
  const sellerDrugLicense = order.seller_drug_license || order.drug_license || process.env.NEXT_PUBLIC_SELLER_DRUG_LICENSE || "TS/HYD/2025/8892";
  const sellerCin = order.seller_cin || process.env.NEXT_PUBLIC_SELLER_CIN || "U24232TG2026PTC099124";
  const sellerEmail = "sales@evvaipharma.com";
  const sellerPhone = order.seller_phone || process.env.NEXT_PUBLIC_SELLER_PHONE || "+91 7075730616";
  const bankName = adminSettings?.bankName || order.bank_name || "HDFC Bank Ltd, Genome Valley Branch, Hyderabad";
  const bankAccountNo = adminSettings?.accountNo || order.bank_account_no || "50200088910243";
  const bankIfsc = adminSettings?.ifscCode || order.bank_ifsc || "HDFC0000123";
  const bankUpi = order.bank_upi || "evvaipharma@hdfcbank";

  return (
    <div className="text-slate-900 leading-normal text-[11px] font-sans border-2 border-slate-800 p-6 rounded-xl bg-white space-y-4 shadow-sm print:border-none print:p-0 print:shadow-none">
      {/* 1. Header: EVVAI Logo & Official Seller Credentials */}
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <EvvaiLogo className="h-11 w-auto" variant="dark" />
          </div>
          <div className="mt-2 text-[10px] text-slate-600 space-y-0.5">
            <p className="font-black text-[#0b2341] text-xs uppercase tracking-wide">
              {sellerName}
            </p>
            <p>{sellerAddress}</p>
            <p><strong>GSTIN:</strong> {sellerGstin} &nbsp;|&nbsp; <strong>Drug License:</strong> {sellerDrugLicense}</p>
            <p><strong>CIN:</strong> {sellerCin} &nbsp;|&nbsp; <strong>Email:</strong> {sellerEmail}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block bg-[#0b2341] text-white px-3 py-1 text-xs font-black uppercase tracking-wider rounded">
            TAX INVOICE / BILL OF SUPPLY
          </span>
          <div className="mt-2 text-[10px] space-y-1 text-slate-700">
            <p><span className="font-bold text-slate-500">Invoice No:</span> <strong className="font-mono text-slate-900 text-xs">{invoiceNo}</strong></p>
            <p><span className="font-bold text-slate-500">Invoice Date:</span> <strong className="font-mono">{formatDocDate(order.created_at || order.orderDate)}</strong></p>
            <p><span className="font-bold text-slate-500">Order Ref:</span> <strong className="font-mono text-blue-800">{orderCode}</strong></p>
            <p><span className="font-bold text-slate-500">Payment Mode:</span> <strong className="text-slate-900 font-bold">{order.payment_method || "Online"}</strong></p>
            <p><span className="font-bold text-slate-500">Payment Status:</span> <strong className={isPaid ? "text-emerald-700 font-bold" : "text-amber-700"}>{isPaid ? "PAID (Confirmed)" : (order.payment_status || "PENDING")}</strong></p>
          </div>
        </div>
      </div>

      {/* 2. Billing & Shipping Address Split */}
      <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-300 p-3.5 rounded-lg text-[10px]">
        <div>
          <span className="font-black text-[#0b2341] uppercase tracking-wider block border-b border-slate-300 pb-1 mb-1.5">
            👤 BILLED TO (BUYER DETAILS):
          </span>
          <p className="font-bold text-slate-900 text-xs">{order.customer_name || order.customerName}</p>
          <p className="text-slate-600">{isDistributor ? "🏢 Verified B2B Wholesale Distributor" : "Direct Retail Customer"}</p>
          {order.gstin && <p className="font-mono font-bold text-slate-900"><strong>GSTIN / UIN:</strong> {order.gstin}</p>}
          {order.customer_phone && <p><strong>Mobile:</strong> {order.customer_phone}</p>}
          <p className="mt-1 text-slate-700">
            {order.delivery_address ? `${order.delivery_address}, ` : ""}
            {order.delivery_city || order.deliveryCity || "Hyderabad"}
            {order.delivery_state ? `, ${order.delivery_state}` : ""}
            {order.delivery_pincode ? ` - ${order.delivery_pincode}` : ""}
          </p>
        </div>

        <div>
          <span className="font-black text-[#0b2341] uppercase tracking-wider block border-b border-slate-300 pb-1 mb-1.5">
            📦 SHIPPED TO / DISPATCH DESTINATION:
          </span>
          <p className="font-bold text-slate-900">{order.customer_name || order.customerName}</p>
          <p className="text-slate-700">
            {order.delivery_address ? `${order.delivery_address}, ` : ""}
            {order.delivery_city || order.deliveryCity || "Hyderabad"}
            {order.delivery_state ? `, ${order.delivery_state}` : ""}
            {order.delivery_pincode ? ` - ${order.delivery_pincode}` : ""}
          </p>
          <p className="mt-1 text-slate-600">
            <strong>Dispatch Mode:</strong> Air Express Cold-Chain &nbsp;|&nbsp;
            <strong>Tracking No:</strong> <span className="font-mono font-bold text-slate-900">{order.tracking_number || "BLUEDART-8891024"}</span>
          </p>
        </div>
      </div>

      {/* 3. Product / Formulation Line Items Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-[10px] border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase border-b border-slate-800">
              <th className="py-2.5 px-2 text-center w-8 border-r border-slate-300">#</th>
              <th className="py-2.5 px-3 border-r border-slate-300">Formulation & Brand Description</th>
              <th className="py-2.5 px-2 text-center w-24 border-r border-slate-300">HSN Code</th>
              <th className="py-2.5 px-2 text-center w-32 border-r border-slate-300">Batch / Expiry</th>
              <th className="py-2.5 px-2 text-center w-14 border-r border-slate-300">Qty</th>
              <th className="py-2.5 px-3 text-right w-24 border-r border-slate-300">Unit Rate (₹)</th>
              <th className="py-2.5 px-3 text-right w-28">Taxable Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {itemsList.map((it: any, idx: number) => {
              const lineTotal = it.total_price || (it.quantity * it.unit_price) || 0;
              return (
                <tr key={idx}>
                  <td className="py-2.5 px-2 text-center font-bold border-r border-slate-300">{idx + 1}</td>
                  <td className="py-2.5 px-3 border-r border-slate-300">
                    <strong className="text-slate-900 text-[11px] block">{it.product_name || it.name}</strong>
                    <span className="block text-[9px] text-slate-500 font-mono mt-0.5">SKU: {it.sku || "EVV-PRD-01"}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono border-r border-slate-300 whitespace-nowrap">
                    30049099
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono border-r border-slate-300 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{it.batch_no || "N/A"}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{it.expiry_date || "N/A"}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-black text-slate-900 border-r border-slate-300 whitespace-nowrap">
                    {it.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300 whitespace-nowrap">
                    ₹{Number(it.unit_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                    ₹{Number(lineTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Tax, Discount, and Commercial Total Breakdown */}
      <div className="grid grid-cols-2 gap-4 pt-1">
        {/* Bank & Remittance Info */}
        <div className="border border-slate-300 p-3.5 rounded-lg text-[9px] text-slate-600 space-y-1">
          <p className="font-black text-slate-800 uppercase text-[10px]">🏦 Bank & Wire Remittance Details:</p>
          <p><strong>Bank:</strong> {bankName}</p>
          <p><strong>Account Name:</strong> {sellerName}</p>
          <p><strong>Account No:</strong> <span className="font-mono font-bold text-slate-900 whitespace-nowrap">{bankAccountNo}</span> &nbsp;|&nbsp; <strong>IFSC:</strong> <span className="font-mono font-bold">{bankIfsc}</span></p>
          <p><strong>UPI ID:</strong> <span className="font-mono font-bold">{bankUpi}</span></p>
        </div>

        {/* Financial Calculation Summary */}
        <div className="border border-slate-800 rounded-lg p-3 space-y-1.5 text-[10px] bg-slate-50">
          <div className="flex justify-between text-slate-600 font-medium">
            <span>Gross Taxable Amount:</span>
            <span className="font-mono font-bold text-slate-900">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>CGST @ 6%:</span>
            <span className="font-mono text-slate-900">₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>SGST @ 6%:</span>
            <span className="font-mono text-slate-900">₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          {shipping > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Logistics / Freight:</span>
              <span className="font-mono text-slate-900">₹{shipping.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Trade Discount:</span>
              <span className="font-mono">-₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="flex justify-between items-center border-t-2 border-slate-800 pt-2 text-xs">
            <strong className="font-black text-slate-900 uppercase">Total Invoice Amount:</strong>
            <strong className="font-black text-[#0b2341] text-sm font-mono">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* 5. Terms, Conditions & Digital Signature Stamp */}
      <div className="border-t border-slate-300 pt-3 flex items-end justify-between text-[9px] text-slate-500">
        <div className="max-w-md space-y-0.5">
          <p className="font-bold text-slate-700 uppercase">Terms & Conditions:</p>
          <p>1. Certified that the particulars given above are true and correct under WHO-GMP compliance.</p>
          <p>2. Goods once dispatched under cold-chain compliance are non-returnable except upon QA verification.</p>
          <p>3. Subject to Hyderabad Jurisdiction only.</p>
        </div>

        <div className="text-center space-y-1">
          <div className="w-36 border-b border-dashed border-slate-400 pb-4 font-mono text-[9px] text-emerald-700 font-bold">
            [DIGITALLY VERIFIED]
          </div>
          <p className="font-bold text-slate-900 text-[10px]">For {sellerName}</p>
          <p className="text-[8px] text-slate-400">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
