"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PixConfigForm({
  initial,
}: {
  initial: {
    pix_key: string;
    pix_holder: string;
    pix_city: string;
  };
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage("Erro ao salvar.");
      return;
    }
    setMessage("Configurações salvas.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <div>
        <label className="label">Chave PIX</label>
        <input
          name="pix_key"
          defaultValue={initial.pix_key}
          className="field"
          required
        />
      </div>
      <div>
        <label className="label">Titular</label>
        <input
          name="pix_holder"
          defaultValue={initial.pix_holder}
          className="field"
          required
        />
      </div>
      <div>
        <label className="label">Cidade</label>
        <input name="pix_city" defaultValue={initial.pix_city} className="field" />
      </div>
      {message && <p className="text-sm text-green-400">{message}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
