import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { restoreOrderStock } from "@/lib/store";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.status !== "PENDING" && order.status !== "AWAITING_CONFIRMATION") {
    return NextResponse.json(
      { error: "Este pedido não pode ser cancelado." },
      { status: 400 }
    );
  }

  await prisma.order.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  await restoreOrderStock(id);

  return NextResponse.json({ ok: true });
}
