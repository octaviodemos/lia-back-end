const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'minhasenha';

  const existing = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin already exists:', adminEmail);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);
  const created = await prisma.usuario.create({
    data: {
      nome: 'Admin Seed',
      email: adminEmail,
      senha: hashed,
      tipo_usuario: 'admin',
    },
  });

  console.log('Created admin user:', created.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
