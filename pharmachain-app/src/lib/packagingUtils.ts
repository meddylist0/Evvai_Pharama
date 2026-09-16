/**
 * PHARMACEUTICAL PACKAGING & INVENTORY HIERARCHY UTILITIES
 * 
 * Hierarchy:
 * PRODUCT -> PACKAGING -> BATCH -> STOCK IN SALEABLE PACKS
 * 
 * Domain Rules:
 * 1. Primary Inventory Unit = Saleable Pack (Box / Bottle / Tube)
 * 2. 1 Pack = stripsPerPack Strips / Sub-units
 * 3. 1 Strip / Unit = tabletsPerStrip Tablets / Bottles / Vials / Tubes
 * 4. 1 Master Carton = packsPerCarton Saleable Packs
 * 5. Primary Stock is ALWAYS tracked and stored in Saleable Packs.
 *    Strips and Tablets/Units are derived equivalent quantities for clinical / dispensing clarity.
 */

export interface PackagingConfig {
  packsPerCarton: number;   // e.g. 50 packs per master carton / shipper box
  stripsPerPack: number;    // e.g. 10 strips per box
  tabletsPerStrip: number;  // e.g. 10 tablets/capsules per strip
}

export const DEFAULT_PACKAGING_CONFIG: PackagingConfig = {
  packsPerCarton: 50,
  stripsPerPack: 10,
  tabletsPerStrip: 10,
};

/**
 * Returns dynamic unit names (singular & plural) based on category and pack size string.
 * Examples:
 * - "Syrups & Liquids" -> "Bottle" / "Bottles"
 * - "Injectables" -> "Vial" / "Vials" (or "Ampoule" / "Ampoules")
 * - "Topical" / "Ointments" -> "Tube" / "Tubes"
 * - "Capsules" -> "Cap" / "Caps"
 * - "Inhalers & Sprays" -> "Unit" / "Units"
 * - "Tablets" -> "Tab" / "Tabs"
 */
export function getDerivedUnitLabel(
  categoryName?: string | null,
  packSize?: string | null
): { unitSingular: string; unitPlural: string } {
  const cat = (categoryName || "").toLowerCase();
  const pack = (packSize || "").toLowerCase();

  // 1. Liquids, Syrups, Suspensions, Drops, Solutions
  if (
    cat.includes("syrup") ||
    cat.includes("liquid") ||
    cat.includes("suspension") ||
    cat.includes("solution") ||
    cat.includes("drop") ||
    pack.includes("bottle") ||
    pack.includes("ml") ||
    pack.includes("fl oz")
  ) {
    return { unitSingular: "Bottle", unitPlural: "Bottles" };
  }

  // 2. Injectables, Injections, Vials, Ampoules
  if (
    cat.includes("inject") ||
    cat.includes("vial") ||
    cat.includes("ampoule") ||
    pack.includes("vial") ||
    pack.includes("ampoule")
  ) {
    if (pack.includes("ampoule")) {
      return { unitSingular: "Ampoule", unitPlural: "Ampoules" };
    }
    return { unitSingular: "Vial", unitPlural: "Vials" };
  }

  // 3. Topicals, Ointments, Creams, Gels
  if (
    cat.includes("topical") ||
    cat.includes("ointment") ||
    cat.includes("cream") ||
    cat.includes("gel") ||
    cat.includes("derma") ||
    pack.includes("tube") ||
    pack.includes("jar")
  ) {
    if (pack.includes("jar")) {
      return { unitSingular: "Jar", unitPlural: "Jars" };
    }
    return { unitSingular: "Tube", unitPlural: "Tubes" };
  }

  // 4. Inhalers, Sprays
  if (
    cat.includes("inhal") ||
    cat.includes("spray") ||
    pack.includes("inhal") ||
    pack.includes("spray") ||
    pack.includes("canister")
  ) {
    return { unitSingular: "Unit", unitPlural: "Units" };
  }

  // 5. Sachets, Powders
  if (
    cat.includes("sachet") ||
    cat.includes("powder") ||
    pack.includes("sachet") ||
    pack.includes("pouch")
  ) {
    return { unitSingular: "Sachet", unitPlural: "Sachets" };
  }

  // 6. Capsules
  if (cat.includes("capsule") || pack.includes("capsule") || pack.includes("cap ")) {
    return { unitSingular: "Cap", unitPlural: "Caps" };
  }

  // 7. Default to Tablets/Tabs
  return { unitSingular: "Tab", unitPlural: "Tabs" };
}

