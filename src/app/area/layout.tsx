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
  { href: "/area/pedidos", label: "Pedidos" },
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
      <header className="border-b border-white/10 bg-black/40 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
          <Link href="/area" className="flex min-w-0 items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt={club.name}
              width={40}
              height={56}
              className="h-10 w-auto shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-none text-white">
                Área do sócio
              </p>
              <p className="truncate text-xs text-tf-muted">{session.user.name}</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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
