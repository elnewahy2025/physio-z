import { prisma } from './src/lib/prisma.js';

async function run() {
  const user = await prisma.user.findFirst({
    where: { role: 'PATIENT', isDeleted: false },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!user) {
    console.log('No PATIENT users found.');
    return;
  }

  const patient = await prisma.patient.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!patient) {
    console.log('No patient profiles found.');
    return;
  }

  console.log(`Found User: ${user.name} (Email: ${user.email})`);
  console.log(`Found Patient Profile: ${patient.name}`);

  // Check if already linked
  const linked = await prisma.user.findFirst({ where: { id: user.id, patient: { isNot: null } } });
  if (!linked) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        patient: {
          connect: { id: patient.id }
        }
      }
    });
    console.log('✅ Successfully linked the User to the Patient Profile!');
  } else {
    console.log('User is already linked to a patient profile.');
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
