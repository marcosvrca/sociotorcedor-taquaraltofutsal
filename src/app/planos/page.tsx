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
      <div className="hero-grid relative pb-16 pt-36 court-lines md:pt-40">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tf-red">
            {club.programName}
          </p>
          <h1 className="mt-2 font-display text-5xl text-white md:text-7xl">
            Planos
          </h1>
          <p className="mt-4 max-w-2xl text-tf-muted">
            Compare benefícios e escolha o plano que combina com o seu jeito de
            torcer pelo {club.name}.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
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
