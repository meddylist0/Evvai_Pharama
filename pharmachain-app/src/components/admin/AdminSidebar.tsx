"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EvvaiLogo } from "@/components/shared/EvvaiLogo";
import { authAPI } from "@/lib/api";

interface SubMenuItem {
  id: string;
  label: string;
  badge?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  children?: SubMenuItem[];
}

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const router = useRouter();

  // Menu items list with dropdown children
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Overview Dashboard",
      icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    },
    {
      id: "products-group",
      label: "Product Management",
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.072a2 2 0 00-1.874 1.258l-.19.476a2 2 0 001.258 2.531l2.387.955a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.955a2 2 0 002.531-1.258l.19-.476z",
      children: [
        { id: "products/new", label: "Add New Product", badge: "New" },
        { id: "products", label: "All Products" },
        { id: "categories", label: "Product Categories" },
        // { id: "pricing", label: "Role Pricing Rules" },
      ],
    },
    {
      id: "orders-group",
      label: "Orders Fulfillment",
      icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
      children: [
        { id: "orders", label: "All Orders" },
        { id: "orders?status=Pending", label: "Pending Orders", badge: "Live" },
        { id: "orders?status=Shipped", label: "Dispatched Orders" },
      ],
    },
    {
      id: "inventory-group",
      label: "Stock & Warehouse",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      children: [
        { id: "inventory", label: "Stock Inventory" },
      ],
    },
    {
      id: "kyc-group",
      label: "Partner KYC & Compliance",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      children: [
        { id: "kyc", label: "KYC Verification", badge: "Live" },
      ],
    },
    {
      id: "users-group",
      label: "Accounts & Credit Lines",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      children: [
        { id: "users", label: "Customer Accounts" },
        { id: "credit-requests", label: "Credit Requests", badge: "Review" },
        { id: "roles", label: "Staff Access & Roles" },
      ],
    },
    {
      id: "reports",
      label: "Reports & Analytics",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      id: "inquiries",
      label: "Commercial Inquiries",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
    {
      id: "audit",
      label: "Audit Logs",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      id: "settings",
      label: "System Settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    },
  ];

  // Accordion open/close state tracking - Only ONE dropdown open at a time
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Auto-expand accordion group if activeTab is a child item
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const hasChild = item.children.some(
          (child) => child.id === activeTab || (activeTab.startsWith("orders") && child.id.startsWith("orders")) || (activeTab.startsWith("products") && child.id.startsWith("products")) || (activeTab.startsWith("credit-requests") && child.id.startsWith("credit-requests"))
        );
        if (hasChild) {
          setOpenGroup(item.id);
        }
      }
    });
  }, [activeTab]);

  const toggleGroup = (groupId: string) => {
    setOpenGroup((prev) => (prev === groupId ? null : groupId));
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out of the Admin panel?")) {
      authAPI.logout();
      router.push("/login");
    }
  };

  return (
    <aside className="w-64 bg-[#0b2341] text-white flex flex-col justify-between p-4 h-full border-r border-slate-800 shrink-0 overflow-y-auto scrollbar-thin" suppressHydrationWarning>
      {/* Brand Header */}
      <div className="space-y-6" suppressHydrationWarning>
        <Link href="/" className="flex flex-col space-y-1 px-2 pt-1 cursor-pointer">
          <EvvaiLogo className="h-8" variant="light" />
          <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase block pl-0.5 mt-0.5">
            Enterprise Admin Panel
          </span>
        </Link>

        {/* Navigation Items with Generous Padding & Spacing */}
        <nav className="space-y-2" suppressHydrationWarning>
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isGroupOpen = openGroup === item.id;
            const isDirectActive = activeTab === item.id;
            const isChildActive =
              hasChildren &&
              item.children?.some((c) => {
                if (c.id === activeTab) return true;
                if (activeTab.startsWith("orders") && c.id.startsWith("orders")) return true;
                if (activeTab.startsWith("products") && c.id.startsWith("products")) return true;
                return false;
              });

            return (
              <div key={item.id} className="space-y-1.5" suppressHydrationWarning>
                {/* Parent Menu Item Button */}
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleGroup(item.id);
                    } else {
                      onSelectTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[6px] text-[13px] font-extrabold transition-all cursor-pointer ${isDirectActive || isChildActive
                    ? "bg-[#A71380] text-white shadow-md shadow-[#A71380]/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  suppressHydrationWarning
                >
                  <div className="flex items-center space-x-3 text-left min-w-0">
                    <svg className="w-4 h-4 shrink-0 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    <span className="truncate leading-none">{item.label}</span>
                  </div>

                  {/* Dropdown Chevron Arrow Indicator */}
                  {hasChildren && (
                    <svg
                      className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 shrink-0 ml-1 ${isGroupOpen ? "rotate-180 text-white" : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {/* Collapsible Sub-menu Dropdown Items */}
                {hasChildren && isGroupOpen && (
                  <div className="pl-3 py-1 space-y-1.5 border-l-2 border-[#A71380]/60 ml-3.5 animate-in slide-in-from-top-1 duration-150" suppressHydrationWarning>
                    {item.children?.map((sub) => {
                      const isSubActive = activeTab === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => onSelectTab(sub.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-xs font-bold transition-all cursor-pointer text-left ${isSubActive
                            ? "bg-[#A71380] text-white font-black shadow-xs"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                            }`}
                          suppressHydrationWarning
                        >
                          <div className="flex items-center space-x-2 min-w-0 pr-1 flex-1">
                            <span className={`text-[10px] shrink-0 leading-none ${isSubActive ? "text-white" : "text-slate-400"}`}>•</span>
                            <span className="truncate leading-none">{sub.label}</span>
                          </div>
                          {sub.badge && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-[4px] shrink-0 ml-1 uppercase ${isSubActive
                              ? "bg-white text-[#A71380]"
                              : "bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9]"
                              }`}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-3 border-t border-slate-800/80 pt-4 mt-auto" suppressHydrationWarning>
        <Link
          href="/"
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-[6px] text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Main Website</span>
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-[6px] text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
          suppressHydrationWarning
        >
          <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
