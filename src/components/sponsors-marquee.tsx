import Image from "next/image";

type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
};

export function SponsorsMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  const loop = [...sponsors, ...sponsors];
  return (
    <div className="overflow-hidden py-4">
      <div className="sponsor-track items-center">
        {loop.map((s, i) => (
          <div
            key={`${s.id}-${i}`}
            className="flex h-24 w-40 shrink-0 items-center justify-center rounded-lg bg-black/50 px-3"
            title={s.name}
          >
            <Image
              src={s.logoUrl}
              alt={s.name}
              width={140}
              height={70}
              className="max-h-16 w-auto object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
