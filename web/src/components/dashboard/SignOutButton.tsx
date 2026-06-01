"use client";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      className="nj2-btn nj2-btn-secondary nj2-btn-sm"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign out
    </button>
  );
}
