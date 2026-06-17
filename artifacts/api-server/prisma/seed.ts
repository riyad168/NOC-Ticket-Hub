import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Seed admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@noc.com" },
    update: {},
    create: { name: "Admin User", email: "admin@noc.com", password: adminPassword, role: "admin" },
  });

  // Seed manager
  const managerPassword = await bcrypt.hash("manager123", 10);
  await prisma.user.upsert({
    where: { email: "manager@noc.com" },
    update: {},
    create: { name: "Manager User", email: "manager@noc.com", password: managerPassword, role: "manager" },
  });

  // Seed engineers
  const eng1 = await prisma.user.upsert({
    where: { email: "john@noc.com" },
    update: {},
    create: { name: "John Smith", email: "john@noc.com", password: await bcrypt.hash("eng123", 10), role: "noc_engineer" },
  });

  await prisma.user.upsert({
    where: { email: "sarah@noc.com" },
    update: {},
    create: { name: "Sarah Wilson", email: "sarah@noc.com", password: await bcrypt.hash("eng123", 10), role: "noc_engineer" },
  });

  await prisma.user.upsert({
    where: { email: "mike@noc.com" },
    update: {},
    create: { name: "Mike Johnson", email: "mike@noc.com", password: await bcrypt.hash("eng123", 10), role: "noc_engineer" },
  });

  // Seed ticket categories
  const categories = ["BW", "MAC", "Link Down", "OLT Config", "Website", "Follow Up"];
  const categoryRecords: Record<string, Awaited<ReturnType<typeof prisma.ticketCategory.upsert>>> = {};
  for (const name of categories) {
    categoryRecords[name] = await prisma.ticketCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Seed customers
  const c1 = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "ABC Internet", contactPerson: "Alice Brown", phone: "+880 1711-000001", email: "abc@internet.com", address: "Dhaka, Bangladesh" },
  }).catch(() => prisma.customer.create({ data: { name: "ABC Internet", contactPerson: "Alice Brown", phone: "+880 1711-000001", email: "abc@internet.com", address: "Dhaka, Bangladesh" } }));

  const c2 = await prisma.customer.findFirst({ where: { name: "XYZ Telecom" } }) ||
    await prisma.customer.create({ data: { name: "XYZ Telecom", contactPerson: "Bob Green", phone: "+880 1711-000002", email: "xyz@telecom.com", address: "Chittagong, Bangladesh" } });

  const c3 = await prisma.customer.findFirst({ where: { name: "Tech Solutions" } }) ||
    await prisma.customer.create({ data: { name: "Tech Solutions", contactPerson: "Carol White", phone: "+880 1711-000003", email: "tech@solutions.com", address: "Sylhet, Bangladesh" } });

  console.log("✅ Users, categories, and customers seeded");
  console.log("\n📋 Login credentials:");
  console.log("  Admin:   admin@noc.com    / admin123");
  console.log("  Manager: manager@noc.com  / manager123");
  console.log("  Engineer: john@noc.com   / eng123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
