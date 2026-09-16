import Link from "next/link";
import Image from "next/image";
import { requireSession } from "@/lib/session";
import { club } from "@/lib/club";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/area", label: "Dashboard" },
  { href: "/area/cadastro", label: "Meu cadastro" },
  { href: "/area/pagamentos", label: "Pagamentos" },
  { href: "/area/ingressos", label: "Ingressos" },
  { href: "/area/beneficios", label: "Benefícios" },
  { href: "/area/carteirinha", label: "Carteirinha" },
];

export default async function AreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-[#07090d]">
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/area" className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt={club.name}
              width={40}
              height={56}
              className="h-10 w-auto"
            />
            <div>
              <p className="font-display text-lg leading-none text-white">
                Área do sócio
              </p>
              <p className="text-xs text-tf-muted">{session.user.name}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="text-xs font-semibold uppercase text-tf-blue">
                Admin
              </Link>
            )}
            <Link href="/" className="hidden text-xs uppercase text-tf-muted hover:text-white sm:inline">
              Site
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
