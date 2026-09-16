"use client";

import React from "react";
import { usePlatform } from "@/lib/platform";
import { MobileServicesView } from "@/components/mobile";
import { ServicesPageView } from "@/components/pages/ServicesPageView";

export default function ServicesPage() {
  const platform = usePlatform();

  if (platform.isNative || platform.isMobile) {
    return <MobileServicesView />;
  }

  return <ServicesPageView />;
}

