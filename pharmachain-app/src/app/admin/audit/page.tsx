"use client";

import React, { useState, useEffect, useMemo } from "react";
import { auditAPI, AuditLogItem } from "@/lib/api";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
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
    fetchAuditLogs();
  }, []);

  // Reset page number on search, filter, or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, moduleFilter, pageSize]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditLogs();
  };

  // Filtered list
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (log.user_email?.toLowerCase() || "").includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        (log.details?.toLowerCase() || "").includes(q) ||
        (log.ip_address?.toLowerCase() || "").includes(q) ||
        `log-${log.id}`.includes(q);

      if (moduleFilter === "all") return matchesSearch;
      if (moduleFilter === "SECURITY") {
        return matchesSearch && ["AUTH", "USERS", "PAYMENTS"].includes(log.module.toUpperCase());
      }
      return matchesSearch && log.module.toUpperCase() === moduleFilter.toUpperCase();
    });
  }, [logs, searchTerm, moduleFilter]);

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
      case "ORDERS":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "KYC":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "PRODUCTS":
      case "INVENTORY":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "PRICING":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "AUTH":
      case "USERS":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "PAYMENTS":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Live Database Audit Trail
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>PostgreSQL Real-Time</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            System Operations & Security Audit Logs
          </h1>
          <p className="text-xs text-slate-500">
            Immutable database records of all actions: User registrations, distributor KYC reviews, PO placements, pricing overrides, and batch inventory edits.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-3 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? "Refreshing..." : "Refresh Logs"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-extrabold px-5 py-3 rounded-xl shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
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
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Recorded</span>
          <div className="text-xl font-black text-[#0b2341]">{totalCount}</div>
          <span className="text-[10px] text-slate-500">Live DB entries</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">Orders Placed</span>
          <div className="text-xl font-black text-blue-600">{orderLogsCount}</div>
          <span className="text-[10px] text-slate-500">B2B & Retail POs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Product & Stock</span>
          <div className="text-xl font-black text-emerald-600">{productLogsCount}</div>
          <span className="text-[10px] text-slate-500">Inventory events</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">KYC Reviews</span>
          <div className="text-xl font-black text-amber-600">{kycLogsCount}</div>
          <span className="text-[10px] text-slate-500">Drug license audits</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1 col-span-2 md:col-span-1">
          <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">Auth & Security</span>
          <div className="text-xl font-black text-indigo-600">{securityLogsCount}</div>
          <span className="text-[10px] text-slate-500">Logins & roles</span>
        </div>
      </div>

      {/* Filter Row & Search Input */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: `All Logs (${logs.length})` },
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
                className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${isActive ? "bg-[#0b2341] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
            className="border border-slate-200 rounded-xl pl-9 pr-4 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium text-xs w-full md:w-72"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-bold">Querying live database audit records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <div className="text-2xl text-rose-500 font-bold">⚠️</div>
            <p className="text-xs text-rose-600 font-bold">{error}</p>
            <button
              onClick={fetchAuditLogs}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
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
                    <td className="py-4 px-5 font-mono font-bold text-blue-600">
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
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
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
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">IST</span>
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
                  className="bg-white border border-slate-200 text-[#0b2341] text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                  title="First Page"
                >
                  «
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
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
                        className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#0b2341] text-white shadow-2xs"
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
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
                >
                  Next ›
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px]"
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
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 text-[#0b2341]">
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
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Action Executed</span>
                <p className="text-sm font-black text-[#0b2341]">{selectedLog.action}</p>
              </div>

              {selectedLog.details && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Payload / Change Details</span>
                  <p className="text-xs text-slate-700 font-mono break-all leading-relaxed whitespace-pre-wrap">
                    {selectedLog.details}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Initiator</span>
                  <span className="font-bold text-[#0b2341] block truncate">{selectedLog.user_email || "System"}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">IP Address</span>
                  <span className="font-bold font-mono text-slate-700">{selectedLog.ip_address || "127.0.0.1"}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Recorded Timestamp (Asia / IST)</span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="font-bold font-mono text-slate-800 text-xs">
                    {formatAsiaTimestamp(selectedLog.timestamp)}
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                    Asia/Kolkata (IST)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white font-black py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
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

