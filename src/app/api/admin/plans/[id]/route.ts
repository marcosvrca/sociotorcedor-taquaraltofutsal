import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  priceReais: z.coerce.number().positive(),
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
