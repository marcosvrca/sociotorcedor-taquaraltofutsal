import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMemberCode } from "@/lib/club";
import { getPixProvider } from "@/lib/payments";

const schema = z
  .object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    cpf: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    planSlug: z.string().default("torcida"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este e-mail." },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { slug: data.planSlug },
    });
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["pix_key", "pix_holder", "pix_city"] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const pixKey = map.pix_key || "taquaraltofutsal@gmail.com";
    const pixHolder = map.pix_holder || "Taquaralto Futsal";
    const pixCity = map.pix_city || "Palmas";

    const cpf = data.cpf?.replace(/\D/g, "") || null;
    if (cpf) {
      const cpfOwner = await prisma.user.findUnique({ where: { cpf } });
      if (cpfOwner) {
        return NextResponse.json(
          { error: "Já existe uma conta com este CPF." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const provider = getPixProvider();
    const charge = await provider.createCharge({
      amountCents: plan.priceCents,
      description: `Mensalidade ${plan.name} - Socio Torcedor`,
      payerEmail: data.email,
      payerName: data.name,
      pixKey,
      pixHolder,
      pixCity,
    });

    const due = new Date();
    due.setDate(due.getDate() + 3);
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        passwordHash,
        cpf,
        phone: data.phone || null,
        address: data.address || null,
        memberCode: generateMemberCode(),
        subscription: {
          create: {
            planId: plan.id,
            status: "PENDING",
            currentPeriodEnd: periodEnd,
            payments: {
              create: {
                amountCents: plan.priceCents,
                status: "PENDING",
                provider: charge.provider,
                method: "PIX",
                externalId: charge.externalId,
                pixPayload: charge.pixPayload,
                pixKey: charge.pixKey,
                description: `Mensalidade ${plan.name} (PIX)`,
                dueDate: due,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = String(err.meta?.target ?? "");
      if (target.includes("cpf")) {
        return NextResponse.json(
          { error: "Já existe uma conta com este CPF." },
          { status: 400 }
        );
      }
      if (target.includes("email")) {
        return NextResponse.json(
          { error: "Já existe uma conta com este e-mail." },
          { status: 400 }
        );
      }
    }
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao criar cadastro." },
      { status: 500 }
    );
  }
}
