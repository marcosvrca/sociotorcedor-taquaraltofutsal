import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/club";
import { PlanAdminForm, PlansToolbar } from "@/components/plan-admin-form";

export const dynamic = "force-dynamic";

export default async function AdminPlanosPage() {
  const [plans, benefits] = await Promise.all([
    prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
      include: { benefits: { include: { benefit: true } } },
    }),
    prisma.benefit.findMany({ orderBy: { title: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl text-white">Planos</h1>
        <p className="mt-1 text-tf-muted">
          Cadastre planos e benefícios no topo. Edite ou exclua os planos já existentes.
        </p>
      </div>

      <PlansToolbar benefits={benefits.map((b) => ({ id: b.id, title: b.title }))} />

      <div className="space-y-6">
        {plans.map((plan) => (
          <PlanAdminForm
            key={plan.id}
            plan={{
              id: plan.id,
              name: plan.name,
              slug: plan.slug,
              description: plan.description,
              priceCents: plan.priceCents,
              productDiscountPercent: plan.productDiscountPercent,
              ticketDiscountPercent: plan.ticketDiscountPercent,
              partnerDiscountPercent: plan.partnerDiscountPercent,
              sortOrder: plan.sortOrder,
              highlighted: plan.highlighted,
              active: plan.active,
              benefitIds: plan.benefits.map((b) => b.benefitId),
            }}
            allBenefits={benefits.map((b) => ({ id: b.id, title: b.title }))}
            priceLabel={formatBRL(plan.priceCents)}
          />
        ))}
      </div>
    </div>
  );
}
