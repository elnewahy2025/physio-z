import { Controller, Get, Param } from '@nestjs/common';
import { PROVIDER_TEMPLATES } from '../templates/provider-templates';

@Controller('provider-templates')
export class TemplateController {
  
  @Get()
  getAllTemplates() {
    return Object.keys(PROVIDER_TEMPLATES).map(key => ({
      id: key,
      ...PROVIDER_TEMPLATES[key],
      capabilities: undefined,
      credentialsTemplate: undefined,
    }));
  }

  @Get(':templateId')
  getTemplate(@Param('templateId') templateId: string) {
    const template = PROVIDER_TEMPLATES[templateId];
    
    if (!template) {
      throw new NotFoundException(`Template not found: ${templateId}`);
    }

    return {
      id: templateId,
      ...template,
    };
  }
}
