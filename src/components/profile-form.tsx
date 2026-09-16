"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Profile = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

export function ProfileForm({ user }: { user: Profile }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/member/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erro ao salvar.");
      return;
    }
    setMessage("Cadastro atualizado.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        {(
          [
            ["name", "Nome", user.name, "text"],
            ["email", "E-mail", user.email, "email"],
            ["cpf", "CPF", user.cpf, "text"],
            ["phone", "Telefone", user.phone, "text"],
            ["address", "Endereço", user.address, "text"],
            ["city", "Cidade", user.city, "text"],
            ["state", "UF", user.state, "text"],
            ["zipCode", "CEP", user.zipCode, "text"],
          ] as const
        ).map(([name, label, value, type]) => (
          <div key={name} className={name === "address" ? "md:col-span-2" : ""}>
            <label className="label" htmlFor={name}>
              {label}
            </label>
            <input
              id={name}
              name={name}
              type={type}
              defaultValue={value}
              className="field"
              required={name === "name" || name === "email"}
            />
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-tf-red">{error}</p>}
      {message && <p className="text-sm text-green-400">{message}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
