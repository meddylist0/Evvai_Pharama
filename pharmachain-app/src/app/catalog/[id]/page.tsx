import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { FooterSection } from "@/components/FooterSection";
import { INITIAL_PRODUCTS, Product } from "@/data/mockData";
import { ProductDetailClientView } from "@/components/ProductDetailClientView";

// Required for Next.js static HTML export (output: 'export')
export async function generateStaticParams() {
  return INITIAL_PRODUCTS.map((prod) => ({
    id: prod.id,
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product: Product | undefined = INITIAL_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  // Related formulations
  const relatedProducts = INITIAL_PRODUCTS.filter(
    (p) => p.id !== product.id && (p.category === product.category || Math.random() > 0.5)
  ).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10">
        {/* Breadcrumb Bar */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-[#0b2341] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/catalog" className="hover:text-[#0b2341] transition-colors">Catalog</Link>
          <span>/</span>
          <span className="text-[#0b2341] font-bold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Client Interactive Product View */}
        <ProductDetailClientView product={product} relatedProducts={relatedProducts} />
      </main>

      <FooterSection />
    </div>
  );
}
