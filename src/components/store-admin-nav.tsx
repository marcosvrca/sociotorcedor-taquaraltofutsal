"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/loja", label: "Início", exact: true },
  { href: "/admin/loja/produtos", label: "Produtos" },
  { href: "/admin/loja/estoque", label: "Estoque" },
  { href: "/admin/loja/cadastrar", label: "Cadastrar" },
  { href: "/admin/loja/compras", label: "Compras" },
  { href: "/admin/loja/pagamentos", label: "Pagamentos" },
] as const;

export function StoreAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          "exact" in link
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide ${
              active
                ? "bg-white text-black"
                : "bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
