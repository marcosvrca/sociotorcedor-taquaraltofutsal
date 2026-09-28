"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { club } from "@/lib/club";
import { CartLink } from "@/components/cart-link";

const navLinks = [
  { href: "/#jogos", label: "Jogos" },
  { href: "/loja", label: "Loja" },
  { href: "/planos", label: "Planos" },
  { href: "/#beneficios", label: "Benefícios" },
  { href: "/#patrocinadores", label: "Parceiros" },
] as const;

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

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden>
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function SiteHeaderBar({
  loggedIn,
  areaHref,
}: {
  loggedIn: boolean;
  areaHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative bg-gradient-to-b from-black/55 to-transparent backdrop-blur-[2px]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3 md:py-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-6 lg:gap-10">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <Image
              src="/brand/logo.png"
              alt={club.name}
              width={44}
              height={60}
              className="h-9 w-auto sm:h-11 md:h-12"
              priority
            />
            <div className="hidden leading-none sm:block">
              <p className="font-display text-xl tracking-wide text-white md:text-2xl">
                SÓCIO
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-tf-muted md:tracking-[0.28em]">
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <CartLink className="hidden font-display text-sm tracking-[0.14em] text-white/85 transition hover:text-white sm:inline" />
          {loggedIn ? (
            <Link
              href={areaHref}
              className="flex items-center gap-2 font-display text-sm tracking-[0.14em] text-white/85 transition hover:text-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30">
                <UserIcon className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">Minha área</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                aria-label="Login"
                className="flex items-center gap-2 font-display text-sm tracking-[0.14em] text-white/85 transition hover:text-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="hidden lg:inline">Login</span>
              </Link>
              <span className="hidden h-4 w-px bg-white/25 lg:block" aria-hidden />
              <Link
                href="/cadastro"
                className="hidden font-display text-sm tracking-[0.14em] text-white/85 transition hover:text-white lg:inline"
              >
                Cadastre-se
              </Link>
              <Link
                href="/cadastro"
                className="btn btn-primary !px-3 !py-2 text-xs lg:hidden"
              >
                <span className="sm:hidden">Sócio</span>
                <span className="hidden sm:inline">Seja sócio</span>
              </Link>
            </>
          )}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white lg:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="site-menu"
          className="absolute inset-x-0 top-full z-50 border-b border-white/10 bg-[#07090d] px-3 py-2 shadow-2xl lg:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-3 font-display text-lg tracking-[0.12em] text-white/85 hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <CartLink
            className="block rounded-md px-3 py-3 font-display text-lg tracking-[0.12em] text-white/85 hover:bg-white/5 hover:text-white"
          />
        </nav>
      )}
    </div>
  );
}
