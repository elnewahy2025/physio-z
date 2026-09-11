import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { MedicalFileService } from './medical-file.service';

@Controller('patient-care/medical-files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalFileController {
  constructor(private medicalFileService: MedicalFileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async uploadMedicalFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      patientId: string;
      category: string;
      description?: string;
      appointmentId?: string;
    },
    @Request() req,
  ) {
    return this.medicalFileService.uploadMedicalFile(
      body.patientId,
      file,
      body.category,
      body.description,
      req.user.id,
      body.appointmentId,
    );
  }

  @Get('patient/:patientId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPatientFiles(
    @Param('patientId') patientId: string,
    @Request() req,
  ) {
    return this.medicalFileService.getPatientMedicalFiles(
      patientId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':fileId/download')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Request() req,
    @Res() res,
  ) {
    const file = await this.medicalFileService.downloadMedicalFile(
      fileId,
      req.user.id,
      req.user.role,
    );

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
    });

    return res.send(file.data);
  }

  @Delete(':fileId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async deleteFile(@Param('fileId') fileId: string, @Request() req) {
    return this.medicalFileService.deleteMedicalFile(fileId, req.user.id);
  }
}
