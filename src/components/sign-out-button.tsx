"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="btn btn-secondary !py-1.5 !px-3 text-xs"
    >
      Sair
    </button>
  );
}
