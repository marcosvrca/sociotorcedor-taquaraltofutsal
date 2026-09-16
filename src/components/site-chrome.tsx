import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { club } from "@/lib/club";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.75 15.5v-7l6.2 3.5-6.2 3.5z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c1.8-3.2 4.2-4.8 7-4.8s5.2 1.6 7 4.8" strokeLinecap="round" />
    </svg>
  );
}

const navLinks = [
  { href: "/#jogos", label: "Jogos" },
  { href: "/planos", label: "Planos" },
  { href: "/#beneficios", label: "Benefícios" },
  { href: "/#patrocinadores", label: "Parceiros" },
  { href: "/cadastro", label: "Conheça" },
] as const;

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const areaHref = session?.user?.role === "ADMIN" ? "/admin" : "/area";

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      {/* Top: redes sociais + escudo */}
      <div className="border-b border-white/10 bg-black/55 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 px-4 py-2.5 md:gap-8 md:px-6">
          <a
            href={club.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-white/80 transition hover:text-white"
            aria-label={`Instagram ${club.instagramHandle}`}
          >
            <InstagramIcon className="h-[18px] w-[18px]" />
          </a>

          <Link href="/" className="shrink-0" aria-label={club.name}>
            <Image
              src="/brand/logo-icon.png"
              alt=""
              width={44}
              height={44}
              className="h-10 w-10 object-contain drop-shadow-[0_0_12px_rgba(11,92,171,0.35)] md:h-11 md:w-11"
              priority
            />
          </Link>

          <a
            href={club.youtube}
            target="_blank"
            rel="noreferrer"
            className="text-white/80 transition hover:text-white"
            aria-label={`YouTube ${club.youtubeHandle}`}
          >
            <YouTubeIcon className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>

      {/* Bottom: logo + navegação + conta */}
      <div className="bg-gradient-to-b from-black/55 to-transparent backdrop-blur-[2px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-6 md:gap-10">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <Image
                src="/brand/logo.png"
                alt={club.name}
                width={44}
                height={60}
                className="h-11 w-auto md:h-12"
                priority
              />
              <div className="leading-none">
                <p className="font-display text-xl tracking-wide text-white md:text-2xl">
                  SÓCIO
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-tf-muted">
                  Torcedor
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-display text-sm tracking-[0.14em] text-white/80 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {session?.user ? (
              <Link
                href={areaHref}
                className="flex items-center gap-2 font-display text-sm tracking-[0.14em] text-white/85 transition hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="hidden sm:inline">Minha área</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 font-display text-sm tracking-[0.14em] text-white/85 transition hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <span className="hidden sm:inline">Login</span>
                </Link>
                <span className="hidden h-4 w-px bg-white/25 sm:block" aria-hidden />
                <Link
                  href="/cadastro"
                  className="hidden font-display text-sm tracking-[0.14em] text-white/85 transition hover:text-white sm:inline"
                >
                  Cadastre-se
                </Link>
                <Link
                  href="/cadastro"
                  className="btn btn-primary !px-3 !py-2 text-xs sm:hidden"
                >
                  Seja sócio
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Nav compacta no tablet/mobile */}
        <nav className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 lg:hidden md:px-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="shrink-0 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt={club.name}
              width={40}
              height={56}
              className="h-12 w-auto"
            />
            <div>
              <p className="font-display text-lg">{club.name}</p>
              <p className="text-sm text-tf-muted">{club.fullLocation}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm text-tf-muted">
          <p className="font-display text-base text-white">Contato</p>
          <a href={`mailto:${club.email}`} className="block hover:text-white">
            {club.email}
          </a>
          <a
            href={club.instagram}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-white"
          >
            Instagram {club.instagramHandle}
          </a>
          <a
            href={club.youtube}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-white"
          >
            YouTube {club.youtubeHandle}
          </a>
        </div>
        <div className="space-y-2 text-sm text-tf-muted">
          <p className="font-display text-base text-white">Programa</p>
          <Link href="/planos" className="block hover:text-white">
            Planos
          </Link>
          <Link href="/login" className="block hover:text-white">
            Área do sócio
          </Link>
          <Link href="/cadastro" className="block hover:text-white">
            Cadastre-se
          </Link>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-tf-muted">
        © {new Date().getFullYear()} {club.name}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
