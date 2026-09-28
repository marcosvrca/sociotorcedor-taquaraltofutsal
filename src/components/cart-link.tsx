"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount } from "@/lib/cart";

export function CartLink({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(cartCount());
    sync();
    window.addEventListener("tf-cart", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tf-cart", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <Link href="/loja/carrinho" className={className}>
      Sacola{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
