import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const percent = z.coerce.number().int().min(0).max(100);

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  priceReais: z.coerce.number().positive(),
  productDiscountPercent: percent.default(0),
  ticketDiscountPercent: percent.default(0),
  partnerDiscountPercent: percent.default(0),
  sortOrder: z.coerce.number().int(),
  highlighted: z.boolean(),
  active: z.boolean(),
  benefitIds: z.array(z.string()),
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const data = schema.parse(await req.json());
  const priceCents = Math.round(data.priceReais * 100);

  await prisma.$transaction([
    prisma.planBenefit.deleteMany({ where: { planId: id } }),
    prisma.plan.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        priceCents,
        productDiscountPercent: data.productDiscountPercent,
        ticketDiscountPercent: data.ticketDiscountPercent,
        partnerDiscountPercent: data.partnerDiscountPercent,
        sortOrder: data.sortOrder,
        highlighted: data.highlighted,
        active: data.active,
        benefits: {
          create: data.benefitIds.map((benefitId) => ({ benefitId })),
        },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: { _count: { select: { subscriptions: true } } },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });
  }
  if (plan._count.subscriptions > 0) {
    return NextResponse.json(
      {
        error: `Este plano tem ${plan._count.subscriptions} sócio(s) vinculado(s). Desative o plano em vez de excluir.`,
      },
      { status: 400 }
    );
  }

  await prisma.plan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
