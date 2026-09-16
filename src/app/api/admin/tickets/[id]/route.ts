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
  const { action } = (await req.json()) as { action: "confirm" | "reject" | "use" };

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ingresso não encontrado." }, { status: 404 });
  }

  if (action === "reject") {
    await prisma.ticket.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "use") {
    if (ticket.status !== "PAID") {
      return NextResponse.json(
        { error: "Só é possível marcar ingresso pago como utilizado." },
        { status: 400 }
      );
    }
    await prisma.ticket.update({
      where: { id },
      data: { status: "USED", usedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  await prisma.ticket.update({
    where: { id },
    data: {
      status: "PAID",
      confirmedAt: new Date(),
      paidAt: ticket.paidAt || new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
