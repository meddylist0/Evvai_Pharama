"use client";

import React, { useState, useEffect, useRef } from "react";
import { getStoredUser, StoredUser, authAPI, kycAPI, setStoredUser } from "@/lib/api";

const PRESET_AVATARS = [
  { id: "dist1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", label: "Executive" },
  { id: "dist2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", label: "Professional" },
  { id: "dist3", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", label: "Healthcare" },
  { id: "dist4", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", label: "Partner" },
  { id: "dist5", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80", label: "Pharmacist" },
  { id: "dist6", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80", label: "Director" },
];

export default function DistributorProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Profile Form State
  const [form, setForm] = useState({
    companyName: "",
    distributorName: "",
    email: "",
    phone: "",
    gstNumber: "",
    drugLicenseNo: "",
    panNumber: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    address: "",
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const loadData = async () => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored?.avatar) {
      setSelectedAvatar(stored.avatar);
    } else {
      setSelectedAvatar(PRESET_AVATARS[0].url);
    }

    try {
      const me = await authAPI.getMe();
      if (me) {
        setProfileData(me);
        if (me.avatar) setSelectedAvatar(me.avatar);
        setForm({
          companyName: me.distributor_profile?.company_name || me.full_name || "",
          distributorName: me.distributor_profile?.distributor_name || me.full_name || "",
          email: me.email || "",
          phone: me.phone || "",
          gstNumber: me.distributor_profile?.gstin || "",
          drugLicenseNo: me.distributor_profile?.drug_license_no || "",
          panNumber: "",
          city: me.distributor_profile?.city || "Hyderabad",
          state: me.distributor_profile?.state || "Telangana",
          pincode: me.distributor_profile?.pincode || "500033",
          address: me.distributor_profile?.business_address || "",
        });
      }
    } catch (err) {
      console.warn("Failed fetching profile:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kycStatus = profileData?.distributor_profile?.kyc_status || user?.kyc_status || "PENDING";
  const isApproved = kycStatus === "APPROVED";
  const isRejected = kycStatus === "REJECTED";
  const adminRemarks = profileData?.distributor_profile?.admin_remarks;

  // Handle Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMsg({ type: "error", text: "Please upload a valid image file (PNG, JPG, JPEG, WEBP)." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ type: "error", text: "Image size too large. Please select a photo under 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedAvatar(base64);
      setStatusMsg({ type: "success", text: `✓ Uploaded photo '${file.name}'! Click 'Save Profile Changes' below to apply.` });
      setTimeout(() => setStatusMsg(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Save Profile & Resubmit KYC
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      // 1. Update basic profile info (name, email, phone, company, address, avatar)
      await authAPI.updateProfile({
        full_name: form.distributorName,
        email: form.email,
        phone: form.phone,
        company_name: form.companyName,
        address: form.address,
        city: form.city,
        state: form.state,
        avatar: selectedAvatar,
      });

      // 2. If rejected or pending, re-submit revised KYC documents
      if (!isApproved && form.gstNumber && form.drugLicenseNo) {
        await kycAPI.submit({
          gst_number: form.gstNumber,
          drug_license_no: form.drugLicenseNo,
          pan_number: form.panNumber || undefined,
        });

        const updated: StoredUser = {
          ...user!,
          full_name: form.distributorName,
          email: form.email,
          avatar: selectedAvatar,
          kyc_status: "PENDING",
        };
        setStoredUser(updated);
        setUser(updated);

        setStatusMsg({
          type: "success",
          text: "✓ Profile updated & Revised KYC documents successfully re-submitted for Admin Verification!",
        });
      } else {
        const updated: StoredUser = {
          ...user!,
          full_name: form.distributorName,
          email: form.email,
          avatar: selectedAvatar,
        };
        setStoredUser(updated);
        setUser(updated);

        setStatusMsg({
          type: "success",
          text: "✓ Distributor profile changes saved successfully!",
        });
      }

      // Notify other components (top header pill etc.)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pharmalink_user_updated"));
      }

      await loadData();
    } catch (err: any) {
      console.warn("Failed updating profile:", err);
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to save profile changes. Please try again.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  // Change Password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: "error", text: "New passwords do not match. Please re-type." });
      return;
    }

    setChangingPassword(true);
    try {
      await authAPI.changePassword(
        passwordForm.current_password,
        passwordForm.new_password
      );

      setPasswordMsg({
        type: "success",
        text: "✓ Password updated successfully! Use your new password on your next sign-in.",
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.message || "Failed to update password. Please check your current password.",
      });
    } finally {
      setChangingPassword(false);
      setTimeout(() => setPasswordMsg(null), 6000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl w-full">
      {/* Header Status Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-2xs ${isRejected
        ? "bg-rose-50/70 border-rose-200 text-rose-950"
        : isApproved
          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
          : "bg-white border-slate-200/90"
        }`}>
        <div className="flex items-center space-x-2 mb-2">
          <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border inline-block ${isApproved
            ? "text-emerald-800 bg-emerald-100/70 border-emerald-300"
            : isRejected
              ? "text-rose-800 bg-rose-100/80 border-rose-300"
              : "text-amber-800 bg-amber-100/70 border-amber-300"
            }`}>
            {isApproved
              ? "KYC Status: Verified & Approved ✓"
              : isRejected
                ? "KYC Status: Rejected ❌ — Action Required"
                : "KYC Status: Pending Admin Verification ⏳"}
          </span>
        </div>

        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight">
          Distributor Account Profile & KYC Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account profile picture, contact email, GSTIN, Drug License, and password security.
        </p>

        {isRejected && (
          <div className="mt-4 p-4 bg-rose-100/80 border-2 border-rose-300 rounded-2xl space-y-1 text-xs text-rose-900 shadow-inner">
            <div className="flex items-center space-x-2 font-black text-rose-950 uppercase text-[11px]">
              <span>⚠️</span>
              <span>Rejection Reason from Compliance Officer:</span>
            </div>
            <p className="font-semibold text-rose-900 bg-white/70 p-2.5 rounded-xl border border-rose-200 leading-relaxed">
              "{adminRemarks || "Document uploaded is invalid or illegible. Please provide a clear active Drug License (Form 20B/21B) and matching GSTIN."}"
            </p>
            <p className="text-[11px] text-rose-800 pt-1">
              Please update your GST number and Drug License below and click <strong>"Save & Re-submit KYC"</strong>.
            </p>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className={`text-xs p-4 rounded-2xl font-bold border transition-all ${statusMsg.type === "error"
          ? "bg-rose-50 border-rose-200 text-rose-800"
          : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Card 1: Avatar / Profile Photo */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#0b2341] uppercase tracking-wider">
              Profile Photo & Avatar
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Choose a preset avatar or upload a custom corporate photo from your device.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-600 shadow-md bg-slate-100">
                <img
                  src={selectedAvatar || PRESET_AVATARS[0].url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-3 flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatar(av.url)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${selectedAvatar === av.url
                      ? "border-blue-600 ring-2 ring-blue-400/40 scale-105"
                      : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                      }`}
                    title={av.label}
                  >
                    <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs border border-slate-200"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Upload Photo from Device</span>
                </button>
                <span className="text-[11px] text-slate-400">JPG, PNG under 5MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Contact & Account Details */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-2xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#0b2341] uppercase tracking-wider">
              Personal & Contact Information
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Your primary login email, authorized contact name, and phone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Authorized Contact Person *</label>
              <input
                type="text"
                required
                value={form.distributorName}
                onChange={(e) => setForm({ ...form, distributorName: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Login / Contact Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Account Role</label>
              <input
                type="text"
                readOnly
                value="DISTRIBUTOR (Wholesale B2B)"
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-100 text-slate-500 font-bold cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Company & Regulatory Credentials */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-2xs space-y-5 text-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#0b2341] uppercase tracking-wider">
                Corporate & Drug License Details
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                GSTIN and Drug License numbers for wholesale tax invoices and DCA verification.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-full">
              Form 20B / 21B
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Firm Name *</label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">GST Number (GSTIN) *</label>
              <input
                type="text"
                required
                value={form.gstNumber}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-bold text-blue-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Drug License Number *</label>
              <input
                type="text"
                required
                value={form.drugLicenseNo}
                onChange={(e) => setForm({ ...form, drugLicenseNo: e.target.value.toUpperCase() })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">PAN Card Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. AAECP1234F"
                value={form.panNumber}
                onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Registered Business Address</label>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className={`${isRejected
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[#0b2341] hover:bg-[#1d4ed8]"
                } text-white px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-2`}
            >
              <span>{saving ? "Saving Changes..." : isRejected ? "📝 Save & Re-submit KYC Documents" : "Save Profile Changes"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Card 4: Account Security & Password Change */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-8 shadow-2xs space-y-5 text-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#0b2341] uppercase tracking-wider">
              Account Security & Password
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Update your account password regularly to keep your wholesale console secure.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full">
            🔒 256-bit BCrypt
          </span>
        </div>

        {passwordMsg && (
          <div className={`p-3.5 rounded-xl font-bold border transition-all ${passwordMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}>
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-xl">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                required
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="Enter current password"
                className="w-full border border-slate-200 rounded-xl p-3 pr-10 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                {showCurrentPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password *</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full border border-slate-200 rounded-xl p-3 pr-10 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="Re-type new password"
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {changingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
