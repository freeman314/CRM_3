import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const baseStatuses = [
    { name: 'Новый', description: 'Новый клиент' },
    { name: 'В работе', description: 'Клиент в обработке' },
    { name: 'Активный', description: 'Действующий клиент' },
    { name: 'Ожидает решения', description: 'Ожидание подтверждения' },
    { name: 'Закрыт', description: 'Сделка закрыта/потеряна' }
  ];

  for (const s of baseStatuses) {
    await prisma.clientStatus.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }

  // create admin if not exists
  const bcrypt = require('bcrypt');
  const adminUsername = 'admin';
  const adminEmail = 'admin@example.com';
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed completed');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
