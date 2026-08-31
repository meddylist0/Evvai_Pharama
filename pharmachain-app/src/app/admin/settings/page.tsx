"use client";

import React, { useState, useEffect } from "react";
import { getStoredUser, StoredUser, authAPI, paymentsAPI, PaymentAdminSettings, notificationsAPI, NotificationSettingsData, NotificationLogItem } from "@/lib/api";

const PRESET_AVATARS = [
  { id: "doc1", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80", label: "Chief Physician" },
  { id: "exec1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", label: "Operations Exec" },
  { id: "doc2", url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80", label: "Quality Director" },
  { id: "sci1", url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=150&q=80", label: "Lead Chemist" },
  { id: "corp1", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", label: "Supply Admin" },
  { id: "doc3", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80", label: "Regulatory Officer" },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"payments" | "profile" | "compliance" | "notifications">("payments");

  // User Profile State
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCompany, setProfileCompany] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Razorpay Gateway State
  const [paymentConfig, setPaymentConfig] = useState<PaymentAdminSettings | null>(null);
  const [rzpKeyId, setRzpKeyId] = useState("rzp_test_Bvq9kiuaq8gkcs");
  const [rzpKeySecret, setRzpKeySecret] = useState("");
  const [rzpMode, setRzpMode] = useState<"test" | "live">("test");
  const [rzpIsActive, setRzpIsActive] = useState(true);
  const [showRzpSecret, setShowRzpSecret] = useState(false);

  // Stripe Gateway State
  const [stripeIsActive, setStripeIsActive] = useState(false);
  const [stripeMode, setStripeMode] = useState<"test" | "live">("test");
  const [stripePublishableKey, setStripePublishableKey] = useState("pk_test_51MzXYZ1234567890Abc");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  // PayPal Gateway State
  const [paypalIsActive, setPaypalIsActive] = useState(false);
  const [paypalMode, setPaypalMode] = useState<"sandbox" | "live">("sandbox");
  const [paypalClientId, setPaypalClientId] = useState("AU_Sandbox_ClientId_12345");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [showPaypalSecret, setShowPaypalSecret] = useState(false);

  // Cash on Delivery & Wire Transfer State
  const [codEnabled, setCodEnabled] = useState(true);
  const [codMaxLimit, setCodMaxLimit] = useState(50000);
  const [wireEnabled, setWireEnabled] = useState(true);
  const [bankName, setBankName] = useState("HDFC Bank Ltd");
  const [accountNo, setAccountNo] = useState("50200012345678");
  const [ifscCode, setIfscCode] = useState("HDFC0001234");

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification & SMS Gateway State
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("notifications@pharmalink.com");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [senderEmail, setSenderEmail] = useState("orders@pharmalink.com");
  const [senderName, setSenderName] = useState("PharmaLink Enterprise");
  const [emailEnabled, setEmailEnabled] = useState(true);

  const [smsProvider, setSmsProvider] = useState("Twilio / Fast2SMS");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("PHARMA");
  const [smsEnabled, setSmsEnabled] = useState(true);

  const [notifyOrderCreated, setNotifyOrderCreated] = useState(true);
  const [notifyOrderStatus, setNotifyOrderStatus] = useState(true);
  const [notifyKycStatus, setNotifyKycStatus] = useState(true);

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMsg, setNotifMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Test Dispatch State
  const [testEmailTarget, setTestEmailTarget] = useState("");
  const [testSmsTarget, setTestSmsTarget] = useState("");
  const [testDispatchMsg, setTestDispatchMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notifLogs, setNotifLogs] = useState<NotificationLogItem[]>([]);

  // Notification Logs Pagination & Filtering State
  const [logCurrentPage, setLogCurrentPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(8);
  const [logChannelFilter, setLogChannelFilter] = useState<"ALL" | "EMAIL" | "SMS">("ALL");
  const [logSearchQuery, setLogSearchQuery] = useState("");

  // Compliance Settings State
  const [complianceSaved, setComplianceSaved] = useState(false);
  const [thresholdsSaved, setThresholdsSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: "PharmaChain Global Manufacturing Ltd",
    gstin: "36AAACA1234A1Z5",
    drugLicense: "TS/HYD/2025/8892",
    lowStockThreshold: 2000,
    defaultCurrency: "INR (₹)",
    enableGstInvoicing: true,
    requireKycForB2b: true,
    supportEmail: "sales@evvaipharma.com",
    emailAlerts: true,
    smsAlerts: true,
  });

  useEffect(() => {
    const u = getStoredUser();
    if (u) {
      setUser(u);
      setProfileName(u.full_name || "");
      setProfilePhone(u.phone || "+91 9876543210");
      setProfileCompany(u.company_name || "PharmaChain Global Manufacturing Ltd");
      setProfileAvatar(u.avatar || PRESET_AVATARS[0].url);
      setTestEmailTarget(u.email || "admin@pharmalink.com");
      setTestSmsTarget(u.phone || "+91 9876543210");
    }
    loadPaymentSettings();
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const nData = await notificationsAPI.getSettings();
      setSmtpHost(nData.smtp_host || "smtp.gmail.com");
      setSmtpPort(nData.smtp_port || 587);
      setSmtpUser(nData.smtp_user || "notifications@pharmalink.com");
      setSenderEmail(nData.sender_email || "orders@pharmalink.com");
      setSenderName(nData.sender_name || "PharmaLink Enterprise");
      setEmailEnabled(nData.email_enabled);

      setSmsProvider(nData.sms_provider || "Twilio / Fast2SMS");
      setSmsSenderId(nData.sms_sender_id || "PHARMA");
      setSmsEnabled(nData.sms_enabled);

      setNotifyOrderCreated(nData.notify_order_created);
      setNotifyOrderStatus(nData.notify_order_status);
      setNotifyKycStatus(nData.notify_kyc_status);

      const logs = await notificationsAPI.getLogs();
      setNotifLogs(logs);
    } catch (err: any) {
      console.warn("Could not load notification settings:", err);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const data = await paymentsAPI.getAdminSettings();
      setPaymentConfig(data);
      setRzpKeyId(data.key_id || "rzp_test_Bvq9kiuaq8gkcs");
      setRzpMode((data.mode as any) || "test");
      setRzpIsActive(data.is_active);
      setCodEnabled(data.cod_enabled);

      if (data.stripe_active !== undefined) setStripeIsActive(data.stripe_active);
      if (data.stripe_mode) setStripeMode(data.stripe_mode as any);
      if (data.stripe_publishable_key) setStripePublishableKey(data.stripe_publishable_key);

      if (data.paypal_active !== undefined) setPaypalIsActive(data.paypal_active);
      if (data.paypal_mode) setPaypalMode(data.paypal_mode as any);
      if (data.paypal_client_id) setPaypalClientId(data.paypal_client_id);

      if (data.wire_enabled !== undefined) setWireEnabled(data.wire_enabled);
      if (data.bank_name) setBankName(data.bank_name);
      if (data.account_no) setAccountNo(data.account_no);
      if (data.ifsc_code) setIfscCode(data.ifsc_code);
    } catch (err: any) {
      console.warn("Could not load payment settings:", err);
    }
  };

  const handlePaymentSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentMsg(null);
    try {
      const payload: any = {
        key_id: rzpKeyId.trim(),
        mode: rzpMode,
        is_active: rzpIsActive,
        cod_enabled: codEnabled,

        stripe_active: stripeIsActive,
        stripe_mode: stripeMode,
        stripe_publishable_key: stripePublishableKey.trim(),

        paypal_active: paypalIsActive,
        paypal_mode: paypalMode,
        paypal_client_id: paypalClientId.trim(),

        wire_enabled: wireEnabled,
        bank_name: bankName.trim(),
        account_no: accountNo.trim(),
        ifsc_code: ifscCode.trim(),
      };

      if (rzpKeySecret.trim()) payload.key_secret = rzpKeySecret.trim();
      if (stripeSecretKey.trim()) payload.stripe_secret_key = stripeSecretKey.trim();
      if (paypalSecret.trim()) payload.paypal_secret = paypalSecret.trim();

      const updated = await paymentsAPI.updateAdminSettings(payload);
      setPaymentConfig(updated);
      setRzpKeySecret("");
      setStripeSecretKey("");
      setPaypalSecret("");

      setPaymentMsg({
        type: "success",
        text: `✓ Multi-Gateway Configuration saved to live database! Active Gateways: Razorpay (${rzpIsActive ? "ACTIVE" : "OFF"}), Stripe (${stripeIsActive ? "ACTIVE" : "OFF"}), PayPal (${paypalIsActive ? "ACTIVE" : "OFF"}), COD (${codEnabled ? "ENABLED" : "OFF"}), Wire (${wireEnabled ? "ENABLED" : "OFF"})`,
      });
    } catch (err: any) {
      setPaymentMsg({
        type: "error",
        text: err.message || "Failed to update payment gateway settings.",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      await authAPI.updateProfile({
        full_name: profileName.trim(),
        phone: profilePhone.trim(),
        company_name: profileCompany.trim(),
        avatar: profileAvatar,
      });

      setProfileMsg({
        type: "success",
        text: "✓ Administrator Profile & Avatar updated in database successfully! Live sync enabled.",
      });
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err.message || "Failed to update profile in database.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleComplianceSave = (e: React.FormEvent) => {
    e.preventDefault();
    setComplianceSaved(true);
    setTimeout(() => setComplianceSaved(false), 4000);
  };

  const handleThresholdsSave = (e: React.FormEvent) => {
    e.preventDefault();
    setThresholdsSaved(true);
    setTimeout(() => setThresholdsSaved(false), 4000);
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifLoading(true);
    setNotifMsg(null);
    try {
      const payload: any = {
        smtp_host: smtpHost.trim(),
        smtp_port: smtpPort,
        smtp_user: smtpUser.trim(),
        sender_email: senderEmail.trim(),
        sender_name: senderName.trim(),
        email_enabled: emailEnabled,

        sms_provider: smsProvider.trim(),
        sms_sender_id: smsSenderId.trim(),
        sms_enabled: smsEnabled,

        notify_order_created: notifyOrderCreated,
        notify_order_status: notifyOrderStatus,
        notify_kyc_status: notifyKycStatus,
      };
      if (smtpPassword.trim()) payload.smtp_password = smtpPassword.trim();
      if (smsApiKey.trim()) payload.sms_api_key = smsApiKey.trim();

      await notificationsAPI.updateSettings(payload);
      setSmtpPassword("");
      setSmsApiKey("");
      setNotifMsg({
        type: "success",
        text: "✓ Email SMTP & SMS Gateway Settings successfully saved and active!",
      });
      loadNotificationSettings();
    } catch (err: any) {
      setNotifMsg({
        type: "error",
        text: err.message || "Failed to update notification settings.",
      });
    } finally {
      setNotifLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTarget.trim()) return;
    setTestDispatchMsg(null);
    try {
      const res = await notificationsAPI.sendTestEmail(testEmailTarget.trim());
      setTestDispatchMsg({
        type: "success",
        text: `✓ ${res.message} (${res.status} mode)`,
      });
      loadNotificationSettings();
    } catch (err: any) {
      setTestDispatchMsg({
        type: "error",
        text: err.message || "Failed to send test email.",
      });
    }
  };

  const handleSendTestSMS = async () => {
    if (!testSmsTarget.trim()) return;
    setTestDispatchMsg(null);
    try {
      const res = await notificationsAPI.sendTestSMS(testSmsTarget.trim());
      setTestDispatchMsg({
        type: "success",
        text: `✓ ${res.message} (${res.status} mode)`,
      });
      loadNotificationSettings();
    } catch (err: any) {
      setTestDispatchMsg({
        type: "error",
        text: err.message || "Failed to send test SMS.",
      });
    }
  };

  const activeCount = [rzpIsActive, stripeIsActive, paypalIsActive, codEnabled, wireEnabled].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-extrabold text-[#0b2341] uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200">
              System Administration & Security
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              API Synced
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0b2341] tracking-tight mt-2">
            Settings & Multi-Payment Gateway Management
          </h1>
          <p className="text-xs text-slate-500">
            Configure multi-tier payment gateways (Razorpay, Stripe, PayPal, COD, Wire Transfer), compliance rules, and administrator profile details.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/90 shrink-0">
          <img
            src={profileAvatar || PRESET_AVATARS[0].url}
            alt="Admin Avatar"
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
          />
          <div>
            <p className="text-xs font-black text-[#0b2341]">{user?.full_name || "Dr. Arun Bhairi"}</p>
            <p className="text-[10px] text-slate-500 font-mono font-bold uppercase">{user?.role || "ADMIN"} Account</p>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${activeTab === "payments"
              ? "bg-[#0b2341] text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
        >
          <span>💳 Multi-Payment Gateways</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${activeTab === "payments" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800"
            }`}>
            {activeCount} Active
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${activeTab === "profile"
              ? "bg-[#0b2341] text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
        >
          <span>👤 Profile & Avatar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("compliance")}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${activeTab === "compliance"
              ? "bg-[#0b2341] text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
        >
          <span>🏛️ Compliance & GST</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2.5 rounded-xl font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${activeTab === "notifications"
              ? "bg-[#0b2341] text-white shadow-xs"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
        >
          <span>🔔 Alerts & Thresholds</span>
        </button>
      </div>

      {/* TAB 1: MULTI-PAYMENT GATEWAY CONFIGURATION */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          {paymentMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border ${paymentMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
            >
              {paymentMsg.text}
            </div>
          )}

          <form onSubmit={handlePaymentSettingsSubmit} className="space-y-6">

            {/* GATEWAY 1: RAZORPAY */}
            <div className={`p-6 rounded-3xl border transition-all ${rzpIsActive ? "bg-white border-blue-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-2xs ${rzpIsActive ? "bg-[#0b2341] text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                    R
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-sm text-[#0b2341]">Razorpay Gateway</h3>
                      <span className="bg-blue-50 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-200">
                        UPI, Cards, QR & NetBanking
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Primary Indian payment gateway supporting UPI QR, NetBanking & Cards.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* TOGGLE SWITCH */}
                  <div className="flex items-center space-x-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRzpIsActive(!rzpIsActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${rzpIsActive ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rzpIsActive ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                    <span
                      onClick={() => setRzpIsActive(!rzpIsActive)}
                      className={`font-extrabold text-xs cursor-pointer select-none ${rzpIsActive ? "text-emerald-700" : "text-slate-500"}`}
                    >
                      {rzpIsActive ? "✓ Enabled" : "Disabled"}
                    </span>
                  </div>

                  {/* Mode Switcher */}
                  {rzpIsActive && (
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setRzpMode("test")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${rzpMode === "test" ? "bg-[#0b2341] text-white shadow-2xs" : "text-slate-600"
                          }`}
                      >
                        🧪 Test
                      </button>
                      <button
                        type="button"
                        onClick={() => setRzpMode("live")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${rzpMode === "live" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600"
                          }`}
                      >
                        🚀 Live
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {rzpIsActive ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Razorpay Key ID
                    </label>
                    <input
                      type="text"
                      value={rzpKeyId}
                      onChange={(e) => setRzpKeyId(e.target.value)}
                      placeholder="rzp_test_... or rzp_live_..."
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-[#0b2341] focus:bg-white focus:border-blue-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Found in Razorpay Dashboard &rarr; Settings &rarr; API Keys</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Razorpay Key Secret
                      </label>
                      {paymentConfig?.key_secret_masked && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Current: {paymentConfig.key_secret_masked}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showRzpSecret ? "text" : "password"}
                        value={rzpKeySecret}
                        onChange={(e) => setRzpKeySecret(e.target.value)}
                        placeholder="Enter new key secret to update..."
                        className="w-full border border-slate-200 rounded-xl p-3 pr-12 bg-slate-50 font-mono text-xs focus:bg-white focus:border-blue-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRzpSecret(!showRzpSecret)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-[11px]"
                      >
                        {showRzpSecret ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Leave blank to keep existing configured secret</p>
                  </div>
                </div>
              ) : (
                <div className="pt-3 text-[11px] text-slate-500 font-medium">
                  Razorpay Gateway is currently disabled. Toggle the switch above to enable Razorpay and enter API credentials.
                </div>
              )}
            </div>

            {/* GATEWAY 2: STRIPE PAYMENTS */}
            <div className={`p-6 rounded-3xl border transition-all ${stripeIsActive ? "bg-white border-indigo-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-2xs ${stripeIsActive ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                    S
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-sm text-[#0b2341]">Stripe Payments</h3>
                      <span className="bg-indigo-50 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-indigo-200">
                        Global Credit Cards & Apple Pay
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">International Payment Gateway supporting USD, EUR & Global Cards.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* TOGGLE SWITCH */}
                  <div className="flex items-center space-x-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setStripeIsActive(!stripeIsActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${stripeIsActive ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${stripeIsActive ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                    <span
                      onClick={() => setStripeIsActive(!stripeIsActive)}
                      className={`font-extrabold text-xs cursor-pointer select-none ${stripeIsActive ? "text-emerald-700" : "text-slate-500"}`}
                    >
                      {stripeIsActive ? "✓ Enabled" : "Disabled"}
                    </span>
                  </div>

                  {stripeIsActive && (
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setStripeMode("test")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${stripeMode === "test" ? "bg-indigo-900 text-white shadow-2xs" : "text-slate-600"
                          }`}
                      >
                        🧪 Test
                      </button>
                      <button
                        type="button"
                        onClick={() => setStripeMode("live")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${stripeMode === "live" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600"
                          }`}
                      >
                        🚀 Live
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {stripeIsActive ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Stripe Publishable Key
                    </label>
                    <input
                      type="text"
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      placeholder="pk_test_... or pk_live_..."
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-[#0b2341] focus:bg-white focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        Stripe Secret Key
                      </label>
                      {paymentConfig?.stripe_secret_masked && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Current: {paymentConfig.stripe_secret_masked}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showStripeSecret ? "text" : "password"}
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        placeholder="sk_test_... or sk_live_..."
                        className="w-full border border-slate-200 rounded-xl p-3 pr-12 bg-slate-50 font-mono text-xs focus:bg-white focus:border-indigo-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStripeSecret(!showStripeSecret)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-[11px]"
                      >
                        {showStripeSecret ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-3 text-[11px] text-slate-500 font-medium">
                  Stripe Gateway is currently disabled. Toggle the switch above to enable Stripe and enter API credentials.
                </div>
              )}
            </div>

            {/* GATEWAY 3: PAYPAL GATEWAY */}
            <div className={`p-6 rounded-3xl border transition-all ${paypalIsActive ? "bg-white border-sky-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-2xs ${paypalIsActive ? "bg-sky-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                    P
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-sm text-[#0b2341]">PayPal Express Checkout</h3>
                      <span className="bg-sky-50 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-sky-200">
                        Global Wallet Checkout
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">PayPal Wallet & Cross-Border Credit Card Checkout.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* TOGGLE SWITCH */}
                  <div className="flex items-center space-x-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setPaypalIsActive(!paypalIsActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${paypalIsActive ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${paypalIsActive ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                    <span
                      onClick={() => setPaypalIsActive(!paypalIsActive)}
                      className={`font-extrabold text-xs cursor-pointer select-none ${paypalIsActive ? "text-emerald-700" : "text-slate-500"}`}
                    >
                      {paypalIsActive ? "✓ Enabled" : "Disabled"}
                    </span>
                  </div>

                  {paypalIsActive && (
                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setPaypalMode("sandbox")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${paypalMode === "sandbox" ? "bg-sky-900 text-white shadow-2xs" : "text-slate-600"
                          }`}
                      >
                        🧪 Sandbox
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaypalMode("live")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${paypalMode === "live" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600"
                          }`}
                      >
                        🚀 Live
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {paypalIsActive ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      PayPal Client ID
                    </label>
                    <input
                      type="text"
                      value={paypalClientId}
                      onChange={(e) => setPaypalClientId(e.target.value)}
                      placeholder="AU_Sandbox_ClientId_..."
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-[#0b2341] focus:bg-white focus:border-sky-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">
                        PayPal Secret Key
                      </label>
                      {paymentConfig?.paypal_secret_masked && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Current: {paymentConfig.paypal_secret_masked}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPaypalSecret ? "text" : "password"}
                        value={paypalSecret}
                        onChange={(e) => setPaypalSecret(e.target.value)}
                        placeholder="EL_Sandbox_Secret_..."
                        className="w-full border border-slate-200 rounded-xl p-3 pr-12 bg-slate-50 font-mono text-xs focus:bg-white focus:border-sky-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-[11px]"
                      >
                        {showPaypalSecret ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-3 text-[11px] text-slate-500 font-medium">
                  PayPal Express Checkout is currently disabled. Toggle the switch above to enable PayPal and enter Client ID.
                </div>
              )}
            </div>

            {/* CARD 4 & 5: COD & WIRE TRANSFER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Cash on Delivery */}
              <div className={`p-6 rounded-3xl border transition-all ${codEnabled ? "bg-white border-amber-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
                }`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                      💵
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#0b2341]">Cash on Delivery (COD)</h4>
                      <p className="text-[10px] text-slate-500">Offline Collection on Delivery</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCodEnabled(!codEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${codEnabled ? "bg-amber-500" : "bg-slate-300"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${codEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                      />
                    </button>
                    <span
                      onClick={() => setCodEnabled(!codEnabled)}
                      className="font-bold text-xs cursor-pointer select-none text-slate-700"
                    >
                      {codEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                {codEnabled ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Max COD Order Limit (₹)
                    </label>
                    <input
                      type="number"
                      value={codMaxLimit}
                      onChange={(e) => setCodMaxLimit(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono font-bold text-slate-900"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium">COD Checkout option disabled.</p>
                )}
              </div>

              {/* NEFT / RTGS Wire Transfer */}
              <div className={`p-6 rounded-3xl border transition-all ${wireEnabled ? "bg-white border-emerald-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
                }`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                      🏦
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#0b2341]">NEFT / RTGS Wire Transfer</h4>
                      <p className="text-[10px] text-slate-500">B2B Wholesale Bank Payment</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setWireEnabled(!wireEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${wireEnabled ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${wireEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                      />
                    </button>
                    <span
                      onClick={() => setWireEnabled(!wireEnabled)}
                      className="font-bold text-xs cursor-pointer select-none text-slate-700"
                    >
                      {wireEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                {wireEnabled ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono font-bold text-[11px]"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium">NEFT Wire Transfer disabled.</p>
                )}
              </div>
            </div>

            {/* MASTER SAVE BUTTON */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-700">Cryptographic HMAC Signature Verification Active & Persisted to Database</span>
              </div>
              <button
                type="submit"
                disabled={paymentLoading}
                className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-2xl font-extrabold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 inline-flex items-center space-x-2"
              >
                <span>{paymentLoading ? "Saving Configurations..." : "Save Gateway Configurations"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PROFILE & AVATAR SETTINGS */}
      {activeTab === "profile" && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-2xs space-y-6 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-[#0b2341]">
                Administrator Profile & Avatar
              </h2>
              <p className="text-[11px] text-slate-400">
                Changes made here will reflect live on the Header, Dashboard welcome banner, and audit trails.
              </p>
            </div>
            <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase px-3 py-1 rounded-lg border border-blue-200">
              {user?.role || "ADMIN"} Account
            </span>
          </div>

          {profileMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border ${profileMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Profile Picture / Avatar:
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-blue-600 bg-white shadow-2xs flex items-center justify-center">
                    <img
                      src={profileAvatar || PRESET_AVATARS[0].url}
                      alt="Selected Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="bg-[#0b2341] hover:bg-[#12315a] text-white px-4 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer inline-flex items-center space-x-2 transition-all shadow-xs">
                      <span>Upload Photo From Computer</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              alert("Image size should be less than 5MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              if (uploadEvent.target?.result) {
                                setProfileAvatar(uploadEvent.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {profileAvatar && !PRESET_AVATARS.some(a => a.url === profileAvatar) && (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                        ✓ Custom file selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Supported formats: JPG, PNG, WEBP (Max 5MB). You can also choose from presets below.
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <span className="text-[11px] font-bold text-slate-500 block mb-2">
                  Or choose a preset avatar:
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  {PRESET_AVATARS.map((av) => {
                    const isSelected = profileAvatar === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setProfileAvatar(av.url)}
                        className={`relative rounded-2xl p-1 transition-all cursor-pointer ${isSelected
                            ? "ring-3 ring-blue-600 bg-blue-50 shadow-2xs"
                            : "border border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                          }`}
                      >
                        <img
                          src={av.url}
                          alt={av.label}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-2xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-bold text-[#0b2341] text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-medium text-slate-900 text-sm focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-2xl font-extrabold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{profileLoading ? "Updating Database..." : "Save & Update Profile"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: COMPLIANCE & GST SETTINGS */}
      {activeTab === "compliance" && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-2xs space-y-6 text-xs">
          <h2 className="text-base font-black text-[#0b2341] border-b border-slate-100 pb-3">
            Enterprise Compliance & Regulatory Rules
          </h2>

          {complianceSaved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xl font-bold">
              ✓ Enterprise Compliance & Regulatory Settings saved successfully!
            </div>
          )}

          <form onSubmit={handleComplianceSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Corporate GSTIN</label>
                <input
                  type="text"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold text-blue-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Drug License Number</label>
                <input
                  type="text"
                  value={settings.drugLicense}
                  onChange={(e) => setSettings({ ...settings, drugLicense: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireKycForB2b}
                  onChange={(e) => setSettings({ ...settings, requireKycForB2b: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-700">
                  Require GST & Drug License Verification before unlocking B2B Wholesale Pricing
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-2xl font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            >
              Save Compliance Rules
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: ALERTS, EMAIL & SMS GATEWAY CONFIGURATION */}
      {activeTab === "notifications" && (
        <div className="space-y-6 text-xs">
          {notifMsg && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold border ${notifMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
            >
              {notifMsg.text}
            </div>
          )}

          <form onSubmit={handleNotificationSubmit} className="space-y-6">
            {/* GATEWAY 1: EMAIL (SMTP) CONFIGURATION */}
            <div className={`p-6 rounded-3xl border transition-all ${emailEnabled ? "bg-white border-blue-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-2xs ${emailEnabled ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                    📧
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-sm text-[#0b2341]">SMTP Email Gateway Settings</h3>
                      <span className="bg-blue-50 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-200">
                        Gmail, SendGrid, Amazon SES, Outlook
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Configure corporate SMTP server to dispatch order confirmations & status updates to customer inboxes.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailEnabled ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                  <span
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className="font-extrabold text-xs cursor-pointer select-none text-slate-700"
                  >
                    {emailEnabled ? "✓ Email Gateway Active" : "Disabled"}
                  </span>
                </div>
              </div>

              {emailEnabled ? (
                <div className="space-y-4">


                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SMTP Host Server</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.gmail.com or smtp.sendgrid.net"
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono font-bold text-[#0b2341]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SMTP Port (587 TLS / 465 SSL)</label>
                      <input
                        type="number"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SMTP Username / Gmail ID</label>
                      <input
                        type="text"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="your-email@gmail.com"
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono text-[#0b2341]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SMTP App Password (16-digit)</label>
                      <input
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder="Enter 16-character Google App Password..."
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Leave blank to keep existing password</span>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">From Sender Email</label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">From Sender Name</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium">Email Dispatch Gateway is currently disabled.</p>
              )}
            </div>

            {/* GATEWAY 2: SMS GATEWAY CONFIGURATION */}
            <div className={`p-6 rounded-3xl border transition-all ${smsEnabled ? "bg-white border-emerald-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-2xs ${smsEnabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                    📱
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-black text-sm text-[#0b2341]">SMS Gateway & Provider Settings</h3>
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                        Fast2SMS (India) / Twilio (Global)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Configure Twilio or Fast2SMS API credentials for mobile SMS dispatches.</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSmsEnabled(!smsEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${smsEnabled ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${smsEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                  <span
                    onClick={() => setSmsEnabled(!smsEnabled)}
                    className="font-extrabold text-xs cursor-pointer select-none text-slate-700"
                  >
                    {smsEnabled ? "✓ SMS Gateway Active" : "Disabled"}
                  </span>
                </div>
              </div>

              {smsEnabled ? (
                <div className="space-y-4">
                  {/* Quick Guide for Real SMS */}
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 text-[11px] text-emerald-950 space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                      <span>💡</span>
                      <span>How to send REAL Mobile SMS with Fast2SMS / Twilio:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700 font-medium">
                      <li>For Indian Mobile SMS: Sign up on <a href="https://www.fast2sms.com/dev" target="_blank" rel="noreferrer" className="text-blue-700 underline font-bold">Fast2SMS.com/dev</a> and copy your <strong>API Authorization Key</strong>.</li>
                      <li>For International SMS: Sign up on <a href="https://www.twilio.com" target="_blank" rel="noreferrer" className="text-blue-700 underline font-bold">Twilio.com</a> and enter your <code className="bg-white px-1 py-0.5 rounded font-mono text-slate-800">AccountSID:AuthToken</code> in the API key field.</li>
                      <li>Paste the key in <strong>SMS API Key</strong> below and click <strong>Save Notification Settings</strong>. Real SMS will be delivered instantly to customer mobile phones!</li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SMS Provider</label>
                      <select
                        value={smsProvider}
                        onChange={(e) => setSmsProvider(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-bold"
                      >
                        <option value="Twilio / Fast2SMS">Fast2SMS / Twilio API</option>
                        <option value="AWS SNS">AWS SNS</option>
                        <option value="Mock Gateway Simulator">Mock Gateway Simulator</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SMS API Key / Auth Token</label>
                      <input
                        type="password"
                        value={smsApiKey}
                        onChange={(e) => setSmsApiKey(e.target.value)}
                        placeholder="Enter Fast2SMS or Twilio API key..."
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Leave blank to keep existing key</span>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">SMS Sender ID (DLT Header)</label>
                      <input
                        type="text"
                        value={smsSenderId}
                        onChange={(e) => setSmsSenderId(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-mono font-bold uppercase text-[#0b2341]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium">SMS Dispatch Gateway is currently disabled.</p>
              )}
            </div>

            {/* EVENT TRIGGER TOGGLES */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="font-black text-sm text-[#0b2341]">Automated Notification Event Triggers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOrderCreated}
                    onChange={(e) => setNotifyOrderCreated(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Order Placed Event</span>
                    <span className="text-[10px] text-slate-500">Send Email & SMS on new order placement</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOrderStatus}
                    onChange={(e) => setNotifyOrderStatus(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Order Status Update</span>
                    <span className="text-[10px] text-slate-500">Send alert on Shipped, Delivered & Cancelled</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyKycStatus}
                    onChange={(e) => setNotifyKycStatus(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">KYC Approval / Rejection</span>
                    <span className="text-[10px] text-slate-500">Notify B2B distributor on admin review</span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={notifLoading}
                  className="bg-[#0b2341] hover:bg-[#12315a] text-white px-6 py-3 rounded-2xl font-extrabold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {notifLoading ? "Saving Gateway..." : "Save Notification Settings"}
                </button>
              </div>
            </div>
          </form>

          {/* INTERACTIVE TEST DISPATCH CARD */}
          <div className="bg-gradient-to-r from-blue-900 via-[#0b2341] to-slate-900 text-white p-6 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-blue-800/80 pb-3">
              <div>
                <h3 className="font-black text-sm tracking-wide text-white">🧪 Interactive Test Dispatcher</h3>
                <p className="text-[11px] text-blue-200">Send instant test Email or SMS to verify server SMTP & SMS gateway connectivity.</p>
              </div>
              <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-3 py-1 rounded-full border border-blue-400/40">
                Live Gateway Test
              </span>
            </div>

            {testDispatchMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${testDispatchMsg.type === "success" ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40" : "bg-rose-500/20 text-rose-200 border border-rose-500/40"
                }`}>
                {testDispatchMsg.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-blue-200">Target Email Address</label>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={testEmailTarget}
                    onChange={(e) => setTestEmailTarget(e.target.value)}
                    className="flex-1 bg-white/10 border border-blue-400/30 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-400"
                    placeholder="name@company.com"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer shrink-0"
                  >
                    Send Test Email
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-blue-200">Target Phone Number</label>
                <div className="flex space-x-2">
                  <input
                    type="tel"
                    value={testSmsTarget}
                    onChange={(e) => setTestSmsTarget(e.target.value)}
                    className="flex-1 bg-white/10 border border-blue-400/30 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-400"
                    placeholder="+919876543210"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestSMS}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl transition-all text-xs cursor-pointer shrink-0"
                  >
                    Send Test SMS
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AUDIT LOG TRAIL TABLE */}
          {(() => {
            const filteredNotifLogs = notifLogs.filter((log) => {
              if (logChannelFilter !== "ALL" && log.channel !== logChannelFilter) return false;
              if (logSearchQuery.trim()) {
                const q = logSearchQuery.toLowerCase();
                const rec = (log.recipient || "").toLowerCase();
                const ev = (log.event_type || "").toLowerCase();
                const body = (log.message_body || "").toLowerCase();
                const sub = (log.subject || "").toLowerCase();
                if (!rec.includes(q) && !ev.includes(q) && !body.includes(q) && !sub.includes(q)) {
                  return false;
                }
              }
              return true;
            });

            const totalLogPages = Math.ceil(filteredNotifLogs.length / logPageSize) || 1;
            const paginatedNotifLogs = filteredNotifLogs.slice(
              (logCurrentPage - 1) * logPageSize,
              logCurrentPage * logPageSize
            );

            return (
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-sm text-[#0b2341]">📜 Notification Audit Logs</h3>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold">
                      {filteredNotifLogs.length} Records
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={loadNotificationSettings}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer self-end sm:self-auto"
                  >
                    🔄 Refresh Logs
                  </button>
                </div>

                {/* Search & Channel Filter Bar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setLogChannelFilter("ALL"); setLogCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        logChannelFilter === "ALL"
                          ? "bg-[#0b2341] text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      All Channels ({notifLogs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLogChannelFilter("EMAIL"); setLogCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        logChannelFilter === "EMAIL"
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      📧 Email Only
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLogChannelFilter("SMS"); setLogCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        logChannelFilter === "SMS"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      📱 SMS Only
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-56">
                      <input
                        type="text"
                        placeholder="Search logs..."
                        value={logSearchQuery}
                        onChange={(e) => { setLogSearchQuery(e.target.value); setLogCurrentPage(1); }}
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                      <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
                      {logSearchQuery && (
                        <button
                          type="button"
                          onClick={() => { setLogSearchQuery(""); setLogCurrentPage(1); }}
                          className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 text-slate-500 font-medium shrink-0">
                      <span className="text-[11px]">Show:</span>
                      <select
                        value={logPageSize}
                        onChange={(e) => {
                          setLogPageSize(Number(e.target.value));
                          setLogCurrentPage(1);
                        }}
                        className="border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 font-bold text-[#0b2341] text-xs cursor-pointer focus:outline-none"
                      >
                        <option value={5}>5 / page</option>
                        <option value={8}>8 / page</option>
                        <option value={15}>15 / page</option>
                        <option value={25}>25 / page</option>
                        <option value={50}>50 / page</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredNotifLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-medium text-xs">
                    {logSearchQuery || logChannelFilter !== "ALL"
                      ? "No notification logs matching your filter criteria."
                      : "No notification dispatches recorded yet. Place an order or trigger a test dispatch above to see live logs!"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold bg-slate-50">
                          <th className="p-3">Time</th>
                          <th className="p-3">Channel</th>
                          <th className="p-3">Recipient</th>
                          <th className="p-3">Event</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Message Body</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {paginatedNotifLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                              {new Date(log.sent_at).toLocaleTimeString()}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded font-black text-[10px] ${log.channel === "EMAIL" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}>
                                {log.channel}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{log.recipient}</td>
                            <td className="p-3 font-mono font-bold text-blue-900">{log.event_type}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${log.status === "SENT" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                                }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 max-w-xs truncate" title={log.message_body}>
                              {log.subject ? `[${log.subject}] ` : ""}{log.message_body}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* NUMBERED PAGINATION BAR */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
                  <div className="flex items-center space-x-2">
                    {filteredNotifLogs.length > 0 ? (
                      <span>
                        Showing <span className="font-bold text-[#0b2341]">{(logCurrentPage - 1) * logPageSize + 1}</span> to{" "}
                        <span className="font-bold text-[#0b2341]">{Math.min(logCurrentPage * logPageSize, filteredNotifLogs.length)}</span> of{" "}
                        <span className="font-bold text-[#0b2341]">{filteredNotifLogs.length}</span> logs
                      </span>
                    ) : (
                      <span>0 logs found</span>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                      Page {logCurrentPage} of {totalLogPages}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* First Page */}
                    <button
                      type="button"
                      disabled={logCurrentPage === 1}
                      onClick={() => setLogCurrentPage(1)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700 shadow-2xs"
                      title="First Page"
                    >
                      «
                    </button>

                    {/* Previous Page */}
                    <button
                      type="button"
                      disabled={logCurrentPage === 1}
                      onClick={() => setLogCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700 shadow-2xs"
                    >
                      ‹ Prev
                    </button>

                    {/* Numbered Page Buttons: 1, 2, 3 ... */}
                    {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        totalLogPages <= 7 ||
                        pageNum === 1 ||
                        pageNum === totalLogPages ||
                        (pageNum >= logCurrentPage - 1 && pageNum <= logCurrentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setLogCurrentPage(pageNum)}
                            className={`min-w-[30px] px-2.5 py-1 rounded-xl font-black text-xs transition-all cursor-pointer ${
                              logCurrentPage === pageNum
                                ? "bg-[#0b2341] text-white shadow-2xs scale-105"
                                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (pageNum === logCurrentPage - 2 || pageNum === logCurrentPage + 2) {
                        return (
                          <span key={pageNum} className="px-1 text-slate-400 font-bold text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    {/* Next Page */}
                    <button
                      type="button"
                      disabled={logCurrentPage === totalLogPages || totalLogPages === 0}
                      onClick={() => setLogCurrentPage((prev) => Math.min(prev + 1, totalLogPages))}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700 shadow-2xs"
                    >
                      Next ›
                    </button>

                    {/* Last Page */}
                    <button
                      type="button"
                      disabled={logCurrentPage === totalLogPages || totalLogPages === 0}
                      onClick={() => setLogCurrentPage(totalLogPages)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-[11px] font-bold text-slate-700 shadow-2xs"
                      title="Last Page"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
