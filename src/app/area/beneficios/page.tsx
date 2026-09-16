import Image from "next/image";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BeneficiosPage() {
  const session = await requireSession();
  const [sub, sponsors] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: {
        plan: {
          include: {
            benefits: { include: { benefit: true } },
          },
        },
      },
    }),
    prisma.sponsor.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-white">Benefícios</h1>
        <p className="mt-1 text-tf-muted">
          Vantagens do plano {sub?.plan.name || "atual"} e parceiros oficiais.
        </p>
      </div>

      <div className="panel p-6">
        <h2 className="font-display text-2xl text-white">Seu plano</h2>
        <ul className="mt-4 space-y-3">
          {sub?.plan.benefits.map((b) => (
            <li key={b.benefitId} className="flex gap-3 text-white/90">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-tf-red" />
              {b.benefit.title}
            </li>
          )) || (
            <li className="text-tf-muted">Nenhum benefício vinculado.</li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="font-display text-2xl text-white">Parceiros</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="panel flex h-28 items-center justify-center p-3"
              title={s.name}
            >
              <Image
                src={s.logoUrl}
                alt={s.name}
                width={120}
                height={60}
                className="max-h-16 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
