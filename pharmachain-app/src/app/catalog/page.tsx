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
      {/* Navigation Header */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        <ProductCatalog
          activeRole={activeRole}
          onAddToCart={() => setCartCount((c) => c + 1)}
        />
      </main>

      <FooterSection />
    </div>
  );
}
