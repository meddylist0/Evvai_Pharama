"use client";

import React from "react";
import { DistributorPortal } from "@/components/DistributorPortal";

export default function DistributorDashboardPage() {
  return (
    <DistributorPortal
      onAddToCart={(prodName) => alert(`Added ${prodName} to B2B Wholesale Order (PO)!`)}
    />
  );
}
