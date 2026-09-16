import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/** Após login, o client pode consultar o destino ideal por role. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ destination: "/login" });
  }
  return NextResponse.json({
    destination: session.user.role === "ADMIN" ? "/admin" : "/area",
  });
}
