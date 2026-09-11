import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Generating dense mock data...');

  // Ensure owner exists
  const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
  if (!owner) {
    console.error('Owner not found. Please run db:seed first.');
    return;
  }

  // Create a few Therapists
  const therapists = [];
  const therapistNames = ['Dr. Sarah Ahmed', 'Dr. Mohamed Ali', 'Dr. Youssef Omar'];
  for (let i = 0; i < therapistNames.length; i++) {
    const th = await prisma.user.upsert({
      where: { phone: `0101234567${i}` },
      update: {},
      create: {
        name: therapistNames[i],
        phone: `0101234567${i}`,
        email: `therapist${i}@physio.local`,
        passwordHash: 'hashedpassword',
        role: 'THERAPIST',
      }
    });
    therapists.push(th);
  }
  console.log(`Created ${therapists.length} therapists`);

  // Create Patients
  const patients = [];
  for (let i = 1; i <= 15; i++) {
    const phone = `011000000${i.toString().padStart(2, '0')}`;
    let patient = await prisma.patient.findFirst({ where: { phone } });
    
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          name: `Mock Patient ${i}`,
          phone: phone,
          email: `patient${i}@example.com`,
          dateOfBirth: new Date(1980 + (i % 20), (i % 12), 15),
        }
      });
    }
    patients.push(patient);
  }
  console.log(`Created ${patients.length} mock patients`);

  const rooms = await prisma.room.findMany();
  if (rooms.length === 0) {
    console.error('No rooms found. Run db:seed first.');
    return;
  }

  // Generate 40 appointments spread across the current week
  const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];
  const today = new Date();
  
  // Find Monday of this week
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(today.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  let apptCount = 0;

  for (let i = 0; i < 40; i++) {
    const p = patients[i % patients.length];
    const th = therapists[i % therapists.length];
    const room = rooms[i % rooms.length];
    
    // Random day (0 to 6)
    const dayOffset = Math.floor(Math.random() * 7);
    
    // Random hour between 9 and 21 (9 AM to 9 PM)
    const hour = Math.floor(Math.random() * 13) + 9;
    
    // Random duration (30, 45, 60, 90)
    const durations = [30, 45, 60, 90];
    const duration = durations[Math.floor(Math.random() * durations.length)];

    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(hour, 0, 0, 0);

    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const appt = await prisma.appointment.create({
      data: {
        patientId: p.id,
        therapistId: th.id,
        roomId: room.id,
        dateTime: date,
        duration,
        status: status as any,
        notes: i % 3 === 0 ? 'Patient requested extra focus on lower back.' : (i % 4 === 0 ? 'Follow-up session' : null),
      }
    });
    
    apptCount++;

    // Create a corresponding invoice for completed or confirmed
    if (status === 'COMPLETED' || status === 'CONFIRMED') {
      await prisma.invoice.create({
        data: {
          appointment: { connect: { id: appt.id } },
          patient: { connect: { id: p.id } },
          createdBy: { connect: { id: owner.id } },
          number: `INV-MOCK-${Math.floor(Math.random() * 1000000)}`,
          total: 300.0,
          amount: 300.0,
          tax: 0,
          status: status === 'COMPLETED' ? 'PAID' : 'UNPAID',
        }
      });
    }
  }

  console.log(`Created ${apptCount} mock appointments spread across the week`);
  console.log('Mock data generation complete!');
}

main()
  .catch((e) => {
    console.error(e);
    // @ts-ignore
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
