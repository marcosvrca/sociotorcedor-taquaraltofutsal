import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  select: { slug: true, name: true, priceCents: true, active: true, stock: true },
});
const matches = await prisma.match.findMany({
  select: { id: true, opponent: true, ticketsOnSale: true, ticketMode: true, ticketPriceCents: true, active: true },
});
console.log(JSON.stringify({ products, matches }, null, 2));
await prisma.$disconnect();
