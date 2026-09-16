"use client";

import React, { useState } from "react";
import { MobileCartView } from "./MobileCartView";
import { MobileCheckout } from "./MobileCheckout";

export const MobileCartFlow: React.FC = () => {
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  if (step === "checkout") {
    return <MobileCheckout onBackToCart={() => setStep("cart")} />;
  }

  return <MobileCartView onProceedToCheckout={() => setStep("checkout")} />;
};
