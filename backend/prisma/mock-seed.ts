import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Generating mock data...');

  // Ensure owner exists
  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  if (!owner) {
    console.error('Owner not found. Please run db:seed first.');
    return;
  }

  // Create a Therapist
  const therapist = await prisma.user.upsert({
    where: { phone: '01012345678' },
    update: {},
    create: {
      name: 'Dr. Sarah Ahmed',
      phone: '01012345678',
      email: 'sarah@physio.local',
      passwordHash: 'hashedpassword',
      role: 'THERAPIST',
    }
  });
  console.log('Therapist created:', therapist.name);

  // Create Patients
  const patients = [];
  for (let i = 1; i <= 5; i++) {
    const patient = await prisma.patient.create({
      data: {
        name: `Mock Patient ${i}`,
        phone: `011${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
        email: `patient${i}@example.com`,
        dateOfBirth: new Date(1980 + i, 5, 15),
      }
    });
    patients.push(patient);
  }
  console.log('Created 5 mock patients');

  const rooms = await prisma.room.findMany();
  if (rooms.length === 0) {
    console.error('No rooms found. Run db:seed first.');
    return;
  }

  // Create Appointments & Invoices
  for (let i = 0; i < 5; i++) {
    const p = patients[i];
    
    // Create an appointment for today
    const appt = await prisma.appointment.create({
      data: {
        patientId: p.id,
        therapistId: therapist.id,
        roomId: rooms[0].id,
        dateTime: new Date(new Date().setHours(10 + i, 0, 0, 0)),
        duration: 60,
        status: i % 2 === 0 ? 'CONFIRMED' : 'PENDING',
        notes: 'Initial consultation',
      }
    });

    // Create a corresponding invoice
    await prisma.invoice.create({
      data: {
        appointment: { connect: { id: appt.id } },
        patient: { connect: { id: p.id } },
        createdBy: { connect: { id: owner.id } },
        number: `INV-2026-${String(i + 1).padStart(4, '0')}`,
        total: 300.0,
        amount: 300.0,
        tax: 0,
        status: i % 2 === 0 ? 'PAID' : 'UNPAID',
      }
    });
  }

  console.log('Created mock appointments and invoices for today');
  console.log('Mock data generation complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
