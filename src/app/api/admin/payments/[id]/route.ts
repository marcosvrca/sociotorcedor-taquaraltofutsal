import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const { action } = (await req.json()) as { action: "confirm" | "reject" };

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { subscription: true },
  });
  if (!payment) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  if (action === "reject") {
    await prisma.payment.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return NextResponse.json({ ok: true });
  }

  if (payment.provider === "MERCADO_PAGO" && payment.method === "CARD") {
    return NextResponse.json(
      {
        error:
          "Pagamentos com cartão (Mercado Pago) são confirmados automaticamente via webhook.",
      },
      { status: 400 }
    );
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.$transaction([
    prisma.payment.update({
      where: { id },
      data: {
        status: "PAID",
        confirmedAt: new Date(),
        paidAt: payment.paidAt || new Date(),
      },
    }),
    prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
