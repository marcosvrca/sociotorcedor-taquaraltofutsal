import Link from "next/link";
import { formatBRL } from "@/lib/club";

type PlanCardProps = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  highlighted?: boolean;
  benefits: string[];
};

export function PlanCard({
  name,
  slug,
  description,
  priceCents,
  highlighted,
  benefits,
}: PlanCardProps) {
  return (
    <article
      className={`panel relative flex h-full flex-col p-6 ${
        highlighted
          ? "pt-10 ring-2 ring-tf-red shadow-[0_0_40px_rgba(225,6,0,0.15)]"
          : ""
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-6 badge border border-tf-red bg-[#12161e] text-[#ff6b66]">
          Mais popular
        </span>
      )}
      <h3 className="font-display text-3xl text-white">{name}</h3>
      <p className="mt-2 text-sm text-tf-muted">{description}</p>
      <p className="mt-6">
        <span className="font-display text-4xl text-white">
          {formatBRL(priceCents)}
        </span>
        <span className="text-sm text-tf-muted"> /mês</span>
      </p>
      <ul className="mt-6 flex-1 space-y-2 text-sm text-white/85">
        {benefits.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-tf-red" />
            {b}
          </li>
        ))}
      </ul>
      <Link
        href={`/cadastro?plano=${slug}`}
        className={`btn mt-8 w-full ${highlighted ? "btn-primary" : "btn-blue"}`}
      >
        Quero este plano
      </Link>
    </article>
  );
}
