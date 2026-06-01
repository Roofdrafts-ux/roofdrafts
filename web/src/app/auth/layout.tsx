import "./auth.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Sign in — Roofdrafts",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
