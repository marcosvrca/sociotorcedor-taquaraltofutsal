import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUpload, saveUpload } from "@/lib/storage";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Envie uma foto do sócio (JPG, PNG ou WEBP)." },
      { status: 400 }
    );
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Foto deve ser JPG, PNG ou WEBP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Foto deve ter no máximo 5 MB." },
      { status: 400 }
    );
  }

  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  const photoUrl = await saveUpload(
    "photos",
    `${session.user.id}-${Date.now()}.${ext}`,
    Buffer.from(await file.arrayBuffer())
  );

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { photoUrl: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { photoUrl },
  });

  await deleteUpload(current?.photoUrl);

  return NextResponse.json({ ok: true, photoUrl });
}
