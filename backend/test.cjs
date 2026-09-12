const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const f = await prisma.medicalFile.findFirst({ orderBy: { createdAt: 'desc' }});
  if (f) {
    console.log('Size:', f.size, 'Bytes. Starts with:', f.data.substring(0, 50));
  } else {
    console.log('No files found.');
  }
}

main().finally(() => prisma.$disconnect());
