import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  pix_key: z.string().min(3),
  pix_holder: z.string().min(3),
  pix_city: z.string().optional(),
  payment_provider: z.string().optional(),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const data = schema.parse(await req.json());
  const entries = [
    ["pix_key", data.pix_key],
    ["pix_holder", data.pix_holder],
    ["pix_city", data.pix_city || "Palmas"],
  ] as const;

  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  return NextResponse.json({ ok: true });
}
