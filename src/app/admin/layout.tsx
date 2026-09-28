import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/session";
import { club } from "@/lib/club";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/socios", label: "Sócios" },
  { href: "/admin/pagamentos", label: "Pagamentos" },
  { href: "/admin/jogos", label: "Jogos" },
  { href: "/admin/loja", label: "Loja" },
  { href: "/admin/planos", label: "Planos" },
  { href: "/admin/config", label: "PIX / Config" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[#07090d]">
      <header className="border-b border-white/10 bg-[#0b1220] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt={club.name}
              width={36}
              height={50}
              className="h-10 w-auto shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display text-lg text-white">Admin</p>
              <p className="truncate text-xs text-tf-muted">{club.programName}</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/area" className="text-[11px] uppercase text-tf-muted hover:text-white sm:text-xs">
              <span className="sm:hidden">Área</span>
              <span className="hidden sm:inline">Área sócio</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-3 pb-3 sm:px-4 md:px-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-white/70 hover:bg-white/5 hover:text-white sm:px-3 sm:text-xs"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
