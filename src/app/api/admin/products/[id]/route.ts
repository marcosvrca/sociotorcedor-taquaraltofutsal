import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";
import { formatSizes, parseSizes } from "@/lib/store";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const fieldsSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  priceReais: z.coerce.number().positive(),
  memberPriceReais: z.string(),
  stock: z.coerce.number().int().min(0),
  sizes: z.string(),
  sortOrder: z.coerce.number().int(),
  active: z.boolean(),
});

function reaisToCents(value: string) {
  if (!value) return null;
  const amount = Number(value.replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  try {
    const form = await req.formData();
    const data = fieldsSchema.parse({
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim(),
      priceReais: String(form.get("priceReais") || "").trim(),
      memberPriceReais: String(form.get("memberPriceReais") || "").trim(),
      stock: String(form.get("stock") || "0").trim(),
      sizes: String(form.get("sizes") || "").trim(),
      sortOrder: String(form.get("sortOrder") || "0").trim(),
      active: form.get("active") === "on",
    });

    let imageUrl = existing.imageUrl;
    const image = form.get("image");
    if (image instanceof File && image.size > 0) {
      if (!ALLOWED.has(image.type)) {
        return NextResponse.json(
          { error: "Imagem deve ser JPG, PNG ou WEBP." },
          { status: 400 }
        );
      }
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Imagem deve ter no máximo 5 MB." },
          { status: 400 }
        );
      }
      const ext =
        image.type === "image/png"
          ? "png"
          : image.type === "image/webp"
            ? "webp"
            : "jpg";
      imageUrl = await saveUpload(
        "products",
        `prod-${Date.now()}.${ext}`,
        Buffer.from(await image.arrayBuffer())
      );
    }

    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        priceCents: Math.round(data.priceReais * 100),
        memberPriceCents: reaisToCents(data.memberPriceReais),
        stock: data.stock,
        sizes: formatSizes(parseSizes(data.sizes)),
        sortOrder: data.sortOrder,
        active: data.active,
        imageUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao salvar produto." }, { status: 400 });
  }
}

const stockSchema = z.object({
  stock: z.coerce.number().int().min(0),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  try {
    const data = stockSchema.parse(await req.json());
    await prisma.product.update({
      where: { id },
      data: { stock: data.stock },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Estoque inválido." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar estoque." }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
