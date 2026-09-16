"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { club } from "@/lib/club";

type PlanOption = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
};

function CadastroForm() {
  const router = useRouter();
  const params = useSearchParams();
  const planoSlug = params.get("plano") || "torcida";
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Não foi possível cadastrar.");
      return;
    }

    const login = await signIn("credentials", {
      email: String(payload.email),
      password: String(payload.password),
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/area/pagamentos");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel w-full max-w-2xl space-y-4 p-6 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label" htmlFor="name">
            Nome completo
          </label>
          <input id="name" name="name" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            WhatsApp
          </label>
          <input id="phone" name="phone" className="field" placeholder="63 9...." />
        </div>
        <div>
          <label className="label" htmlFor="cpf">
            CPF
          </label>
          <input id="cpf" name="cpf" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="planSlug">
            Plano
          </label>
          <select
            id="planSlug"
            name="planSlug"
            className="field"
            defaultValue={planoSlug}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.name} — {(p.priceCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="address">
            Endereço
          </label>
          <input id="address" name="address" className="field" />
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
            minLength={6}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="confirmPassword">
            Confirmar senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            className="field"
          />
        </div>
      </div>
      {error && <p className="text-sm text-tf-red">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? "Criando conta..." : "Criar conta e gerar PIX"}
      </button>
      <p className="text-center text-sm text-tf-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-white underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

export default function CadastroPage() {
  return (
    <div className="hero-grid min-h-screen court-lines px-4 py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
        <Link href="/" className="flex flex-col items-center gap-2">
          <Image
            src="/brand/logo.png"
            alt={club.name}
            width={80}
            height={110}
            className="h-20 w-auto"
          />
          <h1 className="font-display text-4xl text-white">Seja sócio</h1>
          <p className="text-center text-sm text-tf-muted">
            Cadastro rápido · pagamento via PIX · acesso imediato à área do sócio
          </p>
        </Link>
        <Suspense fallback={<div className="panel h-96 w-full animate-pulse" />}>
          <CadastroForm />
        </Suspense>
      </div>
    </div>
  );
}