/**
 * Extracts strips per pack and tablets per strip from standard pharma pack size strings
 */
export function parsePackagingConfig(
  packSizeOrPackaging?: string | null,
  secondaryPackSize?: string | null,
  customPacksPerCarton: number = 50,
  categoryName?: string | null
): PackagingConfig {
  const result: PackagingConfig = {
    packsPerCarton: customPacksPerCarton > 0 ? customPacksPerCarton : 50,
    stripsPerPack: 10,
    tabletsPerStrip: 10,
  };

  const rawString = `${packSizeOrPackaging || ""} ${secondaryPackSize || ""}`.trim();
  const cat = (categoryName || "").toLowerCase();

  const isLiquidOrSingleUnit =
    cat.includes("syrup") ||
    cat.includes("liquid") ||
    cat.includes("suspension") ||
    cat.includes("solution") ||
    cat.includes("drop") ||
    cat.includes("inject") ||
    cat.includes("topical") ||
    cat.includes("ointment") ||
    cat.includes("cream") ||
    cat.includes("gel") ||
    cat.includes("spray") ||
    cat.includes("inhal");

  if (!rawString) {
    if (isLiquidOrSingleUnit) {
      result.stripsPerPack = 1;
      result.tabletsPerStrip = 1;
    }
    return result;
  }

  const clean = rawString;

  // Pattern for liquid volume multiplier e.g. "10 x 5ml" or "5 x 2ml"
  const volumeMultiplierMatch = clean.match(/(\d+)\s*(?:[×xX*])\s*(\d+(?:\.\d+)?)\s*(?:ml|l|g|mg|fl\s*oz)/i);
  if (volumeMultiplierMatch) {
    const count = parseInt(volumeMultiplierMatch[1], 10);
    if (!isNaN(count) && count > 0) {
      result.stripsPerPack = 1;
      result.tabletsPerStrip = count;
      return result;
    }
  }

  // Standard multiplier pattern like "10 × 10" or "10 x 10" or "10*15"
  const multiMatch = clean.match(/(\d+)\s*(?:[×xX*])\s*(\d+)/);
  if (multiMatch) {
    const strips = parseInt(multiMatch[1], 10);
    const tablets = parseInt(multiMatch[2], 10);
    if (!isNaN(strips) && strips > 0) result.stripsPerPack = strips;
    if (!isNaN(tablets) && tablets > 0) result.tabletsPerStrip = tablets;
    return result;
  }

  // Single volume/unit pack e.g. "100ml Bottle", "200ml Syrup", "15g Tube"
  const isVolumePack = clean.match(/^(\d+(?:\.\d+)?)\s*(?:ml|l|g|mg|fl\s*oz)/i) || clean.match(/(?:bottle|tube|vial|ampoule|jar|canister|spray|unit)/i);
  if (isVolumePack || isLiquidOrSingleUnit) {
    const singleMatch = clean.match(/(\d+)\s*(?:strips?|ampoules?|vials?|bottles?|sachets?|capsules?|tablets?|units?|tubes?)/i);
    if (singleMatch) {
      const qty = parseInt(singleMatch[1], 10);
      if (!isNaN(qty) && qty > 0) {
        if (clean.toLowerCase().includes("strip")) {
          result.stripsPerPack = qty;
          result.tabletsPerStrip = 10;
        } else {
          result.stripsPerPack = 1;
          result.tabletsPerStrip = qty;
        }
        return result;
      }
    }
    result.stripsPerPack = 1;
    result.tabletsPerStrip = 1;
    return result;
  }

  // Single count match like "30 Tablets" or "10 Strips"
  const singleMatch = clean.match(/(\d+)\s*(?:strips?|ampoules?|vials?|bottles?|sachets?|capsules?|tablets?)/i);
  if (singleMatch) {
    const qty = parseInt(singleMatch[1], 10);
    if (!isNaN(qty) && qty > 0) {
      if (clean.toLowerCase().includes("strip")) {
        result.stripsPerPack = qty;
        result.tabletsPerStrip = 10;
      } else {
        result.stripsPerPack = 1;
        result.tabletsPerStrip = qty;
      }
    }
  }

  return result;
}

