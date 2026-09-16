import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Reativa o prazo dos ingressos após adiamento: USED/EXPIRED → PAID. */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const result = await prisma.ticket.updateMany({
    where: {
      matchId: id,
      OR: [
        { status: "USED" },
        { status: "PAID" },
      ],
      amountCents: { gte: 0 },
    },
    data: {
      status: "PAID",
      usedAt: null,
    },
  });

  await prisma.match.update({
    where: { id },
    data: { active: true, ticketsOnSale: true },
  });

  return NextResponse.json({ ok: true, reactivated: result.count });
}
