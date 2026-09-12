import { prisma } from './src/lib/prisma.js';
async function run() {
  const therapists = await prisma.user.findMany({ where: { role: 'THERAPIST', isActive: true, isDeleted: false } });
  console.log('THERAPISTS:', therapists.map(t => ({ id: t.id, name: t.name })));
}
run().finally(() => prisma.$disconnect());