export interface DerivedStockBreakdown {
  cartons: number;            // Packs / packsPerCarton
  packs: number;              // Primary stock quantity
  strips: number;             // Packs * stripsPerPack
  tablets: number;            // Packs * stripsPerPack * tabletsPerStrip
  tabletsPerPack: number;     // stripsPerPack * tabletsPerStrip
  tabletsPerCarton: number;   // packsPerCarton * stripsPerPack * tabletsPerStrip
}

/**
 * Calculates all derived hierarchy values from primary stock in Saleable Packs
 */
export function calculateStockBreakdown(packs: number, config: PackagingConfig = DEFAULT_PACKAGING_CONFIG): DerivedStockBreakdown {
  const safePacks = Math.max(0, Math.floor(packs || 0));
  const safePacksPerCarton = Math.max(1, config.packsPerCarton || 50);
  const safeStripsPerPack = Math.max(1, config.stripsPerPack || 10);
  const safeTabletsPerStrip = Math.max(1, config.tabletsPerStrip || 10);

  const tabletsPerPack = safeStripsPerPack * safeTabletsPerStrip;
  const tabletsPerCarton = safePacksPerCarton * tabletsPerPack;

  const cartons = safePacks / safePacksPerCarton;
  const strips = safePacks * safeStripsPerPack;
  const tablets = safePacks * tabletsPerPack;

  return {
    cartons,
    packs: safePacks,
    strips,
    tablets,
    tabletsPerPack,
    tabletsPerCarton,
  };
}

/**
 * Calculates primary packs from master cartons received
 */
export function cartonsToPacks(cartons: number, packsPerCarton: number = 50): number {
  return Math.max(0, Math.floor(cartons || 0)) * Math.max(1, packsPerCarton || 50);
}

/**
 * Format helper for primary packs
 */
export function formatPacks(packs: number): string {
  const safe = Math.max(0, Math.floor(packs || 0));
  return `${safe.toLocaleString("en-IN")} ${safe === 1 ? "Pack" : "Packs"}`;
}

/**
 * Format helper for derived tablets
 */
export function formatTablets(tablets: number): string {
  const safe = Math.max(0, Math.floor(tablets || 0));
  return `${safe.toLocaleString("en-IN")} ${safe === 1 ? "Tablet" : "Tablets"}`;
}

/**
 * Format helper for derived unit count (Tablets, Bottles, Vials, Tubes, etc.)
 */
export function formatDerivedUnits(
  count: number,
  categoryName?: string | null,
  packSize?: string | null
): string {
  const safe = Math.max(0, Math.floor(count || 0));
  const { unitSingular, unitPlural } = getDerivedUnitLabel(categoryName, packSize);
  const label = safe === 1 ? unitSingular : unitPlural;
  return `${safe.toLocaleString("en-IN")} ${label}`;
}

/**
 * Format helper for derived strips
 */
export function formatStrips(strips: number): string {
  const safe = Math.max(0, Math.floor(strips || 0));
  return `${safe.toLocaleString("en-IN")} ${safe === 1 ? "Strip" : "Strips"}`;
}

