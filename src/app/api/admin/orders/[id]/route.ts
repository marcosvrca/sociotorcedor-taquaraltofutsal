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
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const { action } = (await req.json()) as {
    action: "confirm" | "reject" | "fulfill" | "cancel";
  };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  if (action === "fulfill") {
    if (order.status !== "PAID") {
      return NextResponse.json(
        { error: "Só é possível entregar um pedido pago." },
        { status: 400 }
      );
    }
    await prisma.order.update({
      where: { id },
      data: { status: "FULFILLED", fulfilledAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "confirm") {
    if (order.status === "CANCELLED" || order.status === "REJECTED") {
      return NextResponse.json(
        { error: "Pedido encerrado não pode ser confirmado." },
        { status: 400 }
      );
    }
    await prisma.order.update({
      where: { id },
      data: {
        status: "PAID",
        confirmedAt: new Date(),
        paidAt: order.paidAt || new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject" || action === "cancel") {
    if (order.status === "FULFILLED") {
      return NextResponse.json(
        { error: "Pedido já entregue." },
        { status: 400 }
      );
    }
    if (order.status !== "REJECTED" && order.status !== "CANCELLED") {
      await prisma.order.update({
        where: { id },
        data: { status: action === "reject" ? "REJECTED" : "CANCELLED" },
      });
      await restoreOrderStock(id);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
}
