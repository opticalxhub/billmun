import React from "react";
import { EBLayout } from "@/components/eb-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EBLayout>{children}</EBLayout>;
}
