import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await context.params;
  const relative = parts.join("/");
  const isReceipt = relative.startsWith("receipts/");

  if (isReceipt) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      const url = `/api/uploads/${relative}`;
      const email = session.user.email || undefined;
      const [payment, order, ticket] = await Promise.all([
        prisma.payment.findFirst({
          where: { receiptUrl: url, subscription: { userId: session.user.id } },
          select: { id: true },
        }),
        prisma.order.findFirst({
          where: { receiptUrl: url, userId: session.user.id },
          select: { id: true },
        }),
        prisma.ticket.findFirst({
          where: {
            receiptUrl: url,
            OR: [
              { userId: session.user.id },
              ...(email ? [{ buyerEmail: email }] : []),
            ],
          },
          select: { id: true },
        }),
      ]);
      if (!payment && !order && !ticket) {
        return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
      }
    }
  }

  const file = await readUpload(relative);

  if (!file) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
