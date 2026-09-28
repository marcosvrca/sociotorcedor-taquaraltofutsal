import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { club } from "@/lib/club";
import {
  isMembershipValid,
  membershipBadgeClass,
  membershipStatusLabel,
} from "@/lib/membership";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function VerificarSocioPage({ params }: Props) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode).trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ memberCode: code }, { memberCode: code.toUpperCase() }],
    },
    include: { subscription: { include: { plan: true } } },
  });

  const valid = isMembershipValid(user?.subscription);
  const statusLabel = membershipStatusLabel(user?.subscription);
  const badge = membershipBadgeClass(user?.subscription);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-tf-blue/30 via-transparent to-tf-red/25" />
      <div className="relative mx-auto max-w-md space-y-6">
        <div className="flex items-center gap-4">
          <Image
            src="/brand/logo.png"
            alt={club.name}
            width={56}
            height={76}
            className="h-16 w-auto"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-tf-muted">
              Verificação de sócio
            </p>
            <h1 className="font-display text-3xl text-white">{club.name}</h1>
          </div>
        </div>

        <div className="panel space-y-5 p-6">
          {!user ? (
            <>
              <p className="font-display text-2xl text-tf-red">Não encontrado</p>
              <p className="text-tf-muted">
                Nenhuma matrícula correspondente a{" "}
                <span className="font-mono text-white">{code}</span>.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="h-24 w-20 overflow-hidden rounded-lg border border-white/20 bg-tf-ink">
                  {user.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] uppercase text-tf-muted">
                      Sem foto
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-tf-muted">
                    Sócio
                  </p>
                  <p className="break-words font-display text-2xl text-white">{user.name}</p>
                  <p className="font-mono text-sm text-tf-muted">
                    {user.memberCode}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-lg border px-4 py-4 ${
                  valid
                    ? "border-green-500/40 bg-green-500/10"
                    : "border-tf-red/40 bg-tf-red/10"
                }`}
              >
                <p className="text-xs uppercase tracking-wider text-white/70">
                  Situação com o clube
                </p>
                <p className="mt-1 font-display text-3xl text-white">
                  {valid ? "Regular" : "Irregular"}
                </p>
                <p className="mt-2">
                  <span className={`badge ${badge}`}>{statusLabel}</span>
                </p>
                <p className="mt-3 text-sm text-white/80">
                  {valid
                    ? "Este sócio está em dia e pode usufruir dos benefícios."
                    : "Este sócio não está adimplente no momento."}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-3 text-sm min-[380px]:grid-cols-2">
                <div>
                  <dt className="text-tf-muted">Plano</dt>
                  <dd className="text-white">
                    {user.subscription?.plan.name || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-tf-muted">Vigência</dt>
                  <dd className="text-white">
                    {user.subscription?.currentPeriodEnd
                      ? format(
                          user.subscription.currentPeriodEnd,
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )
                      : "—"}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>

        <p className="text-center text-xs text-tf-muted">
          {club.programName} · {club.fullLocation}
        </p>
      </div>
    </main>
  );
}
