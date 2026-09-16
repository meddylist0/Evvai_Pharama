"use client";

import React from "react";
import { LoginPageView } from "@/components/pages/LoginPageView";
import { usePlatform } from "@/lib/platform";
import { MobileLoginView } from "@/components/mobile";

export default function LoginPage() {
  const platform = usePlatform();

  if (platform.isNative || platform.isMobile) {
    return <MobileLoginView />;
  }

  return <LoginPageView />;
}
