"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { FooterSection } from "@/components/shared/FooterSection";
import { ProductDetailClientView } from "@/components/pages/ProductDetailClientView";
import { productsAPI, ProductItem } from "@/lib/api";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { usePlatform } from "@/lib/platform";
import { MobileProductDetail } from "@/components/mobile";

interface ProductDetailPageClientProps {
  slug: string;
}

/**
 * Strict product matching — no fuzzy/partial includes.
 * Matches by: exact id, exact 1-based index, exact SKU, or exact name-slug.
 */
function findProductStrict(list: any[], slug: string): any | undefined {
  const target = slug.toLowerCase().trim();
  if (!target) return undefined;

  return list.find((p, idx) => {
    // Match exact product id (string or number)
    if (String(p.id).toLowerCase() === target) return true;
    // Match 1-based index (for fallback mock data where id is remapped to idx+1)
    if (String(idx + 1) === target) return true;
    // Match exact SKU
    if (p.sku && String(p.sku).toLowerCase() === target) return true;
    // Match exact name-slug (e.g. "zene-melatonin-oral-spray")
    const nameSlug = (p.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (nameSlug && nameSlug === target) return true;
    return false;
  });
}

function normalizeToProductItem(p: any, idx: number): ProductItem {
  // API may return category as a nested object {name, slug, id, ...} — extract the name string
  const categoryRaw = p.category;
  const categoryStr =
    typeof categoryRaw === "string"
      ? categoryRaw
      : categoryRaw && typeof categoryRaw === "object" && categoryRaw.name
        ? String(categoryRaw.name)
        : null;

  // Same for category_name
  const categoryNameRaw = p.category_name;
  const categoryNameStr =
    typeof categoryNameRaw === "string"
      ? categoryNameRaw
      : categoryNameRaw && typeof categoryNameRaw === "object" && categoryNameRaw.name
        ? String(categoryNameRaw.name)
        : categoryStr;

  return {
    ...p,
    id: typeof p.id === "number" ? p.id : (p.id ? p.id : idx + 1),
    category: categoryStr,
    category_name: categoryNameStr,
    mrp: p.mrp ?? 0,
    customer_price: p.customer_price ?? p.customerPrice ?? p.mrp ?? 0,
    distributor_price: p.distributor_price ?? p.distributorPrice ?? 0,
    bulk_price: p.bulk_price ?? p.bulkPrice ?? 0,
    bulk_moq: p.bulk_moq ?? p.bulkMoq ?? 50,
    display_price: p.display_price ?? p.customer_price ?? p.customerPrice ?? p.mrp ?? 0,
    dosage_form: p.dosage_form || p.form || categoryStr || "Oral Solid / Tablet",
  } as ProductItem;
}

export const ProductDetailPageClient: React.FC<ProductDetailPageClientProps> = ({ slug }) => {
  const platform = usePlatform();
  const rawId = slug || "";

  // Synchronously initialize product from INITIAL_PRODUCTS so detail page loads instantly
  const [product, setProduct] = useState<ProductItem | null>(() => {
    const found = findProductStrict(INITIAL_PRODUCTS as any[], rawId);
    if (found) {
      const idx = (INITIAL_PRODUCTS as any[]).indexOf(found);
      return normalizeToProductItem(found, idx);
    }
    return null;
  });

  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !product);

  // Load product data from live backend in background
  useEffect(() => {
    let isMounted = true;
    const loadProduct = async () => {
      try {
        // Try direct fetch by numeric ID first (fastest path)
        const numericId = Number(rawId);
        if (!isNaN(numericId) && numericId > 0) {
          try {
            const directProduct = await productsAPI.get(numericId);
            if (directProduct && isMounted) {
              const normalized = normalizeToProductItem(directProduct, numericId - 1);
              setProduct(normalized);
              setLoading(false);
              // Still fetch the full list for related products
              const fullList = await productsAPI.list().catch(() => []);
              if (isMounted && fullList.length > 0) {
                setAllProducts(fullList.map((p, i) => normalizeToProductItem(p, i)));
              }
              return;
            }
          } catch {
            // Direct fetch failed, fall through to list-based approach
          }
        }

        // Fallback: load the full list and find by matching
        const data = await productsAPI.list().catch(() => []);
        const list = data && data.length > 0 ? data : (INITIAL_PRODUCTS as any[]);

        const normalizedList: ProductItem[] = list.map((p: any, idx: number) =>
          normalizeToProductItem(p, idx)
        );

        if (isMounted) {
          setAllProducts(normalizedList);

          const found = findProductStrict(normalizedList, rawId);
          if (found) {
            setProduct(found);
          } else if (!product && normalizedList.length > 0) {
            // Last resort: don't default to first product, show not-found instead
            // setProduct(normalizedList[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load product detail:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [rawId]);

  const relatedProducts = allProducts
    .filter((p) => String(p.id) !== String(product?.id))
    .slice(0, 4);

  if (loading) {
    if (platform.isNative || platform.isMobile) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF8FB]">
          <div className="animate-spin w-8 h-8 border-3 border-[#C00065] border-t-transparent rounded-full mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading medicine...</p>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-24 text-center flex-1 w-full">
          <div className="animate-spin w-10 h-10 border-3 border-[#0B2545] border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-500">Loading product details...</p>
        </main>
        <FooterSection />
      </div>
    );
  }

  if (!product) {
    if (platform.isNative || platform.isMobile) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF8FB] px-6 text-center">
          <span className="text-4xl block mb-2">🧪</span>
          <h2 className="text-lg font-black text-[#0B2545]">Product Not Found</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
            The requested formulation was not found.
          </p>
          <Link
            href="/products/"
            className="bg-[#C00065] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs"
          >
            ← Back to Products
          </Link>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-20 text-center flex-1 w-full space-y-4">
          <span className="text-4xl block">🧪</span>
          <h2 className="text-xl font-black text-[#0B2545]">Product Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested product ID does not match active records.
          </p>
          <Link
            href="/products/"
            className="inline-block bg-[#0B2545] text-white px-5 py-2.5 rounded-xl text-xs font-bold"
          >
            &larr; Back to Products Store
          </Link>
        </main>
        <FooterSection />
      </div>
    );
  }

  if ((platform.isNative || platform.isMobile) && product) {
    return <MobileProductDetail product={product} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <main className="flex-1 w-full py-4">
        <ProductDetailClientView product={product as any} relatedProducts={relatedProducts} />
      </main>
      <FooterSection />
    </div>
  );
};
