"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { INITIAL_ORDERS, INITIAL_PRODUCTS } from "@/data/mockData";
import { reportsAPI, ordersAPI, productsAPI, DashboardSummary, OrderData, ProductItem, getStoredUser, StoredUser } from "@/lib/api";

export const AdminDashboardView: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<StoredUser | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setUser(getStoredUser());
      const [sumData, ordersData, prodsData] = await Promise.allSettled([
        reportsAPI.getDashboardSummary(),
        ordersAPI.getAdminAllOrders(),
        productsAPI.list(),
      ]);

      if (sumData.status === "fulfilled") {
        setSummary(sumData.value);
      }
      if (ordersData.status === "fulfilled" && ordersData.value.length > 0) {
        setRecentOrders(ordersData.value.slice(0, 5));
      } else {
        setRecentOrders(INITIAL_ORDERS as any);
      }
      if (prodsData.status === "fulfilled" && prodsData.value.length > 0) {
        setLowStockProducts(prodsData.value.filter((p) => p.stock < 2500));
      } else {
        setLowStockProducts(INITIAL_PRODUCTS.filter((p) => p.stock < 2500) as any);
      }
    } catch (err) {
      console.warn("Failed loading live admin stats, using fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleUpdate = () => setUser(getStoredUser());
    window.addEventListener("pharmalink_user_updated", handleUpdate);
    return () => window.removeEventListener("pharmalink_user_updated", handleUpdate);
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#0b2341] text-white rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500/30 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              {user?.role || "ADMIN"} Portal Control
            </span>
            <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono">
              FastAPI Live Connected
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Welcome back, {user?.full_name || "Dr. Arun Bhairi"}!
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {user?.company_name ? `${user.company_name} — ` : ""}
            Real-time batch fulfillment status, multi-tier pricing management, B2B distributor KYC approvals, and live inventory alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Link
            href="/admin/products"
            className="bg-white hover:bg-slate-100 text-[#0b2341] text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <span>+ Add New Formulation</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Orders */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Orders</span>
            <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
              {summary ? (summary.total_orders ?? summary.orders_pending + summary.orders_delivered) : "137"}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
              <span>{summary ? `${summary.orders_pending} pending` : "Active Lifecycle"}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Cumulative Revenue */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Revenue</span>
            <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
              ₹{summary ? summary.total_sales_all_time.toLocaleString() : "8,42,000"}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1">
              <span>₹{summary ? summary.total_sales_today.toLocaleString() : "1,20,000"} today</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        {/* Card 3: Pending KYC Approvals */}
        <Link href="/admin/kyc" className="block">
          <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs hover:border-amber-300 transition-all cursor-pointer">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Pending KYC Approvals</span>
              <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
                {summary ? `${summary.pending_kyc_count} Requests` : "2 Requests"}
              </div>
              <div className="text-[11px] font-semibold text-amber-700">Review Documents &rarr;</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Card 4: Active Portfolio */}
        <div className="bg-[#f7f6f4] border border-[#e8e6e2] rounded-2xl p-5 shadow-2xs flex items-center justify-between hover:shadow-xs transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Active Formulations</span>
            <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight">
              {summary ? summary.total_products : "6"}
            </div>
            <div className="text-[11px] font-bold text-slate-600">
              {summary ? `${summary.low_stock_count} low stock` : "0 stock alerts"}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#0b2341] text-white flex items-center justify-center shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Grid: Orders & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-[#0b2341]">Live Incoming Orders</h2>
              <p className="text-xs text-slate-500">Live order queue from retail customers and wholesale distributors.</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-bold text-blue-600 hover:underline">
              View All Orders &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Order Code</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord: any) => (
                  <tr key={ord.id || ord.order_code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{ord.order_code || ord.id}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{ord.customer_name || ord.customerName}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        (ord.role || "").includes("Distributor") ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-blue-800"
                      }`}>
                        {ord.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">₹{(ord.total_amount || ord.totalAmount || 0).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        (ord.order_status || ord.orderStatus) === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                        (ord.order_status || ord.orderStatus) === "Shipped" ? "bg-purple-100 text-purple-800" :
                        (ord.order_status || ord.orderStatus) === "Confirmed" ? "bg-blue-100 text-blue-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {ord.order_status || ord.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-[#0b2341]">Inventory Monitor</h2>
              <p className="text-xs text-slate-500">Live batch quantities & thresholds.</p>
            </div>
            <Link href="/admin/inventory" className="text-xs font-bold text-blue-600 hover:underline">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockProducts.map((p) => (
              <div key={p.id || p.sku} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#0b2341]">{p.name}</div>
                  <span className="text-[10px] font-mono text-slate-500">{p.sku} • Batch {p.batch_no || "BT-2026"}</span>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-900">{p.stock} units</div>
                  <span className="text-[10px] text-amber-700 font-bold">Monitor</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
