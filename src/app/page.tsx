import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { PlanCard } from "@/components/plan-card";
import { SponsorsMarquee } from "@/components/sponsors-marquee";
import { UpcomingMatches } from "@/components/upcoming-matches";
import { prisma } from "@/lib/prisma";
import { club, formatBRL } from "@/lib/club";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [plans, sponsors, matches, products] = await Promise.all([
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: {
        benefits: { include: { benefit: true } },
      },
    }),
    prisma.sponsor.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.match.findMany({
      where: {
        active: true,
        dateTime: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      },
      orderBy: { dateTime: "asc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 3,
    }),
  ]);

  const upcoming = matches.map((m) => ({
    id: m.id,
    opponent: m.opponent,
    competition: m.competition,
    round: m.round,
    venue: m.venue,
    dateTime: m.dateTime.toISOString(),
    isHome: m.isHome,
    opponentLogoUrl: m.opponentLogoUrl,
    ticketMode: m.ticketMode,
    whatsappUrl: m.whatsappUrl,
    ticketPriceCents: m.ticketPriceCents,
    availableFor: m.availableFor,
    ticketsOnSale: m.ticketsOnSale,
  }));

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="hero-grid relative min-h-[100svh] overflow-hidden court-lines">
        <div className="absolute inset-0 bg-[url('/brand/logo.png')] bg-contain bg-center bg-no-repeat opacity-[0.07]" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-start px-4 pb-12 pt-[calc(8.5rem+env(safe-area-inset-top))] sm:pb-16 sm:pt-40 lg:justify-center lg:px-6 lg:pb-24 lg:pt-44">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div>
              <p className="animate-rise text-xs font-semibold uppercase tracking-[0.18em] text-tf-red sm:text-sm sm:tracking-[0.25em]">
                Palmas · Tocantins
              </p>
              <h1 className="animate-rise-delay mt-3 max-w-xl font-display text-5xl leading-[0.9] text-white sm:text-6xl lg:text-8xl">
                {club.name}
              </h1>
              <p className="animate-rise-delay-2 mt-5 max-w-lg text-base text-white/80 sm:text-lg">
                Faça parte do programa oficial de sócio-torcedor. Benefícios
                reais, carteirinha digital e a força da torcida com o clube.
              </p>
              <div className="animate-rise-delay-2 mt-8 flex flex-col gap-3 min-[380px]:flex-row min-[380px]:flex-wrap">
                <Link href="/cadastro" className="btn btn-primary cta-pulse w-full min-[380px]:w-auto">
                  Seja sócio agora
                </Link>
                <Link href="/planos" className="btn btn-secondary w-full min-[380px]:w-auto">
                  Ver planos
                </Link>
              </div>
            </div>
            <div className="animate-rise-delay flex justify-center lg:justify-end">
              <Image
                src="/brand/logo.png"
                alt={`Escudo ${club.name}`}
                width={420}
                height={580}
                className="h-auto w-40 drop-shadow-[0_20px_60px_rgba(11,92,171,0.45)] sm:w-56 lg:w-full lg:max-w-md"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:py-20 md:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tf-blue">
          Por que ser sócio
        </p>
        <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl md:text-5xl">
          Benefícios que reforçam o clube
        </h2>
        <p className="mt-3 max-w-2xl text-tf-muted">
          Inspirado nos grandes programas nacionais, pensado para a realidade do
          futsal em Palmas — com parceiros locais e vantagens no dia a dia.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Prioridade nos jogos",
              text: "Descontos e preferência na compra de ingressos conforme o seu plano.",
            },
            {
              title: "Clube de vantagens",
              text: "Descontos e benefícios com patrocinadores oficiais do Taquaralto.",
            },
            {
              title: "Carteirinha digital",
              text: "Acesse sua área, pagamentos e identificação de sócio pelo celular.",
            },
          ].map((item) => (
            <div key={item.title} className="panel p-6">
              <h3 className="font-display text-2xl text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-tf-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <UpcomingMatches matches={upcoming} />

      <section className="border-y border-white/5 bg-tf-surface/60 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tf-red">
                Planos
              </p>
              <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl md:text-5xl">
                Escolha o seu
              </h2>
            </div>
            <Link href="/planos" className="text-sm font-semibold text-white/70 hover:text-white">
              Comparar todos →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                slug={plan.slug}
                description={plan.description}
                priceCents={plan.priceCents}
                highlighted={plan.highlighted}
                benefits={plan.benefits.map((b) => b.benefit.title)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="patrocinadores" className="scroll-mt-24 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tf-blue">
            Parceiros oficiais
          </p>
          <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl md:text-5xl">
            Quem fortalece o Taquaralto
          </h2>
        </div>
        <div className="mt-8">
          <SponsorsMarquee sponsors={sponsors} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tf-blue">
              Loja oficial
            </p>
            <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl md:text-5xl">
              Vista o clube
            </h2>
          </div>
          <Link href="/loja" className="text-sm font-semibold text-white/70 hover:text-white">
            Ver loja →
          </Link>
        </div>
        {products.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={`/loja/${product.slug}`} className="panel p-5">
                <h3 className="font-display text-2xl text-white">{product.name}</h3>
                <p className="mt-2 text-sm text-tf-muted">{formatBRL(product.priceCents)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
        <div className="panel overflow-hidden p-5 sm:p-8 md:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl text-white sm:text-4xl md:text-5xl">
                Pronto para vestir a camisa?
              </h2>
              <p className="mt-3 text-tf-muted">
                Cadastre-se, escolha o plano e pague via PIX. Em poucos minutos
                você já acessa a área do sócio.
              </p>
              <Link href="/cadastro" className="btn btn-primary mt-6">
                Quero ser sócio
              </Link>
            </div>
            <div className="min-w-0 text-sm text-tf-muted lg:text-right">
              <p>Fale com a gente</p>
              <a
                href={`mailto:${club.email}`}
                className="mt-1 block break-all text-base text-white hover:text-tf-red sm:text-lg"
              >
                {club.email}
              </a>
              <a
                href={club.instagram}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block hover:text-white"
              >
                {club.instagramHandle}
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
