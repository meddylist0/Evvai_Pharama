"use client";

import React, { useState, useEffect, useRef } from "react";
import { authAPI, addressesAPI, AddressItem, getStoredUser, StoredUser } from "@/lib/api";
import { usePlatform } from "@/lib/platform";
import { MobileProfileView } from "@/components/mobile";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

export default function CustomerProfilePage() {
  const platform = usePlatform();

  if (platform.isNative || platform.isMobile) {
    return <MobileProfileView />;
  }

  const [user, setUser] = useState<StoredUser | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Address Book State
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressFormExpanded, setAddressFormExpanded] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressForm, setAddressForm] = useState({
    address_type: "HOME",
    recipient_name: "",
    phone: "",
    street_address: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    is_default: false,
  });

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

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const data = await addressesAPI.list();
      setAddresses(data || []);
    } catch (err) {
      console.error("Failed loading addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setSelectedAvatar(stored.avatar || "");
      setForm({
        full_name: stored.full_name || "",
        email: stored.email || "",
        phone: stored.phone || "+91 9988776655",
        company_name: stored.company_name || "Direct Retail Buyer",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500033",
      });
      setAddressForm((prev) => ({
        ...prev,
        recipient_name: stored.full_name || "",
        phone: stored.phone || "+91 9988776655",
      }));
    }
    fetchAddresses();
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

  // Address Handlers
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      address_type: "HOME",
      recipient_name: form.full_name || user?.full_name || "",
      phone: form.phone || user?.phone || "+91 9988776655",
      street_address: "",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500033",
      is_default: addresses.length === 0,
    });
    setAddressFormExpanded(true);
  };

  const handleOpenEditAddress = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      address_type: addr.address_type || "HOME",
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      street_address: addr.street_address,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: addr.is_default,
    });
    setAddressFormExpanded(true);
  };

  const handleCancelAddress = () => {
    setAddressFormExpanded(false);
    setEditingAddressId(null);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSubmitting(true);
    try {
      if (editingAddressId) {
        await addressesAPI.update(editingAddressId, addressForm);
        setStatusMsg({ type: "success", text: "✓ Delivery address updated successfully!" });
      } else {
        await addressesAPI.create(addressForm);
        setStatusMsg({ type: "success", text: "✓ New delivery address added to your address book!" });
      }
      setAddressFormExpanded(false);
      setEditingAddressId(null);
      await fetchAddresses();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to save address." });
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await addressesAPI.setDefault(id);
      await fetchAddresses();
      setStatusMsg({ type: "success", text: "✓ Default delivery address updated!" });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to set default address." });
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;
    try {
      await addressesAPI.delete(id);
      await fetchAddresses();
      setStatusMsg({ type: "success", text: "✓ Address removed from address book." });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to delete address." });
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
      setPasswordMsg({
        type: "error",
        text: err.message || "Failed to update password. Please check your current password.",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const getAddressTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "HOME":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[10px]">🏠 Home</span>;
      case "OFFICE":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold text-[10px]">🏢 Office / Corp</span>;
      case "CLINIC":
        return <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md font-bold text-[10px]">🏥 Hospital / Clinic</span>;
      case "PHARMACY":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-bold text-[10px]">💊 Retail Pharmacy</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-bold text-[10px]">📍 Destination</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-extrabold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-3 py-1 rounded-full border border-[#F3D0E9]">
            Account Management & Security
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● Active Customer Account
          </span>
        </div>
        <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
          Customer Profile & Address Book
        </h1>

      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border transition-all ${statusMsg.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
            : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Main Profile Card */}
      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6 text-xs">
        {/* Avatar Upload Section */}
        <div className="space-y-4 pb-6 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
            1. Profile Picture / Avatar Photo
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Active Preview */}
            <div className="relative group shrink-0 text-center space-y-2">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-100 shadow-md mx-auto flex items-center justify-center">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setSelectedAvatar("")}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs ${selectedAvatar ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                {selectedAvatar ? "● Photo Attached" : "● No Photo Set"}
              </span>
            </div>

            {/* Upload & Action Controls */}
            <div className="space-y-3 flex-1 w-full">
              <div className="p-5 bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#A71380] rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 text-sm block">Upload Custom Profile Photo</span>
                  <p className="text-[11px] text-slate-500">
                    Select any picture from your PC or Mobile device (Supports JPG, PNG, WEBP under 5MB).
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#A71380] hover:bg-[#8E0F6D] text-white font-extrabold px-4 py-2.5 rounded-lg text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5"
                  >
                    <span>📷 Choose File</span>
                  </button>
                  {selectedAvatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAvatar("");
                        setStatusMsg({ type: "success", text: "Photo removed. Click 'Save Profile' to apply." });
                        setTimeout(() => setStatusMsg(null), 3000);
                      }}
                      className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold px-3 py-2.5 rounded-lg text-xs transition-all cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
            2. Personal & Account Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
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
                className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Clinic / Entity Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-lg font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </form>

      {/* Dynamic Multi-Address Book Card (Home, Office, Clinics) */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base">📍</span>
              <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
                3. Saved Delivery Addresses (Home &amp; Office Book)
              </h3>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Add and manage multiple delivery locations (Home, Corporate Office, Hospital / Clinic, Retail Pharmacy).
            </p>
          </div>
          {!addressFormExpanded && (
            <button
              type="button"
              onClick={handleOpenAddAddress}
              className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-4 py-2 rounded-lg font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>+ Add New Address</span>
            </button>
          )}
        </div>

        {/* INLINE EXPANDABLE ADD / EDIT ADDRESS FORM */}
        {addressFormExpanded && (
          <div className="bg-[#F8EAF4]/30 p-5 md:p-6 rounded-2xl border-2 border-[#F3D0E9] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#F3D0E9] pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-base">📍</span>
                <h4 className="font-black text-sm text-[#0b2341]">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCancelAddress}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer flex items-center space-x-1"
              >
                <span>✕ Cancel</span>
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Address Label / Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "HOME", label: "🏠 Home" },
                    { id: "OFFICE", label: "🏢 Office" },
                    { id: "CLINIC", label: "🏥 Clinic" },
                    { id: "PHARMACY", label: "💊 Pharmacy" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, address_type: t.id })}
                      className={`py-2 px-2 rounded-lg font-bold text-xs border transition-all cursor-pointer text-center ${addressForm.address_type === t.id
                        ? "bg-[#A71380] text-white border-[#A71380] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh / Arun Kumar"
                    value={addressForm.recipient_name}
                    onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium focus:outline-none focus:border-[#A71380]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Street Address / Building / Area / Colony *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Door No, Street Name, Landmark, Colony"
                  value={addressForm.street_address}
                  onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium focus:outline-none focus:border-[#A71380] resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium focus:outline-none focus:border-[#A71380]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium focus:outline-none focus:border-[#A71380]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white font-medium focus:outline-none focus:border-[#A71380]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="addr_default"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  className="w-4 h-4 rounded text-[#A71380] focus:ring-[#A71380] cursor-pointer"
                />
                <label htmlFor="addr_default" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#F3D0E9]">
                <button
                  type="button"
                  onClick={handleCancelAddress}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white font-extrabold px-5 py-2 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {addressSubmitting ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ADDRESS LIST */}
        {loadingAddresses ? (
          <div className="p-8 text-center text-slate-400 font-medium">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#A71380] border-t-transparent mb-2"></div>
            <p>Loading saved addresses...</p>
          </div>
        ) : addresses.length === 0 && !addressFormExpanded ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <div className="text-3xl">🏠🏢</div>
            <h4 className="font-extrabold text-slate-700 text-sm">No Saved Delivery Addresses Yet</h4>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Save your Home, Office, or Clinic addresses here for 1-click auto-fill during formulation orders!
            </p>
            <button
              type="button"
              onClick={handleOpenAddAddress}
              className="bg-[#A71380] hover:bg-[#8E0F6D] text-white font-extrabold px-4 py-2 rounded-lg text-xs shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1"
            >
              <span>+ Add Your First Address</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-xl border transition-all relative flex flex-col justify-between ${addr.is_default
                  ? "bg-[#F8EAF4]/40 border-[#F3D0E9] shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {getAddressTypeBadge(addr.address_type)}
                      {addr.is_default && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                          ✓ DEFAULT
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-[#0b2341]">{addr.recipient_name}</h4>
                    <p className="text-[11px] font-mono text-slate-500">📞 {addr.phone}</p>
                  </div>

                  <p className="text-slate-700 font-medium text-xs leading-relaxed">
                    {addr.street_address}
                  </p>

                  <div className="text-[11px] font-bold text-slate-500">
                    {addr.city}, {addr.state} - <span className="font-mono text-slate-800">{addr.pincode}</span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {!addr.is_default ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-[#A71380] hover:text-[#8E0F6D] hover:underline font-bold text-xs cursor-pointer"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700">
                        ● Primary Destination
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAddress(addr)}
                      title="Edit Address"
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-[#A71380] bg-slate-100 hover:bg-[#F8EAF4] rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      title="Delete Address"
                      className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base">🔒</span>
              <h3 className="font-extrabold text-sm text-[#0b2341] uppercase tracking-wider">
                4. Account Security &amp; Password
              </h3>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Ensure your customer account remains safe with a strong password.
            </p>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Encrypted SHA-256
          </span>
        </div>

        {passwordMsg && (
          <div
            className={`p-4 rounded-xl text-xs font-bold border transition-all ${passwordMsg.type === "success"
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
                  className="w-full border border-slate-200 rounded-lg p-3 pr-12 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
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
                  className="w-full border border-slate-200 rounded-lg p-3 pr-12 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
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
                className="w-full border border-slate-200 rounded-lg p-3 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={changingPassword}
              className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-lg font-extrabold shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <span>{changingPassword ? "Updating Password..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

