import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.appointment.findMany({
    take: 10,
    orderBy: { dateTime: 'desc' }
  });
  
  for (const appt of appointments) {
    console.log(`ID: ${appt.id}, Date: ${appt.dateTime}, Local: ${appt.dateTime.toLocaleString()}`);
  }
}

main().finally(() => prisma.$disconnect());
