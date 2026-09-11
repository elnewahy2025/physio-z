import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PhotoProgressService } from './photo-progress.service';

@Controller('patient-care/photos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PhotoProgressController {
  constructor(private photoProgressService: PhotoProgressService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      patientId: string;
      photoDate: string;
      photoType: string;
      bodyPart?: string;
      notes?: string;
      appointmentId?: string;
    },
    @Request() req,
  ) {
    return this.photoProgressService.uploadProgressPhoto(
      body.patientId,
      file,
      {
        photoDate: new Date(body.photoDate),
        photoType: body.photoType,
        bodyPart: body.bodyPart,
        notes: body.notes,
      },
      req.user.id,
      body.appointmentId,
    );
  }

  @Get('patient/:patientId/timeline')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPhotoTimeline(
    @Param('patientId') patientId: string,
    @Request() req,
  ) {
    return this.photoProgressService.getPhotoTimeline(
      patientId,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':photoId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async getPhoto(@Param('photoId') photoId: string, @Request() req) {
    return this.photoProgressService.getPhotoById(
      photoId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('compare')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT')
  async comparePhotos(
    @Query('patientId') patientId: string,
    @Query('beforeId') beforePhotoId: string,
    @Query('afterId') afterPhotoId: string,
    @Request() req,
  ) {
    return this.photoProgressService.comparePhotos(
      patientId,
      beforePhotoId,
      afterPhotoId,
      req.user.id,
    );
  }

  @Delete(':photoId')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async deletePhoto(@Param('photoId') photoId: string, @Request() req) {
    return this.photoProgressService.deletePhoto(photoId, req.user.id);
  }
}
