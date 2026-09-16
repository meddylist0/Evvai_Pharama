"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/shared/Header";
import { ProductCatalog } from "@/components/b2b/ProductCatalog";
import { FooterSection } from "@/components/shared/FooterSection";
import { usePlatform } from "@/lib/platform";
import { MobileProductList } from "@/components/mobile";

export default function ProductsPage() {
  const platform = usePlatform();
  // Render MobileProductList in Capacitor Native App and mobile viewports
  if (platform.isNative || platform.isMobile) {
    return (
      <React.Suspense fallback={<div className="min-h-screen bg-[#FDF8FB]" />}>
        <MobileProductList />
      </React.Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Navigation Header */}
      <Header />

      <main className="flex-1 w-full">
        <ProductCatalog />
      </main>

      <FooterSection />
    </div>
  );
}
