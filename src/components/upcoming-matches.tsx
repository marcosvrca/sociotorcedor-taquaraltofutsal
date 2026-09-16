"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { club, formatBRL } from "@/lib/club";

export type UpcomingMatch = {
  id: string;
  opponent: string;
  competition: string | null;
  round: string | null;
  venue: string | null;
  dateTime: string;
  isHome: boolean;
  opponentLogoUrl: string | null;
  ticketMode: "ONLINE" | "PHYSICAL";
  whatsappUrl: string | null;
  ticketPriceCents: number | null;
  availableFor: string | null;
  ticketsOnSale: boolean;
};

export function UpcomingMatches({ matches }: { matches: UpcomingMatch[] }) {
  const [selectedId, setSelectedId] = useState(matches[0]?.id || "");

  const selected = useMemo(
    () => matches.find((m) => m.id === selectedId) || matches[0],
    [matches, selectedId]
  );

  if (!matches.length || !selected) {
    return null;
  }

  const homeName = selected.isHome ? club.name : selected.opponent;
  const awayName = selected.isHome ? selected.opponent : club.name;
  const homeLogo = selected.isHome
    ? "/brand/logo.png"
    : selected.opponentLogoUrl;
  const awayLogo = selected.isHome
    ? selected.opponentLogoUrl
    : "/brand/logo.png";

  const title = `${homeName} X ${awayName}`;

  function TeamMark({
    name,
    logoUrl,
  }: {
    name: string;
    logoUrl: string | null;
  }) {
    return (
      <div className="flex w-28 flex-col items-center gap-3 md:w-36">
        {logoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={name}
              className="h-20 w-20 object-contain md:h-28 md:w-28"
            />
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              {name}
            </p>
          </>
        ) : (
          <div className="flex h-20 w-full items-center justify-center md:h-28">
            <p className="font-display text-center text-lg leading-tight tracking-wide text-white md:text-xl">
              {name}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <section
      id="jogos"
      className="relative overflow-hidden border-y border-white/5 bg-[#05070b] py-16 md:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 30% 20%, rgba(11,92,171,0.25), transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(225,6,0,0.18), transparent 50%), linear-gradient(180deg, rgba(7,9,13,0.2), rgba(7,9,13,0.95))",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.04) 48px, rgba(255,255,255,0.04) 49px), repeating-linear-gradient(0deg, transparent, transparent 48px, rgba(34,120,60,0.08) 48px, rgba(34,120,60,0.08) 49px)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[180px_1fr] md:px-6 lg:grid-cols-[200px_1fr]">
        <aside>
          <h2 className="font-display text-3xl leading-none tracking-wide text-white md:text-4xl">
            Próximos
            <br />
            Jogos
          </h2>
          <ul className="mt-8 space-y-3">
            {matches.map((m) => {
              const label = format(new Date(m.dateTime), "dd/MM");
              const active = m.id === selected.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`font-display text-2xl tracking-wide transition md:text-3xl ${
                      active
                        ? "text-[#c4a574]"
                        : "text-white/35 hover:text-white/70"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="flex flex-col items-center text-center">
          <p className="font-display text-2xl uppercase tracking-[0.06em] text-white md:text-4xl lg:text-5xl">
            {title}
            {selected.competition ? (
              <span className="text-white/70">
                {" "}
                (
                {selected.competition.length > 18
                  ? selected.competition.slice(0, 18)
                  : selected.competition}
                )
              </span>
            ) : null}
          </p>
          {selected.competition && (
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
              {selected.competition}
            </p>
          )}
          {selected.round && (
            <p className="mt-1 text-sm lowercase text-white/55">{selected.round}</p>
          )}

          <div className="mt-10 flex w-full max-w-xl items-end justify-center gap-6 md:gap-10">
            <TeamMark name={homeName} logoUrl={homeLogo} />
            <p className="pb-10 font-display text-4xl text-white md:pb-14 md:text-5xl">
              X
            </p>
            <TeamMark name={awayName} logoUrl={awayLogo} />
          </div>

          <p className="mt-8 font-display text-xl text-white md:text-2xl">
            {format(new Date(selected.dateTime), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
          {selected.venue && (
            <p className="mt-1 font-display text-lg uppercase tracking-wide text-white md:text-xl">
              {selected.venue}
            </p>
          )}

          {selected.availableFor && (
            <div className="mt-6 max-w-md text-sm leading-relaxed text-white/75 whitespace-pre-line">
              <span className="font-semibold text-white">Disponível para:</span>
              {"\n"}
              {selected.availableFor}
            </div>
          )}

          {selected.ticketsOnSale && (
            <div className="mt-8">
              {selected.ticketMode === "PHYSICAL" && selected.whatsappUrl ? (
                <a
                  href={selected.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-[200px] items-center justify-center rounded-md bg-gradient-to-b from-[#c4a574] to-[#8f7348] px-8 py-3 font-display text-lg tracking-[0.12em] text-white shadow-[0_8px_24px_rgba(196,165,116,0.25)] transition hover:brightness-110"
                >
                  Compre agora
                </a>
              ) : selected.ticketMode === "ONLINE" ? (
                <Link
                  href={`/ingressos/${selected.id}`}
                  className="inline-flex min-w-[200px] items-center justify-center rounded-md bg-gradient-to-b from-[#c4a574] to-[#8f7348] px-8 py-3 font-display text-lg tracking-[0.12em] text-white shadow-[0_8px_24px_rgba(196,165,116,0.25)] transition hover:brightness-110"
                >
                  Compre agora
                  {selected.ticketPriceCents != null && selected.ticketPriceCents > 0
                    ? ` · ${formatBRL(selected.ticketPriceCents)}`
                    : ""}
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
