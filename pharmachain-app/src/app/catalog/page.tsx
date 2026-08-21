"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { ProductCatalog } from "@/components/ProductCatalog";
import { FooterSection } from "@/components/FooterSection";

export default function CatalogPage() {
  const [activeRole] = useState<"guest" | "retail" | "distributor" | "admin">("guest");
  const [, setCartCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Clean Stitch Navigation Header */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-8">
        {/* Clean Header Banner */}
        <div className="bg-[#0b2545] text-white rounded-3xl p-8 md:p-10 space-y-3 shadow-sm border border-slate-800">
          <div className="inline-block bg-[#1d4ed8] text-white px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
            WHO-GMP Certified Products
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Pharmaceutical Formulations Catalog
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-3xl leading-relaxed">
            Browse our WHO-GMP certified pharmaceutical formulations across solid oral dosage, liquid syrups, sterile injectables, and respiratory therapeutics.
          </p>
        </div>

        <ProductCatalog
          activeRole={activeRole}
          onAddToCart={() => setCartCount((c) => c + 1)}
        />
      </main>

      <FooterSection />
    </div>
  );
}
