import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const [employeeId, pin] = process.argv.slice(2);

const usage = () => {
  console.log('Usage: node scripts/reset-admin-pin.js <employeeId> <newPin>');
  console.log('Example: node scripts/reset-admin-pin.js 1001 1234');
};

const run = async () => {
  if (!employeeId || !pin) {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { employeeId: true, name: true, active: true },
    });
    console.log('Admins:', admins);
    usage();
    return;
  }

  const user = await prisma.user.findUnique({ where: { employeeId } });
  if (!user) {
    console.error(`User not found for employeeId=${employeeId}`);
    return;
  }

  const pinHash = await bcrypt.hash(String(pin), 10);
  await prisma.user.update({
    where: { employeeId },
    data: { pinHash },
  });
  console.log(`PIN updated for employeeId=${employeeId}`);
};

run()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
