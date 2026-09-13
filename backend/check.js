import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Users:', await prisma.user.count());
  console.log('Patients:', await prisma.patient.count());
  console.log('Appointments:', await prisma.appointment.count());
}
main().finally(() => prisma.$disconnect());
