import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  try {
    const { title } = z.object({ title: z.string().min(3) }).parse(await req.json());
    const benefit = await prisma.benefit.create({ data: { title } });
    return NextResponse.json(benefit);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "O benefício precisa de pelo menos 3 caracteres." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erro ao cadastrar benefício." }, { status: 400 });
  }
}