/**
 * Format helper for master cartons (shows clean integer or 1 decimal if fractional)
 */
export function formatCartons(cartons: number): string {
  if (Number.isInteger(cartons)) {
    return `${cartons.toLocaleString("en-IN")} ${cartons === 1 ? "Carton" : "Cartons"}`;
  }
  return `${cartons.toFixed(1)} Cartons`;
}

/**
 * Category-based high-resolution fallback image provider
 */
export function getCategoryFallbackImage(categoryName?: string | null, packSize?: string | null): string {
  const cat = (categoryName || "").toLowerCase();
  const pack = (packSize || "").toLowerCase();

  if (
    cat.includes("syrup") ||
    cat.includes("liquid") ||
    cat.includes("suspension") ||
    cat.includes("solution") ||
    cat.includes("drop") ||
    pack.includes("bottle") ||
    pack.includes("ml") ||
    pack.includes("fl oz")
  ) {
    return "/uploads/products/zene_melatonin_spray.png";
  }

  if (
    cat.includes("inject") ||
    cat.includes("vial") ||
    cat.includes("ampoule") ||
    pack.includes("vial") ||
    pack.includes("ampoule")
  ) {
    return "/uploads/products/nxtnerve_b12_injection.png";
  }

  if (
    cat.includes("topical") ||
    cat.includes("ointment") ||
    cat.includes("cream") ||
    cat.includes("gel") ||
    cat.includes("derma") ||
    pack.includes("tube") ||
    pack.includes("jar")
  ) {
    return "/uploads/products/nxtlife-foaming.jpg";
  }

  if (cat.includes("capsule") || pack.includes("capsule") || pack.includes("cap ")) {
    return "/uploads/products/evglip-met.jpg";
  }

  if (cat.includes("nutra") || cat.includes("supplement") || cat.includes("wellness")) {
    return "/uploads/products/ev-d3.jpg";
  }

  // Default pharmaceutical blister pack image
  return "/uploads/products/accelerant-300.jpg";
}

/**
 * Universal product image URL resolver
 * Safely resolves Base64 Data URLs, full HTTP/HTTPS URLs, relative backend uploads, and fallback images.
 */
export function getProductImageUrl(
  prodOrImage?: any,
  categoryName?: string | null,
  packSize?: string | null
): string {
  let imgStr = "";
  let cat = categoryName || "";
  let pack = packSize || "";

  if (typeof prodOrImage === "string") {
    imgStr = prodOrImage;
  } else if (prodOrImage && typeof prodOrImage === "object") {
    imgStr = prodOrImage.image || prodOrImage.imageUrl || prodOrImage.image_url || "";
    if (!cat) cat = prodOrImage.category_name || prodOrImage.category || "";
    if (!pack) pack = prodOrImage.pack_size || prodOrImage.packSize || "";
  }

  imgStr = (imgStr || "").trim();

  if (imgStr.length > 0) {
    // 1. Base64 Data URL (e.g. data:image/png;base64,...)
    if (imgStr.startsWith("data:")) {
      return imgStr;
    }

    // 2. Full HTTP or HTTPS URL (e.g. http://192.168.0.155:8000/uploads/... or https://...)
    if (imgStr.startsWith("http://") || imgStr.startsWith("https://")) {
      return imgStr;
    }

    // 3. Absolute path starting with / (e.g. /uploads/... or /images/...)
    if (imgStr.startsWith("/")) {
      return imgStr;
    }

    // 4. Backend upload relative path (e.g. uploads/products/zene.png)
    if (imgStr.startsWith("uploads/")) {
      return `/${imgStr}`;
    }

    // 5. Filename in public images folder (e.g. product_zene.png)
    return `/images/${imgStr}`;
  }

  return getCategoryFallbackImage(cat, pack);
}


