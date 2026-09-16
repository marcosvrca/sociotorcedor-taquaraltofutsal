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
      <header className="border-b border-white/10 bg-[#0b1220]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt={club.name}
              width={36}
              height={50}
              className="h-10 w-auto"
            />
            <div>
              <p className="font-display text-lg text-white">Admin</p>
              <p className="text-xs text-tf-muted">{club.programName}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/area" className="text-xs uppercase text-tf-muted hover:text-white">
              Área sócio
            </Link>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 md:px-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide text-white/70 hover:bg-white/5 hover:text-white"
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
