import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const getEnv = (key: string, fallback: string) =>
  process.env[key] || fallback;

async function main() {
  const employeeId = getEnv('ADMIN_EMPLOYEE_ID', 'admin');
  const name = getEnv('ADMIN_NAME', 'Administrator');
  const pin = getEnv('ADMIN_PIN', '1234');

  const pinHash = await bcrypt.hash(pin, 10);
  await prisma.user.upsert({
    where: { employeeId },
    update: {
      name,
      pinHash,
      role: 'ADMIN',
      permissions: [
        'VIEW_ROUTES',
        'MANAGE_ROUTES',
        'MANAGE_ADDRESSES',
        'MANAGE_USERS',
        'VIEW_STATISTICS',
        'MANAGE_SETTINGS',
        'COLLECT_WASTE',
      ],
      active: true,
    },
    create: {
      employeeId,
      name,
      pinHash,
      role: 'ADMIN',
      permissions: [
        'VIEW_ROUTES',
        'MANAGE_ROUTES',
        'MANAGE_ADDRESSES',
        'MANAGE_USERS',
        'VIEW_STATISTICS',
        'MANAGE_SETTINGS',
        'COLLECT_WASTE',
      ],
      active: true,
    },
  });
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
