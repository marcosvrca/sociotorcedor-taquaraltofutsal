import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { syncOffer } from "./offer";

const prisma = new PrismaClient();

async function main() {
  const existingPlans = await prisma.plan.count();
  const force = process.env.FORCE_SEED === "true";

  if (existingPlans > 0 && !force) {
    await syncOffer(prisma);
    console.log(
      "Oferta atualizada: planos Básico (R$ 29,90) e Torcida (R$ 49,90), com a loja nos dois produtos oficiais."
    );
    return;
  }

  if (force) {
    console.log("FORCE_SEED=true — limpando tabelas...");
  }

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.match.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.planBenefit.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  const plans = await syncOffer(prisma);
  const full = plans.full;

  const sponsors = [
    { name: "Durax", logoUrl: "/sponsors/durax.jpg", sortOrder: 1 },
    {
      name: "Planalto Assessoria Contábil",
      logoUrl: "/sponsors/planalto.jpg",
      sortOrder: 2,
    },
    {
      name: "Pit Automotivo Stop 403",
      logoUrl: "/sponsors/pitstop.jpg",
      sortOrder: 3,
    },
    { name: "Lavaceu", logoUrl: "/sponsors/lavaceu.jpg", sortOrder: 4 },
    {
      name: "Academia Oficial Fit Taquaralto",
      logoUrl: "/sponsors/oficialfit.jpg",
      sortOrder: 5,
    },
    {
      name: "Reis Artes & Impressões",
      logoUrl: "/sponsors/reis.jpg",
      sortOrder: 6,
    },
    {
      name: "Dedé Uniformes",
      logoUrl: "/sponsors/dedeuniformes.jpg",
      sortOrder: 7,
    },
  ];

  for (const sponsor of sponsors) {
    await prisma.sponsor.create({ data: sponsor });
  }

  await prisma.setting.createMany({
    data: [
      { key: "pix_key", value: "taquaraltofutsal@gmail.com" },
      { key: "pix_holder", value: "Taquaralto Futsal" },
      { key: "pix_city", value: "Palmas" },
      { key: "payment_provider", value: "PIX_MANUAL" },
      {
        key: "club_instagram",
        value: "https://instagram.com/taquaraltofutsal",
      },
      {
        key: "club_youtube",
        value: "https://youtube.com/@taquaraltofutsal",
      },
      { key: "club_email", value: "taquaraltofutsal@gmail.com" },
    ],
  });

  const isProd = process.env.NODE_ENV === "production";
  const adminPassword =
    process.env.ADMIN_PASSWORD || (isProd ? "" : "admin123");
  const memberPassword =
    process.env.DEMO_MEMBER_PASSWORD || (isProd ? "" : "socio123");

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error(
      "Defina ADMIN_PASSWORD (mín. 8 caracteres) para o seed. Em produção é obrigatório."
    );
  }

  const adminHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      name: "Administrador",
      email: process.env.ADMIN_EMAIL || "admin@taquaraltofutsal.com.br",
      passwordHash: adminHash,
      role: "ADMIN",
      memberCode: "TF-ADMIN",
      city: "Palmas",
      state: "TO",
    },
  });

  if (memberPassword) {
    const memberHash = await bcrypt.hash(memberPassword, 10);
    const member = await prisma.user.create({
      data: {
        name: "Sócio Demonstração",
        email: "socio@demo.com",
        passwordHash: memberHash,
        cpf: "00000000000",
        phone: "63999999999",
        address: "Taquaralto, Palmas - TO",
        city: "Palmas",
        state: "TO",
        role: "MEMBER",
        memberCode: "TF-1001",
      },
    });

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        userId: member.id,
        planId: full.id,
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
        payments: {
          create: {
            amountCents: full.priceCents,
            status: "PAID",
            provider: "PIX_MANUAL",
            description: "Mensalidade Torcida",
            paidAt: new Date(),
            confirmedAt: new Date(),
            pixKey: "taquaraltofutsal@gmail.com",
          },
        },
      },
    });
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

  console.log("Seed OK");
  console.log(
    "Admin:",
    process.env.ADMIN_EMAIL || "admin@taquaraltofutsal.com.br",
    "(senha = ADMIN_PASSWORD)"
  );
  if (memberPassword) {
    console.log("Sócio demo: socio@demo.com (senha = DEMO_MEMBER_PASSWORD ou socio123)");
  }
  console.log("Planos: basico, full");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
