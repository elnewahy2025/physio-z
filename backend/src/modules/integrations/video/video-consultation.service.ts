import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VideoConsultationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add video link to appointment
   */
  async addVideoLink(
    appointmentId: string,
    videoData: {
      videoUrl: string;
      platform?: string;
      password?: string;
      notes?: string;
    },
    createdById: string
  ) {
    // Validate appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    // Validate URL
    if (!this.isValidVideoUrl(videoData.videoUrl)) {
      throw new BadRequestException('Invalid video URL');
    }
    
    // Detect platform if not provided
    const platform = videoData.platform || this.detectPlatform(videoData.videoUrl);
    
    return this.prisma.videoConsultation.create({
      data: {
        appointmentId,
        videoUrl: videoData.videoUrl,
        platform,
        password: videoData.password,
        notes: videoData.notes,
        createdById,
      },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get video links for an appointment
   */
  async getAppointmentVideoLinks(appointmentId: string) {
    return this.prisma.videoConsultation.findMany({
      where: {
        appointmentId,
        isActive: true,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get active video consultation for patient
   */
  async getPatientVideoConsultations(patientId: string) {
    return this.prisma.videoConsultation.findMany({
      where: {
        appointment: {
          patientId,
        },
        isActive: true,
      },
      include: {
        appointment: {
          select: {
            id: true,
            dateTime: true,
            therapist: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deactivate video link
   */
  async deactivateVideoLink(videoId: string) {
    const video = await this.prisma.videoConsultation.findUnique({
      where: { id: videoId },
    });
    
    if (!video) {
      throw new NotFoundException('Video consultation not found');
    }
    
    return this.prisma.videoConsultation.update({
      where: { id: videoId },
      data: { isActive: false },
    });
  }

  /**
   * Detect video platform from URL
   */
  private detectPlatform(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('zoom.us') || urlLower.includes('zoom.com')) {
      return 'ZOOM';
    } else if (urlLower.includes('meet.google.com')) {
      return 'GOOGLE_MEET';
    } else if (urlLower.includes('teams.microsoft.com')) {
      return 'TEAMS';
    } else if (urlLower.includes('whereby.com')) {
      return 'WHEREBY';
    } else {
      return 'OTHER';
    }
  }

  /**
   * Validate video URL
   */
  private isValidVideoUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch (error) {
      return false;
    }
  }
}
