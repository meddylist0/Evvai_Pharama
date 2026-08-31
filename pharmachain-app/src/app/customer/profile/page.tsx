"use client";

import React, { useState, useEffect, useRef } from "react";
import { authAPI, getStoredUser, StoredUser } from "@/lib/api";

const PRESET_AVATARS = [
  { id: "cust1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", label: "Executive" },
  { id: "cust2", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", label: "Professional" },
  { id: "cust3", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80", label: "Healthcare" },
  { id: "cust4", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", label: "Buyer" },
  { id: "cust5", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80", label: "Pharmacist" },
  { id: "cust6", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80", label: "Doctor" },
];

export default function CustomerProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setSelectedAvatar(stored.avatar || PRESET_AVATARS[0].url);
      setForm({
        full_name: stored.full_name || "",
        email: stored.email || "",
        phone: stored.phone || "+91 9988776655",
        company_name: stored.company_name || "Direct Retail Buyer",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500033",
      });
    }
  }, []);

  // Handle Local File Upload from User's Device (PC / Phone)
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
      setStatusMsg({ type: "success", text: `✓ Uploaded '${file.name}' as profile picture! Click 'Save Changes' to apply.` });
      setTimeout(() => setStatusMsg(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await authAPI.updateProfile({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        company_name: form.company_name,
        avatar: selectedAvatar,
      });

      const updated = getStoredUser();
      setUser(updated);

      // Dispatch event to instantly update top navbar profile pill
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pharmalink_user_updated"));
      }

      setStatusMsg({ type: "success", text: "✓ Customer profile and avatar photo updated successfully!" });
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!passwordForm.current_password) {
      setPasswordMsg({ type: "error", text: "Please enter your current password." });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: "error", text: "New password and confirmation password do not match." });
      return;
    }

    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordMsg({ type: "error", text: "New password cannot be identical to current password." });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await authAPI.changePassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordMsg({ type: "success", text: `✓ ${res.message || "Password updated successfully!"}` });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setTimeout(() => setPasswordMsg(null), 5000);
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password. Please check your current password." });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
            Account Management & Security
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● Active Customer Account
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          Customer Profile & Avatar Settings
        </h1>
        <p className="text-xs text-slate-500">
          Upload your custom profile photo from device, update contact credentials, and manage default shipping destination.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border transition-all ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
            : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Main Profile Card */}
      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6 text-xs">
        {/* Avatar Selection & Device Upload Section */}
        <div className="space-y-4 pb-6 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
            1. Profile Picture / Avatar Photo
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Active Preview */}
            <div className="relative group shrink-0 text-center space-y-2">
              <div className="w-28 h-28 rounded-3xl overflow-hidden border-3 border-[#0b2341] bg-slate-100 shadow-md mx-auto">
                <img
                  src={selectedAvatar || PRESET_AVATARS[0].url}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                  }}
                />
              </div>
              <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                ● Current Avatar
              </span>
            </div>

            {/* Upload Button + Presets */}
            <div className="space-y-3 flex-1 w-full">
              {/* Device File Upload Button */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-800 text-xs block">Upload Photo from Computer / Phone</span>
                  <p className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <span>📷 Choose File</span>
                </button>
              </div>

              {/* Or Presets Selection */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-600 block">Or select an avatar preset:</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`w-11 h-11 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${selectedAvatar === av.url
                        ? "border-blue-600 ring-2 ring-blue-400/50 scale-105"
                        : "border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100"
                        }`}
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Destination Info */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
            2. Contact & Consignee Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone Number *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Organization / Home Address *</label>
              <input
                type="text"
                required
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white px-6 py-2.5 rounded-xl font-extrabold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Profile & Avatar"}
          </button>
        </div>
      </form>

      {/* Change Password Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-2xs space-y-6 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base">🔒</span>
              <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
                Account Security & Change Password
              </h3>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Ensure your account remains safe with a strong password (minimum 6 characters).
            </p>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Encrypted SHA-256
          </span>
        </div>

        {passwordMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold border transition-all ${passwordMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
              : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
              }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  placeholder="Enter current password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 pr-12 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer select-none"
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password *</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  placeholder="Min 6 characters"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 pr-12 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px] font-bold cursor-pointer select-none"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type={showNewPassword ? "text" : "password"}
                required
                placeholder="Re-type new password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={changingPassword}
              className="bg-[#0b2341] hover:bg-[#1d4ed8] text-white px-6 py-2.5 rounded-xl font-extrabold shadow-2xs transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <span>{changingPassword ? "Updating Password..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
