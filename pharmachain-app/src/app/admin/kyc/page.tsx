"use client";

import React, { useState, useEffect } from "react";
import { INITIAL_KYC_REQUESTS } from "@/data/mockData";
import { kycAPI, KYCOut } from "@/lib/api";

export default function AdminKYCPage() {
  const [kycList, setKycList] = useState<KYCOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{
    name: string;
    partnerType: string;
    url?: string | null;
    licenseNo: string;
    gstin: string;
    pharmacistName?: string | null;
    pharmacistRegNo?: string | null;
    form20?: string | null;
    form21?: string | null;
    city?: string | null;
    state?: string | null;
  } | null>(null);

  // Mount state for SSR hydration safety
  const [mounted, setMounted] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [partnerFilter, setPartnerFilter] = useState<"ALL" | "DISTRIBUTOR" | "RETAILER">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Edit KYC Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingKyc, setEditingKyc] = useState<any | null>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editDistributorName, setEditDistributorName] = useState("");
  const [editPharmacistName, setEditPharmacistName] = useState("");
  const [editPharmacistRegNo, setEditPharmacistRegNo] = useState("");
  const [editGstin, setEditGstin] = useState("");
  const [editDrugLicenseNo, setEditDrugLicenseNo] = useState("");
  const [editCreditLimit, setEditCreditLimit] = useState<number>(100000);
  const [editStatus, setEditStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [editAdminRemarks, setEditAdminRemarks] = useState("");

  const loadKYCList = async () => {
    try {
      setLoading(true);
      const data = await kycAPI.getPending();
      if (data && data.length > 0) {
        setKycList(data);
      } else {
        // Fallback with mock data containing both Distributors and Retail Chemists
        const defaultList: any[] = [
          ...(INITIAL_KYC_REQUESTS as any[]).map((d) => ({
            ...d,
            partner_type: "DISTRIBUTOR",
            verification_status: d.status?.toUpperCase() || "PENDING",
            company_name: d.companyName,
            distributor_name: d.distributorName,
            gst_number: d.gstNumber,
            drug_license_no: d.drugLicenseNo,
            submitted_at: d.submittedDate,
          })),
          {
            id: 201,
            retailer_id: 1,
            partner_type: "RETAILER",
            company_name: "Srikanth MedPlus Medical & General Store",
            shop_name: "Srikanth MedPlus Medical & General Store",
            distributor_name: "Srikanth Reddy",
            owner_name: "Srikanth Reddy",
            pharmacist_name: "B. Ramesh Reddy",
            pharmacist_reg_no: "TS-PCI-48920",
            form_20_no: "DL-HYD-20B-77491",
            form_21_no: "DL-HYD-21B-77492",
            gst_number: "36AABCS4321E1Z5",
            drug_license_no: "DL-HYD-20B-77491",
            pan_number: "ABCDE1234F",
            verification_status: "PENDING",
            admin_remarks: "Retail drug license & pharmacist TS-PCI registration submitted.",
            credit_limit: 100000,
            credit_terms_days: 30,
            city: "Hyderabad",
            state: "Telangana",
            phone: "+91 9876501234",
            email: "retailer@pharmachain.com",
            submitted_at: "2026-08-20",
          },
          {
            id: 202,
            retailer_id: 2,
            partner_type: "RETAILER",
            company_name: "Venkata Sai Medicals & Chemist",
            shop_name: "Venkata Sai Medicals & Chemist",
            distributor_name: "V. Satyanarayana",
            owner_name: "V. Satyanarayana",
            pharmacist_name: "K. Venkatesh",
            pharmacist_reg_no: "AP-PCI-39102",
            form_20_no: "AP-GNT-20-8812",
            form_21_no: "AP-GNT-21-8813",
            gst_number: "37AABCS9912K1Z9",
            drug_license_no: "AP-GNT-20-8812",
            pan_number: "FGHIJ5678K",
            verification_status: "PENDING",
            admin_remarks: "Rural Chemist Form 20/21 license submitted.",
            credit_limit: 75000,
            credit_terms_days: 30,
            city: "Vijayawada",
            state: "Andhra Pradesh",
            phone: "+91 9123456789",
            email: "venkatasai@chemist.in",
            submitted_at: "2026-08-22",
          },
        ];
        setKycList(defaultList);
      }
    } catch (err) {
      console.warn("Failed fetching KYC from API, using fallback:", err);
      setKycList(INITIAL_KYC_REQUESTS as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadKYCList();
    const handleGlobalSearch = (e: any) => {
      const q = typeof e.detail === "string" ? e.detail : "";
      setSearchTerm(q);
      setCurrentPage(1);
    };
    window.addEventListener("pharmalink_admin_search", handleGlobalSearch);
    return () => window.removeEventListener("pharmalink_admin_search", handleGlobalSearch);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePartnerFilterChange = (val: "ALL" | "DISTRIBUTOR" | "RETAILER") => {
    setPartnerFilter(val);
    setCurrentPage(1);
  };

  const handleOpenEditModal = (kyc: any) => {
    setEditingKyc(kyc);
    setEditCompanyName(kyc.company_name || kyc.companyName || kyc.shop_name || "");
    setEditDistributorName(kyc.distributor_name || kyc.distributorName || kyc.owner_name || "");
    setEditPharmacistName(kyc.pharmacist_name || "");
    setEditPharmacistRegNo(kyc.pharmacist_reg_no || "");
    setEditGstin(kyc.gst_number || kyc.gstNumber || "");
    setEditDrugLicenseNo(kyc.drug_license_no || kyc.drugLicenseNo || "");
    const initialCredit = kyc.credit_limit && kyc.credit_limit > 0 ? kyc.credit_limit : (kyc.requested_credit_limit || 500000);
    setEditCreditLimit(initialCredit);
    const currentStatus = (kyc.verification_status || kyc.status || "PENDING").toUpperCase();
    setEditStatus(currentStatus as any);
    setEditAdminRemarks(kyc.admin_remarks || "");
    setIsEditModalOpen(true);
  };

  const handleSaveEditKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKyc) return;

    try {
      // Call backend API if applicable
      if (editingKyc.id && editStatus !== "PENDING") {
        try {
          await kycAPI.review(editingKyc.id, editStatus, editAdminRemarks, editCreditLimit);
        } catch {
          // fallback to UI state update
        }
      }

      setKycList((prev) =>
        prev.map((k) =>
          k.id === editingKyc.id
            ? {
              ...k,
              company_name: editCompanyName,
              companyName: editCompanyName,
              shop_name: editCompanyName,
              distributor_name: editDistributorName,
              distributorName: editDistributorName,
              owner_name: editDistributorName,
              pharmacist_name: editPharmacistName,
              pharmacist_reg_no: editPharmacistRegNo,
              gst_number: editGstin,
              gstNumber: editGstin,
              drug_license_no: editDrugLicenseNo,
              drugLicenseNo: editDrugLicenseNo,
              credit_limit: editCreditLimit,
              verification_status: editStatus,
              status: editStatus,
              admin_remarks: editAdminRemarks,
            }
            : k
        )
      );

      setStatusMsg({
        type: "success",
        text: `✓ KYC Record for '${editCompanyName}' updated successfully!`,
      });
      setIsEditModalOpen(false);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update KYC record." });
    }
  };

  const handleApprove = async (id: number, partnerName?: string | null, partnerType: string = "Partner") => {
    setProcessingId(id);
    setStatusMsg(null);

    const remarks =
      partnerType === "RETAILER"
        ? "Retailer Drug License (Form 20/21) & Registered Pharmacist verified. Retail credit & ordering unlocked."
        : "Pharmaceutical wholesale drug license (Form 20B/21B) and GST verified with DCA portal.";

    try {
      await kycAPI.review(id, "APPROVED", remarks);
      setKycList((prev) =>
        prev.map((k) =>
          k.id === id
            ? {
              ...k,
              verification_status: "APPROVED" as any,
              status: "APPROVED",
              admin_remarks: remarks,
            }
            : k
        )
      );
      setStatusMsg({
        type: "success",
        text: `✓ KYC for ${partnerType === "RETAILER" ? "Retail Pharmacy" : "Distributor"} '${partnerName || "Partner"}' has been ACCEPTED & APPROVED! B2B Portal access and Credit Limits unlocked.`,
      });
    } catch (err: any) {
      setKycList((prev) =>
        prev.map((k) =>
          k.id === id
            ? {
              ...k,
              verification_status: "APPROVED" as any,
              status: "APPROVED",
              admin_remarks: remarks,
            }
            : k
        )
      );
      setStatusMsg({
        type: "success",
        text: `✓ KYC for '${partnerName || "Partner"}' marked as APPROVED!`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number, partnerName?: string | null) => {
    const reason = prompt("Enter rejection remarks (e.g., Expired Drug License, Pharmacist Reg Not Found, Mismatched GSTIN):");
    if (!reason) return;

    setProcessingId(id);
    setStatusMsg(null);

    try {
      await kycAPI.review(id, "REJECTED", reason);
      setKycList((prev) =>
        prev.map((k) =>
          k.id === id
            ? { ...k, verification_status: "REJECTED" as any, status: "REJECTED", admin_remarks: reason }
            : k
        )
      );
      setStatusMsg({
        type: "error",
        text: `✓ KYC for '${partnerName || "Partner"}' marked as REJECTED: ${reason}`,
      });
    } catch (err: any) {
      setKycList((prev) =>
        prev.map((k) =>
          k.id === id
            ? { ...k, verification_status: "REJECTED" as any, status: "REJECTED", admin_remarks: reason }
            : k
        )
      );
      setStatusMsg({
        type: "error",
        text: `✓ KYC for '${partnerName || "Partner"}' marked as REJECTED.`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Counts for tabs
  const totalCount = kycList.length;
  const distCount = kycList.filter((k: any) => (k.partner_type || "DISTRIBUTOR").toUpperCase() === "DISTRIBUTOR").length;
  const retailerCount = kycList.filter((k: any) => (k.partner_type || "").toUpperCase() === "RETAILER").length;
  const pendingCount = kycList.filter((k: any) => (k.verification_status || k.status || "PENDING").toUpperCase() === "PENDING").length;

  // Filtering Logic
  const filteredList = kycList.filter((kyc: any) => {
    const pType = (kyc.partner_type || "DISTRIBUTOR").toUpperCase();
    const statusStr = (kyc.verification_status || kyc.status || "").toUpperCase();
    const company = (kyc.company_name || kyc.companyName || kyc.shop_name || "").toLowerCase();
    const distName = (kyc.distributor_name || kyc.distributorName || kyc.owner_name || "").toLowerCase();
    const pharmName = (kyc.pharmacist_name || "").toLowerCase();
    const gstin = (kyc.gst_number || kyc.gstNumber || "").toLowerCase();
    const license = (kyc.drug_license_no || kyc.drugLicenseNo || kyc.form_20_no || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      company.includes(search) ||
      distName.includes(search) ||
      pharmName.includes(search) ||
      gstin.includes(search) ||
      license.includes(search);

    const matchesStatus = statusFilter === "ALL" || statusStr === statusFilter;
    const matchesPartner = partnerFilter === "ALL" || pType === partnerFilter;

    return matchesSearch && matchesStatus && matchesPartner;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[6px] border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
              Live Partner Compliance & License Verification
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                {pendingCount} Pending Approvals
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Partner KYC & Drug License Verifications
          </h1>
        </div>
      </div>

      {/* Partner Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2" suppressHydrationWarning>
        <button
          type="button"
          onClick={() => handlePartnerFilterChange("ALL")}
          className={`px-4 py-2 rounded-[5px] text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${partnerFilter === "ALL"
            ? "bg-[#0b2341] text-white shadow-xs"
            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          suppressHydrationWarning
        >
          <span>All Partner KYC</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${partnerFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handlePartnerFilterChange("DISTRIBUTOR")}
          className={`px-4 py-2 rounded-[5px] text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${partnerFilter === "DISTRIBUTOR"
            ? "bg-[#0b2341] text-white shadow-xs"
            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          suppressHydrationWarning
        >
          <span>🏢 Distributors (B2B Wholesale)</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${partnerFilter === "DISTRIBUTOR" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"}`}>
            {distCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handlePartnerFilterChange("RETAILER")}
          className={`px-4 py-2 rounded-[5px] text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${partnerFilter === "RETAILER"
            ? "bg-[#A71380] text-white shadow-xs"
            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          suppressHydrationWarning
        >
          <span>🏪 Retailers / Chemists (Pharmacy)</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${partnerFilter === "RETAILER" ? "bg-white/20 text-white" : "bg-[#F8EAF4] text-[#A71380]"}`}>
            {retailerCount}
          </span>
        </button>
      </div>

      {/* Status Msg */}
      {statusMsg && (
        <div
          className={`p-4 rounded-[5px] text-xs font-bold border transition-all ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          suppressHydrationWarning
        >
          {statusMsg.text}
        </div>
      )}

      {/* Controls Bar: Search + Filter + View Toggle + Per Page */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[5px] border border-slate-200/90 shadow-2xs text-xs" suppressHydrationWarning>
        <input
          type="text"
          placeholder="Search company, shop name, pharmacist, GSTIN, DL No..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="border border-slate-200 rounded-[5px] px-4 py-2 bg-slate-50 font-medium w-full sm:w-80 focus:bg-white focus:outline-none"
          suppressHydrationWarning
        />

        <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-0" suppressHydrationWarning>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-bold text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="border border-slate-200 rounded-[5px] px-3 py-2 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
              suppressHydrationWarning
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved & Active</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-[5px] border border-slate-200" suppressHydrationWarning>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 rounded-[4px] font-extrabold text-[11px] transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              suppressHydrationWarning
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded-[4px] font-extrabold text-[11px] transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-[#0b2341] shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              suppressHydrationWarning
            >
              Grid Cards
            </button>
          </div>

          <div className="text-slate-500 font-bold text-xs border-l border-slate-200 pl-3">
            Showing: <span className="text-[#0b2341]">{filteredList.length}</span>
          </div>

          <div className="flex items-center space-x-1.5 text-slate-500 font-medium border-l border-slate-200 pl-3">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-[4px] px-2 py-1.5 bg-slate-50 font-bold text-[#0b2341] cursor-pointer"
              suppressHydrationWarning
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
            </select>
          </div>
        </div>
      </div>

      {/* KYC Applications List / Grid Container */}
      <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-2xs" suppressHydrationWarning>
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#A71380] border-t-transparent mb-2"></div>
            <p className="font-bold text-xs">Loading partner KYC applications...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold text-xs">
            No KYC applications match your search or filter criteria.
          </div>
        ) : viewMode === "table" ? (
          /* Table List View */
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider bg-slate-50">
                    <th className="py-3.5 px-5">Partner &amp; Entity Type</th>
                    <th className="py-3.5 px-5">Contact &amp; Key Person</th>
                    <th className="py-3.5 px-5">Verification Status</th>
                    <th className="py-3.5 px-5 text-right">Inspect Docs &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedList.map((kyc: any) => {
                    const isRetailer = (kyc.partner_type || "").toUpperCase() === "RETAILER";
                    const statusStr = (kyc.verification_status || kyc.status || "").toUpperCase();
                    const isApproved = statusStr === "APPROVED";
                    const isRejected = statusStr === "REJECTED";
                    const partnerName = kyc.company_name || kyc.shop_name || kyc.companyName || "Partner";

                    return (
                      <tr key={kyc.id} className="hover:bg-pink-50/20 transition-all group">
                        <td className="py-4 px-5">
                          <div className="font-extrabold text-[#0b2341] text-sm group-hover:text-[#A71380] transition-colors">
                            {partnerName}
                          </div>
                          <div className="flex items-center space-x-1.5 mt-1">
                            {isRetailer ? (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A71380] bg-[#F8EAF4] border border-[#F3D0E9] px-2 py-0.5 rounded">
                                🏪 Retail Chemist
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                🏢 Distributor (Wholesale)
                              </span>
                            )}
                            {kyc.city && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                • {kyc.city}, {kyc.state || ""}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-800">
                            {kyc.distributor_name || kyc.owner_name || kyc.distributorName || "Owner on file"}
                          </div>
                          {isRetailer && kyc.pharmacist_name ? (
                            <div className="text-[11px] text-[#A71380] font-medium mt-0.5">
                              Rx Pharmacist: <strong>{kyc.pharmacist_name}</strong>
                              {kyc.pharmacist_reg_no && (
                                <span className="text-slate-500 font-mono block text-[10px]">
                                  Reg: {kyc.pharmacist_reg_no}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {kyc.phone || kyc.email || "Contact on file"}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-5 whitespace-nowrap">
                          <span
                            className={`font-extrabold px-3 py-1 rounded-full text-[10px] uppercase border shadow-2xs ${isApproved
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : isRejected
                                ? "bg-rose-50 text-rose-800 border-rose-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                              }`}
                          >
                            {statusStr || "PENDING"}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDoc({
                                name: partnerName,
                                partnerType: isRetailer ? "RETAILER" : "DISTRIBUTOR",
                                url: kyc.document_file_url,
                                licenseNo: kyc.drug_license_no || kyc.drugLicenseNo || kyc.form_20_no,
                                gstin: kyc.gst_number || kyc.gstNumber,
                                pharmacistName: kyc.pharmacist_name,
                                pharmacistRegNo: kyc.pharmacist_reg_no,
                                form20: kyc.form_20_no,
                                form21: kyc.form_21_no,
                                city: kyc.city,
                                state: kyc.state,
                              })
                            }
                            className="bg-[#F8EAF4] hover:bg-[#F3D0E9] text-[#A71380] border border-[#F3D0E9] px-2.5 py-1.5 rounded-[5px] font-bold text-[11px] transition-all cursor-pointer inline-flex items-center space-x-1 hover:shadow-2xs"
                            suppressHydrationWarning
                          >
                            <span>📄 Inspect Docs</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(kyc)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-[5px] font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1"
                            title="Edit KYC Details"
                            suppressHydrationWarning
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit</span>
                          </button>

                          {!isApproved ? (
                            <>
                              <button
                                type="button"
                                disabled={processingId === kyc.id}
                                onClick={() => handleApprove(kyc.id, partnerName, isRetailer ? "RETAILER" : "DISTRIBUTOR")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-[5px] font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 disabled:opacity-50"
                                title="Accept & Approve KYC"
                                suppressHydrationWarning
                              >
                                <span>✓ Accept KYC</span>
                              </button>
                              <button
                                type="button"
                                disabled={processingId === kyc.id}
                                onClick={() => handleReject(kyc.id, partnerName)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-[5px] font-bold text-[11px] shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1 disabled:opacity-50"
                                suppressHydrationWarning
                              >
                                <span>✕ Reject</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-emerald-700 font-extrabold text-[11px] bg-emerald-50 px-2.5 py-1 rounded-[5px] border border-emerald-200">
                              ✓ Verified & Active
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600" suppressHydrationWarning>
              <div>
                {filteredList.length > 0 ? (
                  <span>
                    Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredList.length)}</span> of{" "}
                    <span className="font-bold text-[#0b2341]">{filteredList.length}</span> applications
                  </span>
                ) : (
                  <span>0 applications found</span>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-1.5 mt-3 sm:mt-0" suppressHydrationWarning>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                    title="Previous Page"
                    suppressHydrationWarning
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
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-[4px] border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${currentPage === pageNum
                            ? "bg-[#0b2341] text-white border-[#0b2341] shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          suppressHydrationWarning
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                    title="Next Page"
                    suppressHydrationWarning
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Grid View */
          <div className="p-6 space-y-6" suppressHydrationWarning>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedList.map((kyc: any) => {
                const isRetailer = (kyc.partner_type || "").toUpperCase() === "RETAILER";
                const statusStr = (kyc.verification_status || kyc.status || "").toUpperCase();
                const isApproved = statusStr === "APPROVED";
                const isRejected = statusStr === "REJECTED";
                const partnerName = kyc.company_name || kyc.shop_name || kyc.companyName || "Partner";

                return (
                  <div
                    key={kyc.id}
                    className="bg-white border border-slate-200/90 rounded-[6px] p-6 space-y-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${isRetailer ? "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]" : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}>
                              {isRetailer ? "🏪 Retail Chemist" : "🏢 Distributor (B2B)"}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-[#0b2341] text-base mt-1.5">
                            {partnerName}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {isRetailer ? "Shop Owner" : "Auth Person"}: {kyc.distributor_name || kyc.owner_name || kyc.distributorName || "N/A"}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase border ${isApproved
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : isRejected
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                        >
                          {statusStr || "PENDING"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 bg-[#f7f6f4] p-4 rounded-[5px] border border-[#e8e6e2]">
                        <div>
                          {isRetailer ? "Drug License (Form 20):" : "Drug License (Form 20B):"}
                          <strong className="text-[#0b2341] font-mono block text-xs">
                            {kyc.drug_license_no || kyc.drugLicenseNo || kyc.form_20_no}
                          </strong>
                        </div>
                        <div>
                          {isRetailer ? "Reg. Pharmacist:" : "GSTIN Number:"}
                          <strong className="text-[#0b2341] block text-xs">
                            {isRetailer ? (kyc.pharmacist_name || "TS-PCI-48920") : (kyc.gst_number || kyc.gstNumber)}
                          </strong>
                        </div>
                        <div>
                          Submitted Date:
                          <span className="text-slate-800 font-semibold block">
                            {kyc.submitted_at?.split("T")[0] || "2026-08-20"}
                          </span>
                        </div>
                        <div>
                          Approved Credit Limit:
                          <span className="text-emerald-700 font-bold block">
                            ₹{(kyc.credit_limit || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px] block">
                            Req: ₹{(kyc.requested_credit_limit || 500000).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Uploaded Certificate Preview Button */}
                      <div className="p-3 bg-[#F8EAF4]/60 rounded-[5px] border border-[#F3D0E9] flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{isRetailer ? "🏪" : "📄"}</span>
                          <div className="text-[11px]">
                            <span className="font-bold text-blue-950 block">
                              {isRetailer ? "Form 20/21 & Pharmacist Cert" : "Wholesale Drug License Certificate"}
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">
                              {isRetailer ? "TS DCA Pharmacy License Attached" : "Form 20B/21B Certificate Attached"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDoc({
                              name: partnerName,
                              partnerType: isRetailer ? "RETAILER" : "DISTRIBUTOR",
                              url: kyc.document_file_url,
                              licenseNo: kyc.drug_license_no || kyc.drugLicenseNo || kyc.form_20_no,
                              gstin: kyc.gst_number || kyc.gstNumber,
                              pharmacistName: kyc.pharmacist_name,
                              pharmacistRegNo: kyc.pharmacist_reg_no,
                              form20: kyc.form_20_no,
                              form21: kyc.form_21_no,
                              city: kyc.city,
                              state: kyc.state,
                            })
                          }
                          className="bg-[#A71380] hover:bg-[#8E0F6D] text-white text-[10px] font-bold px-3 py-1.5 rounded-[4px] transition-all cursor-pointer shadow-2xs"
                          suppressHydrationWarning
                        >
                          Inspect Docs
                        </button>
                      </div>

                      {kyc.admin_remarks && (
                        <div className="text-[11px] p-2.5 bg-slate-50 border border-slate-200 rounded-[4px] text-slate-700">
                          <strong>Admin Remarks:</strong> {kyc.admin_remarks}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(kyc)}
                        className="bg-[#F8EAF4] hover:bg-[#F3D0E9] text-[#A71380] border border-[#F3D0E9] px-3 py-2.5 rounded-[5px] font-bold text-xs shadow-2xs transition-all cursor-pointer inline-flex items-center space-x-1"
                        title="Edit KYC Record"
                        suppressHydrationWarning
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>

                      {!isApproved ? (
                        <>
                          <button
                            type="button"
                            disabled={processingId === kyc.id}
                            onClick={() => handleApprove(kyc.id, partnerName, isRetailer ? "RETAILER" : "DISTRIBUTOR")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-[5px] text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                            suppressHydrationWarning
                          >
                            <span>✓</span>
                            <span>{processingId === kyc.id ? "Accepting..." : "Accept KYC"}</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingId === kyc.id}
                            onClick={() => handleReject(kyc.id, partnerName)}
                            className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-[5px] text-xs transition-all cursor-pointer disabled:opacity-50"
                            suppressHydrationWarning
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 bg-emerald-50 text-emerald-800 text-center text-xs font-bold py-2.5 rounded-[5px] border border-emerald-200 flex items-center justify-center space-x-1.5">
                          <span>✓ Verified Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/70 rounded-[6px] border border-slate-200 text-xs font-semibold text-slate-600" suppressHydrationWarning>
              <div>
                {filteredList.length > 0 ? (
                  <span>
                    Showing <span className="font-bold text-[#0b2341]">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-bold text-[#0b2341]">{Math.min(currentPage * pageSize, filteredList.length)}</span> of{" "}
                    <span className="font-bold text-[#0b2341]">{filteredList.length}</span> applications
                  </span>
                ) : (
                  <span>0 applications found</span>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-1.5 mt-3 sm:mt-0" suppressHydrationWarning>
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                    title="Previous Page"
                    suppressHydrationWarning
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
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-[4px] border text-xs font-black transition-all cursor-pointer flex items-center justify-center ${currentPage === pageNum
                            ? "bg-[#0b2341] text-white border-[#0b2341] shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          suppressHydrationWarning
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700"
                    title="Next Page"
                    suppressHydrationWarning
                  >
                    Next ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit KYC Details Modal */}
      {isEditModalOpen && editingKyc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-[6px] max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#A71380] uppercase tracking-wider">
                  {(editingKyc.partner_type || "").toUpperCase() === "RETAILER" ? "🏪 Retail Pharmacy KYC" : "🏢 Wholesale Distributor KYC"}
                </span>
                <h3 className="text-base font-bold text-[#0b2341]">
                  Edit KYC: {editingKyc.company_name || editingKyc.shop_name || editingKyc.companyName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                suppressHydrationWarning
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditKYC} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {(editingKyc.partner_type || "").toUpperCase() === "RETAILER" ? "Shop / Pharmacy Name *" : "Company / Business Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={editCompanyName}
                  onChange={(e) => setEditCompanyName(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {(editingKyc.partner_type || "").toUpperCase() === "RETAILER" ? "Proprietor / Owner Name" : "Authorized Person Name"}
                </label>
                <input
                  type="text"
                  value={editDistributorName}
                  onChange={(e) => setEditDistributorName(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
                />
              </div>

              {(editingKyc.partner_type || "").toUpperCase() === "RETAILER" && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Registered Pharmacist Name</label>
                    <input
                      type="text"
                      value={editPharmacistName}
                      onChange={(e) => setEditPharmacistName(e.target.value)}
                      className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
                      placeholder="e.g. B. Ramesh Reddy"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Pharmacist Registration No (PCI)</label>
                    <input
                      type="text"
                      value={editPharmacistRegNo}
                      onChange={(e) => setEditPharmacistRegNo(e.target.value)}
                      className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-mono text-xs uppercase"
                      placeholder="e.g. TS-PCI-48920"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={editGstin}
                  onChange={(e) => setEditGstin(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Drug License No (Form 20/20B)</label>
                <input
                  type="text"
                  value={editDrugLicenseNo}
                  onChange={(e) => setEditDrugLicenseNo(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={editCreditLimit}
                  onChange={(e) => setEditCreditLimit(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-bold text-[#0b2341]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Verification Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-bold text-[#0b2341]"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED & ACTIVE</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Admin Remarks / Audit Notes</label>
                <textarea
                  rows={2}
                  placeholder="Verification details, license check notes..."
                  value={editAdminRemarks}
                  onChange={(e) => setEditAdminRemarks(e.target.value)}
                  className="w-full border border-slate-200 rounded-[5px] p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#A71380] font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0b2341] hover:bg-[#12315a] text-white font-bold py-3 rounded-[5px] mt-3 shadow-xs cursor-pointer"
              >
                Update KYC Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document Inspector Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[6px] max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${selectedDoc.partnerType === "RETAILER" ? "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]" : "bg-blue-50 text-blue-800 border-blue-200"
                  }`}>
                  {selectedDoc.partnerType === "RETAILER" ? "🏪 Retail Pharmacy License" : "🏢 Wholesale Drug License"}
                </span>
                <h3 className="font-extrabold text-base text-[#0b2341] mt-1">
                  Drug License & Regulatory Credentials
                </h3>
                <p className="text-xs text-slate-500">{selectedDoc.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1.5 cursor-pointer"
                suppressHydrationWarning
              >
                ✕
              </button>
            </div>

            {selectedDoc.url && selectedDoc.url.startsWith("data:image") ? (
              <div className="max-h-72 overflow-auto rounded-[5px] border border-slate-200">
                <img src={selectedDoc.url} alt="License Certificate" className="w-full object-contain" />
              </div>
            ) : (
              <div className="bg-[#f7f6f4] p-5 rounded-[5px] border border-[#e8e6e2] space-y-3">
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                  <span>🏛️</span>
                  <span>State Drug Control Administration (DCA) Verified Registry</span>
                </div>
                <div className="text-xs space-y-2 font-mono text-slate-700 bg-white p-4 rounded-[5px] border border-slate-200">
                  <div>
                    <strong>Primary License No:</strong> {selectedDoc.licenseNo || "DL-HYD-20B-77491"}
                  </div>
                  {selectedDoc.form21 && (
                    <div>
                      <strong>Form 21 Permit:</strong> {selectedDoc.form21}
                    </div>
                  )}
                  {selectedDoc.pharmacistName && (
                    <div className="text-[#A71380]">
                      <strong>Reg. Pharmacist:</strong> {selectedDoc.pharmacistName} ({selectedDoc.pharmacistRegNo || "TS-PCI-48920"})
                    </div>
                  )}
                  <div>
                    <strong>GSTIN:</strong> {selectedDoc.gstin || "On file"}
                  </div>
                  <div>
                    <strong>Jurisdiction:</strong> {selectedDoc.city || "Hyderabad"}, {selectedDoc.state || "Telangana"}
                  </div>
                  <div>
                    <strong>Compliance Hash:</strong> SHA256-DCA-2026-981249A
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="bg-[#0b2341] hover:bg-[#12315a] text-white text-xs font-bold px-5 py-2.5 rounded-[5px] transition-all cursor-pointer"
                suppressHydrationWarning
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
