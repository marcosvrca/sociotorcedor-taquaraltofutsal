import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/store";

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

async function uniquePlanSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let n = 2;
  while (await prisma.plan.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  try {
    const data = schema.parse(await req.json());
    const plan = await prisma.plan.create({
      data: {
        slug: await uniquePlanSlug(data.name),
        name: data.name,
        description: data.description,
        priceCents: Math.round(data.priceReais * 100),
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
    });
    return NextResponse.json({ ok: true, id: plan.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao cadastrar plano." }, { status: 400 });
  }
}
