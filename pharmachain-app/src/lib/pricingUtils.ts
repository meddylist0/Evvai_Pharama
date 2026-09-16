/**
 * DEVELOPER NOTE — FRONTEND SMART PRICING & DISCOUNT UTILITIES:
 * 1. Presets: Calculates auto-discount tiers (Standard 15%/35%/45%, Wholesale, Generic 70%, OTC 10%/20%/30%).
 * 2. Privacy: B2B wholesale prices (distributor_price, bulk_price) are displayed only for APPROVED distributors.
 */

export interface PricingPreset {
  id: string;
  label: string;
  badge: string;
  custDiscount: number; // Percentage off MRP
  distDiscount: number; // Percentage off MRP
  bulkDiscount: number; // Percentage off MRP
  description: string;
  colorClass: string;
}

export const PHARMA_PRICING_PRESETS: PricingPreset[] = [
  {
    id: "standard",
    label: "Standard Pharma",
    badge: "15% / 35% / 45%",
    custDiscount: 15,
    distDiscount: 35,
    bulkDiscount: 45,
    description: "Standard B2C & B2B tier pricing for regular ethical formulations",
    colorClass: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  {
    id: "wholesale",
    label: "Wholesale Heavy",
    badge: "10% / 40% / 50%",
    custDiscount: 10,
    distDiscount: 40,
    bulkDiscount: 50,
    description: "High margin incentives for wholesale distributor bulk buyers",
    colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  {
    id: "promo",
    label: "Competitive Promo",
    badge: "20% / 30% / 40%",
    custDiscount: 20,
    distDiscount: 30,
    bulkDiscount: 40,
    description: "Attractive retail pricing to boost high consumer volume",
    colorClass: "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100",
  },
  {
    id: "high_margin",
    label: "Direct High Margin",
    badge: "5% / 25% / 35%",
    custDiscount: 5,
    distDiscount: 25,
    bulkDiscount: 35,
    description: "Premium brand pricing with tight discount thresholds",
    colorClass: "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
];

export interface GlobalPricingSettings {
  defaultCustDiscount: number; // e.g. 15%
  defaultDistDiscount: number; // e.g. 35%
  defaultBulkDiscount: number; // e.g. 45%
  defaultLotSize: number;      // e.g. 50 packs/boxes per master lot
  defaultBulkMoq: number;      // e.g. 50 packs
  selectedPresetId: string;
}

export const DEFAULT_PRICING_SETTINGS: GlobalPricingSettings = {
  defaultCustDiscount: 15,
  defaultDistDiscount: 35,
  defaultBulkDiscount: 45,
  defaultLotSize: 50,
  defaultBulkMoq: 50,
  selectedPresetId: "standard",
};

export const PRICING_SETTINGS_KEY = "pharmalink_global_pricing_rules";

export function getGlobalPricingSettings(): GlobalPricingSettings {
  if (typeof window === "undefined") return DEFAULT_PRICING_SETTINGS;
  try {
    const saved = localStorage.getItem(PRICING_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_PRICING_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn("Failed loading pricing settings from storage:", err);
  }
  return DEFAULT_PRICING_SETTINGS;
}

export function saveGlobalPricingSettings(settings: Partial<GlobalPricingSettings>): GlobalPricingSettings {
  if (typeof window === "undefined") return DEFAULT_PRICING_SETTINGS;
  try {
    const current = getGlobalPricingSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(PRICING_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn("Failed saving pricing settings to storage:", err);
    return DEFAULT_PRICING_SETTINGS;
  }
}

/**
 * Calculates selling price given MRP and discount percentage.
 * Formula: Price = MRP * (1 - Discount% / 100)
 */
export function calculatePriceFromDiscount(mrp: number, discountPct: number): number {
  if (isNaN(mrp) || mrp <= 0) return 0;
  if (isNaN(discountPct) || discountPct <= 0) return Math.round(mrp * 100) / 100;
  const clampedDiscount = Math.min(Math.max(discountPct, 0), 100);
  const price = mrp * (1 - clampedDiscount / 100);
  return Math.round(price * 100) / 100;
}

/**
 * Calculates implied discount percentage given MRP and selling price.
 * Formula: Discount% = ((MRP - Price) / MRP) * 100
 */
export function calculateDiscountFromPrice(mrp: number, price: number): number {
  if (isNaN(mrp) || mrp <= 0 || isNaN(price) || price < 0) return 0;
  if (price >= mrp) return 0;
  const discount = ((mrp - price) / mrp) * 100;
  return Math.round(discount * 100) / 100;
}

/**
 * Parse numeric value safely from input string, allowing user typing
 */
export function parseNumberSafe(val: string | number, fallback = 0): number {
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (!val || val.trim() === "") return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Format currency nicely for Indian Rupees
 */
export function formatINR(val: number): string {
  if (isNaN(val)) return "₹0.00";
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface OrderStatusInfo {
  label: string;
  badgeClass: string;
  isCancelled: boolean;
  cancelledBy: "admin" | "customer" | null;
}

/**
 * Normalizes order status into standardized display badges (e.g. "Cancelled by Admin", "Cancelled by Customer", "Delivered", etc.)
 */
export function getOrderStatusDisplay(
  status?: string | null,
  cancellationReason?: string | null,
  adminNotes?: string | null
): OrderStatusInfo {
  const st = (status || "").trim().toUpperCase();
  const notes = `${cancellationReason || ""} ${adminNotes || ""}`.toLowerCase();

  if (
    st.includes("CANCEL") ||
    st === "CANCELLED" ||
    st === "CANCELLED_BY_ADMIN" ||
    st === "CANCELLED_BY_CUSTOMER" ||
    st === "REJECTED"
  ) {
    let cancelledBy: "admin" | "customer" = "admin";
    let label = "Cancelled by Admin";

    if (
      st.includes("CUSTOMER") ||
      st.includes("RETAILER") ||
      notes.includes("customer") ||
      notes.includes("retailer") ||
      notes.includes("buyer") ||
      notes.includes("user")
    ) {
      cancelledBy = "customer";
      label = "Cancelled by Customer";
    }

    return {
      label,
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
      isCancelled: true,
      cancelledBy,
    };
  }

  if (st === "DELIVERED") {
    return {
      label: "Delivered",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      isCancelled: false,
      cancelledBy: null,
    };
  }

  if (st === "SHIPPED" || st === "IN_TRANSIT" || st === "DISPATCHED") {
    return {
      label: "Shipped",
      badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
      isCancelled: false,
      cancelledBy: null,
    };
  }

  if (st === "PACKED") {
    return {
      label: "Packed",
      badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-300",
      isCancelled: false,
      cancelledBy: null,
    };
  }

  if (st === "CONFIRMED" || st === "PROCESSING" || st === "APPROVED") {
    return {
      label: "Confirmed",
      badgeClass: "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]",
      isCancelled: false,
      cancelledBy: null,
    };
  }

  if (st === "RETURNED") {
    return {
      label: "Returned",
      badgeClass: "bg-[#F8EAF4] text-[#A71380] border-[#F3D0E9]",
      isCancelled: true,
      cancelledBy: "customer",
    };
  }

  return {
    label: status ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) : "Pending",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    isCancelled: false,
    cancelledBy: null,
  };
}


