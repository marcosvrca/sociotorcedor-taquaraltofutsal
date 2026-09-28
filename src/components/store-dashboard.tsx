import Link from "next/link";
import { formatBRL } from "@/lib/club";

export function KpiCard({
  label,
  value,
  hint,
  href,
  tone = "white",
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
  tone?: "white" | "green" | "yellow" | "red";
}) {
  const color =
    tone === "green"
      ? "text-green-400"
      : tone === "yellow"
        ? "text-yellow-300"
        : tone === "red"
          ? "text-tf-red"
          : "text-white";
  const body = (
    <>
      <p className="text-xs uppercase tracking-wider text-tf-muted">{label}</p>
      <p className={`mt-2 font-display text-4xl leading-none ${color}`}>{value}</p>
      <p className="mt-3 text-sm text-tf-muted">{hint}</p>
    </>
  );
  if (!href) return <div className="panel p-5">{body}</div>;
  return (
    <Link href={href} className="panel block p-5 transition hover:border-white/25">
      {body}
    </Link>
  );
}

export function RevenueChart({
  days,
  title = "Receita",
  subtitle = "Pedidos pagos nos últimos 14 dias",
}: {
  days: { label: string; cents: number }[];
  title?: string;
  subtitle?: string;
}) {
  const max = Math.max(...days.map((day) => day.cents), 1);
  const width = 640;
  const height = 168;
  const gap = 6;
  const barWidth = (width - gap * (days.length - 1)) / days.length;

  return (
    <div className="panel p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-white">{title}</h2>
          <p className="text-sm text-tf-muted">{subtitle}</p>
        </div>
        <p className="font-display text-2xl text-white">
          {formatBRL(days.reduce((sum, day) => sum + day.cents, 0))}
        </p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-44 w-full" role="img" aria-label={title}>
        {days.map((day, index) => {
          const barHeight = day.cents === 0 ? 2 : Math.max(8, (day.cents / max) * (height - 28));
          const x = index * (barWidth + gap);
          const y = height - 22 - barHeight;
          return (
            <g key={day.label}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill={day.cents ? "#e10600" : "rgba(255,255,255,0.12)"} />
              <text x={x + barWidth / 2} y={height - 6} textAnchor="middle" fill="#9aa3b2" fontSize="10">
                {day.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#eab308",
  AWAITING_CONFIRMATION: "#f97316",
  PAID: "#4ade80",
  FULFILLED: "#0b5cab",
  REJECTED: "#e10600",
  CANCELLED: "#6b7280",
  ACTIVE: "#4ade80",
  PAST_DUE: "#e10600",
};

export function StatusChart({
  title = "Pedidos por status",
  subtitle,
  rows,
}: {
  title?: string;
  subtitle?: string;
  rows: { label: string; status: string; count: number; cents: number; color?: string }[];
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="panel p-5">
      <h2 className="font-display text-2xl text-white">{title}</h2>
      <p className="text-sm text-tf-muted">{subtitle ?? `${total} no total`}</p>
      <ul className="mt-5 space-y-3">
        {rows.map((row) => (
          <li key={row.status}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="text-white">{row.label}</span>
              <span className="text-tf-muted">
                {row.count} · {formatBRL(row.cents)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(row.count ? 4 : 0, (row.count / max) * 100)}%`,
                  background: row.color || STATUS_COLOR[row.status] || "#fff",
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RankList({
  title,
  subtitle,
  rows,
  empty,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; value: string; hint?: string }[];
  empty: string;
}) {
  return (
    <div className="panel p-5">
      <h2 className="font-display text-2xl text-white">{title}</h2>
      <p className="text-sm text-tf-muted">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-tf-muted">{empty}</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <li key={row.label} className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-white">
                  <span className="mr-2 text-tf-muted">{index + 1}</span>
                  {row.label}
                </p>
                {row.hint && <p className="text-xs text-tf-muted">{row.hint}</p>}
              </div>
              <p className="shrink-0 text-sm font-semibold text-white">{row.value}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
