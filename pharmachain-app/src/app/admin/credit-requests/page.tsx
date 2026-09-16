"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usersAPI } from "@/lib/api";

interface UserAccount {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: "ADMIN" | "DISTRIBUTOR" | "RETAILER" | "CUSTOMER";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  lifetime_orders?: number;
  total_spent?: number;
  distributor_profile?: {
    company_name?: string;
    distributor_name?: string;
    gstin?: string;
    drug_license_no?: string;
    business_address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    credit_limit?: number;
    requested_credit_limit?: number;
  };
  retailer_profile?: {
    shop_name?: string;
    pharmacist_name?: string;
    gstin?: string;
    drug_license_no?: string;
    shop_address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    credit_limit?: number;
    requested_credit_limit?: number;
    kyc_status?: string;
  };
}

export default function AdminCreditRequestsPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewTab, setViewTab] = useState<"PENDING" | "APPROVED" | "DISTRIBUTOR" | "RETAILER" | "ALL">("PENDING");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Custom limit modal state
  const [selectedUserForCustom, setSelectedUserForCustom] = useState<UserAccount | null>(null);
  const [customLimitInput, setCustomLimitInput] = useState<number>(500000);

  // Fetch users list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.list();
      setUsers(data);
    } catch (err: any) {
      console.error("Failed loading users for credit requests:", err);
      setStatusMsg({ type: "error", text: "Failed to load credit accounts from FastAPI backend." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Quick Approve Requested Limit
  const handleApproveRequestedLimit = async (user: UserAccount) => {
    const reqLimit = user.distributor_profile?.requested_credit_limit ?? user.retailer_profile?.requested_credit_limit ?? 0;
    if (!reqLimit || reqLimit <= 0) return;

    try {
      setActionLoadingId(user.id);
      await usersAPI.updateCreditLimit(user.id, Number(reqLimit));

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === user.id) {
            return {
              ...u,
              distributor_profile: u.distributor_profile
                ? { ...u.distributor_profile, credit_limit: Number(reqLimit) }
                : u.distributor_profile,
              retailer_profile: u.retailer_profile
                ? { ...u.retailer_profile, credit_limit: Number(reqLimit) }
                : u.retailer_profile,
            };
          }
          return u;
        })
      );

      setStatusMsg({
        type: "success",
        text: `✓ Success! Credit limit of ₹${Number(reqLimit).toLocaleString("en-IN")} approved & sanctioned for '${user.full_name}'.`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to approve credit limit." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject / Keep Current Limit (Reset requested limit)
  const handleRejectRequest = async (user: UserAccount) => {
    const currentLimit = user.distributor_profile?.credit_limit ?? user.retailer_profile?.credit_limit ?? 0;
    if (!confirm(`Dismiss credit increase request for ${user.full_name} and maintain current limit of ₹${Number(currentLimit).toLocaleString('en-IN')}?`)) {
      return;
    }

    try {
      setActionLoadingId(user.id);
      await usersAPI.updateCreditLimit(user.id, Number(currentLimit));

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === user.id) {
            return {
              ...u,
              distributor_profile: u.distributor_profile
                ? { ...u.distributor_profile, requested_credit_limit: currentLimit }
                : u.distributor_profile,
              retailer_profile: u.retailer_profile
                ? { ...u.retailer_profile, requested_credit_limit: currentLimit }
                : u.retailer_profile,
            };
          }
          return u;
        })
      );

      setStatusMsg({
        type: "info",
        text: `✓ Request for '${user.full_name}' dismissed. Maintained limit at ₹${Number(currentLimit).toLocaleString("en-IN")}.`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update credit limit." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Custom Credit Limit Approval
  const handleSaveCustomLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCustom) return;

    try {
      setActionLoadingId(selectedUserForCustom.id);
      await usersAPI.updateCreditLimit(selectedUserForCustom.id, Number(customLimitInput));

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === selectedUserForCustom.id) {
            return {
              ...u,
              distributor_profile: u.distributor_profile
                ? { ...u.distributor_profile, credit_limit: Number(customLimitInput), requested_credit_limit: Number(customLimitInput) }
                : u.distributor_profile,
              retailer_profile: u.retailer_profile
                ? { ...u.retailer_profile, credit_limit: Number(customLimitInput), requested_credit_limit: Number(customLimitInput) }
                : u.retailer_profile,
            };
          }
          return u;
        })
      );

      const updatedName = selectedUserForCustom.full_name;
      setSelectedUserForCustom(null);
      setStatusMsg({
        type: "success",
        text: `✓ Custom Credit Limit of ₹${Number(customLimitInput).toLocaleString("en-IN")} updated for '${updatedName}'!`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to save credit limit." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Base Trade Partners
  const allPartners = useMemo(() => {
    return users.filter((u) => u.role === "DISTRIBUTOR" || u.role === "RETAILER" || u.distributor_profile || u.retailer_profile);
  }, [users]);

  // Pending Requests List
  const pendingRequests = useMemo(() => {
    return allPartners.filter((u) => {
      const reqLimit = u.distributor_profile?.requested_credit_limit ?? u.retailer_profile?.requested_credit_limit ?? 0;
      const creditLimit = u.distributor_profile?.credit_limit ?? u.retailer_profile?.credit_limit ?? 0;
      return reqLimit > 0 && reqLimit !== creditLimit;
    });
  }, [allPartners]);

  // Approved Active Credit Lines List
  const approvedAccounts = useMemo(() => {
    return allPartners.filter((u) => {
      const creditLimit = u.distributor_profile?.credit_limit ?? u.retailer_profile?.credit_limit ?? 0;
      return creditLimit > 0;
    });
  }, [allPartners]);

  // Filtered List based on Active View Tab & Search Term
  const filteredList = useMemo(() => {
    return allPartners.filter((u) => {
      const term = searchTerm.toLowerCase().trim();
      const compName = u.distributor_profile?.company_name || u.retailer_profile?.shop_name || "";
      const gstin = u.distributor_profile?.gstin || u.retailer_profile?.gstin || "";

      const matchesSearch =
        !term ||
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        compName.toLowerCase().includes(term) ||
        gstin.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      const reqLimit = u.distributor_profile?.requested_credit_limit ?? u.retailer_profile?.requested_credit_limit ?? 0;
      const creditLimit = u.distributor_profile?.credit_limit ?? u.retailer_profile?.credit_limit ?? 0;
      const isPending = reqLimit > 0 && reqLimit !== creditLimit;

      if (viewTab === "PENDING" && !isPending) return false;
      if (viewTab === "APPROVED" && (creditLimit <= 0 || isPending)) return false;
      if (viewTab === "DISTRIBUTOR" && u.role !== "DISTRIBUTOR") return false;
      if (viewTab === "RETAILER" && u.role !== "RETAILER") return false;

      return true;
    });
  }, [allPartners, searchTerm, viewTab]);

  // Paginated List
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    return filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Aggregate Metrics
  const totalPendingVolume = useMemo(() => {
    return pendingRequests.reduce((acc, u) => {
      const req = u.distributor_profile?.requested_credit_limit ?? u.retailer_profile?.requested_credit_limit ?? 0;
      return acc + req;
    }, 0);
  }, [pendingRequests]);

  const totalSanctionedVolume = useMemo(() => {
    return approvedAccounts.reduce((acc, u) => {
      const cur = u.distributor_profile?.credit_limit ?? u.retailer_profile?.credit_limit ?? 0;
      return acc + cur;
    }, 0);
  }, [approvedAccounts]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredList.length === 0) return;
    const headers = ["User ID", "Name", "Role", "Company/Shop", "GSTIN", "Current Limit (INR)", "Requested Limit (INR)", "Status"];
    const rows = filteredList.map((u) => {
      const comp = u.distributor_profile?.company_name || u.retailer_profile?.shop_name || "N/A";
      const gstin = u.distributor_profile?.gstin || u.retailer_profile?.gstin || "N/A";
      const curLimit = u.distributor_profile?.credit_limit ?? u.retailer_profile?.credit_limit ?? 0;
      const reqLimit = u.distributor_profile?.requested_credit_limit ?? u.retailer_profile?.requested_credit_limit ?? 0;
      const isPending = reqLimit > 0 && reqLimit !== curLimit;
      return [
        `USR-${String(u.id).padStart(3, "0")}`,
        `"${u.full_name}"`,
        u.role,
        `"${comp}"`,
        gstin,
        curLimit,
        reqLimit,
        isPending ? "PENDING" : "SANCTIONED",
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Credit_Limits_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold uppercase bg-[#F8EAF4] text-[#A71380] px-2.5 py-0.5 rounded border border-[#F3D0E9]">
              B2B Credit Management
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              FastAPI Synced
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-1.5">
            Credit Limits & Increase Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage pending partner credit requests and view all active sanctioned trade credit accounts.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg font-bold text-xs border border-slate-200 transition-all cursor-pointer"
          >
            Export CSV
          </button>
          <Link
            href="/admin/users"
            className="bg-[#0b2341] hover:bg-[#A71380] text-white px-4 py-2 rounded-lg font-extrabold text-xs transition-all shadow-xs"
          >
            &larr; All User Accounts
          </Link>
        </div>
      </div>

      {/* Alert Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg text-xs font-bold border flex items-center justify-between ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : statusMsg.type === "info"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {pendingRequests.length} <span className="text-xs font-normal text-slate-400">Requesters</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Requested Vol: <span className="font-bold text-amber-700">₹{totalPendingVolume.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            Approved Active Credit Facilities
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            ₹{totalSanctionedVolume.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            Sanctioned across {approvedAccounts.length} active partners
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            Total B2B Trade Partners
          </div>
          <div className="text-2xl font-black text-[#0b2341] font-mono">
            {allPartners.length} <span className="text-xs font-normal text-slate-400">Accounts</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Distributors & Pharmacy Chemists
          </div>
        </div>
      </div>

      {/* Premium Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            {
              id: "PENDING",
              label: "Pending Requests",
              icon: (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              count: pendingRequests.length,
              activeClass: "bg-[#A71380] text-white shadow-xs",
              inactiveClass: "bg-amber-50/90 text-amber-900 border border-amber-200/80 hover:bg-amber-100/90",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-amber-200/80 text-amber-950 font-extrabold",
            },
            {
              id: "APPROVED",
              label: "Approved Lines",
              icon: (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              count: approvedAccounts.length,
              activeClass: "bg-emerald-700 text-white shadow-xs",
              inactiveClass: "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-emerald-100 text-emerald-800 font-bold",
            },
            {
              id: "DISTRIBUTOR",
              label: "Distributors",
              icon: (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 v5m-4 0h4" />
                </svg>
              ),
              count: allPartners.filter((u) => u.role === "DISTRIBUTOR").length,
              activeClass: "bg-[#0b2341] text-white shadow-xs",
              inactiveClass: "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-blue-100 text-blue-800 font-bold",
            },
            {
              id: "RETAILER",
              label: "Retail Chemists",
              icon: (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              ),
              count: allPartners.filter((u) => u.role === "RETAILER").length,
              activeClass: "bg-[#0b2341] text-white shadow-xs",
              inactiveClass: "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-purple-100 text-purple-800 font-bold",
            },
            {
              id: "ALL",
              label: "All Accounts",
              icon: (
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ),
              count: allPartners.length,
              activeClass: "bg-slate-800 text-white shadow-xs",
              inactiveClass: "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100",
              badgeActive: "bg-white/20 text-white",
              badgeInactive: "bg-slate-200 text-slate-700 font-bold",
            },
          ].map((tab) => {
            const isActive = viewTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setViewTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center space-x-2 ${
                  isActive ? tab.activeClass : tab.inactiveClass
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                    isActive ? tab.badgeActive : tab.badgeInactive
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-64 shrink-0">
          <input
            type="text"
            placeholder="Search partner, company, GSTIN..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg pl-9 pr-7 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium text-xs"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Table - Fully responsive without horizontal scrollbar */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs table-auto">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50 tracking-wider">
                <th className="py-3 px-3 w-[22%]">Partner & Account</th>
                <th className="py-3 px-3 w-[20%]">Company & GSTIN</th>
                <th className="py-3 px-3 w-[10%]">Role</th>
                <th className="py-3 px-3 text-right w-[14%]">Currently Sanctioned</th>
                <th className="py-3 px-3 text-right bg-amber-50/60 text-amber-900 border-x border-amber-200/60 w-[14%]">
                  Requested Limit
                </th>
                <th className="py-3 px-3 text-center w-[10%]">Status</th>
                <th className="py-3 px-3 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#A71380] border-t-transparent mb-2"></div>
                    <p>Loading Credit Accounts from Database...</p>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                    <div className="space-y-1">
                      <svg className="w-8 h-8 mx-auto text-slate-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-700 text-sm">No Accounts Found in this View</p>
                      <p className="text-xs font-normal text-slate-400">
                        {viewTab === "PENDING"
                          ? "All credit increase requests have been approved! Click 'Approved Credit Lines' tab above to see active limits."
                          : "No accounts match your search or filter tab."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((u) => {
                  const compName = u.distributor_profile?.company_name || u.retailer_profile?.shop_name || "Direct Trade Partner";
                  const gstin = u.distributor_profile?.gstin || u.retailer_profile?.gstin;
                  const creditLimit = u.distributor_profile?.credit_limit ?? u.retailer_profile?.credit_limit ?? 0;
                  const reqLimit = u.distributor_profile?.requested_credit_limit ?? u.retailer_profile?.requested_credit_limit ?? 0;
                  const isPending = reqLimit > 0 && reqLimit !== creditLimit;
                  const delta = reqLimit - creditLimit;
                  const percentageIncrease = creditLimit > 0 && delta > 0 ? Math.round((delta / creditLimit) * 100) : 0;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isPending ? "bg-amber-50/25" : ""
                        }`}
                    >
                      {/* Partner Name & ID */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-[#0b2341] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {u.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#0b2341] text-xs leading-snug truncate">{u.full_name}</div>
                            <div className="text-[10px] font-mono text-slate-400 leading-tight truncate">
                              USR-{String(u.id).padStart(3, "0")} • {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Company & GSTIN */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 text-xs leading-snug truncate">{compName}</div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          {gstin ? `GST: ${gstin}` : "Verified On File"}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block whitespace-nowrap ${u.role === "DISTRIBUTOR"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Current Sanctioned Limit */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                        ₹{Number(creditLimit).toLocaleString("en-IN")}
                      </td>

                      {/* Requested Limit */}
                      <td className="py-3 px-3 text-right bg-amber-50/30 border-x border-amber-200/40 whitespace-nowrap">
                        {isPending ? (
                          <div>
                            <div className="font-mono font-black text-xs text-[#A71380]">
                              ₹{Number(reqLimit).toLocaleString("en-IN")}
                            </div>
                            <div className="text-[9px] font-bold text-amber-800">
                              +₹{Number(delta).toLocaleString("en-IN")} (+{percentageIncrease}%)
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-400 italic">
                            — Standard
                          </div>
                        )}
                      </td>

                      {/* Request Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isPending ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse inline-flex items-center space-x-1 shadow-2xs">
                            <svg className="w-3 h-3 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>PENDING</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center space-x-1">
                            <svg className="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>SANCTIONED</span>
                          </span>
                        )}
                      </td>

                      {/* Sanction Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1 flex-wrap gap-y-1">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveRequestedLimit(u)}
                                disabled={actionLoadingId === u.id}
                                title={`Approve requested limit of ₹${Number(reqLimit).toLocaleString('en-IN')}`}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md font-extrabold text-[10px] shadow-2xs transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{actionLoadingId === u.id ? "..." : "Approve"}</span>
                              </button>

                              <button
                                onClick={() => handleRejectRequest(u)}
                                disabled={actionLoadingId === u.id}
                                title="Dismiss request and maintain current limit"
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setSelectedUserForCustom(u);
                              setCustomLimitInput(creditLimit > 0 ? creditLimit : reqLimit > 0 ? reqLimit : 500000);
                            }}
                            title="Set custom credit limit"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap inline-flex items-center space-x-1"
                          >
                            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredList.length > 0 && (
          <div className="bg-slate-50/90 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-slate-500">
                Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filteredList.length)}</span> of{" "}
                <span className="font-bold text-slate-800">{filteredList.length}</span> accounts
              </span>

              <div className="flex items-center space-x-1.5 text-slate-500">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Partners per page"
                  className="bg-white border border-slate-200 rounded-[4px] px-2.5 py-1 font-bold text-slate-700 focus:outline-none focus:border-[#A71380]"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                aria-label="First page"
                className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ‹ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && pageNum - prev > 1;
                  return (
                    <React.Fragment key={pageNum}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-[4px] font-bold transition-all cursor-pointer ${currentPage === pageNum
                          ? "bg-[#A71380] text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Last page"
                className="px-2.5 py-1.5 rounded-[4px] border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Custom Credit Limit */}
      {selectedUserForCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-[#F8EAF4] text-[#A71380] px-2 py-0.5 rounded border border-[#F3D0E9]">
                  Credit Limit Form
                </span>
                <h3 className="text-base font-black text-[#0b2341] mt-1">Set Custom Sanctioned Limit</h3>
              </div>
              <button onClick={() => setSelectedUserForCustom(null)} className="text-slate-400 hover:text-slate-700 font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomLimit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 text-sm">{selectedUserForCustom.full_name}</div>
                <div className="text-xs font-semibold text-[#A71380]">
                  {selectedUserForCustom.distributor_profile?.company_name || selectedUserForCustom.retailer_profile?.shop_name || "Trade Account"}
                </div>
                <div className="text-[10px] font-mono text-slate-500">{selectedUserForCustom.email}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sanctioned Limit Amount (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  value={customLimitInput}
                  onChange={(e) => setCustomLimitInput(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 font-mono font-bold text-lg text-[#0b2341] focus:bg-white focus:outline-none focus:border-[#A71380]"
                />
              </div>

              <div>
                <span className="block font-bold text-slate-700 mb-1">Quick Presets:</span>
                <div className="grid grid-cols-4 gap-2">
                  {[200000, 500000, 1000000, 2500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomLimitInput(amt)}
                      className={`py-1.5 px-2 rounded font-bold border transition-all cursor-pointer text-center text-xs ${customLimitInput === amt
                        ? "bg-[#A71380] text-white border-[#A71380]"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      ₹{(amt / 100000).toFixed(0)}L
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedUserForCustom(null)}
                  className="px-4 py-2 border border-slate-200 rounded-md font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === selectedUserForCustom.id}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-5 py-2 rounded-md font-extrabold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoadingId === selectedUserForCustom.id ? "Saving..." : "Save Credit Limit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
