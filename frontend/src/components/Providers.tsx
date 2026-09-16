"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/lib/authContext";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
