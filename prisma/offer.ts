import type { PrismaClient } from "@prisma/client";

export const OFFER_PLANS = [
  {
    slug: "basico",
    name: "Básico",
    description:
      "Desconto em todos os produtos, nos ingressos dos jogos e com os parceiros do Taquaralto.",
    priceCents: 2990,
    sortOrder: 1,
    highlighted: false,
    productDiscountPercent: 5,
    ticketDiscountPercent: 10,
    partnerDiscountPercent: 5,
    benefits: [
      "Desconto de 5% em todos os produtos do Taquaralto",
      "Desconto de 10% do ingresso para jogos",
      "Desconto de 5% com todos os parceiros do Taquaralto",
    ],
  },
  {
    slug: "full",
    name: "Torcida",
    description:
      "Mais desconto na loja, nos ingressos e com os parceiros, além do sorteio mensal de brindes.",
    priceCents: 4990,
    sortOrder: 2,
    highlighted: false,
    productDiscountPercent: 10,
    ticketDiscountPercent: 15,
    partnerDiscountPercent: 10,
    benefits: [
      "Desconto de 10% em todos os produtos do Taquaralto",
      "Desconto de 15% em ingressos para jogos",
      "Desconto de 10% em todos os parceiros do Taquaralto",
      "Sorteio mensal de brindes",
    ],
  },
] as const;

export const OFFER_PRODUCTS = [
  {
    slug: "camisa-torcedor-2026",
    name: "Camisa torcedor 2026",
    description: "Camisa de torcedor da temporada 2026 do Taquaralto Futsal.",
    sizes: "P,M,G,GG",
    sortOrder: 1,
  },
  {
    slug: "garrafa-termica-taquaralto",
    name: "Garrafa térmica Taquaralto",
    description: "Garrafa térmica oficial do Taquaralto.",
    sizes: null,
    sortOrder: 2,
  },
] as const;

export async function syncOffer(prisma: PrismaClient) {
  const benefitIdByTitle = new Map<string, string>();

  for (const plan of OFFER_PLANS) {
    for (const title of plan.benefits) {
      if (benefitIdByTitle.has(title)) continue;
      const existing = await prisma.benefit.findFirst({ where: { title } });
      const benefit =
        existing ?? (await prisma.benefit.create({ data: { title } }));
      benefitIdByTitle.set(title, benefit.id);
    }
  }

  const plans: Record<string, { id: string; priceCents: number }> = {};

  for (const plan of OFFER_PLANS) {
    const data = {
      name: plan.name,
      description: plan.description,
      priceCents: plan.priceCents,
      sortOrder: plan.sortOrder,
      highlighted: plan.highlighted,
      active: true,
      productDiscountPercent: plan.productDiscountPercent,
      ticketDiscountPercent: plan.ticketDiscountPercent,
      partnerDiscountPercent: plan.partnerDiscountPercent,
    };
    const saved = await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: { slug: plan.slug, ...data },
      update: data,
    });
    await prisma.planBenefit.deleteMany({ where: { planId: saved.id } });
    await prisma.planBenefit.createMany({
      data: plan.benefits.map((title) => ({
        planId: saved.id,
        benefitId: benefitIdByTitle.get(title)!,
      })),
    });
    plans[plan.slug] = saved;
  }

  await prisma.plan.updateMany({
    where: { slug: { notIn: OFFER_PLANS.map((plan) => plan.slug) } },
    data: { active: false, highlighted: false },
  });

  await prisma.plan.updateMany({
    where: { slug: "torcida" },
    data: { name: "Torcida (antigo)" },
  });

  for (const product of OFFER_PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          slug: product.slug,
          name: product.name,
          description: product.description,
          sizes: product.sizes,
          sortOrder: product.sortOrder,
          priceCents: 0,
          memberPriceCents: null,
          stock: 0,
          active: true,
        },
      });
      continue;
    }
    await prisma.product.update({
      where: { slug: product.slug },
      data: {
        name: product.name,
        description: product.description,
        sizes: existing.sizes ?? product.sizes,
        sortOrder: product.sortOrder,
        active: true,
      },
    });
  }

  await prisma.product.updateMany({
    where: { slug: { notIn: OFFER_PRODUCTS.map((product) => product.slug) } },
    data: { active: false },
  });

  const basico = plans.basico;
  const full = plans.full;
  if (!basico || !full) {
    throw new Error("Não foi possível gravar os planos Básico e Torcida.");
  }
  return { basico, full };
}
