"use client";

import React, { useState, useEffect } from "react";
import { authAPI, getStoredUser, StoredUser, setStoredUser, creditAPI } from "@/lib/api";

export default function RetailerProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [shopName, setShopName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [form20No, setForm20No] = useState("DL-HYD-20B-77491");
  const [form21No, setForm21No] = useState("DL-HYD-21B-77492");
  const [dlIssueDate, setDlIssueDate] = useState("2024-01-15");
  const [dlExpiryDate, setDlExpiryDate] = useState("2029-01-14");
  const [pharmacistName, setPharmacistName] = useState("B. Ramesh Reddy");
  const [pharmacistRegNo, setPharmacistRegNo] = useState("TS-PCI-48920");
  const [panNo, setPanNo] = useState("ABCDE1234F");
  const [gstin, setGstin] = useState("36AABCS4321E1Z5");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [state, setState] = useState("Telangana");
  const [pincode, setPincode] = useState("500072");
  const [kycStatus, setKycStatus] = useState("APPROVED");
  const [creditLimit, setCreditLimit] = useState(100000);
  const [creditTermsDays, setCreditTermsDays] = useState(30);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const stored = getStoredUser();
        setUser(stored);

        const [me, credit] = await Promise.all([
          authAPI.getMe().catch(() => null),
          creditAPI.getMyCreditStatus().catch(() => null),
        ]);

        if (me) {
          setProfileData(me);
          setFullName(me.full_name || "");
          setEmail(me.email || "");
          setPhone(me.phone || "");
          setKycStatus(me.kyc_status || stored?.kyc_status || "APPROVED");

          if (me.retailer_profile) {
            const rp = me.retailer_profile;
            setShopName(rp.shop_name || "");
            setForm20No(rp.form_20_no || rp.drug_license_no || "DL-HYD-20B-77491");
            setForm21No(rp.form_21_no || "DL-HYD-21B-77492");
            setDlIssueDate(rp.dl_issue_date || "2024-01-15");
            setDlExpiryDate(rp.dl_expiry_date || "2029-01-14");
            setPharmacistName(rp.pharmacist_name || me.full_name || "B. Ramesh Reddy");
            setPharmacistRegNo(rp.pharmacist_reg_no || "TS-PCI-48920");
            setPanNo(rp.pan_no || "ABCDE1234F");
            setGstin(rp.gstin || "");
            setAddress(rp.shop_address || "");
            setCity(rp.city || "Hyderabad");
            setState(rp.state || "Telangana");
            setPincode(rp.pincode || "500072");
            setCreditLimit(rp.credit_limit || 0);
            setCreditTermsDays(rp.credit_terms_days || 30);
          } else {
            setShopName(stored?.shop_name || "Srikanth MedPlus Pharmacy");
            setAddress("Shop #4, Main Road, KPHB Colony");
          }
        }

        if (credit) {
          setCreditLimit(credit.credit_limit || 0);
          setCreditTermsDays(credit.credit_terms_days || 30);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg(null);

      await authAPI.updateProfile({
        full_name: fullName,
        phone,
        email,
        shop_name: shopName,
        address,
        city,
        state,
        pincode,
      });

      if (user) {
        const updated: StoredUser = {
          ...user,
          full_name: fullName,
          email,
          phone,
          shop_name: shopName,
        };
        setStoredUser(updated);
        setUser(updated);
      }

      setMsg({ type: "success", text: "Pharmacy Profile details updated successfully!" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    try {
      setPasswordSaving(true);
      setPasswordMsg(null);
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setPasswordSaving(false);
    }
  };

  const kycColor =
    kycStatus === "APPROVED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
      : kycStatus === "REJECTED" || kycStatus === "SUSPENDED"
      ? "bg-rose-50 text-rose-700 border-rose-300"
      : "bg-amber-50 text-amber-700 border-amber-300";

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#A71380] text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full">
              Pharmacy Account
            </span>
            <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-md border ${kycColor}`}>
              ● KYC {kycStatus}
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-1">
            Shop Profile &amp; Drug License Credentials
          </h1>
          {/* <p className="text-xs text-slate-500">
            Official pharmaceutical retailer compliance master record according to Indian Drugs and Cosmetics Rules.
          </p> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Form (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-[#0b2341]">Medical Shop &amp; Pharmacist Credentials</h2>
            <p className="text-xs text-slate-500">Official trade credentials used for GST billing and dispatch invoices.</p>
          </div>

          {msg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pharmacy / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:border-[#A71380]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Authorized Contact Person *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:border-[#A71380]"
                />
              </div>
            </div>

            {/* Drug License Form 20 & 21 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Drug License Form 20 (General Drugs) *
                </label>
                <input
                  type="text"
                  required
                  value={form20No}
                  onChange={(e) => setForm20No(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#0b2341] focus:outline-hidden focus:border-[#A71380]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Drug License Form 21 (Specified / Schedule C/C1)
                </label>
                <input
                  type="text"
                  value={form21No}
                  onChange={(e) => setForm21No(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-[#0b2341] focus:outline-hidden focus:border-[#A71380]"
                />
              </div>
            </div>

            {/* DL Validity Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">DL Issue Date</label>
                <input
                  type="date"
                  value={dlIssueDate}
                  onChange={(e) => setDlIssueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">DL Expiry Date *</label>
                <input
                  type="date"
                  value={dlExpiryDate}
                  onChange={(e) => setDlExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700"
                />
              </div>
            </div>

            {/* Registered Pharmacist Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Registered Pharmacist Name *</label>
                <input
                  type="text"
                  required
                  value={pharmacistName}
                  onChange={(e) => setPharmacistName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-hidden focus:border-[#A71380]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Pharmacist Registration No (Pharmacy Council) *
                </label>
                <input
                  type="text"
                  required
                  value={pharmacistRegNo}
                  onChange={(e) => setPharmacistRegNo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#0b2341] focus:outline-hidden focus:border-[#A71380]"
                />
              </div>
            </div>

            {/* Tax IDs: GSTIN & PAN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pharmacy GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-hidden focus:border-[#A71380]"
                  placeholder="36AABCS..."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Business PAN No</label>
                <input
                  type="text"
                  value={panNo}
                  onChange={(e) => setPanNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-hidden focus:border-[#A71380]"
                  placeholder="ABCDE1234F"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone / Mobile *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:border-[#A71380]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:border-[#A71380]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Shop Street Address *</label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:border-[#A71380]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#A71380] to-[#8E0F6D] hover:from-[#8E0F6D] hover:to-[#6B0B52] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#A71380]/30 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </form>
        </div>

        {/* Security & Credit Terms (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Drug License Verification Card */}
          <div className="bg-gradient-to-br from-[#0b2341] to-[#103058] rounded-3xl p-6 text-white space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#F3D0E9] bg-[#A71380]/40 px-2.5 py-0.5 rounded border border-[#A71380]/60">
                KYC STATUS
              </span>
              <span
                className={`font-black text-xs px-2 py-0.5 rounded ${
                  kycStatus === "APPROVED"
                    ? "text-emerald-300 bg-emerald-950/60 border border-emerald-400/40"
                    : "text-amber-300 bg-amber-950/60 border border-amber-400/40"
                }`}
              >
                {kycStatus === "APPROVED" ? "✓ APPROVED" : `⏳ ${kycStatus}`}
              </span>
            </div>
            <h3 className="text-sm font-black text-white">Drug Control Authority Records</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your registered retail pharmacy credentials with Form 20:{" "}
              <span className="font-mono text-white font-bold">{form20No}</span> and Form 21:{" "}
              <span className="font-mono text-white font-bold">{form21No}</span>.
            </p>
            <div className="pt-2 border-t border-slate-700/80 space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span>Credit Limit:</span>
                <span className="font-black text-white font-mono">₹{creditLimit.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Terms:</span>
                <span className="font-black text-white font-mono">Net-{creditTermsDays} Days</span>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#0b2341]">Account Security</h3>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#A71380]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#A71380]"
                  placeholder="Min 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full bg-[#0b2341] hover:bg-[#103058] text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
