"use client";

import React, { useState, useEffect } from "react";
import { INITIAL_LOCAL_BUYERS, LocalBuyer } from "@/data/mockData";

export default function LocalBuyersPage() {
  const [buyers, setBuyers] = useState<LocalBuyer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Pagination State (Matching Admin Console)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<LocalBuyer["type"]>("RMP_DOCTOR");
  const [ownerName, setOwnerName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [mobile, setMobile] = useState("");
  const [villageTown, setVillageTown] = useState("");
  const [district, setDistrict] = useState("");
  const [creditLimit, setCreditLimit] = useState(25000);

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load buyers from localStorage or initial mock data
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pharmalink_local_buyers");
      if (saved) {
        setBuyers(JSON.parse(saved));
      } else {
        setBuyers(INITIAL_LOCAL_BUYERS);
        localStorage.setItem("pharmalink_local_buyers", JSON.stringify(INITIAL_LOCAL_BUYERS));
      }
    } catch (e) {
      setBuyers(INITIAL_LOCAL_BUYERS);
    }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (val: string) => {
    setTypeFilter(val);
    setCurrentPage(1);
  };

  const saveBuyers = (updated: LocalBuyer[]) => {
    setBuyers(updated);
    try {
      localStorage.setItem("pharmalink_local_buyers", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !licenseNo.trim() || !mobile.trim()) {
      setStatusMsg({ type: "error", text: "Please fill in all mandatory fields (Name, License/Reg No, Mobile)." });
      return;
    }

    const newBuyer: LocalBuyer = {
      id: `BUYER-${Date.now().toString().slice(-4)}`,
      name,
      type,
      ownerName: ownerName || name,
      licenseNo,
      mobile,
      villageTown: villageTown || "Local Area",
      district: district || "Local District",
      creditLimit: Number(creditLimit) || 10000,
      currentOutstanding: 0,
      status: "ACTIVE",
    };

    const updated = [newBuyer, ...buyers];
    saveBuyers(updated);

    setStatusMsg({ type: "success", text: `✓ Local Buyer '${name}' registered successfully!` });
    setIsAddModalOpen(false);

    // Reset Form
    setName("");
    setType("RMP_DOCTOR");
    setOwnerName("");
    setLicenseNo("");
    setMobile("");
    setVillageTown("");
    setDistrict("");
    setCreditLimit(25000);
  };

  const filteredBuyers = buyers.filter((b) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      b.name.toLowerCase().includes(search) ||
      b.licenseNo.toLowerCase().includes(search) ||
      b.villageTown.toLowerCase().includes(search) ||
      b.mobile.includes(search);
    const matchesType = typeFilter === "ALL" || b.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Pagination Logic (Matching Admin Console)
  const totalPages = Math.ceil(filteredBuyers.length / pageSize) || 1;
  const paginatedBuyers = filteredBuyers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalOutstanding = buyers.reduce((sum, b) => sum + b.currentOutstanding, 0);
  const rmpCount = buyers.filter((b) => b.type === "RMP_DOCTOR").length;
  const chemistCount = buyers.filter((b) => b.type === "RETAIL_CHEMIST").length;
  const clinicCount = buyers.filter((b) => b.type === "RURAL_CLINIC" || b.type === "NURSING_HOME").length;

  const getTypeBadge = (t: LocalBuyer["type"]) => {
    switch (t) {
      case "RMP_DOCTOR":
        return <span className="bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">👨‍⚕️ RMP Doctor</span>;
      case "RETAIL_CHEMIST":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">💊 Retail Chemist</span>;
      case "RURAL_CLINIC":
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">🏥 Rural Clinic</span>;
      case "NURSING_HOME":
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">🏢 Nursing Home</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
              Admin Grade Console • Retail & RMP Buyers Network
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Local Buyers & Retail Network
          </h1>
          <p className="text-xs text-slate-500">
            Manage small medical shops, chemist counters, rural RMP doctors, and local clinics supplied by your distribution hub.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#0b2341] hover:bg-[#12315a] text-white font-bold px-5 py-3 rounded-[5px] shadow-xs transition-all text-xs flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <span>+ Add Local Buyer (RMP / Chemist)</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Buyers</span>
          <div className="text-2xl font-black text-[#0b2341]">{buyers.length} Network Partners</div>
        </div>

        <div className="bg-white p-5 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RMP Medical Practitioners</span>
          <div className="text-2xl font-black text-[#A71380]">{rmpCount} Doctors</div>
        </div>

        <div className="bg-white p-5 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retail Chemist Counters</span>
          <div className="text-2xl font-black text-emerald-600">{chemistCount} Shops</div>
        </div>

        <div className="bg-white p-5 rounded-[5px] border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Active Credit Collectibles</span>
          <div className="text-2xl font-black text-amber-600">₹{totalOutstanding.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Status Msg */}
      {statusMsg && (
        <div
          className={`p-4 rounded-[5px] text-xs font-bold border transition-all ${
            statusMsg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Admin Controls Bar: Search + Filter + View Toggle + Per Page */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs text-xs">
        <input
          type="text"
          placeholder="Search by buyer name, RMP license, mobile, village..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border border-slate-200 rounded-[5px] px-4 py-2 bg-slate-50 font-medium w-full sm:w-80 focus:bg-white focus:outline-none"
        />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-bold text-[11px]">Filter Category:</span>
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              className="border border-slate-200 rounded-[5px] px-3 py-2 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
            >
              <option value="ALL">All Buyer Types ({buyers.length})</option>
              <option value="RMP_DOCTOR">RMP Doctors ({rmpCount})</option>
              <option value="RETAIL_CHEMIST">Retail Chemists ({chemistCount})</option>
              <option value="RURAL_CLINIC">Rural Clinics ({clinicCount})</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-[5px] border border-slate-200">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-[4px] font-extrabold text-[11px] transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded-[4px] font-extrabold text-[11px] transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Grid Cards
            </button>
          </div>

          <div className="text-slate-500 font-bold text-xs border-l border-slate-200 pl-3">
            Buyers: <span className="text-[#0b2341]">{filteredBuyers.length}</span>
          </div>

          {/* Per Page Selector */}
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium border-l border-slate-200 pl-3">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-[4px] px-2 py-1.5 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Container (Table View vs Grid View) */}
      <div className="bg-white rounded-[6px] border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredBuyers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold text-xs">
            No buyers found matching your search or filter criteria.
          </div>
        ) : viewMode === "table" ? (
          /* Table List View */
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Buyer & Entity Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">License / Reg No.</th>
                    <th className="px-6 py-4">Location / Area</th>
                    <th className="px-6 py-4">Mobile Number</th>
                    <th className="px-6 py-4">Credit Balance</th>
                    <th className="px-6 py-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {paginatedBuyers.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0b2341] text-sm">{b.name}</div>
                        <div className="text-[11px] text-slate-400">Proprietor / Contact: {b.ownerName}</div>
                      </td>
                      <td className="px-6 py-4">{getTypeBadge(b.type)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800">{b.licenseNo}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700">{b.villageTown}</span>
                        <span className="block text-[10px] text-slate-400">{b.district}</span>
                      </td>
                      <td className="px-6 py-4 font-mono">{b.mobile}</td>
                      <td className="px-6 py-4">
                        {b.currentOutstanding > 0 ? (
                          <div>
                            <span className="font-black text-rose-600 text-sm">₹{b.currentOutstanding.toLocaleString("en-IN")}</span>
                            <span className="block text-[10px] text-slate-400">Limit: ₹{b.creditLimit.toLocaleString("en-IN")}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-emerald-600 text-xs">✓ Clear (₹0 Due)</span>
                            <span className="block text-[10px] text-slate-400">Limit: ₹{b.creditLimit.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/distributor/sales/new?buyerId=${b.id}`}
                          className="inline-flex items-center space-x-1.5 bg-[#0b2341] hover:bg-[#12315a] text-white font-bold px-3 py-2 rounded-[5px] text-xs transition-all shadow-2xs"
                        >
                          <span>+ Issue Invoice</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Admin Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/70 border-t border-slate-200 text-xs font-semibold text-slate-600">
              <div>
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredBuyers.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filteredBuyers.length}</span> registered buyers
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-[4px] border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === pageNum
                          ? "bg-[#0b2341] text-white border-[#0b2341] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Grid View Cards */
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedBuyers.map((b) => (
                <div key={b.id} className="border border-slate-200/90 rounded-[5px] p-5 bg-white hover:shadow-md transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-[#0b2341] text-base">{b.name}</h4>
                      <div className="text-[11px] text-slate-400">Proprietor: {b.ownerName}</div>
                    </div>
                    {getTypeBadge(b.type)}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-[5px] border border-slate-200/80 space-y-1 text-xs font-mono">
                    <div>DL / Reg No: <span className="font-bold text-slate-800">{b.licenseNo}</span></div>
                    <div>Location: <span className="font-bold text-slate-700">{b.villageTown}, {b.district}</span></div>
                    <div>Mobile: <span className="font-bold text-slate-700">{b.mobile}</span></div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Credit Limit</span>
                      <span className="font-bold text-slate-700 font-mono">₹{b.creditLimit.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Due</span>
                      {b.currentOutstanding > 0 ? (
                        <span className="font-black text-rose-600 font-mono text-base">₹{b.currentOutstanding.toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="font-bold text-emerald-600 text-sm">₹0 (Clear)</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <a
                      href={`/distributor/sales/new?buyerId=${b.id}`}
                      className="w-full inline-flex items-center justify-center bg-[#0b2341] hover:bg-[#12315a] text-white font-bold py-2.5 rounded-[5px] text-xs transition-all shadow-2xs"
                    >
                      + Issue Invoice
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/70 rounded-[5px] border border-slate-200 text-xs font-semibold text-slate-600">
              <div>
                <span>
                  Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredBuyers.length)}</span> of{" "}
                  <span className="font-bold text-[#0b2341]">{filteredBuyers.length}</span> buyers
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                  >
                    ‹ Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-[4px] border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === pageNum
                          ? "bg-[#0b2341] text-white border-[#0b2341] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Buyer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-[6px] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0b2341]">Register Local Buyer / RMP Doctor</h3>
                <p className="text-xs text-slate-500">Add local medical shop or doctor to your secondary supply roster</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBuyer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Buyer / Doctor / Shop Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Srinivas Rao (RMP) / Laxmi Medical Counter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-bold text-[#0b2341]"
                  >
                    <option value="RMP_DOCTOR">👨‍⚕️ RMP Doctor</option>
                    <option value="RETAIL_CHEMIST">💊 Retail Chemist Shop</option>
                    <option value="RURAL_CLINIC">🏥 Rural First-Aid Clinic</option>
                    <option value="NURSING_HOME">🏢 Local Nursing Home</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Owner / Doctor Name</label>
                  <input
                    type="text"
                    placeholder="Doctor or Chemist Name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Drug License / RMP Reg No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TS/RMP/2021/4892"
                    value={licenseNo}
                    onChange={(e) => setLicenseNo(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Village / Mandal</label>
                  <input
                    type="text"
                    placeholder="e.g. Chivvemla"
                    value={villageTown}
                    onChange={(e) => setVillageTown(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">District</label>
                  <input
                    type="text"
                    placeholder="e.g. Suryapet"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-[5px] p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-bold text-amber-700"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white font-bold py-3.5 rounded-[5px] mt-3 shadow-xs cursor-pointer text-xs"
              >
                Save & Register Local Buyer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
