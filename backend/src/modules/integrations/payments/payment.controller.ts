import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PaymentService } from './payment.service';

@Controller('integrations/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('myfawry/create/:invoiceId')
  @Roles('OWNER', 'SECRETARY')
  async createMyFawryReference(@Param('invoiceId') invoiceId: string) {
    return this.paymentService.createMyFawryReference(invoiceId);
  }

  @Post('instapay/create/:invoiceId')
  @Roles('OWNER', 'SECRETARY')
  async createInstapayPayment(@Param('invoiceId') invoiceId: string) {
    return this.paymentService.createInstapayPayment(invoiceId);
  }

  @Post('confirm/:referenceId')
  @Roles('OWNER', 'SECRETARY')
  async confirmPayment(
    @Param('referenceId') referenceId: string,
    @Body() data: { notes?: string },
    @Request() req,
  ) {
    return this.paymentService.confirmPayment(
      referenceId,
      req.user.id,
      data.notes
    );
  }

  @Get('invoice/:invoiceId')
  @Roles('OWNER', 'SECRETARY', 'THERAPIST')
  async getInvoicePaymentReferences(@Param('invoiceId') invoiceId: string) {
    return this.paymentService.getInvoicePaymentReferences(invoiceId);
  }

  @Get('pending')
  @Roles('OWNER', 'SECRETARY')
  async getPendingPayments() {
    return this.paymentService.getPendingPayments();
  }

  @Post('expire-old')
  @Roles('OWNER')
  async expireOldReferences() {
    return this.paymentService.expireOldReferences();
  }
}
