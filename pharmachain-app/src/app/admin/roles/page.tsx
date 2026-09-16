"use client";

import React, { useState, useEffect } from "react";
import { usersAPI } from "@/lib/api";

export interface SystemRoleDefinition {
  id: "ADMIN" | "DISTRIBUTOR" | "RETAILER" | "CUSTOMER";
  name: string;
  icon: string;
  portal_url: string;
  description: string;
  assigned_modules: string[];
}

export interface PermissionModule {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
}

export const SYSTEM_MODULES: PermissionModule[] = [
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
    name: "B2B Distributor & Retailer KYC Verification",
    icon: "📑",
    category: "Compliance",
    description: "Review submitted GSTIN and Drug Licenses (Form 20/21, Form 20B/21B), approve or reject trade onboarding.",
  },
  {
    id: "pricing",
    name: "Dynamic Pricing & Discount Rules",
    icon: "🏷️",
    category: "Commercial",
    description: "Configure role multipliers, PTR trade margins, PTS wholesale rates, and 10+1 free promotional schemes.",
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
    name: "Staff & User Access Management",
    icon: "👥",
    category: "Security",
    description: "Create staff personnel, toggle account activation, and manage role access permissions.",
  },
];

// 4 Pharma Supply Chain Roles
const DATABASE_ROLES: SystemRoleDefinition[] = [
  {
    id: "ADMIN",
    name: "Super Admin (Executive Operations)",
    icon: "🛡️",
    portal_url: "/admin/dashboard",
    description: "Master administrative control across all 8 enterprise operational & regulatory subsystems.",
    assigned_modules: ["products", "orders", "kyc", "pricing", "inventory", "reports", "audit", "users"],
  },
  {
    id: "RETAILER",
    name: "Pharmacy & Chemist Retailer",
    icon: "🏪",
    portal_url: "/retailer/dashboard",
    description: "Licensed retail chemist (Form 20/21) purchasing at Price-To-Retailer (PTR) trade discounts, 10+1 schemes & Net-30 trade credit.",
    assigned_modules: ["products", "orders"],
  },
  {
    id: "DISTRIBUTOR",
    name: "B2B Wholesale Distributor",
    icon: "🏬",
    portal_url: "/distributor/dashboard",
    description: "Verified B2B wholesale pharmaceutical stockist (Form 20B/21B) with bulk MOQ master shipper cartons & GST tax invoicing.",
    assigned_modules: ["products", "orders"],
  },
  {
    id: "CUSTOMER",
    name: "Retail Patient / Consumer",
    icon: "👤",
    portal_url: "/customer/dashboard",
    description: "Direct retail consumer purchasing therapeutic products at standard MRP with prescription uploads.",
    assigned_modules: ["products", "orders"],
  },
];

