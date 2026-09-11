// Seed provider templates into database
import { PrismaClient } from '@prisma/client';
import { PROVIDER_TEMPLATES } from '../src/modules/providers/templates/provider-templates';

const prisma = new PrismaClient();

async function seedProviderTemplates() {
  console.log('Seeding provider templates...');

  for (const [key, template] of Object.entries(PROVIDER_TEMPLATES)) {
    const existing = await prisma.providerTemplate.findFirst({
      where: {
        name: template.name,
        providerType: template.providerType as any,
      },
    });

    if (!existing) {
      await prisma.providerTemplate.create({
        data: {
          name: template.name,
          providerType: template.providerType as any,
          providerSubtype: template.providerSubtype,
          description: template.description,
          baseUrl: template.baseUrl,
          authMethod: template.authMethod as any,
          credentialsTemplate: template.credentialsTemplate,
          capabilitiesTemplate: template.capabilities,
          category: template.category,
          isPopular: template.isPopular || false,
        },
      });
      console.log(`✓ Created template: ${template.name}`);
    } else {
      console.log(`- Template already exists: ${template.name}`);
    }
  }

  console.log('Template seeding completed!');
}

seedProviderTemplates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
