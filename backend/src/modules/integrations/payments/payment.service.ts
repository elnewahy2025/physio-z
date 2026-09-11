import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { randomInt } from 'crypto';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Create MyFawry payment reference
   */
  async createMyFawryReference(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { patient: true },
    });
    
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    
    // Generate MyFawry reference number
    // Format: XXXXXXXXXX (10 digits)
    const referenceNumber = this.generateMyFawryReference();
    
    // Calculate expiry (typically 24-48 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    return this.prisma.paymentReference.create({
      data: {
        invoiceId,
        paymentMethod: 'MYFAWRY',
        referenceNumber,
        amount: invoice.total,
        expiresAt,
        notes: `MyFawry payment reference for invoice ${invoice.number}`,
      },
      include: {
        invoice: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create Instapay payment details
   */
  async createInstapayPayment(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { patient: true },
    });
    
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    
    // Get bank details from settings
    const settings = await this.prisma.settings.findFirst();
    const bankDetails = {
      bankName: settings?.bankName || "Banque Misr",
      accountNumber: settings?.bankAccountNumber || "1234567890123",
      accountName: settings?.bankAccountName || "Physio-Z Center",
      instapayHandle: settings?.instapayHandle || "@physioz",
    };
    
    return this.prisma.paymentReference.create({
      data: {
        invoiceId,
        paymentMethod: 'INSTAPAY',
        bankDetails,
        amount: invoice.total,
        notes: `Instapay payment for invoice ${invoice.number}`,
      },
      include: {
        invoice: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Confirm payment received manually
   */
  async confirmPayment(
    referenceId: string,
    confirmedById: string,
    notes?: string
  ) {
    const reference = await this.prisma.paymentReference.findUnique({
      where: { id: referenceId },
      include: { invoice: true },
    });
    
    if (!reference) {
      throw new NotFoundException('Payment reference not found');
    }
    
    if (reference.status !== 'PENDING') {
      throw new BadRequestException('Payment reference is not pending');
    }
    
    // Update payment reference
    await this.prisma.paymentReference.update({
      where: { id: referenceId },
      data: {
        status: 'CONFIRMED',
        confirmedById,
        confirmedAt: new Date(),
        notes: notes || reference.notes,
      },
    });
    
    // Update invoice status
    await this.prisma.invoice.update({
      where: { id: reference.invoiceId },
      data: {
        status: 'PAID',
        paymentMethod: reference.paymentMethod === 'MYFAWRY' ? 'OTHER' : 'BANK_TRANSFER',
      },
    });
    
    // Create payment record
    await this.prisma.payment.create({
      data: {
        invoiceId: reference.invoiceId,
        amount: reference.amount,
        method: reference.paymentMethod === 'MYFAWRY' ? 'OTHER' : 'BANK_TRANSFER',
        status: 'COMPLETED',
        transactionId: reference.referenceNumber || `INSTAPAY-${Date.now()}`,
      },
    });
    
    return {
      success: true,
      message: 'Payment confirmed successfully',
    };
  }

  /**
   * Get payment references for an invoice
   */
  async getInvoicePaymentReferences(invoiceId: string) {
    return this.prisma.paymentReference.findMany({
      where: { invoiceId },
      include: {
        confirmedBy: {
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
   * Get pending payments for confirmation
   */
  async getPendingPayments() {
    return this.prisma.paymentReference.findMany({
      where: { status: 'PENDING' },
      include: {
        invoice: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Expire old payment references
   */
  async expireOldReferences() {
    const now = new Date();
    
    const result = await this.prisma.paymentReference.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });
    
    return {
      expired: result.count,
    };
  }

  private generateMyFawryReference(): string {
    // Generate a 10-digit reference number
    let reference = '';
    for (let i = 0; i < 10; i++) {
      reference += randomInt(10).toString();
    }
    return reference;
  }
}
