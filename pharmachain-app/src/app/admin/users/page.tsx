"use client";

import React, { useEffect, useState } from "react";
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
  customer_profile?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

const ROLE_PERMISSIONS: Record<string, { label: string; badgeColor: string; description: string; permissions: string[] }> = {
  ADMIN: {
    label: "Chief Administrator / Staff",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Full enterprise privileges including inventory adjustment, pricing matrices, user roles, KYC, and financial reports.",
    permissions: [
      "Product Catalog CRUD & Batch Stock Inward",
      "Dynamic Pricing & Tier Matrix Configuration",
      "B2B Distributor KYC Review & Approval",
      "Orders Fulfillment & Status Transitions",
      "Commercial GMV & Sales PDF/CSV Reports",
      "Staff Access Management & Role Assignment",
      "Immutable Audit Log Inspection",
    ],
  },
  DISTRIBUTOR: {
    label: "Certified B2B Wholesale Partner",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    description: "Authorized wholesale distributor with GSTIN/Drug License verification, unlocked B2B trade prices, and bulk tiered MOQ ordering.",
    permissions: [
      "Wholesale Catalog & B2B Special Pricing Access",
      "Tiered Volume Bulk Discounts (50+ MOQ)",
      "B2B Purchase Order Placement & Tracking",
      "Official Tax GST Invoices & Receipts Download",
      "KYC Verification Submission & Status",
    ],
  },
  RETAILER: {
    label: "Pharmacy & Chemist Retailer",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    description: "Licensed retail chemist (Form 20/21) purchasing at Price-To-Retailer (PTR) trade discounts, schemes, and Net-30 credit.",
    permissions: [
      "Retail Catalog & PTR Pricing Access",
      "10+1 Promotional Schemes Access",
      "Retail Order Placement & Invoices",
      "Chemist License & KYC Verification",
    ],
  },
  CUSTOMER: {
    label: "Retail Direct Customer",
    badgeColor: "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]",
    description: "Standard consumer account for browsing the retail catalog, ordering at MRP/customer pricing, and home delivery tracking.",
    permissions: [
      "Public OTC & Wellness Catalog Browsing",
      "Retail Customer Pricing & Discounts",
      "Cart Checkout & Payment Processing",
      "Order History & Delivery Status Tracking",
      "Personal Profile & Address Management",
    ],
  },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals state
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserAccount | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<"ADMIN" | "DISTRIBUTOR" | "RETAILER" | "CUSTOMER">("ADMIN");
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierUser, setDossierUser] = useState<UserAccount | null>(null);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);

  // Credit Limit Modal State
  const [isCreditLimitModalOpen, setIsCreditLimitModalOpen] = useState(false);
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<UserAccount | null>(null);
  const [creditLimitInput, setCreditLimitInput] = useState<number>(500000);
  const [creditLimitLoading, setCreditLimitLoading] = useState(false);

  // Add Staff Form State
  const [staffFullName, setStaffFullName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffRole, setStaffRole] = useState<"ADMIN" | "DISTRIBUTOR" | "RETAILER" | "CUSTOMER">("ADMIN");
  const [staffCompany, setStaffCompany] = useState("");
  const [staffCreditLimit, setStaffCreditLimit] = useState<number>(500000);
  const [staffCity, setStaffCity] = useState("Hyderabad");
  const [staffState, setStaffState] = useState("Telangana");
  const [addSubmitLoading, setAddSubmitLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.list();
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setStatusMsg({ type: "error", text: "Failed to connect to backend users API." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const handleGlobalSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setSearchTerm(q);
      setCurrentPage(1);
    };
    window.addEventListener("pharmalink_admin_search", handleGlobalSearch);
    return () => window.removeEventListener("pharmalink_admin_search", handleGlobalSearch);
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitLoading(true);
    setStatusMsg(null);

    try {
      const created = await usersAPI.create({
        email: staffEmail.trim(),
        password: staffPassword,
        full_name: staffFullName.trim(),
        phone: staffPhone.trim(),
        role: staffRole,
        company_name: staffCompany.trim() || undefined,
        city: staffCity,
        state: staffState,
      });

      setUsers([created, ...users]);
      setIsAddStaffModalOpen(false);
      setStatusMsg({
        type: "success",
        text: `✓ New ${staffRole} account for '${created.full_name}' successfully created and saved in database!`,
      });

      // Reset form
      setStaffFullName("");
      setStaffEmail("");
      setStaffPassword("");
      setStaffPhone("");
      setStaffCompany("");
      setStaffCreditLimit(500000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to create user account." });
    } finally {
      setAddSubmitLoading(false);
    }
  };

  const handleOpenRoleModal = (user: UserAccount) => {
    setSelectedUserForRole(user);
    setSelectedNewRole(user.role);
    setIsRoleModalOpen(true);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole) return;

    try {
      setActionLoadingId(selectedUserForRole.id);
      const updated = await usersAPI.updateRole(selectedUserForRole.id, selectedNewRole);
      setUsers(users.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u)));
      setIsRoleModalOpen(false);
      setStatusMsg({
        type: "success",
        text: `✓ Role and system authorizations for '${selectedUserForRole.full_name}' updated to '${selectedNewRole}'!`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update role." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenCreditLimitModal = (user: UserAccount) => {
    setSelectedUserForCredit(user);
    const existingLimit = user.distributor_profile?.credit_limit ?? user.retailer_profile?.credit_limit ?? 0;
    const reqLimit = user.distributor_profile?.requested_credit_limit ?? user.retailer_profile?.requested_credit_limit ?? 0;
    setCreditLimitInput(existingLimit > 0 ? existingLimit : (reqLimit > 0 ? reqLimit : 500000));
    setIsCreditLimitModalOpen(true);
  };

  const handleSaveCreditLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForCredit) return;
    setCreditLimitLoading(true);
    try {
      await usersAPI.updateCreditLimit(selectedUserForCredit.id, Number(creditLimitInput));
      setUsers(users.map((u) => {
        if (u.id === selectedUserForCredit.id) {
          return {
            ...u,
            distributor_profile: u.distributor_profile ? {
              ...u.distributor_profile,
              credit_limit: Number(creditLimitInput),
            } : u.distributor_profile,
            retailer_profile: u.retailer_profile ? {
              ...u.retailer_profile,
              credit_limit: Number(creditLimitInput),
            } : u.retailer_profile,
          };
        }
        return u;
      }));
      if (dossierUser && dossierUser.id === selectedUserForCredit.id) {
        setDossierUser({
          ...dossierUser,
          distributor_profile: dossierUser.distributor_profile ? {
            ...dossierUser.distributor_profile,
            credit_limit: Number(creditLimitInput),
          } : dossierUser.distributor_profile,
          retailer_profile: dossierUser.retailer_profile ? {
            ...dossierUser.retailer_profile,
            credit_limit: Number(creditLimitInput),
          } : dossierUser.retailer_profile,
        });
      }
      setIsCreditLimitModalOpen(false);
      setStatusMsg({
        type: "success",
        text: `✓ B2B Credit Limit for '${selectedUserForCredit.full_name}' updated to ₹${Number(creditLimitInput).toLocaleString('en-IN')}!`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update credit limit." });
    } finally {
      setCreditLimitLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserAccount) => {
    const actionName = user.is_active ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${actionName} ${user.full_name}'s account?`)) return;

    try {
      setActionLoadingId(user.id);
      const updated = await usersAPI.toggleStatus(user.id);
      setUsers(users.map((u) => (u.id === user.id ? { ...u, is_active: updated.is_active } : u)));
      setStatusMsg({
        type: "success",
        text: `✓ User '${user.full_name}' has been ${updated.is_active ? "activated" : "deactivated"}!`,
      });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to toggle status." });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter
  const filtered = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.distributor_profile?.company_name?.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(searchTerm));

    if (!matchesSearch) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleRoleTabChange = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Matching Product Management Design */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
              User & Role Administration
            </span>
           
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Enterprise User Accounts & Role Governance
          </h1>

        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/admin/credit-requests"
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-3 rounded-[5px] font-extrabold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
          >
            <span>💳 B2B Credit Approvals</span>
          </Link>

          <button
            onClick={() => setShowPermissionsMatrix(!showPermissionsMatrix)}
            className="bg-slate-100 hover:bg-slate-200 text-[#0b2341] px-4 py-3 rounded-[5px] font-extrabold text-xs flex items-center space-x-2 border border-slate-200 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{showPermissionsMatrix ? "Hide Role Matrix" : "View Role Authorizations"}</span>
          </button>

          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-5 py-3 rounded-[5px] font-extrabold text-xs flex items-center space-x-2 shadow-sm shadow-[#A71380]/20 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Add Staff / User Account</span>
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {statusMsg && (
        <div
          className={`p-4 rounded-[5px] text-xs font-bold border ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Role & Permissions Matrix Card (Expandable) */}
      {showPermissionsMatrix && (
        <div className="bg-white border border-slate-200/90 rounded-[6px] p-6 shadow-2xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-[#0b2341]">Role-Based Access Control (RBAC) Authorizations</h3>
              <p className="text-xs text-slate-500">Fine-grained permission matrices enforcing enterprise security policies across portals.</p>
            </div>
            <span className="text-[10px] font-mono bg-[#F8EAF4] text-[#A71380] font-bold px-3 py-1 rounded-full border border-[#F3D0E9]">
              OAuth2 Scope Enforcement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(ROLE_PERMISSIONS).map(([roleKey, roleData]) => (
              <div key={roleKey} className="p-4 rounded-[5px] border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-black text-[11px] px-2.5 py-1 rounded-[4px] border ${roleData.badgeColor}`}>
                    {roleKey}
                  </span>
                </div>
                <h4 className="font-bold text-[#0b2341] text-xs">{roleData.label}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{roleData.description}</p>
                <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Capabilities:</span>
                  {roleData.permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-700">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Row - Matching Product Management Design */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {[
            { id: "all", label: "All Users" },
            { id: "CUSTOMER", label: "Retail Customers" },
            { id: "RETAILER", label: "Pharmacy Retailers" },
            { id: "DISTRIBUTOR", label: "Distributors B2B" },
            { id: "ADMIN", label: "Administrators" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleRoleTabChange(tab.id)}
              className={`px-3.5 py-2 rounded-[5px] font-bold transition-all cursor-pointer ${roleFilter === tab.id
                ? "bg-[#A71380] text-white shadow-xs shadow-[#A71380]/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by name, email, company, or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border border-slate-200 rounded-[5px] pl-9 pr-4 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Users Table - Matching Product Management Design */}
      <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Customer / Staff Profile</th>
                <th className="py-3.5 px-4">Account Type</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Orders</th>
                <th className="py-3.5 px-4">Total GMV (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#A71380] border-t-transparent mb-2"></div>
                    <p className="font-bold">Loading User Accounts from FastAPI...</p>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    No user accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User ID */}
                    <td className="py-4 px-4 font-mono font-bold text-[#A71380]">
                      USR-{String(u.id).padStart(3, "0")}
                    </td>

                    {/* Customer / Company Profile */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#0b2341] text-sm">{u.full_name}</div>
                      {(() => {
                        const compName = u.distributor_profile?.company_name || u.retailer_profile?.shop_name;
                        const creditLimit = u.distributor_profile?.credit_limit ?? u.retailer_profile?.credit_limit ?? 0;
                        const reqLimit = u.distributor_profile?.requested_credit_limit ?? u.retailer_profile?.requested_credit_limit;
                        const hasPendingReq = reqLimit !== undefined && reqLimit > 0 && reqLimit !== creditLimit;

                        if (!compName && !u.distributor_profile && !u.retailer_profile) {
                          return <div className="text-[10px] text-slate-400 mt-0.5">Direct Retail Customer</div>;
                        }

                        return (
                          <div className="space-y-1 mt-1">
                            {compName && (
                              <div className="text-[11px] font-bold text-slate-700">
                                {compName}
                              </div>
                            )}
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border inline-flex items-center space-x-1 ${creditLimit > 0
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                <span>💳 Limit: ₹{Number(creditLimit).toLocaleString('en-IN')}</span>
                              </span>

                              {hasPendingReq && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-900 border border-amber-300 animate-pulse inline-flex items-center space-x-1">
                                  <span>⚡ Req: ₹{Number(reqLimit).toLocaleString('en-IN')}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Account Type Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${u.role === "DISTRIBUTOR"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : u.role === "ADMIN"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]"
                          }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Contact Details */}
                    <td className="py-4 px-4 text-slate-600">
                      <span className="block font-semibold">{u.email}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{u.phone || "No phone registered"}</span>
                    </td>

                    {/* Orders */}
                    <td className="py-4 px-4 font-bold text-slate-800">
                      {u.lifetime_orders || 0} Orders
                    </td>

                    {/* Total GMV */}
                    <td className="py-4 px-4 font-black text-slate-900 font-mono text-sm">
                      ₹{Number(u.total_spent || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`font-extrabold px-3 py-1 rounded-full text-[10px] border inline-flex items-center space-x-1 ${u.is_active
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                        <span>{u.is_active ? "Active" : "Deactivated"}</span>
                      </span>
                    </td>

                    {/* Action Buttons - Matching Product Management Style */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Review Credit Limit Request Button — Shown ONLY when partner submitted a credit request */}
                        {(() => {
                          const reqLimit = u.distributor_profile?.requested_credit_limit ?? u.retailer_profile?.requested_credit_limit ?? 0;
                          const creditLimit = u.distributor_profile?.credit_limit ?? u.retailer_profile?.credit_limit ?? 0;
                          const hasPendingReq = reqLimit > 0 && reqLimit !== creditLimit;

                          if (!hasPendingReq) return null;

                          return (
                            <Link
                              href="/admin/credit-requests"
                              title={`Review requested credit limit of ₹${Number(reqLimit).toLocaleString('en-IN')}`}
                              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-1.5 rounded-[6px] font-black transition-all cursor-pointer flex items-center space-x-1.5 text-xs shadow-md shadow-amber-500/20 animate-pulse"
                            >
                              <span>⚡ Review Req (₹{Number(reqLimit).toLocaleString('en-IN')})</span>
                            </Link>
                          );
                        })()}

                        {/* View Dossier Button */}
                        <button
                          onClick={() => {
                            setDossierUser(u);
                            setIsDossierModalOpen(true);
                          }}
                          title="View Profile Details"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-[5px] font-bold transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Edit Role / Authorizations Button */}
                        <button
                          onClick={() => handleOpenRoleModal(u)}
                          title="Change Role & Authorizations"
                          className="bg-[#F8EAF4] hover:bg-[#F8EAF4] text-[#A71380] p-2 rounded-[5px] font-bold border border-[#F3D0E9] transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Toggle Status Button */}
                        {u.role !== "ADMIN" && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoadingId === u.id}
                            title={u.is_active ? "Deactivate Account" : "Activate Account"}
                            className={`p-2 rounded-[5px] font-bold transition-all cursor-pointer disabled:opacity-50 ${u.is_active
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {u.is_active ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer - Matching Product Management Design */}
        {filtered.length > 0 && (
          <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-slate-500">
                Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-slate-800">{Math.min(currentPage * pageSize, filtered.length)}</span> of{" "}
                <span className="font-bold text-slate-800">{filtered.length}</span> accounts
              </span>

              <div className="flex items-center space-x-1.5 text-slate-500">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Accounts per page"
                  className="bg-white border border-slate-200 rounded-[4px] px-2 py-1 font-bold text-slate-700 focus:outline-none focus:border-[#A71380]"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
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

      {/* MODAL 1: ADD NEW STAFF / USER ACCOUNT */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-[6px] max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-[#F8EAF4] text-[#0b2341] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
                  Account Registration Form
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">Create Staff or System Account</h3>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Suresh Rao"
                    value={staffFullName}
                    onChange={(e) => setStaffFullName(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Role *</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-bold text-[#0b2341] focus:bg-white focus:outline-none focus:border-[#A71380] cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN (Operations / Staff Privileges)</option>
                    <option value="DISTRIBUTOR">DISTRIBUTOR (Wholesale B2B Account)</option>
                    <option value="RETAILER">RETAILER (Pharmacy & Chemist)</option>
                    <option value="CUSTOMER">CUSTOMER (Retail Direct Buyer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address (Login ID) *</label>
                  <input
                    type="email"
                    required
                    placeholder="suresh.rao@pharmalink.com"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name (If Distributor)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rao Medical Wholesalers Ltd"
                    value={staffCompany}
                    onChange={(e) => setStaffCompany(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>

              {staffRole === "DISTRIBUTOR" && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-[5px] space-y-1.5">
                  <label className="block font-extrabold text-emerald-900 text-xs">
                    Allocated B2B Credit Limit (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={staffCreditLimit}
                    onChange={(e) => setStaffCreditLimit(Number(e.target.value))}
                    className="w-full border border-emerald-300 rounded-[5px] p-2.5 bg-white font-mono font-bold text-[#0b2341] focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-emerald-700 block">
                    Default: ₹5,00,000. Distributor can order on credit up to this threshold.
                  </span>
                </div>
              )}

              <div className="p-3 bg-[#F8EAF4]/60 rounded-[5px] border border-[#F3D0E9] text-[11px] text-[#A71380] leading-relaxed">
                <strong>Authorization Note:</strong> Creating this account will automatically grant role permissions for{" "}
                <span className="font-bold underline">{staffRole}</span>. You can change role scopes anytime.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[5px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitLoading}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-5 py-2.5 rounded-[5px] font-extrabold shadow-md shadow-[#A71380]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {addSubmitLoading ? "Saving to Database..." : "Register User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ROLE & PERMISSIONS */}
      {isRoleModalOpen && selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-[6px] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-[#F8EAF4] text-[#0b2341] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
                  Role Reassignment
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">Manage Role & Permissions</h3>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Target User</div>
                <div className="font-black text-sm text-[#0b2341]">{selectedUserForRole.full_name}</div>
                <div className="font-mono text-slate-500">{selectedUserForRole.email}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">Select New Assigned Role:</label>
                <div className="space-y-2">
                  {(["ADMIN", "DISTRIBUTOR", "RETAILER", "CUSTOMER"] as const).map((r) => {
                    const isSelected = selectedNewRole === r;
                    const rData = ROLE_PERMISSIONS[r];
                    return (
                      <label
                        key={r}
                        onClick={() => setSelectedNewRole(r)}
                        className={`flex items-start space-x-3 p-3 rounded-[5px] border transition-all cursor-pointer ${isSelected
                          ? "bg-[#F8EAF4] border-[#A71380] ring-2 ring-[#A71380]/20"
                          : "border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="roleChoice"
                          checked={isSelected}
                          onChange={() => setSelectedNewRole(r)}
                          className="mt-1 text-[#A71380]"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-black text-[#0b2341]">{r}</span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${rData.badgeColor}`}>
                              {rData.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{rData.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[5px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === selectedUserForRole.id}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-5 py-2.5 rounded-[5px] font-extrabold shadow-md shadow-[#A71380]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === selectedUserForRole.id ? "Updating Role..." : "Save Role & Update Permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DOSSIER VIEW MODAL */}
      {isDossierModalOpen && dossierUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-[6px] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-[#F8EAF4] text-[#0b2341] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
                  Account Dossier
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">{dossierUser.full_name}</h3>
              </div>
              <button onClick={() => setIsDossierModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-100">
                  <span className="text-slate-400 font-bold text-[10px] block uppercase">Role Type</span>
                  <span className="font-extrabold text-[#0b2341] text-xs">{dossierUser.role}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-100">
                  <span className="text-slate-400 font-bold text-[10px] block uppercase">Account Status</span>
                  <span className={`font-extrabold text-xs ${dossierUser.is_active ? "text-emerald-700" : "text-rose-700"}`}>
                    {dossierUser.is_active ? "Active" : "Deactivated"}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-[5px] border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] block uppercase">Email & Contact</span>
                <div className="font-bold text-slate-800">{dossierUser.email}</div>
                <div className="font-mono text-slate-600 text-[11px]">{dossierUser.phone || "No phone registered"}</div>
              </div>

              {dossierUser.distributor_profile && (
                <div className="p-3.5 bg-emerald-50/60 rounded-[5px] border border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-800 font-black text-[10px] uppercase tracking-wider">Distributor Corporate Profile</span>
                    <button
                      onClick={() => {
                        setIsDossierModalOpen(false);
                        handleOpenCreditLimitModal(dossierUser);
                      }}
                      className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-[4px] border border-emerald-300 cursor-pointer"
                    >
                      💳 Edit Limit
                    </button>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{dossierUser.distributor_profile.company_name}</div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium block">GSTIN:</span>
                      <span className="font-mono font-bold text-[#A71380]">{dossierUser.distributor_profile.gstin || "Verified"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Drug License:</span>
                      <span className="font-mono font-bold text-slate-800">{dossierUser.distributor_profile.drug_license_no || "Verified"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Approved Credit Limit:</span>
                      <span className="font-black text-[#0b2341] font-mono text-sm">
                        ₹{Number(dossierUser.distributor_profile.credit_limit || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {Boolean(
                      dossierUser.distributor_profile.requested_credit_limit &&
                      dossierUser.distributor_profile.requested_credit_limit > 0 &&
                      dossierUser.distributor_profile.requested_credit_limit !== dossierUser.distributor_profile.credit_limit
                    ) && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Requested Credit Limit:</span>
                          <span className="font-bold text-[#A71380] font-mono">
                            ₹{Number(dossierUser.distributor_profile.requested_credit_limit).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {dossierUser.retailer_profile && (
                <div className="p-3.5 bg-blue-50/60 rounded-[5px] border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-black text-[10px] uppercase tracking-wider">Retailer Pharmacy Profile</span>
                    <button
                      onClick={() => {
                        setIsDossierModalOpen(false);
                        handleOpenCreditLimitModal(dossierUser);
                      }}
                      className="text-[10px] font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded-[4px] border border-blue-300 cursor-pointer"
                    >
                      💳 Edit Limit
                    </button>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{dossierUser.retailer_profile.shop_name || "Pharmacy Chemist"}</div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium block">GSTIN:</span>
                      <span className="font-mono font-bold text-[#A71380]">{dossierUser.retailer_profile.gstin || "Verified"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Drug License:</span>
                      <span className="font-mono font-bold text-slate-800">{dossierUser.retailer_profile.drug_license_no || "Verified"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Approved Credit Limit:</span>
                      <span className="font-black text-[#0b2341] font-mono text-sm">
                        ₹{Number(dossierUser.retailer_profile.credit_limit || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    {Boolean(
                      dossierUser.retailer_profile.requested_credit_limit &&
                      dossierUser.retailer_profile.requested_credit_limit > 0 &&
                      dossierUser.retailer_profile.requested_credit_limit !== dossierUser.retailer_profile.credit_limit
                    ) && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Requested Credit Limit:</span>
                          <span className="font-bold text-[#A71380] font-mono">
                            ₹{Number(dossierUser.retailer_profile.requested_credit_limit).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F8EAF4]/50 rounded-[5px] border border-[#F3D0E9] text-center">
                  <span className="text-slate-400 font-bold text-[10px] block uppercase">Lifetime Orders</span>
                  <span className="text-lg font-black text-[#A71380]">{dossierUser.lifetime_orders || 0}</span>
                </div>
                <div className="p-3 bg-[#F8EAF4]/50 rounded-[5px] border border-[#F3D0E9] text-center">
                  <span className="text-slate-400 font-bold text-[10px] block uppercase">Total GMV (₹)</span>
                  <span className="text-lg font-black text-[#0b2341]">₹{Number(dossierUser.total_spent || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDossierModalOpen(false)}
                className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-5 py-2.5 rounded-[5px] font-extrabold text-xs shadow-md shadow-[#A71380]/20 cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT B2B CREDIT LIMIT MODAL */}
      {isCreditLimitModalOpen && selectedUserForCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b2341]/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0">

            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-[#0b2341] via-[#163a63] to-[#A71380] text-white p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase bg-white/15 text-white backdrop-blur-md px-3 py-0.5 rounded-full border border-white/20 tracking-wider">
                      B2B Credit Control
                    </span>
                    <span className="text-[10px] font-mono text-pink-200 font-bold">
                      USR-{String(selectedUserForCredit.id).padStart(3, "0")}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight mt-1">
                    Configure Credit Limit
                  </h3>
                  <p className="text-slate-200 text-[11px] opacity-90">
                    Set Net-30 revolving credit facility for wholesale transactions.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreditLimitModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-all cursor-pointer border border-white/20 shrink-0"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveCreditLimit} className="p-6 space-y-5 text-xs">
              {/* Business Partner Info Card */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0b2341] to-[#A71380] text-white font-black flex items-center justify-center text-sm shadow-md">
                    {selectedUserForCredit.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-[#0b2341]">{selectedUserForCredit.full_name}</div>
                    <div className="text-[11px] font-bold text-emerald-700">
                      {selectedUserForCredit.distributor_profile?.company_name || selectedUserForCredit.retailer_profile?.shop_name || "B2B Partner Account"}
                    </div>
                    <div className="font-mono text-slate-500 text-[10px]">{selectedUserForCredit.email}</div>
                  </div>
                </div>
                <span className="shrink-0 px-3 py-1 text-[10px] font-black rounded-full bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-2xs">
                  {selectedUserForCredit.role}
                </span>
              </div>

              {/* Partner Requested Credit Limit Highlight Box (Shows ONLY when user has requested limit) */}
              {(() => {
                const reqLimit = selectedUserForCredit.distributor_profile?.requested_credit_limit ?? selectedUserForCredit.retailer_profile?.requested_credit_limit ?? 0;
                const appLimit = selectedUserForCredit.distributor_profile?.credit_limit ?? selectedUserForCredit.retailer_profile?.credit_limit ?? 0;
                const isRequestedDifferent = reqLimit > 0 && reqLimit !== appLimit;

                if (!isRequestedDifferent) return null;

                return (
                  <div className="p-4 rounded-xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-purple-500/10 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          ⚡
                        </span>
                        <div>
                          <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider block">
                            Partner Requested Increase
                          </span>
                          <span className="text-[10px] text-amber-800">Submitted via Partner Portal</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-lg text-[#A71380] block">
                          ₹{Number(reqLimit).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-amber-300/50 pt-2">
                      <span>Currently Sanctioned Limit:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {appLimit > 0 ? `₹${Number(appLimit).toLocaleString('en-IN')}` : "₹0 (Not Approved Yet)"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCreditLimitInput(Number(reqLimit))}
                      className="w-full bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6f0a54] text-white font-extrabold py-2.5 px-4 rounded-lg text-xs transition-all cursor-pointer shadow-md shadow-[#A71380]/25 flex items-center justify-center space-x-2"
                    >
                      <span>⚡ One-Click Approve Requested Amount (₹{Number(reqLimit).toLocaleString('en-IN')})</span>
                    </button>
                  </div>
                );
              })()}

              {/* Main Input Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-black text-slate-800 text-xs uppercase tracking-wider">
                    Sanctioned Credit Limit (₹) *
                  </label>
                  <span className="text-[11px] font-mono font-bold text-[#A71380]">
                    ₹{Number(creditLimitInput || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    value={creditLimitInput}
                    onChange={(e) => setCreditLimitInput(Number(e.target.value))}
                    className="w-full border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 bg-white font-mono font-black text-2xl text-[#0b2341] focus:outline-none focus:border-[#A71380] focus:ring-4 focus:ring-[#A71380]/15 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Quick Preset Limits:
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: "₹2 Lakhs", value: 200000 },
                    { label: "₹5 Lakhs", value: 500000 },
                    { label: "₹10 Lakhs", value: 1000000 },
                    { label: "₹25 Lakhs", value: 2500000 },
                    { label: "₹50 Lakhs", value: 5000000 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setCreditLimitInput(preset.value)}
                      className={`py-2 px-1.5 rounded-lg text-[11px] font-black border transition-all cursor-pointer text-center ${creditLimitInput === preset.value
                        ? "bg-gradient-to-r from-[#0b2341] to-[#A71380] text-white border-transparent shadow-md shadow-[#A71380]/30 scale-102"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Policy Overview Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start space-x-2.5 text-xs">
                <span className="text-[#A71380] font-bold text-base shrink-0">🛡️</span>
                <div className="text-[11px] leading-relaxed text-slate-600">
                  <strong className="text-slate-800 font-bold">Credit Control Governance:</strong> Updating this credit limit instantly updates the partner's purchasing quota under Net-30 credit terms.
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreditLimitModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl font-extrabold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creditLimitLoading}
                  className="bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6f0a54] text-white px-7 py-2.5 rounded-xl font-extrabold text-xs shadow-lg shadow-[#A71380]/30 transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                >
                  <span>{creditLimitLoading ? "Applying Changes..." : "Save & Apply Credit Limit 💳"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
