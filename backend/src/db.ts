import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://root@127.0.0.1:3306/waste_route_manager';
}

export const prisma = new PrismaClient();
