import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { PlanCard } from "@/components/plan-card";
import { prisma } from "@/lib/prisma";
import { club } from "@/lib/club";

export const dynamic = "force-dynamic";

export default async function PlanosPage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { benefits: { include: { benefit: true } } },
  });

  return (
    <div className="min-h-screen">
      <div className="hero-grid relative pb-12 pt-[calc(8.5rem+env(safe-area-inset-top))] court-lines sm:pb-16 sm:pt-40 lg:pt-44">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tf-red sm:text-sm sm:tracking-[0.2em]">
            {club.programName}
          </p>
          <h1 className="mt-2 font-display text-5xl text-white sm:text-6xl md:text-7xl">
            Planos
          </h1>
          <p className="mt-4 max-w-2xl text-tf-muted">
            Compare benefícios e escolha o plano que combina com o seu jeito de
            torcer pelo {club.name}.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>
      <SiteFooter />
    </div>
  );
}
