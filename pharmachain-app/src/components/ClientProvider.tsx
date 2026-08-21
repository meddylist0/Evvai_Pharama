"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
