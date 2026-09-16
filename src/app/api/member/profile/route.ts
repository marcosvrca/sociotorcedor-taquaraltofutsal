import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());
    const email = data.email.toLowerCase().trim();

    const conflict = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "E-mail já utilizado por outra conta." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        email,
        cpf: data.cpf || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || "Palmas",
        state: data.state || "TO",
        zipCode: data.zipCode || null,
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
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}
