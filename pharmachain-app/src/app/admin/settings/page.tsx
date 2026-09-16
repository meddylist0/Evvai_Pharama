"use client";

import React, { useState, useEffect } from "react";
import {
  getStoredUser,
  StoredUser,
  authAPI,
  paymentsAPI,
  PaymentAdminSettings,
  notificationsAPI,
  NotificationLogItem,
  productsAPI,
  ProductItem,
} from "@/lib/api";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import {
  GlobalPricingSettings,
  DEFAULT_PRICING_SETTINGS,
  getGlobalPricingSettings,
  saveGlobalPricingSettings,
  PHARMA_PRICING_PRESETS,
  formatINR,
  calculatePriceFromDiscount,
  PricingPreset,
} from "@/lib/pricingUtils";

const PRESET_AVATARS = [
  { id: "doc1", url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80", label: "Chief Physician" },
  { id: "exec1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", label: "Operations Exec" },
  { id: "doc2", url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80", label: "Quality Director" },
  { id: "sci1", url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=150&q=80", label: "Lead Chemist" },
  { id: "corp1", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", label: "Supply Admin" },
  { id: "doc3", url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80", label: "Regulatory Officer" },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"payments" | "pricing" | "inventory" | "notifications" | "compliance" | "profile">("payments");

  // User Profile State
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCompany, setProfileCompany] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Global Pharma Pricing & Margin Rules State
  const [pricingSettings, setPricingSettings] = useState<GlobalPricingSettings>(DEFAULT_PRICING_SETTINGS);
  const [pricingSavedMsg, setPricingSavedMsg] = useState<string | null>(null);
  const [sampleMrp, setSampleMrp] = useState<number>(580);

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

  // Inventory & Stock Limits State
  const [stockSettings, setStockSettings] = useState({
    globalLowStockThreshold: 20,
    criticalOutOfStockLimit: 5,
    maxOrderLimitB2C: 30,
    defaultB2bMoq: 40,
    enableLowStockEmailAlert: true,
    enableLowStockSmsAlert: false,
    autoReorderRecommendation: true,
    restockLeadTimeDays: 7,
    preventOrdersWhenOutOfStock: true,
  });
  const [stockSavedMsg, setStockSavedMsg] = useState<string | null>(null);

  // Real Inventory Products Preview State
  interface DisplayProduct {
    price: number;
    id: string | number;
    sku: string;
    name: string;
    composition: string;
    category: string;
    mrp: number;
    stock: number;
    batch_no: string;
    expiry_date: string;
    pack_size: string;
  }

  const normalizeProductsList = (rawList: any[]): DisplayProduct[] => {
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    return rawList.map((p, idx) => ({
      id: p.id !== undefined && p.id !== null ? p.id : `PROD_${idx + 1}`,
      sku: p.sku || `EVV-PROD-${idx + 1}`,
      name: p.name || "Pharma Product",
      composition: p.composition || p.subtitle || "Standard Formulation",
      category: p.category_name || p.category || "General Pharma",
      mrp: p.mrp || p.price || p.display_price || 450,
      price: p.price || p.mrp || p.display_price || 450,
      stock: typeof p.stock === "number" ? p.stock : 7,
      batch_no: p.batch_no || p.batchNo || "EV2026-Z01",
      expiry_date: p.expiry_date || p.expiryDate || "12/2028",
      pack_size: p.pack_size || p.packSize || "Standard Pack",
    }));
  };

  const initialNormalized = normalizeProductsList(INITIAL_PRODUCTS);
  const [liveProducts, setLiveProducts] = useState<DisplayProduct[]>(initialNormalized);
  const [selectedPreviewProductId, setSelectedPreviewProductId] = useState<string | number>(
    initialNormalized[0]?.id ?? "P001"
  );
  const [simulatedStockUnits, setSimulatedStockUnits] = useState<number>(
    initialNormalized[0]?.stock ?? 7
  );
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

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
  const [settings, setSettings] = useState({
    companyName: "PharmaChain Global Manufacturing Ltd",
    gstin: "36AAACA1234A1Z5",
    drugLicense: "TS/HYD/2025/8892",
    defaultCurrency: "INR (₹)",
    enableGstInvoicing: true,
    requireKycForB2b: true,
    supportEmail: "sales@evvaipharma.com",
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

    // Load Stock Limits from localStorage if present
    try {
      const savedStock = localStorage.getItem("pharmalink_stock_limits");
      if (savedStock) {
        setStockSettings(JSON.parse(savedStock));
      }
    } catch (e) {
      console.warn("Could not parse saved stock limits:", e);
    }

    // Load Global Pricing Rules from localStorage if present
    try {
      const savedPricing = getGlobalPricingSettings();
      if (savedPricing) {
        setPricingSettings(savedPricing);
      }
    } catch (e) {
      console.warn("Could not parse saved pricing settings:", e);
    }

    loadPaymentSettings();
    loadNotificationSettings();
    loadLiveProducts();
  }, []);

  const loadLiveProducts = async () => {
    setLoadingProducts(true);
    try {
      const prods = await productsAPI.list();
      const normalized = normalizeProductsList(prods);
      if (normalized.length > 0) {
        setLiveProducts(normalized);
        setSelectedPreviewProductId(normalized[0].id);
        setSimulatedStockUnits(normalized[0].stock);
      }
    } catch (err) {
      console.warn("Using fallback default products for inventory preview:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

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
        text: `✓ Multi-Gateway Configuration saved! Active Gateways: Razorpay (${rzpIsActive ? "ACTIVE" : "OFF"}), Stripe (${stripeIsActive ? "ACTIVE" : "OFF"}), PayPal (${paypalIsActive ? "ACTIVE" : "OFF"}), COD (${codEnabled ? "ENABLED" : "OFF"}), Wire (${wireEnabled ? "ENABLED" : "OFF"})`,
      });
      setTimeout(() => setPaymentMsg(null), 5000);
    } catch (err: any) {
      setPaymentMsg({
        type: "error",
        text: err.message || "Failed to update payment gateway settings.",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleStockSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("pharmalink_stock_limits", JSON.stringify(stockSettings));
      setStockSavedMsg("✓ Global Stock Thresholds & Low-Stock Alert Limits successfully updated!");
      setTimeout(() => setStockSavedMsg(null), 4000);
    } catch (err) {
      console.error("Failed saving stock settings:", err);
    }
  };

  const handlePricingSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveGlobalPricingSettings(pricingSettings);
      setPricingSavedMsg("✓ Global Pharma Pricing Rules & Default Discount Margins saved! All newly added formulation products will automatically inherit these rates.");
      setTimeout(() => setPricingSavedMsg(null), 4000);
    } catch (err) {
      console.error("Failed saving pricing settings:", err);
    }
  };

  const handleApplySettingsPreset = (preset: PricingPreset) => {
    setPricingSettings((prev) => ({
      ...prev,
      selectedPresetId: preset.id,
      defaultCustDiscount: preset.custDiscount,
      defaultDistDiscount: preset.distDiscount,
      defaultBulkDiscount: preset.bulkDiscount,
    }));
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
        text: "✓ Administrator Profile & Avatar updated in database successfully! Live sync active.",
      });
      setTimeout(() => setProfileMsg(null), 5000);
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
      setTimeout(() => setNotifMsg(null), 5000);
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

  const activeGatewaysCount = [rzpIsActive, stripeIsActive, paypalIsActive, codEnabled, wireEnabled].filter(Boolean).length;

  const navSections = [
    {
      id: "payments",
      title: "Payment Gateways",
      subtitle: "Razorpay, Stripe, PayPal, COD & Bank",
      icon: "💳",
      badge: `${activeGatewaysCount} Active`,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "pricing",
      title: "Pricing & Margins",
      subtitle: "B2C discounts, B2B wholesale margin & Lot size",
      icon: "🏷️",
      badge: `${pricingSettings.defaultDistDiscount}% Wholesale`,
      badgeColor: "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]",
    },
    {
      id: "inventory",
      title: "Inventory & Stock Limits",
      subtitle: "Low stock alert thresholds, MOQ & sales limits",
      icon: "📦",
      badge: `${stockSettings.globalLowStockThreshold} Units Alert`,
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      id: "notifications",
      title: "Email & SMS Gateways",
      subtitle: "SMTP server, Twilio / Fast2SMS, logs",
      icon: "🔔",
      badge: emailEnabled && smsEnabled ? "2 Gateways" : emailEnabled ? "Email Active" : "Config",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "compliance",
      title: "Compliance & GST Rules",
      subtitle: "GSTIN, Drug License & B2B Verification",
      icon: "🏛️",
      badge: "Verified",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "profile",
      title: "Administrator Identity",
      subtitle: "Avatar photo, Name & Phone",
      icon: "👤",
      badge: user?.role || "ADMIN",
      badgeColor: "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold text-[#A71380] uppercase tracking-wider bg-[#F8EAF4] px-2.5 py-0.5 rounded-md border border-[#F3D0E9]">
              Admin Settings &amp; Store Setup
            </span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
              ● System Active &amp; Synced
            </span>
          </div>
          <h1 className="text-xl font-black text-[#0b2341] tracking-tight mt-1.5">
            Admin Settings &amp; System Setup
          </h1>
          {/* <p className="text-xs text-slate-500 mt-0.5">
            Manage your payment gateways, discount rules, stock alert limits, email/SMS alerts, and admin profile.
          </p> */}
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 shrink-0">
          <img
            src={profileAvatar || PRESET_AVATARS[0].url}
            alt="Admin Avatar"
            className="w-11 h-11 rounded-lg object-cover border border-slate-300 shadow-2xs"
          />
          <div>
            <p className="text-xs font-black text-[#0b2341]">{user?.full_name || "Dr. Arun Bhairi"}</p>
            <p className="text-[10px] text-[#A71380] font-mono font-bold uppercase">{user?.role || "ADMIN"} Account</p>
          </div>
        </div>
      </div>

      {/* 2-COLUMN ENTERPRISE SIDEBAR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: VERTICAL SETTINGS SIDEBAR */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3 lg:sticky lg:top-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1.5">
            <div className="px-3 py-2 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                System Configurations
              </span>
            </div>

            {navSections.map((sec) => {
              const isCurrent = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id as any)}
                  className={`w-full text-left p-3 rounded-xl font-bold transition-all cursor-pointer flex items-start justify-between gap-2 border ${isCurrent
                    ? "bg-[#A71380] text-white border-[#A71380] shadow-md shadow-[#A71380]/20"
                    : "bg-white text-slate-700 border-transparent hover:bg-slate-50 hover:border-slate-200"
                    }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <span className="text-base shrink-0 mt-0.5">{sec.icon}</span>
                    <div>
                      <span className="text-xs font-black block leading-tight">{sec.title}</span>
                      <span className={`text-[10px] line-clamp-1 mt-0.5 ${isCurrent ? "text-pink-100 font-medium" : "text-slate-400 font-normal"}`}>
                        {sec.subtitle}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded shrink-0 border ${isCurrent
                      ? "bg-white/20 text-white border-white/30"
                      : `${sec.badgeColor} border`
                      }`}
                  >
                    {sec.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick System Summary Card */}
          <div className="bg-gradient-to-br from-[#0b2341] to-slate-900 text-white p-4 rounded-2xl shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-black">● Engine Status</span>
              <span className="text-[10px] font-mono text-slate-300">v2.4.0 Live</span>
            </div>
            <div className="text-[11px] space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Active Gateways:</span>
                <span className="font-bold text-white">{activeGatewaysCount} / 5</span>
              </div>
              <div className="flex justify-between">
                <span>Low Stock Trigger:</span>
                <span className="font-bold text-amber-300">≤ {stockSettings.globalLowStockThreshold} units</span>
              </div>
              <div className="flex justify-between">
                <span>Email SMTP:</span>
                <span className={`font-bold ${emailEnabled ? "text-emerald-400" : "text-rose-400"}`}>
                  {emailEnabled ? "Connected" : "Off"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TAB CONTENT PANEL */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* TAB 1: MULTI-PAYMENT GATEWAYS */}
          {activeTab === "payments" && (
            <div className="space-y-6 text-xs">
              {paymentMsg && (
                <div
                  className={`p-4 rounded-xl font-bold border transition-all ${paymentMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
                    : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
                    }`}
                >
                  {paymentMsg.text}
                </div>
              )}

              <form onSubmit={handlePaymentSettingsSubmit} className="space-y-6">
                {/* GATEWAY 1: RAZORPAY */}
                <div className={`p-6 rounded-2xl border transition-all ${rzpIsActive ? "bg-white border-[#F3D0E9] shadow-2xs" : "bg-slate-50 border-slate-200/90"
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
                          <span className="bg-[#F8EAF4] text-[#A71380] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#F3D0E9]">
                            UPI, Cards, QR &amp; NetBanking
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* TOGGLE SWITCH */}
                      <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
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
                        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setRzpMode("test")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${rzpMode === "test" ? "bg-[#0b2341] text-white shadow-2xs" : "text-slate-600"
                              }`}
                          >
                            🧪 Test
                          </button>
                          <button
                            type="button"
                            onClick={() => setRzpMode("live")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${rzpMode === "live" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600"
                              }`}
                          >
                            🚀 Live
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {rzpIsActive ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Razorpay Key ID
                        </label>
                        <input
                          type="text"
                          value={rzpKeyId}
                          onChange={(e) => setRzpKeyId(e.target.value)}
                          placeholder="rzp_test_... or rzp_live_..."
                          className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-[#0b2341] focus:bg-white focus:border-[#A71380] focus:outline-none"
                        />
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
                            className="w-full border border-slate-200 rounded-lg p-2.5 pr-12 bg-slate-50 font-mono text-xs focus:bg-white focus:border-[#A71380] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRzpSecret(!showRzpSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-[11px]"
                          >
                            {showRzpSecret ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 text-[11px] text-slate-500 font-medium">
                      Razorpay Gateway is currently disabled. Toggle the switch above to enable Razorpay and enter API credentials.
                    </div>
                  )}
                </div>

                {/* GATEWAY 2: STRIPE PAYMENTS */}
                <div className={`p-6 rounded-2xl border transition-all ${stripeIsActive ? "bg-white border-indigo-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
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
                          <span className="bg-indigo-50 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-indigo-200">
                            Global Credit Cards &amp; Apple Pay
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
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
                        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setStripeMode("test")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${stripeMode === "test" ? "bg-indigo-900 text-white shadow-2xs" : "text-slate-600"
                              }`}
                          >
                            🧪 Test
                          </button>
                          <button
                            type="button"
                            onClick={() => setStripeMode("live")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${stripeMode === "live" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600"
                              }`}
                          >
                            🚀 Live
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {stripeIsActive ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Stripe Publishable Key
                        </label>
                        <input
                          type="text"
                          value={stripePublishableKey}
                          onChange={(e) => setStripePublishableKey(e.target.value)}
                          placeholder="pk_test_... or pk_live_..."
                          className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-[#0b2341] focus:bg-white focus:border-indigo-600 focus:outline-none"
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
                            className="w-full border border-slate-200 rounded-lg p-2.5 pr-12 bg-slate-50 font-mono text-xs focus:bg-white focus:border-indigo-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowStripeSecret(!showStripeSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-[11px]"
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
                <div className={`p-6 rounded-2xl border transition-all ${paypalIsActive ? "bg-white border-sky-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
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
                          <span className="bg-sky-50 text-sky-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-sky-200">
                            Global Wallet Checkout
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
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
                        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setPaypalMode("sandbox")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${paypalMode === "sandbox" ? "bg-sky-900 text-white shadow-2xs" : "text-slate-600"
                              }`}
                          >
                            🧪 Sandbox
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaypalMode("live")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${paypalMode === "live" ? "bg-emerald-700 text-white shadow-2xs" : "text-slate-600"
                              }`}
                          >
                            🚀 Live
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {paypalIsActive ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          PayPal Client ID
                        </label>
                        <input
                          type="text"
                          value={paypalClientId}
                          onChange={(e) => setPaypalClientId(e.target.value)}
                          placeholder="AU_Sandbox_ClientId_..."
                          className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-[#0b2341] focus:bg-white focus:border-sky-600 focus:outline-none"
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
                            className="w-full border border-slate-200 rounded-lg p-2.5 pr-12 bg-slate-50 font-mono text-xs focus:bg-white focus:border-sky-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPaypalSecret(!showPaypalSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-[11px]"
                          >
                            {showPaypalSecret ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 text-[11px] text-slate-500 font-medium">
                      PayPal Express Checkout is currently disabled. Toggle the switch above to enable PayPal.
                    </div>
                  )}
                </div>

                {/* CARD 4 & 5: COD & WIRE TRANSFER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* COD */}
                  <div className={`p-6 rounded-2xl border transition-all ${codEnabled ? "bg-white border-amber-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
                    }`}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                          💵
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#0b2341]">Cash on Delivery (COD)</h4>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
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
                          className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-slate-900"
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-medium">COD Checkout option disabled.</p>
                    )}
                  </div>

                  {/* Wire Transfer */}
                  <div className={`p-6 rounded-2xl border transition-all ${wireEnabled ? "bg-white border-emerald-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
                    }`}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                          🏦
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-[#0b2341]">NEFT / RTGS Wire Transfer</h4>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
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
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold text-[11px]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-[11px]"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-medium">NEFT Wire Transfer disabled.</p>
                    )}
                  </div>
                </div>

                {/* MASTER SAVE BUTTON */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-700">Active HMAC Signature Security Verification</span>
                  </div>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-lg font-extrabold text-xs shadow-md shadow-[#A71380]/20 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center space-x-2"
                  >
                    <span>{paymentLoading ? "Saving Configurations..." : "Save Gateway Configurations"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: PHARMACEUTICAL PRICING & DISCOUNT MARGINS */}
          {activeTab === "pricing" && (
            <div className="space-y-6 text-xs">
              {pricingSavedMsg && (
                <div className="p-4 rounded-xl font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs animate-in fade-in zoom-in-95">
                  {pricingSavedMsg}
                </div>
              )}

              <form onSubmit={handlePricingSettingsSubmit} className="space-y-6">
                {/* 1. PRESET MARGIN TEMPLATES & GLOBAL PERCENTAGES */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] flex items-center justify-center font-bold text-sm shrink-0">
                        🏷️
                      </span>
                      <div>
                        <h3 className="font-black text-sm text-[#0b2341]">
                          Global Multi-Tier Role Pricing &amp; Discount Margin Rules
                        </h3>
                      </div>
                    </div>
                    <span className="bg-[#F8EAF4] text-[#A71380] text-[10px] font-mono px-3 py-1 rounded-full font-extrabold border border-[#F3D0E9] shrink-0">
                      Catalog Pricing Rules
                    </span>
                  </div>

                  {/* Preset Margin Templates */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                      ⚡ Preset Margin Templates (Click to Apply):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {PHARMA_PRICING_PRESETS.map((preset) => {
                        const isSelected = pricingSettings.selectedPresetId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplySettingsPreset(preset)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${isSelected
                              ? "bg-[#0b2341] text-white border-[#0b2341] shadow-xs ring-2 ring-[#A71380]"
                              : "bg-white hover:bg-slate-100/90 text-slate-800 border-slate-200"
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-xs">{preset.label}</span>
                              {isSelected && (
                                <span className="text-[9px] bg-[#A71380] text-white font-extrabold px-2 py-0.5 rounded-md">
                                  Active
                                </span>
                              )}
                            </div>
                            <span className={`text-[12px] font-mono font-black ${isSelected ? "text-pink-300" : "text-[#A71380]"}`}>
                              {preset.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3 Role Percentage Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Role 1: Retail B2C */}
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-950">1. Retail B2C Discount</span>
                        <span className="text-[9px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                          Direct Consumer
                        </span>
                      </div>
                      <div className="relative pt-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="95"
                          required
                          value={pricingSettings.defaultCustDiscount}
                          onChange={(e) =>
                            setPricingSettings({
                              ...pricingSettings,
                              defaultCustDiscount: Number(e.target.value),
                              selectedPresetId: "custom",
                            })
                          }
                          className="w-full border border-blue-300 rounded-lg p-2.5 pr-8 bg-white font-mono font-black text-base text-blue-950 focus:outline-none focus:border-[#A71380] shadow-2xs"
                        />
                        <span className="absolute right-3 top-3.5 text-blue-600 font-black text-sm">%</span>
                      </div>
                    </div>

                    {/* Role 2: Distributor B2B */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-950">2. Distributor B2B Margin</span>
                        <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          Wholesale Trade
                        </span>
                      </div>
                      <div className="relative pt-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="95"
                          required
                          value={pricingSettings.defaultDistDiscount}
                          onChange={(e) =>
                            setPricingSettings({
                              ...pricingSettings,
                              defaultDistDiscount: Number(e.target.value),
                              selectedPresetId: "custom",
                            })
                          }
                          className="w-full border border-emerald-300 rounded-lg p-2.5 pr-8 bg-white font-mono font-black text-base text-emerald-950 focus:outline-none focus:border-emerald-600 shadow-2xs"
                        />
                        <span className="absolute right-3 top-3.5 text-emerald-600 font-black text-sm">%</span>
                      </div>
                    </div>

                    {/* Role 3: Bulk Order Tier */}
                    <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-950">3. Bulk Order Discount</span>
                        <span className="text-[9px] font-extrabold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                          High Volume
                        </span>
                      </div>
                      <div className="relative pt-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="95"
                          required
                          value={pricingSettings.defaultBulkDiscount}
                          onChange={(e) =>
                            setPricingSettings({
                              ...pricingSettings,
                              defaultBulkDiscount: Number(e.target.value),
                              selectedPresetId: "custom",
                            })
                          }
                          className="w-full border border-purple-300 rounded-lg p-2.5 pr-8 bg-white font-mono font-black text-base text-purple-950 focus:outline-none focus:border-purple-600 shadow-2xs"
                        />
                        <span className="absolute right-3 top-3.5 text-purple-600 font-black text-sm">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. MASTER LOT PACKAGING & MOQ CONFIGURATION */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-sm shrink-0">
                      📦
                    </span>
                    <div>
                      <h3 className="font-black text-sm text-[#0b2341]">
                        Master Lot Packaging &amp; Minimum Order Quantities (MOQ)
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                      <label className="block font-black text-slate-800 text-xs">
                        Default Master Lot / Shipper Size (Packs per Lot) *
                      </label>
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          required
                          value={pricingSettings.defaultLotSize}
                          onChange={(e) =>
                            setPricingSettings({
                              ...pricingSettings,
                              defaultLotSize: Number(e.target.value),
                            })
                          }
                          className="w-32 border border-slate-300 rounded-lg p-2.5 bg-white font-mono font-black text-base text-[#0b2341] focus:outline-none focus:border-[#A71380]"
                        />
                        <span className="font-extrabold text-slate-700 text-xs">Packs / Boxes per Lot</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                      <label className="block font-black text-slate-800 text-xs">
                        Default Bulk Order MOQ (Units) *
                      </label>
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="number"
                          min="1"
                          max="5000"
                          required
                          value={pricingSettings.defaultBulkMoq}
                          onChange={(e) =>
                            setPricingSettings({
                              ...pricingSettings,
                              defaultBulkMoq: Number(e.target.value),
                            })
                          }
                          className="w-32 border border-slate-300 rounded-lg p-2.5 bg-white font-mono font-black text-base text-[#0b2341] focus:outline-none focus:border-[#A71380]"
                        />
                        <span className="font-extrabold text-slate-700 text-xs">Packs Minimum</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. INTERACTIVE LIVE PRICING & LOT SIMULATOR */}
                <div className="bg-gradient-to-r from-[#0b2341] via-[#0b2341] to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#A71380]/30 text-[#F3D0E9] border border-[#F3D0E9]/30 flex items-center justify-center font-bold text-sm shrink-0">
                        🧪
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-white">Live Pricing &amp; Master Lot Calculation Simulator</h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700">
                      <span className="text-xs font-bold text-slate-300">Sample MRP:</span>
                      <span className="text-sm font-extrabold text-white">₹</span>
                      <input
                        type="number"
                        step="10"
                        min="10"
                        value={sampleMrp}
                        onChange={(e) => setSampleMrp(Math.max(Number(e.target.value), 0))}
                        className="w-24 bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1 font-mono font-black text-sm text-pink-300 text-right focus:outline-none focus:border-[#A71380]"
                      />
                    </div>
                  </div>

                  {/* Calculated Rates Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
                    {/* MRP Box */}
                    <div className="bg-white/10 p-4 rounded-xl border border-white/15 space-y-1">
                      <span className="text-[10px] text-slate-300 uppercase font-sans font-extrabold block">Printed MRP</span>
                      <span className="text-xl font-black text-white block">{formatINR(sampleMrp)}</span>
                      <span className="text-[10px] text-slate-400 font-sans block">Base Reference Price</span>
                    </div>

                    {/* Retail Price */}
                    <div className="bg-blue-950/70 p-4 rounded-xl border border-blue-700/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-blue-300 uppercase font-sans font-extrabold">Retail B2C Rate</span>
                        <span className="text-[9px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded font-extrabold">
                          {pricingSettings.defaultCustDiscount}% OFF
                        </span>
                      </div>
                      <span className="text-xl font-black text-blue-200 block">
                        {formatINR(calculatePriceFromDiscount(sampleMrp, pricingSettings.defaultCustDiscount))}
                      </span>
                      <span className="text-[10px] text-blue-300 font-sans block">
                        Saves {formatINR(sampleMrp - calculatePriceFromDiscount(sampleMrp, pricingSettings.defaultCustDiscount))}
                      </span>
                    </div>

                    {/* Distributor Rate */}
                    <div className="bg-emerald-950/70 p-4 rounded-xl border border-emerald-700/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-300 uppercase font-sans font-extrabold">Distributor Rate</span>
                        <span className="text-[9px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-extrabold">
                          {pricingSettings.defaultDistDiscount}% MARGIN
                        </span>
                      </div>
                      <span className="text-xl font-black text-emerald-300 block">
                        {formatINR(calculatePriceFromDiscount(sampleMrp, pricingSettings.defaultDistDiscount))}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-sans block">
                        Margin {formatINR(sampleMrp - calculatePriceFromDiscount(sampleMrp, pricingSettings.defaultDistDiscount))}
                      </span>
                    </div>

                    {/* Bulk Rate */}
                    <div className="bg-purple-950/70 p-4 rounded-xl border border-purple-700/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-purple-300 uppercase font-sans font-extrabold">Bulk Rate</span>
                        <span className="text-[9px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded font-extrabold">
                          {pricingSettings.defaultBulkDiscount}% OFF
                        </span>
                      </div>
                      <span className="text-xl font-black text-purple-200 block">
                        {formatINR(calculatePriceFromDiscount(sampleMrp, pricingSettings.defaultBulkDiscount))}
                      </span>
                      <span className="text-[10px] text-purple-300 font-sans block">
                        MOQ: {pricingSettings.defaultBulkMoq} packs
                      </span>
                    </div>
                  </div>

                  {/* Master Lot Packaging Calculation Strip */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px]">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📦</span>
                      <div>
                        <span className="font-extrabold text-white block">
                          1 Master Lot Packaging = {pricingSettings.defaultLotSize} Packs / Boxes
                        </span>
                        <span className="text-slate-300 text-[10px] font-mono">
                          Shipper Wholesale Value: {formatINR(calculatePriceFromDiscount(sampleMrp, pricingSettings.defaultDistDiscount) * pricingSettings.defaultLotSize)} (Total MRP: {formatINR(sampleMrp * pricingSettings.defaultLotSize)})
                        </span>
                      </div>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-extrabold border border-emerald-500/30 text-[10px] shrink-0">
                      ✓ Auto-Calculated for Inwarding
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-7 py-3 rounded-xl font-black text-xs shadow-md shadow-[#A71380]/20 transition-all cursor-pointer inline-flex items-center space-x-2"
                  >
                    <span>Save Pricing &amp; Lot Packaging Rules</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: INVENTORY & STOCK LIMITS CONFIGURATION (సేల్స్ స్టాక్ లిమిట్ & లో స్టాక్ అలర్ట్స్) */}
          {activeTab === "inventory" && (
            <div className="space-y-6 text-xs">
              {stockSavedMsg && (
                <div className="p-4 rounded-xl font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  {stockSavedMsg}
                </div>
              )}

              <form onSubmit={handleStockSettingsSubmit} className="space-y-6">
                {/* 1. GLOBAL STOCK THRESHOLDS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h3 className="font-black text-sm text-[#0b2341]">
                          Global Stock Alert Thresholds
                        </h3>
                      </div>
                    </div>
                    <span className="bg-amber-50 text-amber-800 text-[10px] font-mono px-2.5 py-1 rounded-full font-bold border border-amber-200">
                      Live Threshold Sync
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-2">
                      <label className="block font-black text-amber-950 text-xs">
                        1. Low Stock Alert Threshold (Units) *
                      </label>
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          required
                          value={stockSettings.globalLowStockThreshold}
                          onChange={(e) => setStockSettings({ ...stockSettings, globalLowStockThreshold: Number(e.target.value) })}
                          className="w-32 border border-amber-300 rounded-lg p-2.5 bg-white font-mono font-black text-base text-[#0b2341] focus:outline-none focus:border-[#A71380]"
                        />
                        <span className="font-bold text-slate-600 text-xs">Available Units</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/70 space-y-2">
                      <label className="block font-black text-rose-950 text-xs">
                        2. Critical Out-of-Stock Cutoff (Units) *
                      </label>
                      <div className="flex items-center space-x-2 pt-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={stockSettings.criticalOutOfStockLimit}
                          onChange={(e) => setStockSettings({ ...stockSettings, criticalOutOfStockLimit: Number(e.target.value) })}
                          className="w-32 border border-rose-300 rounded-lg p-2.5 bg-white font-mono font-black text-base text-rose-700 focus:outline-none focus:border-[#A71380]"
                        />
                        <span className="font-bold text-slate-600 text-xs">Available Units</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ORDER QUANTITY LIMITS & MOQ (సేల్స్ పరిమితులు) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
                    <span className="text-xl">📊</span>
                    <div>
                      <h3 className="font-black text-sm text-[#0b2341]">
                        Sales Order Limits &amp; B2B Minimum Order Quantities (MOQ)
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Max Allowed Quantity per B2C Retail Order (Units)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={stockSettings.maxOrderLimitB2C}
                        onChange={(e) => setStockSettings({ ...stockSettings, maxOrderLimitB2C: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#A71380]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Default B2B Bulk Tier MOQ (Units)
                      </label>
                      <input
                        type="number"
                        min="5"
                        value={stockSettings.defaultB2bMoq}
                        onChange={(e) => setStockSettings({ ...stockSettings, defaultB2bMoq: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#A71380]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Expected Restock Lead Time (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={stockSettings.restockLeadTimeDays}
                        onChange={(e) => setStockSettings({ ...stockSettings, restockLeadTimeDays: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#A71380]"
                      />
                    </div>

                    <div className="flex items-center space-x-3 pt-6">
                      <input
                        type="checkbox"
                        id="prevent_oos"
                        checked={stockSettings.preventOrdersWhenOutOfStock}
                        onChange={(e) => setStockSettings({ ...stockSettings, preventOrdersWhenOutOfStock: e.target.checked })}
                        className="w-4 h-4 rounded text-[#A71380] focus:ring-[#A71380] cursor-pointer"
                      />
                      <label htmlFor="prevent_oos" className="font-bold text-slate-700 text-xs cursor-pointer">
                        Prevent new orders when stock hits 0 (Disable Backorders)
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. AUTOMATED INVENTORY DISPATCH TRIGGERS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                    <span className="w-7 h-7 rounded-lg bg-[#F8EAF4] text-[#A71380] flex items-center justify-center border border-[#F3D0E9] shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="font-black text-sm text-[#0b2341]">Automated Low-Stock Email / SMS Triggers</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stockSettings.enableLowStockEmailAlert}
                        onChange={(e) => setStockSettings({ ...stockSettings, enableLowStockEmailAlert: e.target.checked })}
                        className="w-4 h-4 text-[#A71380] rounded focus:ring-[#A71380]"
                      />
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9] flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block text-xs">Email Admin on Low Stock</span>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3.5 p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stockSettings.enableLowStockSmsAlert}
                        onChange={(e) => setStockSettings({ ...stockSettings, enableLowStockSmsAlert: e.target.checked })}
                        className="w-4 h-4 text-[#A71380] rounded focus:ring-[#A71380]"
                      />
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block text-xs">SMS Admin on Critical Stock</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* LIVE INVENTORY TABLE DEMO PREVIEW */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#0b2341] text-white flex items-center justify-center shadow-2xs shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-[#0b2341]">Live Inventory Catalog Alert Preview</h4>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-[#A71380] bg-[#F8EAF4] px-3 py-1 rounded-md font-extrabold border border-[#F3D0E9]">
                        Low Threshold: &le; {stockSettings.globalLowStockThreshold} Units
                      </span>
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-3 py-1 rounded-md font-extrabold border border-rose-200">
                        Critical: &le; {stockSettings.criticalOutOfStockLimit} Units
                      </span>
                    </div>
                  </div>

                  {/* INTERACTIVE CONTROLS */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs">
                    {/* Product Selector Dropdown */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="font-black text-[#0b2341] text-[11px] block">
                        Select Product from Live Database Catalog:
                      </label>
                      <select
                        value={String(selectedPreviewProductId ?? "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPreviewProductId(val);
                          const prod = liveProducts.find((p) => String(p.id) === val);
                          if (prod) setSimulatedStockUnits(prod.stock);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800 text-xs shadow-2xs focus:ring-2 focus:ring-[#A71380] focus:border-[#A71380] cursor-pointer"
                      >
                        {liveProducts.map((p) => (
                          <option key={String(p.id)} value={String(p.id)}>
                            {p.name} ({p.sku}) — DB Stock: {p.stock} units
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Simulated Quantity Slider & Input */}
                    <div className="md:col-span-6 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="font-black text-[#0b2341] text-[11px]">
                          Test Stock Quantity: <span className="font-mono text-[#A71380]">{simulatedStockUnits !== null ? simulatedStockUnits : 0} Units</span>
                        </label>
                        {selectedPreviewProductId && (
                          <button
                            type="button"
                            onClick={() => {
                              const prod = liveProducts.find((p) => String(p.id) === String(selectedPreviewProductId));
                              if (prod) setSimulatedStockUnits(prod.stock);
                            }}
                            className="text-[10px] text-slate-600 bg-slate-200/70 hover:bg-[#A71380] hover:text-white px-2 py-0.5 rounded-md font-extrabold cursor-pointer transition-all shadow-2xs"
                          >
                            Reset to DB Value
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={simulatedStockUnits !== null ? simulatedStockUnits : 0}
                          onChange={(e) => setSimulatedStockUnits(Number(e.target.value))}
                          className="w-full accent-[#A71380] cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="9999"
                          value={simulatedStockUnits !== null ? simulatedStockUnits : 0}
                          onChange={(e) => setSimulatedStockUnits(Number(e.target.value))}
                          className="w-20 bg-white border border-slate-300 rounded-lg p-1 text-center font-mono font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC CARD PREVIEW */}
                  {(() => {
                    const prod = liveProducts.find((p) => String(p.id) === String(selectedPreviewProductId)) || liveProducts[0];
                    if (!prod) return null;
                    const stockVal = simulatedStockUnits !== null ? simulatedStockUnits : prod.stock;
                    const isCritical = stockVal <= stockSettings.criticalOutOfStockLimit;
                    const isLow = stockVal <= stockSettings.globalLowStockThreshold;

                    return (
                      <div className={`p-4 rounded-xl border transition-all ${isCritical
                        ? "bg-rose-50/70 border-rose-300 shadow-2xs"
                        : isLow
                          ? "bg-amber-50/70 border-amber-300 shadow-2xs"
                          : "bg-emerald-50/50 border-emerald-200"
                        }`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-[#0b2341] text-sm">{prod.name}</span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {prod.category}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                              SKU: {prod.sku} • Composition: {prod.composition} • Pack: {prod.pack_size}
                            </span>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <span className={`font-black text-sm block font-mono ${isCritical ? "text-rose-700" : isLow ? "text-amber-800" : "text-emerald-800"
                                }`}>
                                {stockVal} Available Units
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Box MRP {formatINR(prod.mrp || prod.price || 450)}
                              </span>
                            </div>

                            <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border shadow-2xs flex items-center gap-1.5 ${isCritical
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : isLow
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}>
                              <span className={`w-2 h-2 rounded-full ${isCritical ? "bg-rose-600 animate-ping" : isLow ? "bg-amber-600 animate-pulse" : "bg-emerald-500"
                                }`}></span>
                              {isCritical
                                ? "Critical Stock Alert"
                                : isLow
                                  ? "Low Stock Warning"
                                  : "Sufficient Stock"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* REAL LOW STOCK DATABASE ITEMS TABLE */}
                  {(() => {
                    const lowStockDbItems = liveProducts.filter((p) => p.stock <= stockSettings.globalLowStockThreshold);
                    return (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-bold text-xs text-[#0b2341] flex items-center gap-1.5">
                            <span>Live Database Items Currently Triggering Alert:</span>
                            <span className="bg-[#A71380] text-white px-2 py-0.5 rounded-full text-[10px] font-mono">
                              {lowStockDbItems.length} Products
                            </span>
                          </h5>
                        </div>
                        {lowStockDbItems.length === 0 ? (
                          <div className="bg-slate-50 p-3 rounded-lg text-center text-slate-500 text-[11px]">
                            No products in your live database are currently below the threshold of &le; {stockSettings.globalLowStockThreshold} units.
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-[11px]">
                              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                                <tr>
                                  <th className="p-2">Product Name</th>
                                  <th className="p-2">SKU</th>
                                  <th className="p-2 text-right">Actual DB Stock</th>
                                  <th className="p-2 text-center">Alert Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {lowStockDbItems.slice(0, 5).map((item) => (
                                  <tr key={String(item.id)} className="hover:bg-slate-50">
                                    <td className="p-2 font-bold text-slate-900">{item.name}</td>
                                    <td className="p-2 text-slate-500 font-mono">{item.sku}</td>
                                    <td className="p-2 text-right font-mono font-bold text-amber-700">{item.stock} Units</td>
                                    <td className="p-2 text-center">
                                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded border border-amber-200">
                                        LOW STOCK
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-lg font-extrabold text-xs shadow-md shadow-[#A71380]/20 transition-all cursor-pointer"
                  >
                    Save Stock &amp; Inventory Limits
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: ALERTS, EMAIL & SMS GATEWAY */}
          {activeTab === "notifications" && (
            <div className="space-y-6 text-xs">
              {notifMsg && (
                <div
                  className={`p-4 rounded-xl font-bold border transition-all ${notifMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
                    : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
                    }`}
                >
                  {notifMsg.text}
                </div>
              )}

              <form onSubmit={handleNotificationSubmit} className="space-y-6">
                {/* GATEWAY 1: EMAIL (SMTP) */}
                <div className={`p-6 rounded-2xl border transition-all ${emailEnabled ? "bg-white border-[#F3D0E9] shadow-2xs" : "bg-slate-50 border-slate-200/90"
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-2xs ${emailEnabled ? "bg-[#A71380] text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                        📧
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-black text-sm text-[#0b2341]">SMTP Email Gateway Settings</h3>
                          <span className="bg-[#F8EAF4] text-[#A71380] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#F3D0E9]">
                            Gmail, SendGrid, Amazon SES, Outlook
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
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
                            placeholder="smtp.gmail.com"
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-[#0b2341] focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">SMTP Port (587 TLS / 465 SSL)</label>
                          <input
                            type="number"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(Number(e.target.value))}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">SMTP Username / Gmail ID</label>
                          <input
                            type="text"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                            placeholder="your-email@gmail.com"
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-[#0b2341] focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">SMTP App Password (16-digit)</label>
                          <input
                            type="password"
                            value={smtpPassword}
                            onChange={(e) => setSmtpPassword(e.target.value)}
                            placeholder="Enter 16-character App Password..."
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">From Sender Email</label>
                          <input
                            type="email"
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">From Sender Name</label>
                          <input
                            type="text"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-medium">Email Dispatch Gateway is currently disabled.</p>
                  )}
                </div>

                {/* GATEWAY 2: SMS GATEWAY */}
                <div className={`p-6 rounded-2xl border transition-all ${smsEnabled ? "bg-white border-emerald-200 shadow-2xs" : "bg-slate-50 border-slate-200/90"
                  }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl font-black flex items-center justify-center text-sm shadow-2xs ${smsEnabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                        📱
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-black text-sm text-[#0b2341]">SMS Gateway &amp; Provider Settings</h3>
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">
                            Fast2SMS (India) / Twilio (Global)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
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
                      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4 text-[11px] text-emerald-950 space-y-1">
                        <div className="flex items-center space-x-1.5 font-bold text-emerald-900">
                          <span>💡</span>
                          <span>How to send REAL Mobile SMS with Fast2SMS / Twilio:</span>
                        </div>
                        <p className="text-slate-700">
                          For Indian SMS, sign up on <strong>Fast2SMS.com/dev</strong> &amp; copy your API Authorization Key. For International SMS, use <strong>Twilio.com</strong>.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">SMS Provider</label>
                          <select
                            value={smsProvider}
                            onChange={(e) => setSmsProvider(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold focus:bg-white focus:outline-none"
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
                            placeholder="Enter API key..."
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">SMS Sender ID (DLT Header)</label>
                          <input
                            type="text"
                            value={smsSenderId}
                            onChange={(e) => setSmsSenderId(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold uppercase text-[#0b2341] focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-medium">SMS Dispatch Gateway is currently disabled.</p>
                  )}
                </div>

                {/* EVENT TRIGGER TOGGLES */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                  <h3 className="font-black text-sm text-[#0b2341]">Automated Notification Event Triggers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyOrderCreated}
                        onChange={(e) => setNotifyOrderCreated(e.target.checked)}
                        className="w-4 h-4 text-[#A71380] rounded"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Order Placed Event</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyOrderStatus}
                        onChange={(e) => setNotifyOrderStatus(e.target.checked)}
                        className="w-4 h-4 text-[#A71380] rounded"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">Order Status Update</span>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifyKycStatus}
                        onChange={(e) => setNotifyKycStatus(e.target.checked)}
                        className="w-4 h-4 text-[#A71380] rounded"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">KYC Approval / Rejection</span>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={notifLoading}
                      className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-lg font-extrabold text-xs shadow-md shadow-[#A71380]/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {notifLoading ? "Saving Gateway..." : "Save Notification Settings"}
                    </button>
                  </div>
                </div>
              </form>

              {/* INTERACTIVE TEST DISPATCH CARD */}
              <div className="bg-gradient-to-r from-[#0b2341] via-[#0b2341] to-slate-900 text-white p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-sm tracking-wide text-white">🧪 Interactive Test Dispatcher</h3>
                  </div>
                  <span className="bg-[#A71380]/30 text-[#F3D0E9] text-[10px] font-mono px-3 py-1 rounded-full border border-[#F3D0E9]/40">
                    Live Gateway Test
                  </span>
                </div>

                {testDispatchMsg && (
                  <div className={`p-3 rounded-lg text-xs font-bold ${testDispatchMsg.type === "success" ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40" : "bg-rose-500/20 text-rose-200 border border-rose-500/40"
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
                        className="flex-1 bg-white/10 border border-blue-400/30 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-[#A71380]"
                        placeholder="name@company.com"
                      />
                      <button
                        type="button"
                        onClick={handleSendTestEmail}
                        className="bg-[#A71380] hover:bg-[#8E0F6D] text-white font-extrabold px-4 py-2 rounded-lg transition-all text-xs cursor-pointer shrink-0 shadow-sm shadow-[#A71380]/20"
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
                        className="flex-1 bg-white/10 border border-blue-400/30 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#A71380]"
                        placeholder="+919876543210"
                      />
                      <button
                        type="button"
                        onClick={handleSendTestSMS}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-lg transition-all text-xs cursor-pointer shrink-0"
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
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
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
                        className="text-[11px] font-bold text-[#A71380] hover:text-[#8E0F6D] cursor-pointer self-end sm:self-auto"
                      >
                        🔄 Refresh Logs
                      </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setLogChannelFilter("ALL"); setLogCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${logChannelFilter === "ALL"
                            ? "bg-[#A71380] text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                          All Channels ({notifLogs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setLogChannelFilter("EMAIL"); setLogCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${logChannelFilter === "EMAIL"
                            ? "bg-[#A71380] text-white shadow-2xs"
                            : "bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9]"
                            }`}
                        >
                          📧 Email Only
                        </button>
                        <button
                          type="button"
                          onClick={() => { setLogChannelFilter("SMS"); setLogCurrentPage(1); }}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${logChannelFilter === "SMS"
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
                            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#A71380]"
                          />
                          <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
                        </div>
                      </div>
                    </div>

                    {filteredNotifLogs.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-medium text-xs">
                        No notification dispatches found.
                      </div>
                    ) : (
                      <>
                        <div className="overflow-hidden border border-slate-200 rounded-xl">
                          <table className="w-full text-left border-collapse table-fixed">
                            <thead>
                              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold bg-slate-50">
                                <th className="p-3 w-24">Time</th>
                                <th className="p-3 w-20">Channel</th>
                                <th className="p-3 w-36">Recipient</th>
                                <th className="p-3 w-32">Event</th>
                                <th className="p-3 w-24">Status</th>
                                <th className="p-3">Message Body</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px]">
                              {paginatedNotifLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/80">
                                  <td className="p-3 font-mono text-slate-500 truncate">
                                    {new Date(log.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded font-black text-[10px] ${log.channel === "EMAIL" ? "bg-[#F8EAF4] text-[#A71380] border border-[#F3D0E9]" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      }`}>
                                      {log.channel}
                                    </span>
                                  </td>
                                  <td className="p-3 font-bold text-slate-800 truncate" title={log.recipient}>
                                    {log.recipient}
                                  </td>
                                  <td className="p-3 font-mono font-bold text-[#A71380] truncate" title={log.event_type}>
                                    {log.event_type}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${log.status === "SENT" ? "bg-emerald-100 text-emerald-800" : "bg-[#F8EAF4] text-[#A71380]"
                                      }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-600 truncate" title={log.message_body}>
                                    {log.subject ? `[${log.subject}] ` : ""}{log.message_body}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* PAGINATION CONTROLS */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                          <div className="text-slate-500 text-[11px]">
                            Showing <span className="font-bold text-slate-800">{Math.min((logCurrentPage - 1) * logPageSize + 1, filteredNotifLogs.length)}</span> to{" "}
                            <span className="font-bold text-slate-800">{Math.min(logCurrentPage * logPageSize, filteredNotifLogs.length)}</span> of{" "}
                            <span className="font-bold text-slate-800">{filteredNotifLogs.length}</span> audit records
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              disabled={logCurrentPage === 1}
                              onClick={() => setLogCurrentPage((prev) => Math.max(prev - 1, 1))}
                              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs"
                            >
                              &larr; Prev
                            </button>

                            <div className="flex items-center space-x-1">
                              {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => setLogCurrentPage(pageNum)}
                                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${logCurrentPage === pageNum
                                    ? "bg-[#A71380] text-white shadow-2xs"
                                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                  {pageNum}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              disabled={logCurrentPage >= totalLogPages}
                              onClick={() => setLogCurrentPage((prev) => Math.min(prev + 1, totalLogPages))}
                              className="px-3 py-1 rounded-lg border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all text-xs"
                            >
                              Next &rarr;
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 4: COMPLIANCE & GST SETTINGS */}
          {activeTab === "compliance" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-2xs space-y-6 text-xs">
              <h2 className="text-base font-black text-[#0b2341] border-b border-slate-100 pb-3">
                Enterprise Compliance &amp; Regulatory Rules
              </h2>

              {complianceSaved && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xl font-bold shadow-2xs">
                  ✓ Enterprise Compliance &amp; Regulatory Settings saved successfully!
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
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold text-[#A71380] focus:bg-white focus:outline-none focus:border-[#A71380]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Drug License Number</label>
                    <input
                      type="text"
                      value={settings.drugLicense}
                      onChange={(e) => setSettings({ ...settings, drugLicense: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono font-bold focus:bg-white focus:outline-none focus:border-[#A71380]"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireKycForB2b}
                      onChange={(e) => setSettings({ ...settings, requireKycForB2b: e.target.checked })}
                      className="w-4 h-4 text-[#A71380] rounded"
                    />
                    <span className="font-semibold text-slate-700">
                      Require GST &amp; Drug License Verification before unlocking B2B Wholesale Pricing
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-lg font-extrabold text-xs shadow-md shadow-[#A71380]/20 transition-all cursor-pointer"
                >
                  Save Compliance Rules
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: PROFILE & AVATAR SETTINGS */}
          {activeTab === "profile" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-2xs space-y-6 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-black text-[#0b2341]">
                    Administrator Profile &amp; Avatar
                  </h2>
                </div>
                <span className="bg-[#F8EAF4] text-[#A71380] font-extrabold text-[10px] uppercase px-3 py-1 rounded-full border border-[#F3D0E9]">
                  {user?.role || "ADMIN"} Account
                </span>
              </div>

              {profileMsg && (
                <div
                  className={`p-4 rounded-xl text-xs font-bold border ${profileMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs"
                    : "bg-rose-50 text-rose-800 border-rose-200 shadow-2xs"
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

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#A71380] bg-white shadow-2xs flex items-center justify-center">
                        <img
                          src={profileAvatar || PRESET_AVATARS[0].url}
                          alt="Selected Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-4 py-2.5 rounded-lg font-extrabold text-xs cursor-pointer inline-flex items-center space-x-2 transition-all shadow-xs">
                          <span>📷 Choose Photo From Computer</span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
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
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-bold">
                            ✓ Custom photo attached
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] font-bold text-slate-500 block mb-2">
                      Or choose from preset executive avatars:
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {PRESET_AVATARS.map((av) => {
                        const isSelected = profileAvatar === av.url;
                        return (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => setProfileAvatar(av.url)}
                            className={`relative rounded-xl p-1 transition-all cursor-pointer ${isSelected
                              ? "ring-2 ring-[#A71380] bg-[#F8EAF4] shadow-2xs"
                              : "border border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                              }`}
                          >
                            <img
                              src={av.url}
                              alt={av.label}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#A71380] text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-2xs">
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
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold text-[#0b2341] text-sm focus:bg-white focus:border-[#A71380] focus:outline-none"
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
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium text-slate-900 text-sm focus:bg-white focus:border-[#A71380] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="bg-[#A71380] hover:bg-[#8E0F6D] text-white px-6 py-2.5 rounded-lg font-extrabold text-xs shadow-md shadow-[#A71380]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{profileLoading ? "Updating Database..." : "Save & Update Profile"}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
