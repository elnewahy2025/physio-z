import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { WhatsAppService } from './whatsapp.service';

@Controller('integrations/whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Get('pending-reminders')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getPendingReminders() {
    return this.whatsappService.getPendingReminders();
  }

  @Get('appointment/:appointmentId/reminder-link')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async generateReminderLink(@Param('appointmentId') appointmentId: string) {
    // Get appointment with patient details
    const appointment = await this.getAppointment(appointmentId);
    
    // Generate message
    const message = await this.whatsappService.generateAppointmentReminder(appointment);
    
    // Generate link
    const link = this.whatsappService.generateWhatsAppLink(
      appointment.patient.phone,
      message
    );
    
    return {
      link,
      message,
      phoneNumber: appointment.patient.phone,
    };
  }

  @Get('appointment/:appointmentId/payment-reminder-link')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async generatePaymentReminderLink(@Param('appointmentId') appointmentId: string) {
    // Get appointment with invoice details
    const appointment = await this.getAppointmentWithInvoice(appointmentId);
    
    // Generate message
    const message = await this.whatsappService.generatePaymentReminder(appointment.invoices[0]);
    
    // Generate link
    const link = this.whatsappService.generateWhatsAppLink(
      appointment.patient.phone,
      message
    );
    
    return {
      link,
      message,
      phoneNumber: appointment.patient.phone,
    };
  }

  @Post('log-sent')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async logReminderSent(
    @Body() data: {
      appointmentId: string;
      messageContent: string;
      status?: string;
    },
    @Request() req,
  ) {
    return this.whatsappService.logReminderSent(
      data.appointmentId,
      req.user.id,
      data.messageContent,
      data.status
    );
  }

  @Get('appointment/:appointmentId/history')
  @Roles('OWNER', 'THERAPIST', 'SECRETARY')
  async getReminderHistory(@Param('appointmentId') appointmentId: string) {
    return this.whatsappService.getReminderHistory(appointmentId);
  }

  private async getAppointment(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
      },
    });
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return appointment;
  }

  private async getAppointmentWithInvoice(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        invoices: {
          where: { status: 'UNPAID' },
          take: 1,
        },
      },
    });
    
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    
    return appointment;
  }
}
