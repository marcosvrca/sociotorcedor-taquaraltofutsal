"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { club } from "@/lib/club";
import { safeCallbackUrl } from "@/lib/safe-url";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email")),
      password: String(form.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    if (callbackUrl && callbackUrl !== "/area") {
      router.push(callbackUrl);
    } else {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      router.push(me.destination || "/area");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel mx-auto w-full max-w-md space-y-4 p-4 sm:p-6">
      <div>
        <label className="label" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="field"
          placeholder="seu@email.com"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="field"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-tf-red">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-sm text-tf-muted">
        Ainda não é sócio?{" "}
        <Link
          href={
            params.get("callbackUrl") && callbackUrl.startsWith("/loja")
              ? `/cadastro?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : "/cadastro"
          }
          className="text-white underline"
        >
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="hero-grid min-h-screen court-lines px-4 py-16">
      <div className="mx-auto flex max-w-lg flex-col items-center">
        <Link href="/" className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt={club.name}
            width={90}
            height={120}
            className="h-24 w-auto"
          />
          <h1 className="font-display text-4xl text-white">Área do sócio</h1>
        </Link>
        <Suspense fallback={<div className="panel h-64 w-full max-w-md animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
