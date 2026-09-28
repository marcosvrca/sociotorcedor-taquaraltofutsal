import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.match.count();
  if (count > 0) {
    console.log("already have", count, "matches");
    return;
  }

  const inDays = (days: number, hour = 19, minute = 30) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  await prisma.match.createMany({
    data: [
      {
        opponent: "Palmas Futsal",
        competition: "Liga Tocantinense",
        round: "1ª fase",
        venue: "Ginásio de Taquaralto",
        dateTime: inDays(3, 20, 0),
        isHome: true,
        ticketMode: "ONLINE",
        ticketPriceCents: 1500,
        availableFor: "Sócio Torcedor\nPúblico geral",
        ticketsOnSale: true,
        active: true,
      },
      {
        opponent: "Gurupi FS",
        competition: "Copa TO",
        round: "quartas de final",
        venue: "Ginásio de Taquaralto",
        dateTime: inDays(7, 19, 30),
        isHome: true,
        ticketMode: "ONLINE",
        ticketPriceCents: 1500,
        availableFor: "Sócio Torcedor\nArquibancada",
        ticketsOnSale: true,
        active: true,
      },
      {
        opponent: "Araguaína",
        competition: "Liga Tocantinense",
        round: "1ª fase",
        venue: "Ginásio Municipal",
        dateTime: inDays(12, 18, 0),
        isHome: false,
        ticketMode: "ONLINE",
        ticketPriceCents: 1000,
        availableFor: "Sócio Torcedor",
        ticketsOnSale: true,
        active: true,
      },
    ],
  });

  console.log("created", await prisma.match.count(), "matches");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
