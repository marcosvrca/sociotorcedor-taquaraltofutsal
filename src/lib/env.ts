/**
 * Helpers de ambiente compartilhados (URL pública, validação no boot).
 */

export function getAppUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.RAILWAY_PUBLIC_DOMAIN?.trim();

  if (raw) {
    const withProtocol = raw.startsWith("http")
      ? raw
      : `https://${raw.replace(/^\/\//, "")}`;
    return withProtocol.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Defina NEXTAUTH_URL (URL HTTPS pública) para produção / Railway."
    );
  }

  return "http://localhost:3000";
}

export function assertEnv(): void {
  const missing: string[] = [];

  if (!process.env.DATABASE_URL?.trim()) {
    missing.push("DATABASE_URL");
  }

  if (!process.env.NEXTAUTH_SECRET?.trim()) {
    missing.push("NEXTAUTH_SECRET");
  } else if (
    process.env.NODE_ENV === "production" &&
    /change-me|dev-secret|troque/i.test(process.env.NEXTAUTH_SECRET)
  ) {
    missing.push("NEXTAUTH_SECRET (valor fraco/placeholder)");
  }

  if (process.env.NODE_ENV === "production") {
    try {
      getAppUrl();
    } catch {
      missing.push("NEXTAUTH_URL");
    }
  }

  if (missing.length) {
    throw new Error(
      `Variáveis de ambiente inválidas/ausentes: ${missing.join(", ")}`
    );
  }
}

/** Evita open redirect no login. */
export { safeCallbackUrl } from "./safe-url";
