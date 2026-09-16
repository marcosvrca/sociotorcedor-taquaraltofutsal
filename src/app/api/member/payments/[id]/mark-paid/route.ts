import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { subscription: true },
  });

  if (!payment || payment.subscription.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Pagamento não encontrado." },
      { status: 404 }
    );
  }

  if (payment.status !== "PENDING") {
    return NextResponse.json(
      { error: "Este pagamento não pode ser marcado agora." },
      { status: 400 }
    );
  }

  if (payment.method === "CARD" || payment.provider === "MERCADO_PAGO") {
    return NextResponse.json(
      { error: "Pagamentos com cartão são confirmados pelo Mercado Pago." },
      { status: 400 }
    );
  }

  const form = await req.formData();
  const file = form.get("receipt");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Envie o comprovante do pagamento via PIX." },
      { status: 400 }
    );
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Comprovante deve ser JPG, PNG, WEBP ou PDF." },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Comprovante deve ter no máximo 5 MB." },
      { status: 400 }
    );
  }

  const ext =
    file.type === "application/pdf"
      ? "pdf"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

  const receiptUrl = await saveUpload(
    "receipts",
    `${payment.id}-${Date.now()}.${ext}`,
    Buffer.from(await file.arrayBuffer())
  );

  await prisma.payment.update({
    where: { id },
    data: {
      status: "AWAITING_CONFIRMATION",
      paidAt: new Date(),
      receiptUrl,
    },
  });

  return NextResponse.json({ ok: true, receiptUrl });
}
