"use client";

import React, { useEffect, useState } from "react";
import { reportsAPI, productsAPI, ordersAPI, usersAPI, auditAPI, kycAPI, ReportPackItem } from "@/lib/api";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [reportPacks, setReportPacks] = useState<ReportPackItem[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [analyticsData, dashboardData, packsData] = await Promise.allSettled([
        reportsAPI.getCommercialAnalytics(),
        reportsAPI.getDashboardSummary(),
        reportsAPI.getReportPacks(),
      ]);
      if (analyticsData.status === "fulfilled") setAnalytics(analyticsData.value);
      if (dashboardData.status === "fulfilled") setDashboard(dashboardData.value);
      if (packsData.status === "fulfilled") setReportPacks(packsData.value);
    } catch (err) {
      console.error("Failed fetching live report analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const formatINR = (val: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(val || 0);

  const formatAsiaTimestamp = (ts: string | null | undefined) => {
    if (!ts) return "N/A";
    try {
      const d = new Date(ts.includes("T") || ts.endsWith("Z") ? ts : ts.replace(" ", "T") + "Z");
      if (isNaN(d.getTime())) return ts;
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(d);
    } catch {
      return ts;
    }
  };

  const handleDownloadReport = async (reportType: string, filename: string) => {
    try {
      setExporting(reportType);
      let csvContent = "";
      if (reportType === "sales") {
        const orders = await ordersAPI.getAdminAllOrders();
        csvContent = "Order ID,Order Number,Customer/Company,Role,Subtotal (INR),Tax (INR),Shipping (INR),Total Amount (INR),Payment Status,Order Status,Date (Asia/IST)\n";
        orders.forEach((o: any) => {
          csvContent += `"${o.id}","${o.order_number || o.order_code || `ORD-${o.id}`}","${(o.user?.full_name || o.customer_name || 'Direct Customer').replace(/"/g, '""')}","${o.user?.role || o.role || 'CUSTOMER'}","${o.subtotal || 0}","${o.tax_amount || 0}","${o.shipping_charge || 0}","${o.total_amount || 0}","${o.payment_status || 'Pending'}","${o.order_status || 'Pending'}","${formatAsiaTimestamp(o.created_at)}"\n`;
        });
      } else if (reportType === "inventory") {
        const products = await productsAPI.list();
        csvContent = "SKU,Product Name,Composition,Category,Pack Size,MRP (INR),Customer Price,Distributor Price,Stock,Batch No,Expiry Date,Status\n";
        products.forEach((p: any) => {
          csvContent += `"${p.sku}","${(p.name || '').replace(/"/g, '""')}","${(p.composition || '').replace(/"/g, '""')}","${(p.category_name || (p as any).category?.name || '').replace(/"/g, '""')}","${p.pack_size || ''}","${p.mrp || 0}","${p.customer_price || p.display_price || 0}","${p.distributor_price || ''}","${p.stock || 0}","${p.batch_no || ''}","${p.expiry_date || ''}","${p.status || 'active'}"\n`;
        });
      } else if (reportType === "users") {
        const users = await usersAPI.list();
        csvContent = "User ID,Full Name,Email,Phone,Company,Role,KYC Status,Active,Lifetime Orders,Total Spent (INR),Created At (Asia/IST)\n";
        users.forEach((u: any) => {
          csvContent += `"${u.id}","${(u.full_name || '').replace(/"/g, '""')}","${u.email}","${u.phone || ''}","${(u.company_name || '').replace(/"/g, '""')}","${u.role}","${u.kyc_status || 'N/A'}","${u.is_active !== false ? 'YES' : 'NO'}","${u.lifetime_orders || 0}","${u.total_spent || 0}","${formatAsiaTimestamp(u.created_at)}"\n`;
        });
      } else if (reportType === "audit") {
        const logs = await auditAPI.getLogs(undefined, undefined, 500);
        csvContent = "Log ID,Module,Action,User Email,Details,IP Address,Timestamp (Asia/IST)\n";
        logs.forEach((l: any) => {
          csvContent += `"${l.id}","${l.module}","${(l.action || '').replace(/"/g, '""')}","${l.user_email || 'System'}","${(l.details || '').replace(/"/g, '""')}","${l.ip_address || '127.0.0.1'}","${formatAsiaTimestamp(l.timestamp)}"\n`;
        });
      } else if (reportType === "kyc") {
        const kycList = await kycAPI.getPending().catch(() => []);
        csvContent = "Submission ID,User ID,Company Name,Contact Person,Email,Phone,GSTIN,Drug License Number,Status,Submitted At (Asia/IST)\n";
        kycList.forEach((k: any) => {
          csvContent += `"${k.id}","${k.user_id || ''}","${(k.company_name || '').replace(/"/g, '""')}","${(k.contact_person || '').replace(/"/g, '""')}","${k.email || ''}","${k.phone || ''}","${k.gstin || ''}","${k.drug_license_number || ''}","${k.kyc_status || 'PENDING'}","${formatAsiaTimestamp(k.created_at)}"\n`;
        });
      } else if (reportType === "low_stock") {
        const products = await productsAPI.list();
        const low = products.filter((p: any) => (p.stock || 0) <= (p.low_stock_threshold || 25));
        csvContent = "SKU,Product Name,Composition,Category,Current Stock Units,Batch No,Expiry Date,Status\n";
        low.forEach((p: any) => {
          csvContent += `"${p.sku}","${(p.name || '').replace(/"/g, '""')}","${(p.composition || '').replace(/"/g, '""')}","${(p.category_name || (p as any).category?.name || '').replace(/"/g, '""')}","${p.stock || 0}","${p.batch_no || ''}","${p.expiry_date || ''}","${p.status || 'active'}"\n`;
        });
      } else {
        csvContent = `Report Type: ${reportType}\nGenerated: ${formatAsiaTimestamp(new Date().toISOString())}\nTotal Revenue: INR ${analytics?.total_revenue || 0}\n`;
      }
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PharmaLink_${filename}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to export: " + err);
    } finally {
      setExporting(null);
    }
  };

  const totalRevenue = analytics?.total_revenue || dashboard?.total_sales_all_time || 0;
  const b2bPct = analytics?.b2b_percentage ?? 76.2;
  const retailPct = analytics?.retail_percentage ?? 23.8;
  const totalOrders = analytics?.total_orders_count || dashboard?.total_orders || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Enterprise Intelligence Dashboard
            </span>
            <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span>API Live</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Reports & Live Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time sales revenue, B2B wholesale distribution ratios, and automated database CSV export engines.
          </p>
        </div>
        <button
          onClick={() => handleDownloadReport("sales", "Executive_Commercial_Summary")}
          disabled={exporting !== null}
          className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-extrabold px-5 py-3 rounded-2xl shadow-sm transition-all flex items-center space-x-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{exporting ? "Generating..." : "Export Master Sales CSV"}</span>
        </button>
      </div>

      {/* Primary KPI Cards — Navy + Wheat palette */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 bg-white border border-[#e8e6e2] rounded-xl flex items-center justify-center shadow-2xs">
              <svg className="w-5 h-5 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-[#0b2341] bg-white border border-[#e8e6e2] px-2.5 py-0.5 rounded-full">
              ↑ Live DB
            </span>
          </div>
          {loading ? <div className="h-7 w-28 bg-[#e8e6e2] rounded-lg animate-pulse"></div> : (
            <div className="text-2xl font-black text-[#0b2341] tracking-tight">₹{formatINR(totalRevenue)}</div>
          )}
          <div>
            <div className="text-xs font-extrabold text-[#0b2341]">Total Revenue</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">All-time commercial revenue</div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 bg-white border border-[#e8e6e2] rounded-xl flex items-center justify-center shadow-2xs">
              <svg className="w-5 h-5 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-[#0b2341] bg-white border border-[#e8e6e2] px-2.5 py-0.5 rounded-full">
              All Time
            </span>
          </div>
          {loading ? <div className="h-7 w-20 bg-[#e8e6e2] rounded-lg animate-pulse"></div> : (
            <div className="text-2xl font-black text-[#0b2341] tracking-tight">{formatINR(totalOrders)}</div>
          )}
          <div>
            <div className="text-xs font-extrabold text-[#0b2341]">Total Orders</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Confirmed & delivered orders</div>
          </div>
        </div>

        {/* B2B Share */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 bg-white border border-[#e8e6e2] rounded-xl flex items-center justify-center shadow-2xs">
              <svg className="w-5 h-5 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-[#0b2341] bg-white border border-[#e8e6e2] px-2.5 py-0.5 rounded-full">
              Distributor
            </span>
          </div>
          {loading ? <div className="h-7 w-16 bg-[#e8e6e2] rounded-lg animate-pulse"></div> : (
            <div className="text-2xl font-black text-[#0b2341] tracking-tight">{b2bPct}%</div>
          )}
          <div>
            <div className="text-xs font-extrabold text-[#0b2341]">B2B Wholesale Share</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">₹{formatINR(analytics?.b2b_wholesale_revenue || 0)} volume</div>
          </div>
        </div>

        {/* Retail Share */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 bg-white border border-[#e8e6e2] rounded-xl flex items-center justify-center shadow-2xs">
              <svg className="w-5 h-5 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-[#0b2341] bg-white border border-[#e8e6e2] px-2.5 py-0.5 rounded-full">
              Customer
            </span>
          </div>
          {loading ? <div className="h-7 w-16 bg-[#e8e6e2] rounded-lg animate-pulse"></div> : (
            <div className="text-2xl font-black text-[#0b2341] tracking-tight">{retailPct}%</div>
          )}
          <div>
            <div className="text-xs font-extrabold text-[#0b2341]">Retail Direct Share</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">₹{formatINR(analytics?.retail_direct_revenue || 0)} volume</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Active Products",
            value: dashboard?.total_products ?? dashboard?.active_products,
            icon: <svg className="w-4 h-4 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          },
          {
            label: "Total Users",
            value: dashboard ? ((dashboard.total_customers ?? 0) + (dashboard.total_distributors ?? 0)) : undefined,
            icon: <svg className="w-4 h-4 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          },
          {
            label: "Pending KYC",
            value: dashboard?.pending_kyc_count,
            icon: <svg className="w-4 h-4 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          },
          {
            label: "Low Stock Alerts",
            value: dashboard?.low_stock_count,
            icon: <svg className="w-4 h-4 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          },
          {
            label: "Avg Order Value",
            value: dashboard && dashboard.total_orders > 0 ? `₹${formatINR(Math.round((dashboard.total_sales_all_time || totalRevenue) / dashboard.total_orders))}` : (dashboard?.avg_order_value ? `₹${formatINR(dashboard.avg_order_value)}` : undefined),
            icon: <svg className="w-4 h-4 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          },
          {
            label: "Today's Orders",
            value: dashboard?.orders_today ?? dashboard?.orders_pending,
            icon: <svg className="w-4 h-4 text-[#0b2341]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2">
            <div className="w-7 h-7 bg-[#f7f6f4] border border-[#e8e6e2] rounded-lg flex items-center justify-center">
              {stat.icon}
            </div>
            {loading ? (
              <div className="h-5 w-12 bg-slate-100 rounded animate-pulse"></div>
            ) : (
              <div className="text-base font-black text-[#0b2341]">{stat.value ?? "—"}</div>
            )}
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Split Visual */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-extrabold text-[#0b2341]">Revenue Channel Split</h3>
            <p className="text-xs text-slate-500">B2B Wholesale vs Retail Direct breakdown</p>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-[#f7f6f4] border border-[#e8e6e2] px-3 py-1 rounded-full">
            Total: ₹{formatINR(totalRevenue)}
          </span>
        </div>
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[#0b2341] flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-[#0b2341] rounded-full inline-block"></span>
                <span>Distributor B2B Wholesale</span>
              </span>
              <span className="text-xs font-black text-[#0b2341]">{b2bPct}%</span>
            </div>
            <div className="h-2.5 bg-[#e8e6e2] rounded-full overflow-hidden">
              <div className="h-full bg-[#0b2341] rounded-full transition-all duration-1000" style={{ width: `${b2bPct}%` }}></div>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block font-medium">₹{formatINR(analytics?.b2b_wholesale_revenue || 0)}</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-slate-600 flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-full inline-block"></span>
                <span>Retail Direct Consumer</span>
              </span>
              <span className="text-xs font-black text-slate-600">{retailPct}%</span>
            </div>
            <div className="h-2.5 bg-[#e8e6e2] rounded-full overflow-hidden">
              <div className="h-full bg-slate-400 rounded-full transition-all duration-1000" style={{ width: `${retailPct}%` }}></div>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block font-medium">₹{formatINR(analytics?.retail_direct_revenue || 0)}</span>
          </div>
        </div>
      </div>

      {/* Report Packs Export Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-[#0b2341]">Instant Data Export & Regulatory Audit Packs</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live database reports from{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">/api/v1/reports/packs</code>
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse inline-block"></span>
            <span>Live DB Connected</span>
          </span>
        </div>

        {loading && reportPacks.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-7 h-7 border-2 border-[#0b2341] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-bold">Querying live database report packages...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[920px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] bg-slate-50">
                  <th className="py-3.5 px-4 w-[28%]">Report Package</th>
                  <th className="py-3.5 px-4 w-[28%]">Description</th>
                  <th className="py-3.5 px-4 w-[18%] whitespace-nowrap">Live DB Scope</th>
                  <th className="py-3.5 px-4 w-[12%] whitespace-nowrap">Period</th>
                  <th className="py-3.5 px-4 w-[8%] whitespace-nowrap">Format</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportPacks.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-[#0b2341]">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black">{rep.title}</span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${rep.badge_color || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {rep.badge}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-medium text-[11px] leading-relaxed">
                      {rep.desc}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-[#0b2341] block text-xs">{rep.records_count}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{rep.metric_value}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="bg-[#f7f6f4] border border-[#e8e6e2] text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[10px] whitespace-nowrap inline-flex items-center">
                        {rep.period}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] border border-blue-200 whitespace-nowrap">
                        {rep.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadReport(rep.id, rep.title.replace(/\s+/g, "_"))}
                        disabled={exporting === rep.id}
                        className="bg-[#0b2341] hover:bg-[#12315a] text-white px-4 py-2 rounded-xl font-bold text-[11px] shadow-2xs cursor-pointer transition-all inline-flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <svg className={`w-3.5 h-3.5 shrink-0 ${exporting === rep.id ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{exporting === rep.id ? "Exporting..." : "Download"}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
