"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  photoUrl?: string | null;
  name: string;
};

export function MemberPhotoUpload({ photoUrl, name }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(photoUrl || "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Selecione uma foto.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const form = new FormData();
    form.append("photo", file);

    const res = await fetch("/api/member/photo", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erro ao enviar foto.");
      return;
    }

    setPreview(data.photoUrl);
    setMessage("Foto atualizada.");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-tf-blue bg-tf-ink">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={`Foto de ${name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-tf-muted">
              Sem foto
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-tf-muted">
            Foto do sócio para a carteirinha digital. JPG, PNG ou WEBP até 5 MB.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field file:mr-3 file:rounded file:border-0 file:bg-tf-blue file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />
        </div>
      </div>
      {error && <p className="text-sm text-tf-red">{error}</p>}
      {message && <p className="text-sm text-green-400">{message}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Enviando..." : "Salvar foto"}
      </button>
    </form>
  );
}
