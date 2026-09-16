"use client";

import React, { useState, useEffect } from "react";
import { inquiriesAPI, InquiryItem } from "@/lib/api";

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await inquiriesAPI.listAll({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      });
      setInquiries(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load commercial inquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInquiries();
  };

  const handleUpdateStatus = async (inquiryId: number, newStatus: string) => {
    setUpdating(true);
    try {
      const updated = await inquiriesAPI.update(inquiryId, {
        status: newStatus,
        admin_notes: adminNotes.trim() || undefined,
      });
      setInquiries((prev) => prev.map((item) => (item.id === inquiryId ? updated : item)));
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(updated);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update inquiry status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (inquiryId: number) => {
    if (!confirm(`Are you sure you want to delete inquiry #${inquiryId}?`)) return;
    try {
      await inquiriesAPI.delete(inquiryId);
      setInquiries((prev) => prev.filter((item) => item.id !== inquiryId));
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete inquiry");
    }
  };

  const openModal = (item: InquiryItem) => {
    setSelectedInquiry(item);
    setAdminNotes(item.admin_notes || "");
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper for initials
  const getInitials = (name: string) => {
    if (!name) return "CI";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Metrics
  const totalCount = inquiries.length;
  const newCount = inquiries.filter((i) => i.status === "NEW").length;
  const inProgressCount = inquiries.filter((i) => i.status === "IN_PROGRESS").length;
  const respondedCount = inquiries.filter((i) => i.status === "RESPONDED").length;
  const archivedCount = inquiries.filter((i) => i.status === "ARCHIVED").length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      {/* Header Banner */}
      <div className="bg-[#0b2341] text-white rounded-[6px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs border border-slate-800">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#A71380]/30 text-[#F3D0E9] border border-[#F3D0E9]/40 px-3 py-1 rounded-[4px] text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center space-x-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Commercial Inquiry Desk</span>
            </span>
            {newCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-[4px] border border-amber-500/40 animate-pulse flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>{newCount} Unread Inquiry{newCount > 1 ? "ies" : ""}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Website Commercial &amp; B2B Inquiries
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Track, review, and follow up on commercial trade inquiries, bulk drug quotes, and COA dossier requests submitted from the Contact desk.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={fetchInquiries}
            disabled={loading}
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white text-xs font-extrabold px-4 py-2.5 rounded-[5px] shadow-xs shadow-[#A71380]/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? "Refreshing..." : "Refresh List"}</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Row matching Admin Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {/* Card 1: Total Received */}
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`bg-[#f7f6f4] border rounded-[6px] p-5 shadow-2xs flex flex-col justify-between h-full min-h-[140px] transition-all cursor-pointer group ${statusFilter === "ALL"
            ? "border-[#0b2341] ring-2 ring-[#0b2341]/10 bg-white"
            : "border-[#e8e6e2] hover:border-[#0b2341]/30 hover:shadow-xs"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Received</span>
            <div className="w-9 h-9 rounded-[5px] bg-[#0b2341] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-[#A71380] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0b2341] tracking-tight my-1">
            {totalCount}
          </div>
          <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span>All Submissions</span>
            <span className="text-[#A71380] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">Filter All &rarr;</span>
          </div>
        </div>

        {/* Card 2: New / Pending */}
        <div
          onClick={() => setStatusFilter("NEW")}
          className={`bg-[#f7f6f4] border rounded-[6px] p-5 shadow-2xs flex flex-col justify-between h-full min-h-[140px] transition-all cursor-pointer group ${statusFilter === "NEW"
            ? "border-blue-600 ring-2 ring-blue-500/10 bg-white"
            : "border-[#e8e6e2] hover:border-blue-500/40 hover:shadow-xs"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 block">New / Unread</span>
            <div className="w-9 h-9 rounded-[5px] bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-[#A71380] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-blue-900 tracking-tight my-1">
            {newCount}
          </div>
          <div className="text-[11px] font-bold text-blue-700 flex items-center justify-between">
            <span>Action Required</span>
            <span className="text-[#A71380] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">View New &rarr;</span>
          </div>
        </div>

        {/* Card 3: In Follow-Up */}
        <div
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`bg-[#f7f6f4] border rounded-[6px] p-5 shadow-2xs flex flex-col justify-between h-full min-h-[140px] transition-all cursor-pointer group ${statusFilter === "IN_PROGRESS"
            ? "border-amber-600 ring-2 ring-amber-500/10 bg-white"
            : "border-[#e8e6e2] hover:border-amber-500/40 hover:shadow-xs"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 block">In Follow-Up</span>
            <div className="w-9 h-9 rounded-[5px] bg-amber-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-[#A71380] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-900 tracking-tight my-1">
            {inProgressCount}
          </div>
          <div className="text-[11px] font-bold text-amber-700 flex items-center justify-between">
            <span>Under Review</span>
            <span className="text-[#A71380] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">View Active &rarr;</span>
          </div>
        </div>

        {/* Card 4: Completed / Responded */}
        <div
          onClick={() => setStatusFilter("RESPONDED")}
          className={`bg-[#f7f6f4] border rounded-[6px] p-5 shadow-2xs flex flex-col justify-between h-full min-h-[140px] transition-all cursor-pointer group ${statusFilter === "RESPONDED"
            ? "border-emerald-600 ring-2 ring-emerald-500/10 bg-white"
            : "border-[#e8e6e2] hover:border-emerald-500/40 hover:shadow-xs"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">Completed / Sent</span>
            <div className="w-9 h-9 rounded-[5px] bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:bg-[#A71380] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-900 tracking-tight my-1">
            {respondedCount}
          </div>
          <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-between">
            <span>Resolved Queries</span>
            <span className="text-[#A71380] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">View Done &rarr;</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Control Panel */}
      <div className="bg-white border border-[#e8e6e2] rounded-[6px] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs with Vector Icons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
            {[
              { id: "ALL", label: "All Messages", count: totalCount, icon: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" },
              { id: "NEW", label: "New", count: newCount, icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              { id: "IN_PROGRESS", label: "In Progress", count: inProgressCount, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { id: "RESPONDED", label: "Responded", count: respondedCount, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { id: "ARCHIVED", label: "Archived", count: archivedCount, icon: "M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-[5px] font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 ${statusFilter === tab.id
                  ? "bg-[#0b2341] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search name, email, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-[5px] focus:bg-white focus:outline-none focus:border-[#A71380] font-medium text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchInquiries();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#0b2341] hover:bg-black text-white rounded-[5px] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-[5px] font-medium flex items-center space-x-2">
          <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Table Card matching Admin Dashboard */}
      <div className="bg-white border border-[#e8e6e2] rounded-[6px] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#A71380] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Fetching commercial inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-sm font-extrabold text-slate-800">No Commercial Inquiries Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "Try adjusting your search query or status tab filter."
                : "New inquiries from website visitors will automatically arrive here."}
            </p>
            {(searchQuery || statusFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-2 text-xs font-bold text-[#A71380] hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-[#e8e6e2] text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-5">Sender Contact</th>
                  <th className="py-3.5 px-5">Company / Business</th>
                  <th className="py-3.5 px-5">Subject &amp; Teaser</th>
                  <th className="py-3.5 px-5">Submitted Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {inquiries.map((item) => {
                  const initials = getInitials(item.name);
                  const isNew = item.status === "NEW";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isNew ? "bg-blue-50/20" : ""
                        }`}
                    >
                      {/* Sender Contact Column */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-[5px] bg-[#0b2341] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-extrabold text-slate-900 block truncate flex items-center space-x-1.5">
                              <span>{item.name}</span>
                              {isNew && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 inline-block" title="Unread" />
                              )}
                            </span>
                            <a
                              href={`mailto:${item.email}`}
                              className="text-[11px] font-medium text-slate-500 hover:text-[#A71380] block truncate transition-colors"
                            >
                              {item.email}
                            </a>
                            <span className="text-[10px] font-mono text-slate-400 block">{item.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Company Column */}
                      <td className="py-3.5 px-5">
                        {item.company ? (
                          <div className="flex items-center space-x-1.5">
                            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m4 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-bold text-slate-800">{item.company}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Individual / Not specified</span>
                        )}
                      </td>

                      {/* Subject & Teaser Column */}
                      <td className="py-3.5 px-5 max-w-xs">
                        <div className="space-y-1">
                          <span className="font-extrabold text-[#0b2341] block line-clamp-1">
                            {item.subject}
                          </span>
                          <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">
                            {item.message}
                          </p>
                        </div>
                      </td>

                      {/* Submitted Date Column */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[11px] font-bold text-slate-700 block">
                            {new Date(item.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {new Date(item.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status Column with Interactive Dropdown Selector */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            disabled={updating}
                            className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-[5px] border cursor-pointer focus:outline-none transition-all ${item.status === "NEW"
                              ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                              : item.status === "IN_PROGRESS"
                                ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                : item.status === "RESPONDED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                              }`}
                          >
                            <option value="NEW" className="bg-white text-blue-900 font-bold">🔵 New Message</option>
                            <option value="IN_PROGRESS" className="bg-white text-amber-900 font-bold">🟡 In Progress / Follow-Up</option>
                            <option value="RESPONDED" className="bg-white text-emerald-900 font-bold">🟢 Responded / Settled</option>
                            <option value="ARCHIVED" className="bg-white text-slate-700 font-bold">⚪ Archived</option>
                          </select>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => openModal(item)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0b2341] hover:bg-[#A71380] text-white rounded-[5px] text-xs font-extrabold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                          title="Open lead follow-up drawer and add internal sales notes"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Follow Up &amp; Notes</span>
                        </button>

                        <a
                          href={`mailto:${item.email}?subject=${encodeURIComponent(`RE: ${item.subject}`)}`}
                          className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[5px] transition-all"
                          title={`Send Direct Email to ${item.email}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </a>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center justify-center w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-[5px] transition-all cursor-pointer"
                          title="Delete inquiry record"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Response Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-[8px] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-[6px] bg-[#0b2341] text-white flex items-center justify-center font-black text-xs shadow-md">
                  {getInitials(selectedInquiry.name)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase text-[#A71380] tracking-wider">
                      Inquiry #{selectedInquiry.id}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(selectedInquiry.created_at).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#0b2341]">{selectedInquiry.subject}</h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedInquiry(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer transition-all"
              >
                ✕
              </button>
            </div>

            {/* Contact Details Grid */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-[6px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Contact Person</span>
                <span className="font-black text-[#0b2341] text-sm block">{selectedInquiry.name}</span>
                {selectedInquiry.company && (
                  <span className="text-slate-600 font-medium block flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m4 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{selectedInquiry.company}</span>
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Contact Actions</span>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-[#A71380] text-slate-700 hover:text-[#A71380] rounded-[5px] font-bold text-[11px] transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email</span>
                  </a>
                  <button
                    onClick={() => copyToClipboard(selectedInquiry.email, "email")}
                    className="px-2.5 py-1.5 bg-slate-200/70 hover:bg-slate-200 text-slate-700 rounded-[5px] text-[10px] font-bold cursor-pointer"
                  >
                    {copiedField === "email" ? "Copied!" : "Copy Email"}
                  </button>
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-600 text-slate-700 hover:text-emerald-700 rounded-[5px] font-bold text-[11px] transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Commercial Inquiry / Message Content:
              </label>
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-[6px] p-4 text-xs font-normal text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Internal Sales Notes / Follow-up History:
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setAdminNotes((prev) => (prev ? `${prev} | Quoted via phone` : "Quoted via phone"))}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[4px] text-[10px] font-bold cursor-pointer"
                  >
                    + Quoted Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminNotes((prev) => (prev ? `${prev} | Sent Dossier PDF` : "Sent Dossier PDF"))}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[4px] text-[10px] font-bold cursor-pointer"
                  >
                    + Sent COA PDF
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Log internal action taken, assigned trade rep, or discussion summary..."
                className="w-full border border-slate-200 rounded-[6px] p-3 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-[#A71380]"
              />
            </div>

            {/* Status Update Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                Update Status &amp; Save:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "NEW")}
                  className={`px-3.5 py-2 rounded-[5px] text-xs font-extrabold cursor-pointer transition-all flex items-center space-x-1.5 ${selectedInquiry.status === "NEW"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Mark New</span>
                </button>

                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "IN_PROGRESS")}
                  className={`px-3.5 py-2 rounded-[5px] text-xs font-extrabold cursor-pointer transition-all flex items-center space-x-1.5 ${selectedInquiry.status === "IN_PROGRESS"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Mark In Progress</span>
                </button>

                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "RESPONDED")}
                  className={`px-3.5 py-2 rounded-[5px] text-xs font-extrabold cursor-pointer transition-all flex items-center space-x-1.5 ${selectedInquiry.status === "RESPONDED"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Mark Responded</span>
                </button>

                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "ARCHIVED")}
                  className={`px-3.5 py-2 rounded-[5px] text-xs font-extrabold cursor-pointer transition-all flex items-center space-x-1.5 ${selectedInquiry.status === "ARCHIVED"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Archive</span>
                </button>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                <button
                  onClick={() => handleDelete(selectedInquiry.id)}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-[5px] text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Inquiry</span>
                </button>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="px-5 py-2 bg-[#0b2341] hover:bg-black text-white rounded-[5px] text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
