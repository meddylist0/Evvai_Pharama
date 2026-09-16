"use client";

import React from "react";
import { usePlatform } from "@/lib/platform";
import { MobilePartnersView } from "@/components/mobile";
import { PartnersPageView } from "@/components/pages/PartnersPageView";

export default function PartnersPage() {
  const platform = usePlatform();

  if (platform.isNative || platform.isMobile) {
    return <MobilePartnersView />;
  }

  return <PartnersPageView />;
}
