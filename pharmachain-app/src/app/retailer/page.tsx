"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RetailerRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/retailer/dashboard");
  }, [router]);

  return null;
}
