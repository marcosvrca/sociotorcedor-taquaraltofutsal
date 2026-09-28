import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { club } from "@/lib/club";
import { SiteHeaderBar } from "@/components/site-header-bar";

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

export async function SiteHeader() {
  const session = await getServerSession(authOptions);
  const areaHref = session?.user?.role === "ADMIN" ? "/admin" : "/area";

  return (
    <header className="absolute inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
      {/* Top: redes sociais + escudo */}
      <div className="border-b border-white/10 bg-black/55 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 px-4 py-2 md:gap-8 md:px-6 md:py-2.5">
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
              className="h-8 w-8 object-contain drop-shadow-[0_0_12px_rgba(11,92,171,0.35)] sm:h-10 sm:w-10 md:h-11 md:w-11"
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

      <SiteHeaderBar loggedIn={!!session?.user} areaHref={areaHref} />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:items-start sm:gap-6 sm:py-12 lg:gap-8 lg:px-6">
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
          <a href={`mailto:${club.email}`} className="block break-all hover:text-white">
            {club.email}
          </a>
          <a
            href={club.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-white"
          >
            <InstagramIcon className="h-4 w-4 shrink-0" />
            Instagram {club.instagramHandle}
          </a>
          <a
            href={club.youtube}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-white"
          >
            <YouTubeIcon className="h-4 w-4 shrink-0" />
            YouTube {club.youtubeHandle}
          </a>
        </div>
        <div className="space-y-2 text-sm text-tf-muted">
          <p className="font-display text-base text-white">Programa</p>
          <Link href="/loja" className="block hover:text-white">
            Loja
          </Link>
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
