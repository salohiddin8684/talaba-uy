const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { seedListings } = require("../server/seed-data");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@talabauy.uz").toLowerCase();
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "talabauy2026";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASS, 10);

  await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: { username: ADMIN_USER, passwordHash },
    create: {
      email: ADMIN_EMAIL,
      username: ADMIN_USER,
      passwordHash,
    },
  });

  await prisma.listing.deleteMany();
  await prisma.listing.createMany({ data: seedListings });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
