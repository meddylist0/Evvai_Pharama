"use client";

import React, { useState, useEffect } from "react";
import { getStoredUser, StoredUser, authAPI } from "@/lib/api";

export default function DistributorProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    companyName: "",
    distributorName: "",
    email: "",
    mobile: "",
    gstNumber: "",
    drugLicenseNo: "",
    city: "Hyderabad",
    state: "Telangana",
    address: "",
  });

  useEffect(() => {
    const load = async () => {
      const stored = getStoredUser();
      setUser(stored);
      try {
        const me = await authAPI.getMe();
        if (me) {
          setProfile({
            companyName: me.distributor_profile?.company_name || me.full_name || "",
            distributorName: me.distributor_profile?.distributor_name || me.full_name || "",
            email: me.email || "",
            mobile: me.phone || "",
            gstNumber: me.distributor_profile?.gstin || "",
            drugLicenseNo: me.distributor_profile?.drug_license_no || "",
            city: me.distributor_profile?.city || "Hyderabad",
            state: me.distributor_profile?.state || "Telangana",
            address: me.distributor_profile?.business_address || "",
          });
        }
      } catch (err) {
        console.warn("Failed fetching profile:", err);
      }
    };
    load();
  }, []);

  const isApproved = user?.kyc_status === "APPROVED";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile({
        full_name: profile.distributorName,
        phone: profile.mobile,
        company_name: profile.companyName,
        address: profile.address,
        city: profile.city,
        state: profile.state,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn("Failed updating profile:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border mb-2 inline-block ${
          isApproved 
            ? "text-emerald-800 bg-emerald-100/70 border-emerald-200"
            : "text-amber-800 bg-amber-100/70 border-amber-200"
        }`}>
          {isApproved ? "KYC Status: Verified & Approved ✓" : "KYC Status: Pending Admin Verification ⏳"}
        </span>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-1">
          Distributor Profile & KYC Account Settings
        </h1>
        <p className="text-xs text-slate-500">
          Manage corporate GST registration details, drug licenses, and shipping addresses.
        </p>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xl font-bold">
          ✓ Profile and GST Business details saved successfully!
        </div>
      )}

      {/* Profile Edit Form Card */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-5 text-xs">
        <h3 className="text-sm font-bold text-[#0b2341] border-b border-slate-100 pb-2">
          Company & Legal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Company / Wholesaler Name</label>
            <input
              type="text"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Authorized Contact Person</label>
            <input
              type="text"
              value={profile.distributorName}
              onChange={(e) => setProfile({ ...profile, distributorName: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">GST Number (GSTIN)</label>
            <input
              type="text"
              value={profile.gstNumber}
              onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-bold text-blue-900"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Drug License Number</label>
            <input
              type="text"
              value={profile.drugLicenseNo}
              onChange={(e) => setProfile({ ...profile, drugLicenseNo: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
            <input
              type="tel"
              value={profile.mobile}
              onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Registered Business Address</label>
          <textarea
            rows={2}
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
          />
        </div>

        <button
          type="submit"
          className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
        >
          Save Profile Changes
        </button>
      </form>
    </div>
  );
}
