const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const f = await prisma.medicalFile.findFirst({ orderBy: { createdAt: 'desc' }});
  if (f) {
    const buffer = Buffer.from(f.data, 'base64');
    fs.writeFileSync('test.pdf', buffer);
    console.log('PDF saved to test.pdf');
  }
}
main().finally(() => prisma.$disconnect());
