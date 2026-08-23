import { prisma } from "../src/lib/db/client";

const SERVICES = [
  {
    id: "essential-detail",
    name: "Essential Detail",
    description:
      "A refined maintenance detail for keeping your vehicle clean, fresh and road-ready.",
    price: 90,
    durationMinutes: 120,
  },
  {
    id: "full-detail",
    name: "Full Detail",
    description:
      "A complete inside-and-out reset for vehicles that need more than a routine clean.",
    price: 180,
    durationMinutes: 180,
  },
  {
    id: "ceramic-protection",
    name: "Ceramic Protection",
    description:
      "A precision finish designed to restore depth, enhance gloss and protect the paintwork.",
    price: 450,
    durationMinutes: 300,
  },
];

async function main() {
  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: { ...service, active: true },
      create: { ...service, active: true },
    });
  }
  console.log(`Seeded ${SERVICES.length} services.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
