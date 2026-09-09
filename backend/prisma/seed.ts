import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      centerName: 'Physio Center',
      sessionPrice: 300,
      currency: 'EGP',
      taxRate: 0,
      defaultLanguage: 'ar',
      whatsappMessageTemplate: 'Hello {patient_name}, reminder for your appointment on {date_time} at {center_name}.',
    },
  });
  console.log('Settings seeded');
  for (let n = 1; n <= 6; n++) {
    await prisma.room.upsert({
      where: { number: n },
      update: {},
      create: { number: n, name: `Room ${n}` },
    });
  }
  console.log('Rooms 1-6 seeded');
  const ownerPhone = process.env.OWNER_PHONE ?? '01000000000';
  const ownerPassword = process.env.OWNER_PASSWORD ?? 'ChangeMe123!';
  await prisma.user.upsert({
    where: { phone: ownerPhone },
    update: {},
    create: {
      name: 'Center Owner',
      phone: ownerPhone,
      email: 'owner@physio.local',
      passwordHash: await bcrypt.hash(ownerPassword, 10),
      role: 'OWNER',
    },
  });
  console.log(`Owner seeded - login with phone: ${ownerPhone}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());