"use client";

import React, { useState, useEffect, useMemo } from "react";
import { auditAPI, AuditLogItem } from "@/lib/api";

export default function AdminAuditPage() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "7days" | "30days" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch real audit logs from backend database
  const fetchAuditLogs = async () => {
    try {
      setError(null);
      const data = await auditAPI.getLogs(undefined, undefined, 200);
      setLogs(data);
    } catch (err: any) {
      console.error("Failed to load audit logs:", err);
      setError(err.message || "Failed to load audit logs from server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAuditLogs();
    const handleGlobalSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setSearchTerm(q);
      setCurrentPage(1);
    };
    window.addEventListener("pharmalink_admin_search", handleGlobalSearch);
    return () => window.removeEventListener("pharmalink_admin_search", handleGlobalSearch);
  }, []);

  // Reset page number on search, filter, date, or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, moduleFilter, dateFilter, startDate, endDate, pageSize]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditLogs();
  };

  // Helper to get exact YYYY-MM-DD date key in Asia/Kolkata (IST) timezone
  const getLogDateKey = (timestampStr: string): string => {
    if (!timestampStr) return "";
    try {
      let d: Date;
      if (timestampStr.includes("T") || timestampStr.endsWith("Z")) {
        d = new Date(timestampStr);
      } else {
        d = new Date(timestampStr.replace(" ", "T") + "Z");
        if (isNaN(d.getTime())) d = new Date(timestampStr);
      }
      if (isNaN(d.getTime())) return timestampStr.slice(0, 10);

      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d); // Returns "YYYY-MM-DD"
    } catch {
      return timestampStr.slice(0, 10);
    }
  };

  // Helper to parse log timestamp into local Date object
  const parseLogDate = (timestampStr: string): Date | null => {
    if (!timestampStr) return null;
    try {
      let d: Date;
      if (timestampStr.includes("T") || timestampStr.endsWith("Z")) {
        d = new Date(timestampStr);
      } else {
        d = new Date(timestampStr.replace(" ", "T") + "Z");
      }
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  // Filtered list with Module + Search + Date Range
  const filteredLogs = useMemo(() => {
    const now = new Date();

    // Get Today and Yesterday keys in IST
    const todayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(yesterdayDate);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return logs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (log.user_email?.toLowerCase() || "").includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        (log.details?.toLowerCase() || "").includes(q) ||
        (log.ip_address?.toLowerCase() || "").includes(q) ||
        `log-${log.id}`.includes(q);

      if (!matchesSearch) return false;

      // Module Filter
      if (moduleFilter === "SECURITY") {
        if (!["AUTH", "USERS", "PAYMENTS"].includes(log.module.toUpperCase())) return false;
      } else if (moduleFilter !== "all") {
        if (log.module.toUpperCase() !== moduleFilter.toUpperCase()) return false;
      }

      // Date Filter
      if (dateFilter === "all" && !startDate && !endDate) return true;

      const logDateKey = getLogDateKey(log.timestamp);
      const logDateObj = parseLogDate(log.timestamp) || (logDateKey ? new Date(logDateKey) : null);

      if (dateFilter === "today") {
        return logDateKey === todayKey || log.timestamp.startsWith(todayKey);
      }
      if (dateFilter === "yesterday") {
        return logDateKey === yesterdayKey || log.timestamp.startsWith(yesterdayKey);
      }
      if (dateFilter === "7days") {
        return logDateObj ? logDateObj.getTime() >= sevenDaysAgo.getTime() : true;
      }
      if (dateFilter === "30days") {
        return logDateObj ? logDateObj.getTime() >= thirtyDaysAgo.getTime() : true;
      }
      if (dateFilter === "custom" || startDate || endDate) {
        const cleanStart = startDate && startDate.length >= 10 ? startDate.slice(0, 10) : "";
        const cleanEnd = endDate && endDate.length >= 10 ? endDate.slice(0, 10) : "";

        if (cleanStart && logDateKey < cleanStart) return false;
        if (cleanEnd && logDateKey > cleanEnd) return false;
        return true;
      }

      return true;
    });
  }, [logs, searchTerm, moduleFilter, dateFilter, startDate, endDate]);

  // Paginated list & page count
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Statistics
  const totalCount = logs.length;
  const orderLogsCount = logs.filter((l) => l.module.toUpperCase() === "ORDERS").length;
  const productLogsCount = logs.filter((l) => ["PRODUCTS", "INVENTORY"].includes(l.module.toUpperCase())).length;
  const kycLogsCount = logs.filter((l) => l.module.toUpperCase() === "KYC").length;
  const securityLogsCount = logs.filter((l) => ["AUTH", "USERS", "PAYMENTS"].includes(l.module.toUpperCase())).length;

  // Format timestamp in Asia/Kolkata (IST) timezone
  const formatAsiaTimestamp = (timestampStr: string) => {
    if (!timestampStr) return "N/A";
    try {
      let date: Date;
      if (timestampStr.includes("T") || timestampStr.endsWith("Z")) {
        date = new Date(timestampStr);
      } else {
        // Backend UTC string "YYYY-MM-DD HH:MM:SS" -> treat as UTC
        date = new Date(timestampStr.replace(" ", "T") + "Z");
        if (isNaN(date.getTime())) {
          date = new Date(timestampStr);
        }
      }

      if (isNaN(date.getTime())) return timestampStr;

      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return timestampStr;
    }
  };

  // Real CSV Export
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No audit logs available to export.");
      return;
    }

    const headers = ["Log ID", "Timestamp (Asia/IST)", "User Email", "Module", "Action", "Details", "IP Address"];
    const rows = filteredLogs.map((l) => [
      `LOG-${l.id}`,
      `"${formatAsiaTimestamp(l.timestamp)} (IST)"`,
      `"${l.user_email || "System / Anonymous"}"`,
      `"${l.module}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      `"${l.ip_address || "Internal / Localhost"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PharmaLink_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getModuleBadgeColor = (mod: string) => {
    switch (mod.toUpperCase()) {
      case "LEADS":
      case "INQUIRIES":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "ORDERS":
        return "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]";
      case "KYC":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "PRODUCTS":
      case "INVENTORY":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "PRICING":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "AUTH":
      case "USERS":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "PAYMENTS":
        return "bg-blue-50 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white p-6 rounded-[6px] border border-slate-200 h-28"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-4 rounded-[5px] border border-slate-200 h-20"></div>
          ))}
        </div>
        <div className="bg-white border border-slate-200 rounded-[6px] p-12 text-center text-slate-400 font-bold text-xs">
          Loading Audit Console...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
              Live Database Audit Trail
            </span>
            {/* <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>PostgreSQL Real-Time</span>
            </span> */}
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            System Operations &amp; Security Audit Logs
          </h1>

        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-3 rounded-[5px] transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? "Refreshing..." : "Refresh Logs"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white text-xs font-extrabold px-5 py-3 rounded-[5px] shadow-sm shadow-[#A71380]/20 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Recorded</span>
          <div className="text-xl font-black text-[#0b2341]">{totalCount}</div>
          <span className="text-[10px] text-slate-500">Live DB entries</span>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-[#A71380] uppercase tracking-wider block">Orders Placed</span>
          <div className="text-xl font-black text-[#A71380]">{orderLogsCount}</div>
          <span className="text-[10px] text-slate-500">B2B &amp; Retail POs</span>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Product &amp; Stock</span>
          <div className="text-xl font-black text-emerald-600">{productLogsCount}</div>
          <span className="text-[10px] text-slate-500">Inventory events</span>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">KYC Reviews</span>
          <div className="text-xl font-black text-amber-600">{kycLogsCount}</div>
          <span className="text-[10px] text-slate-500">Drug license audits</span>
        </div>

        <div className="bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1 col-span-2 md:col-span-1">
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">Auth &amp; Security</span>
          <div className="text-xl font-black text-indigo-600">{securityLogsCount}</div>
          <span className="text-[10px] text-slate-500">Logins &amp; roles</span>
        </div>
      </div>

      {/* Filter Row 1: Module Categories & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: `All Logs (${logs.length})` },
            { id: "LEADS", label: `B2B Leads (${logs.filter((l) => ["LEADS", "INQUIRIES"].includes(l.module.toUpperCase())).length})` },
            { id: "ORDERS", label: `Orders (${orderLogsCount})` },
            { id: "PRODUCTS", label: `Products` },
            { id: "INVENTORY", label: `Inventory` },
            { id: "KYC", label: `KYC (${kycLogsCount})` },
            { id: "PRICING", label: `Pricing` },
            { id: "SECURITY", label: `Auth & Security (${securityLogsCount})` },
          ].map((tab) => {
            const isActive = moduleFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setModuleFilter(tab.id)}
                className={`px-3.5 py-2 rounded-[5px] font-bold whitespace-nowrap transition-all cursor-pointer ${isActive ? "bg-[#A71380] text-white shadow-xs shadow-[#A71380]/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>


        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, email, module, details..."
            className="border border-slate-200 rounded-[5px] pl-9 pr-4 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium text-xs w-full md:w-72"
          />
        </div>
      </div>

      {/* Filter Row 2: Date-based Filter Bar (Today, Yesterday, 7 Days, 30 Days, Custom Range) */}
      <div className="bg-[#f7f6f4] border border-[#e8e6e2] p-3.5 rounded-[5px] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <span className="font-extrabold text-[#0b2341] flex items-center space-x-1.5 shrink-0 pr-1">
            <svg className="w-3.5 h-3.5 text-[#0b2341]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Date Filter:</span>
          </span>

          {[
            { id: "all", label: "All Time" },
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "7days", label: "Last 7 Days" },
            { id: "30days", label: "Last 30 Days" },
            { id: "custom", label: "Custom Range" },
          ].map((d) => {
            const isActive = dateFilter === d.id;
            return (
              <button
                key={d.id}
                onClick={() => {
                  setDateFilter(d.id as any);
                  if (d.id !== "custom") {
                    setStartDate("");
                    setEndDate("");
                  }
                }}
                className={`px-3 py-1.5 rounded-[5px] font-extrabold whitespace-nowrap transition-all cursor-pointer text-[11px] ${isActive
                  ? "bg-[#A71380] text-white shadow-xs shadow-[#A71380]/20"
                  : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200/80"
                  }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Date Pickers for Custom Range or Quick Tuning */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-[5px] border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
            <input
              type="date"
              min="2020-01-01"
              max="2035-12-31"
              value={startDate}
              onChange={(e) => {
                const val = e.target.value;
                // Guard against browser year typos like 20024
                if (val) {
                  const parts = val.split("-");
                  if (parts[0] && parts[0].length > 4) {
                    parts[0] = parts[0].slice(0, 4);
                    setStartDate(parts.join("-"));
                  } else {
                    setStartDate(val);
                  }
                } else {
                  setStartDate("");
                }
                setDateFilter("custom");
              }}
              className="font-mono text-xs font-bold text-[#0b2341] bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-[5px] border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase">To:</span>
            <input
              type="date"
              min="2020-01-01"
              max="2035-12-31"
              value={endDate}
              onChange={(e) => {
                const val = e.target.value;
                // Guard against browser year typos like 20024
                if (val) {
                  const parts = val.split("-");
                  if (parts[0] && parts[0].length > 4) {
                    parts[0] = parts[0].slice(0, 4);
                    setEndDate(parts.join("-"));
                  } else {
                    setEndDate(val);
                  }
                } else {
                  setEndDate("");
                }
                setDateFilter("custom");
              }}
              className="font-mono text-xs font-bold text-[#0b2341] bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          {(dateFilter !== "all" || startDate || endDate) && (
            <button
              onClick={() => {
                setDateFilter("all");
                setStartDate("");
                setEndDate("");
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-[5px] font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1"
              title="Reset Date Filter"
            >
              <span>✕ Clear Date</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#A71380] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-bold">Querying live database audit records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-2xl text-rose-500 font-bold">⚠️</div>
            <p className="text-xs text-rose-600 font-bold">{error}</p>
            <button
              onClick={fetchAuditLogs}
              className="px-4 py-2 bg-[#A71380] text-white text-xs font-bold rounded-[5px]"
            >
              Try Again
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="text-2xl text-slate-400">📋</div>
            <h3 className="text-sm font-black text-slate-700">No Audit Logs Found</h3>
            <p className="text-xs text-slate-400">No actions matched your search or selected module filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Module</th>
                  <th className="py-3.5 px-5">User / Initiator</th>
                  <th className="py-3.5 px-5">Action & Details</th>
                  <th className="py-3.5 px-5">Timestamp (Asia/IST)</th>
                  <th className="py-3.5 px-5 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-5 font-mono font-bold text-[#A71380]">
                      #{log.id}
                    </td>

                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] border uppercase ${getModuleBadgeColor(log.module)}`}>
                        {log.module}
                      </span>
                    </td>

                    <td className="py-4 px-5">
                      <span className="font-bold text-[#0b2341] block">
                        {log.user_email || "System / Guest"}
                      </span>
                      {log.user_id && (
                        <span className="text-[10px] text-slate-400 font-mono">User ID: #{log.user_id}</span>
                      )}
                    </td>

                    <td className="py-4 px-5 max-w-md">
                      <div className="font-bold text-slate-900 group-hover:text-[#A71380] transition-colors">
                        {log.action}
                      </div>
                      {log.details && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {log.details}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5 text-slate-700 font-mono text-[11px] font-medium whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span>{formatAsiaTimestamp(log.timestamp)}</span>
                        <span className="text-[9px] font-bold bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] px-1.5 py-0.5 rounded">IST</span>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-right font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {log.ip_address || "127.0.0.1"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && !error && filteredLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredLogs.length)}</span> of{" "}
                <span className="font-bold text-[#0b2341]">{filteredLogs.length}</span> audit logs
              </span>

              <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-300">
                <span className="text-[11px] text-slate-500 font-medium">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 text-[#0b2341] text-xs font-bold rounded-[4px] px-2 py-1 focus:outline-none focus:border-[#A71380] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="First Page"
                >
                  «
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                >
                  ‹ Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-[4px] font-bold text-[11px] transition-all cursor-pointer ${currentPage === pageNum
                          ? "bg-[#A71380] text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="px-1 text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                >
                  Next ›
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="Last Page"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Modal to inspect single log entry */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[6px] p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 text-[#0b2341]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-base font-black">Audit Record #{selectedLog.id}</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border uppercase ${getModuleBadgeColor(selectedLog.module)}`}>
                  {selectedLog.module}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-[5px] border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Action Executed</span>
                <p className="text-sm font-black text-[#0b2341]">{selectedLog.action}</p>
              </div>

              {selectedLog.details && (
                <div className="bg-slate-50 p-3.5 rounded-[5px] border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Payload / Change Details</span>
                  <p className="text-xs text-slate-700 font-mono break-all leading-relaxed whitespace-pre-wrap">
                    {selectedLog.details}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Initiator</span>
                  <span className="font-bold text-[#0b2341] block truncate">{selectedLog.user_email || "System"}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">IP Address</span>
                  <span className="font-bold font-mono text-slate-700">{selectedLog.ip_address || "127.0.0.1"}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Recorded Timestamp (Asia / IST)</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-bold font-mono text-slate-800 text-xs">
                    {formatAsiaTimestamp(selectedLog.timestamp)}
                  </span>
                  <span className="text-[10px] font-bold bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] px-1.5 py-0.5 rounded">
                    Asia/Kolkata (IST)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full bg-[#A71380] hover:bg-[#8E0F6D] text-white font-extrabold py-2.5 rounded-[5px] text-xs shadow-md shadow-[#A71380]/20 transition-all cursor-pointer"
              >
                Close Record Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

