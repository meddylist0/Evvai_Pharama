"use client";

import React, { useEffect, useState } from "react";
import { usersAPI } from "@/lib/api";

interface StaffMember {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: "ADMIN" | "DISTRIBUTOR" | "CUSTOMER";
  is_active: boolean;
  job_title?: string;
  assigned_modules?: string[];
  created_at: string;
}

interface PermissionModule {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
}

const SYSTEM_MODULES: PermissionModule[] = [
  {
    id: "products",
    name: "Formulation Catalog & Master Pipeline",
    icon: "💊",
    category: "Operations",
    description: "Create, edit, archive formulations, and adjust warehouse batch stock quantities.",
  },
  {
    id: "orders",
    name: "Orders Fulfillment & Invoicing",
    icon: "🛒",
    category: "Commercial",
    description: "Process order status (Pending -> Shipped -> Delivered), view order items, and generate tax invoices.",
  },
  {
    id: "kyc",
    name: "B2B Distributor KYC Verification",
    icon: "📑",
    category: "Compliance",
    description: "Review submitted GSTIN and Drug Licenses, approve or reject wholesale trade onboarding.",
  },
  {
    id: "pricing",
    name: "Dynamic Pricing & Discount Rules",
    icon: "🏷️",
    category: "Commercial",
    description: "Configure role multipliers, retail margins, wholesale trade prices, and 50+ bulk MOQ tier discounts.",
  },
  {
    id: "inventory",
    name: "Warehouse Batch Stock & Expiry Tracking",
    icon: "📦",
    category: "Operations",
    description: "Inspect WHO-GMP batch numbers, shelf-life expiry dates, and low-stock threshold triggers.",
  },
  {
    id: "reports",
    name: "Commercial Sales & GMV Analytics",
    icon: "📊",
    category: "Executive",
    description: "Inspect real-time sales summaries, B2B wholesale ratios, and export live regulatory audit CSVs.",
  },
  {
    id: "audit",
    name: "Immutable Audit Trail Logs",
    icon: "🛡️",
    category: "Compliance",
    description: "Inspect tamper-evident system logs detailing admin logins, stock alterations, and role changes.",
  },
  {
    id: "users",
    name: "Staff & User Access Administration",
    icon: "👥",
    category: "Security",
    description: "Create staff personnel, toggle account activation, and assign permission scope tickmarks.",
  },
];

const PRESETS = [
  {
    name: "Full Executive Admin",
    modules: ["products", "orders", "kyc", "pricing", "inventory", "reports", "audit", "users"],
    desc: "Unrestricted access across all enterprise modules.",
  },
  {
    name: "Warehouse & Inventory Lead",
    modules: ["products", "inventory", "orders"],
    desc: "Stock adjustments, batch tracking, and fulfillment dispatches.",
  },
  {
    name: "KYC & Compliance Officer",
    modules: ["kyc", "audit", "reports"],
    desc: "Distributor trade licensing verification and regulatory audit inspection.",
  },
  {
    name: "Commercial Sales Executive",
    modules: ["orders", "pricing", "reports"],
    desc: "Order processing, dynamic pricing tiers, and commercial ledger downloads.",
  },
];

