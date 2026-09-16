import React from "react";
import { INITIAL_PRODUCTS } from "@/data/mockData";
import { ProductDetailPageClient } from "./ProductDetailPageClient";

// Required for Next.js static HTML export (output: 'export') for Capacitor / mobile build
export async function generateStaticParams() {
  const staticSlugs = [
    ...Array.from({ length: 150 }, (_, i) => String(i + 1)),
    ...INITIAL_PRODUCTS.map((p) => String(p.id)),
    ...INITIAL_PRODUCTS.map((p) => p.sku).filter(Boolean),
    ...INITIAL_PRODUCTS.map((p) => (p as any).slug).filter(Boolean),
    ...INITIAL_PRODUCTS.map((p) => (p.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")),
  ];
  return Array.from(new Set(staticSlugs)).map((slug) => ({
    slug: String(slug),
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetailPageClient slug={slug} />;
}
