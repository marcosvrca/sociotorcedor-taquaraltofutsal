import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/storage";
import { formatSizes, parseSizes, uniqueProductSlug } from "@/lib/store";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function parseProductForm(form: FormData) {
  return {
    name: String(form.get("name") || "").trim(),
    description: String(form.get("description") || "").trim(),
    priceReais: String(form.get("priceReais") || "").trim(),
    memberPriceReais: String(form.get("memberPriceReais") || "").trim(),
    stock: String(form.get("stock") || "0").trim(),
    sizes: String(form.get("sizes") || "").trim(),
    sortOrder: String(form.get("sortOrder") || "0").trim(),
    active: form.get("active") === "on",
    image: form.get("image"),
  };
}

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

async function saveProductImage(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Imagem deve ser JPG, PNG ou WEBP.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Imagem deve ter no máximo 5 MB.");
  }
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  return saveUpload(
    "products",
    `prod-${Date.now()}.${ext}`,
    Buffer.from(await file.arrayBuffer())
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const raw = parseProductForm(form);
    const data = fieldsSchema.parse(raw);
    const memberPriceCents = reaisToCents(data.memberPriceReais);
    let imageUrl: string | null = null;
    if (raw.image instanceof File && raw.image.size > 0) {
      imageUrl = await saveProductImage(raw.image);
    }

    const product = await prisma.product.create({
      data: {
        slug: await uniqueProductSlug(data.name),
        name: data.name,
        description: data.description,
        priceCents: Math.round(data.priceReais * 100),
        memberPriceCents,
        stock: data.stock,
        sizes: formatSizes(parseSizes(data.sizes)),
        sortOrder: data.sortOrder,
        active: data.active,
        imageUrl,
      },
    });

    return NextResponse.json({ ok: true, id: product.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao criar produto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