export default function AdminRolesMatrixPage() {
  const [roles, setRoles] = useState<SystemRoleDefinition[]>(DATABASE_ROLES);
  const [userCounts, setUserCounts] = useState<{ ADMIN: number; DISTRIBUTOR: number; RETAILER: number; CUSTOMER: number }>({
    ADMIN: 0,
    DISTRIBUTOR: 0,
    RETAILER: 0,
    CUSTOMER: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SystemRoleDefinition | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Add User Form State
  const [userFormData, setUserFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "ADMIN" as "ADMIN" | "DISTRIBUTOR" | "RETAILER" | "CUSTOMER",
    selectedModules: ["products", "orders", "kyc", "pricing", "inventory", "reports", "audit", "users"] as string[],
  });

  // Edit Role Form State
  const [roleFormData, setRoleFormData] = useState({
    assigned_modules: [] as string[],
  });

  // Fetch real database user counts for all roles
  const loadDatabaseCounts = async () => {
    try {
      setLoading(true);
      const allUsers = await usersAPI.list();
      const counts = {
        ADMIN: allUsers.filter((u: any) => u.role === "ADMIN").length,
        DISTRIBUTOR: allUsers.filter((u: any) => u.role === "DISTRIBUTOR").length,
        RETAILER: allUsers.filter((u: any) => u.role === "RETAILER").length,
        CUSTOMER: allUsers.filter((u: any) => u.role === "CUSTOMER").length,
      };
      setUserCounts(counts);

      // Load custom saved permissions if available
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("pharmalink_db_roles_perms");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length >= 3) {
              setRoles(parsed);
            }
          } catch (e) { }
        }
      }
    } catch (err: any) {
      console.error("Failed to load users for roles count:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseCounts();
  }, []);

  const saveRolesToStorage = (updatedRoles: SystemRoleDefinition[]) => {
    setRoles(updatedRoles);
    if (typeof window !== "undefined") {
      localStorage.setItem("pharmalink_db_roles_perms", JSON.stringify(updatedRoles));
    }
  };

  // Open Configure Tickmarks Modal
  const handleOpenEditModal = (role: SystemRoleDefinition) => {
    setSelectedRole(role);
    setRoleFormData({
      assigned_modules: [...role.assigned_modules],
    });
    setIsEditModalOpen(true);
  };

  const toggleRoleModule = (moduleId: string) => {
    setRoleFormData((prev) => {
      const exists = prev.assigned_modules.includes(moduleId);
      return {
        assigned_modules: exists
          ? prev.assigned_modules.filter((m) => m !== moduleId)
          : [...prev.assigned_modules, moduleId],
      };
    });
  };

  const handleUpdateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    const updated = roles.map((r) =>
      r.id === selectedRole.id
        ? {
          ...r,
          assigned_modules: roleFormData.assigned_modules,
        }
        : r
    );

    saveRolesToStorage(updated);
    setIsEditModalOpen(false);
    setStatusMsg({
      type: "success",
      text: `✓ Role '${selectedRole.name}' permissions updated with ${roleFormData.assigned_modules.length} authorized modules!`,
    });
  };

  // Open Add User with Role Modal
  const handleOpenAddUserModal = (defaultRole: "ADMIN" | "DISTRIBUTOR" | "RETAILER" | "CUSTOMER" = "ADMIN") => {
    const roleDef = roles.find((r) => r.id === defaultRole) || roles[0];
    setUserFormData({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      role: defaultRole,
      selectedModules: [...roleDef.assigned_modules],
    });
    setIsAddUserModalOpen(true);
  };

  const handleRoleSelectionChange = (newRole: "ADMIN" | "DISTRIBUTOR" | "RETAILER" | "CUSTOMER") => {
    const roleDef = roles.find((r) => r.id === newRole);
    setUserFormData((prev) => ({
      ...prev,
      role: newRole,
      selectedModules: roleDef ? [...roleDef.assigned_modules] : prev.selectedModules,
    }));
  };

  const toggleUserModule = (moduleId: string) => {
    setUserFormData((prev) => {
      const exists = prev.selectedModules.includes(moduleId);
      return {
        ...prev,
        selectedModules: exists
          ? prev.selectedModules.filter((m) => m !== moduleId)
          : [...prev.selectedModules, moduleId],
      };
    });
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setStatusMsg(null);

    try {
      const created = await usersAPI.create({
        email: userFormData.email.trim(),
        password: userFormData.password || "User@123",
        full_name: userFormData.full_name.trim(),
        phone: userFormData.phone.trim(),
        role: userFormData.role,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(`staff_perms_${created.id}`, JSON.stringify(userFormData.selectedModules));
      }

      await loadDatabaseCounts();
      setIsAddUserModalOpen(false);
      setStatusMsg({
        type: "success",
        text: `✓ User '${userFormData.full_name}' created successfully with role ${userFormData.role}!`,
      });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to create user account." });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
              User Roles &amp; Permissions
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
              ● 4 Store User Roles Active
            </span>
          </div>
          <h1 className="text-xl font-black text-[#0b2341] tracking-tight mt-1.5">
            User Roles &amp; Access Permissions
          </h1>
        </div>

        <button
          onClick={() => handleOpenAddUserModal("ADMIN")}
          className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-4 py-2.5 rounded-lg font-extrabold text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add User with Role</span>
        </button>
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

      {/* 2. THE 4 DATABASE ROLES CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {roles.map((role) => {
          const isSuperAdmin = role.id === "ADMIN";
          const isDistributor = role.id === "DISTRIBUTOR";
          const activeUsersCount = userCounts[role.id] || 0;

          const borderColor = isSuperAdmin
            ? "border-purple-200 hover:border-purple-400"
            : isDistributor
              ? "border-emerald-200 hover:border-emerald-400"
              : "border-[#F3D0E9] hover:border-blue-400";
          const badgeBg = isSuperAdmin
            ? "bg-purple-50 text-purple-800 border-purple-200"
            : isDistributor
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]";

          return (
            <div
              key={role.id}
              className={`bg-white border-2 ${borderColor} rounded-[6px] p-6 shadow-2xs space-y-4 transition-all flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{role.icon}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {loading ? "..." : `${activeUsersCount} Users`}
                    </span>
                    <span className={`px-3 py-1 rounded-full font-black text-[10px] border ${badgeBg}`}>
                      {role.id}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-black text-lg text-[#0b2341]">{role.name}</h3>
                </div>

                <div className="bg-slate-50 p-3 rounded-[5px] border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold text-[11px]">Portal Gateway:</span>
                    <code className="text-[#A71380] font-mono font-bold">{role.portal_url}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold text-[11px]">Authorized Modules:</span>
                    <span className="font-mono font-black text-[#0b2341]">
                      {role.assigned_modules.length} / {SYSTEM_MODULES.length}
                    </span>
                  </div>
                </div>

                {/* Subsystem Badges Preview */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    Accessible Subsystems:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SYSTEM_MODULES.map((mod) => {
                      const hasAccess = role.assigned_modules.includes(mod.id);
                      return (
                        <span
                          key={mod.id}
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold inline-flex items-center space-x-1 border ${hasAccess
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-black shadow-2xs"
                            : "bg-slate-100 text-slate-400 border-slate-200 opacity-40 line-through"
                            }`}
                        >
                          <span>{hasAccess ? "☑" : "☐"}</span>
                          <span>{mod.id.toUpperCase()}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleOpenEditModal(role)}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white py-2.5 px-3 rounded-lg font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Manage</span>
                </button>
                <button
                  onClick={() => handleOpenAddUserModal(role.id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  title={`Add user under ${role.id}`}
                >
                  <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Add User</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ROLES PERMISSIONS MATRIX COMPARISON TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#0b2341]">Subsystem Authorization Matrix</h3>
          </div>
          <span className="text-[10px] font-bold bg-[#F8EAF4] text-[#A71380] px-3 py-1 rounded-full border border-[#F3D0E9]">
            Database RBAC Matrix
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] bg-slate-50">
                <th className="py-3.5 px-5">Enterprise Subsystem Module</th>
                <th className="py-3.5 px-4 text-center">🛡️ SUPER ADMIN</th>
                <th className="py-3.5 px-4 text-center">🏪 RETAILER</th>
                <th className="py-3.5 px-4 text-center">🏬 DISTRIBUTOR</th>
                <th className="py-3.5 px-4 text-center">👤 CUSTOMER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SYSTEM_MODULES.map((mod) => {
                const adminHas = roles.find((r) => r.id === "ADMIN")?.assigned_modules.includes(mod.id);
                const retHas = roles.find((r) => r.id === "RETAILER")?.assigned_modules.includes(mod.id);
                const distHas = roles.find((r) => r.id === "DISTRIBUTOR")?.assigned_modules.includes(mod.id);
                const custHas = roles.find((r) => r.id === "CUSTOMER")?.assigned_modules.includes(mod.id);

                return (
                  <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xl">{mod.icon}</span>
                        <div>
                          <div className="font-bold text-[#0b2341] text-xs">{mod.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Admin Status */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-black text-[10px] border ${adminHas
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                      >
                        {adminHas ? "✓ AUTHORIZED" : "✕ LOCKED"}
                      </span>
                    </td>

                    {/* Retailer Status */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-black text-[10px] border ${retHas
                          ? "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                      >
                        {retHas ? "✓ AUTHORIZED" : "✕ LOCKED"}
                      </span>
                    </td>

                    {/* Distributor Status */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-black text-[10px] border ${distHas
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                      >
                        {distHas ? "✓ AUTHORIZED" : "✕ LOCKED"}
                      </span>
                    </td>

                    {/* Customer Status */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-black text-[10px] border ${custHas
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                      >
                        {custHas ? "✓ AUTHORIZED" : "✕ LOCKED"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: ADD USER WITH ROLE */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[6px] max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-[#F8EAF4] text-[#0b2341] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
                  User Onboarding
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">Add User & Assign Core Role</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              {/* User Role Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Select User Role (PostgreSQL Enum) *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {roles.map((r) => {
                    const isSelected = userFormData.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleSelectionChange(r.id)}
                        className={`p-3 rounded-[5px] border text-center transition-all cursor-pointer ${isSelected
                          ? "bg-[#F8EAF4] border-[#A71380] ring-2 ring-[#A71380]/20 shadow-xs"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <span className="text-xl block mb-1">{r.icon}</span>
                        <span className="font-extrabold text-[#0b2341] text-xs block">{r.id}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{r.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={userFormData.full_name}
                    onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rajesh@example.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>

              {/* Module Tickmarks Checkboxes */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="font-bold text-slate-800 block">
                  Authorized Subsystem Modules (Tick / Untick):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = userFormData.selectedModules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        onClick={() => toggleUserModule(mod.id)}
                        className={`flex items-center space-x-2.5 p-2.5 rounded-[5px] border transition-all cursor-pointer ${isChecked
                          ? "bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/20"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer"
                        />
                        <div className="min-w-0">
                          <span className="font-extrabold text-[#0b2341] text-xs truncate block">
                            {mod.icon} {mod.name}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[5px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-[5px] font-extrabold shadow-md shadow-[#A71380]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitLoading ? "Creating User..." : "Save & Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT ROLE PERMISSION TICKMARKS */}
      {isEditModalOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-[6px] max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-[#F8EAF4] text-[#0b2341] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
                  Role Permissions Configurator
                </span>
                <h3 className="text-lg font-black text-[#0b2341] mt-1">
                  Configure Subsystems for {selectedRole.name}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateRoleSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-[5px] border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{selectedRole.icon}</span>
                  <div>
                    <div className="font-black text-sm text-[#0b2341]">{selectedRole.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{selectedRole.portal_url}</div>
                  </div>
                </div>
                <span className="bg-purple-50 text-purple-800 font-extrabold px-3 py-1 rounded-[5px] border border-purple-200 text-[10px]">
                  {selectedRole.id}
                </span>
              </div>

              {/* Checkboxes List */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">
                  Accessible Subsystem Modules (Tick / Untick):
                </label>
                <div className="space-y-2 max-h-72 overflow-y-auto p-1">
                  {SYSTEM_MODULES.map((mod) => {
                    const isChecked = roleFormData.assigned_modules.includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        onClick={() => toggleRoleModule(mod.id)}
                        className={`flex items-center justify-between p-3 rounded-[5px] border transition-all cursor-pointer ${isChecked
                          ? "bg-emerald-50/80 border-emerald-500"
                          : "bg-slate-50/60 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => { }}
                            className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                          />
                          <div>
                            <div className="font-black text-[#0b2341] text-xs flex items-center space-x-1.5">
                              <span>{mod.icon}</span>
                              <span>{mod.name}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-[4px] border shrink-0 ${isChecked
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
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-[5px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-[5px] font-extrabold shadow-md shadow-[#A71380]/20 transition-all cursor-pointer"
                >
                  Save Role Permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