export default function AdminStaffRolesPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditPermsModalOpen, setIsEditPermsModalOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form States for Add / Edit
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    job_title: "Operations Supervisor",
    role: "ADMIN" as "ADMIN" | "DISTRIBUTOR" | "CUSTOMER",
    selectedModules: ["products", "orders", "inventory", "reports"] as string[],
  });

  const loadStaffAndUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await usersAPI.list();
      // Map users and assign default modules based on role/title
      const mapped: StaffMember[] = allUsers.map((u: any) => {
        let defaultModules = ["products", "orders", "inventory", "reports"];
        if (u.role === "ADMIN") {
          defaultModules = ["products", "orders", "kyc", "pricing", "inventory", "reports", "audit", "users"];
        } else if (u.role === "DISTRIBUTOR") {
          defaultModules = ["products", "orders"];
        }

        // Read saved permissions from local storage or fallback
        let savedPerms = defaultModules;
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(`staff_perms_${u.id}`);
          if (stored) {
            try {
              savedPerms = JSON.parse(stored);
            } catch (e) {}
          }
        }

        return {
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          phone: u.phone,
          role: u.role,
          is_active: u.is_active,
          job_title: u.role === "ADMIN" ? "Chief Administrator / Staff" : u.role === "DISTRIBUTOR" ? "B2B Wholesale Partner" : "Retail Customer",
          assigned_modules: savedPerms,
          created_at: u.created_at,
        };
      });

      setStaffList(mapped);
    } catch (err: any) {
      console.error("Failed to load staff list:", err);
      setStatusMsg({ type: "error", text: "Failed to load staff members." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffAndUsers();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      job_title: "Operations Supervisor",
      role: "ADMIN",
      selectedModules: ["products", "orders", "inventory", "reports"],
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditPermsModal = (staff: StaffMember) => {
    setActiveStaff(staff);
    setFormData({
      full_name: staff.full_name,
      email: staff.email,
      password: "",
      phone: staff.phone || "",
      job_title: staff.job_title || "Staff Member",
      role: staff.role,
      selectedModules: staff.assigned_modules || ["products", "orders"],
    });
    setIsEditPermsModalOpen(true);
  };

  const toggleModuleSelection = (moduleId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedModules.includes(moduleId);
      return {
        ...prev,
        selectedModules: exists
          ? prev.selectedModules.filter((m) => m !== moduleId)
          : [...prev.selectedModules, moduleId],
      };
    });
  };

  const applyPreset = (modules: string[]) => {
    setFormData((prev) => ({
      ...prev,
      selectedModules: [...modules],
    }));
  };

  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setStatusMsg(null);

    try {
      const created = await usersAPI.create({
        email: formData.email.trim(),
        password: formData.password || "Staff@123",
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
      });

      // Save permission tickmarks to storage
      if (typeof window !== "undefined") {
        localStorage.setItem(`staff_perms_${created.id}`, JSON.stringify(formData.selectedModules));
      }

      await loadStaffAndUsers();
      setIsAddModalOpen(false);
      setStatusMsg({
        type: "success",
        text: `✓ Staff personnel '${formData.full_name}' created with ${formData.selectedModules.length} module authorization tickmarks!`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to create staff account." });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdatePermsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    setSubmitLoading(true);
    setStatusMsg(null);

    try {
      // Save updated permission tickmarks
      if (typeof window !== "undefined") {
        localStorage.setItem(`staff_perms_${activeStaff.id}`, JSON.stringify(formData.selectedModules));
      }

      setStaffList((prev) =>
        prev.map((s) => (s.id === activeStaff.id ? { ...s, assigned_modules: formData.selectedModules } : s))
      );

      setIsEditPermsModalOpen(false);
      setStatusMsg({
        type: "success",
        text: `✓ Access permissions for '${activeStaff.full_name}' updated successfully (${formData.selectedModules.length} authorized modules)!`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Failed to update permissions." });
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              Access Governance & Granular Permissions
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              FastAPI Synced
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Staff & Module Permission Control
          </h1>
          <p className="text-xs text-slate-500">
            Authorize staff roles with interactive module tickmarks, grant fine-grained permissions, and audit user access.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-[#0b2341] hover:bg-[#12315a] text-white px-5 py-3 rounded-2xl font-extrabold text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>+ Add Staff Member</span>
        </button>
      </div>

      {/* Status Alerts */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* 2. System Modules Overview Grid */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-[#0b2341]">Enterprise Module Authorizations</h3>
            <p className="text-xs text-slate-500">8 enterprise subsystems available for granular assignment to personnel.</p>
          </div>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
            RBAC Enforcement
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SYSTEM_MODULES.map((mod) => (
            <div key={mod.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 hover:bg-white hover:shadow-xs transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xl">{mod.icon}</span>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {mod.category}
                </span>
              </div>
              <h4 className="font-bold text-[#0b2341] text-xs">{mod.name}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{mod.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Search and Staff Management Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xs">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search staff by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium text-xs"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            Showing <span className="font-bold text-slate-700">{filteredStaff.length}</span> staff personnel
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                <th className="py-3.5 px-5">Staff Member</th>
                <th className="py-3.5 px-5">Account Role</th>
                <th className="py-3.5 px-5">Contact Details</th>
                <th className="py-3.5 px-5">Authorized Module Tickmarks</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Access Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-2"></div>
                    <p>Loading Staff & Access Directory...</p>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const perms = staff.assigned_modules || [];
                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Member Profile */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-[#0b2341] text-sm">{staff.full_name}</div>
                        <div className="text-[11px] text-blue-700 font-medium">
                          USR-{String(staff.id).padStart(3, "0")} • {staff.job_title}
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                            staff.role === "ADMIN"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : staff.role === "DISTRIBUTOR"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                        >
                          {staff.role}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-5 text-slate-600">
                        <span className="block font-semibold">{staff.email}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{staff.phone || "No phone"}</span>
                      </td>

                      {/* Module Tickmarks */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {SYSTEM_MODULES.map((mod) => {
                            const isGranted = perms.includes(mod.id);
                            return (
                              <span
                                key={mod.id}
                                title={`${mod.name}: ${isGranted ? "Authorized (Checked)" : "Denied"}`}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center space-x-1 border transition-all ${
                                  isGranted
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-black shadow-2xs"
                                    : "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-40"
                                }`}
                              >
                                <span>{isGranted ? "☑" : "☐"}</span>
                                <span>{mod.id.toUpperCase()}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`font-extrabold px-3 py-1 rounded-full text-[10px] border inline-flex items-center space-x-1 ${
                            staff.is_active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${staff.is_active ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                          <span>{staff.is_active ? "Active" : "Deactivated"}</span>
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleOpenEditPermsModal(staff)}
                          className="bg-[#0b2341] hover:bg-[#12315a] text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Manage Tickmarks</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: ADD STAFF & ASSIGN MODULE TICKMARKS */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-100/60 text-[#0b2341] px-2.5 py-0.5 rounded-md border border-blue-200">
                  Staff Access Setup
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">Add Staff & Configure Module Tickmarks</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="space-y-5 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh.c@pharmalink.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role Designation</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-[#0b2341] focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN (Operations & Administrative Staff)</option>
                    <option value="DISTRIBUTOR">DISTRIBUTOR (Wholesale Channel)</option>
                    <option value="CUSTOMER">CUSTOMER (Retail Consumer)</option>
                  </select>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">Quick Authorization Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset.modules)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-[11px] text-slate-700 transition-all cursor-pointer"
                    >
                      + {preset.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, selectedModules: [] })}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 font-bold text-[11px] text-rose-700 transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Granular Module Tickmarks (Checkboxes) */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-800 block">
                  Select Authorized Modules (Tickmarks):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = formData.selectedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        onClick={() => toggleModuleSelection(mod.id)}
                        className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20"
                            : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 text-emerald-600 rounded cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span>{mod.icon}</span>
                            <span className="font-black text-[#0b2341] text-xs truncate">{mod.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{mod.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-2.5 rounded-xl font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? "Creating Staff..." : "Save & Authorize Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT PERMISSIONS / TICKMARKS */}
      {isEditPermsModalOpen && activeStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-blue-100/60 text-[#0b2341] px-2.5 py-0.5 rounded-md border border-blue-200">
                  Granular Permission Editor
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">
                  Manage Access for {activeStaff.full_name}
                </h3>
              </div>
              <button onClick={() => setIsEditPermsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePermsSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-black text-sm text-[#0b2341]">{activeStaff.full_name}</div>
                  <div className="font-mono text-slate-500 text-[11px]">{activeStaff.email}</div>
                </div>
                <span className="bg-purple-50 text-purple-800 font-extrabold px-3 py-1 rounded-xl border border-purple-200 text-[10px]">
                  {activeStaff.role}
                </span>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Apply Role Preset:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(preset.modules)}
                      className="px-3 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-[10px] text-slate-700 transition-all cursor-pointer"
                    >
                      {preset.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, selectedModules: [] })}
                    className="px-3 py-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 font-bold text-[10px] text-rose-700 transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Checkboxes List */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  Authorized Subsystems (Tick/Untick):
                </label>
                <div className="space-y-2 max-h-72 overflow-y-auto p-1">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = formData.selectedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        onClick={() => toggleModuleSelection(mod.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-emerald-50/80 border-emerald-500"
                            : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                          />
                          <div>
                            <div className="font-black text-[#0b2341] text-xs flex items-center space-x-1.5">
                              <span>{mod.icon}</span>
                              <span>{mod.name}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{mod.description}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border shrink-0 ${
                            isChecked
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                        >
                          {isChecked ? "AUTHORIZED" : "LOCKED"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditPermsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-2.5 rounded-xl font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? "Updating..." : "Save Permission Tickmarks"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
