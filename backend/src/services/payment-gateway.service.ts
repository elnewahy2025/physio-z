import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export interface CreatePaymentGatewayDto {
  name: string;
  provider: string; // 'FAWRY' | 'INSTAPAY' | 'STRIPE' | 'PAYPAL' | string
  config: Record<string, any>;
  isActive?: boolean;
}

export interface UpdatePaymentGatewayDto {
  name?: string;
  provider?: string;
  config?: Record<string, any>;
  isActive?: boolean;
}

export async function listPaymentGateways() {
  const gateways = await prisma.paymentGateway.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // If empty, auto-seed typical defaults for easy clinic configuration
  if (gateways.length === 0) {
    const defaults = [
      {
        name: 'InstaPay Egypt',
        provider: 'INSTAPAY',
        isActive: true,
        config: {
          accountName: 'Physio Rehab Clinic',
          ipaHandle: 'clinic@instapay',
          phone: '+201001234567',
          instructionsAr: 'قم بالتحويل عبر تطبيق إنستاباي باستخدام المعرف أو رقم الهاتف ثم أرفق رقم العملية',
        },
      },
      {
        name: 'Fawry Pay',
        provider: 'FAWRY',
        isActive: true,
        config: {
          merchantCode: 'FAWRY_DEMO_MERCHANT',
          securityKey: 'demo_sec_key_****',
          sandboxMode: true,
          expiryHours: 48,
        },
      },
      {
        name: 'Stripe Payments',
        provider: 'STRIPE',
        isActive: false,
        config: {
          publishableKey: 'pk_test_demo123456789',
          secretKey: 'sk_test_demo123456789',
          currency: 'egp',
        },
      },
      {
        name: 'PayPal Checkout',
        provider: 'PAYPAL',
        isActive: false,
        config: {
          clientId: 'client_id_demo_paypal',
          clientSecret: 'secret_demo_paypal',
          currency: 'USD',
        },
      },
    ];

    for (const d of defaults) {
      await prisma.paymentGateway.create({ data: d });
    }

    return prisma.paymentGateway.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  return gateways;
}

export async function getPaymentGatewayById(id: string) {
  const gateway = await prisma.paymentGateway.findUnique({
    where: { id },
  });
  if (!gateway) {
    throw new HttpError(404, 'Payment gateway not found');
  }
  return gateway;
}

export async function createPaymentGateway(data: CreatePaymentGatewayDto) {
  if (!data.name || !data.provider) {
    throw new HttpError(400, 'Name and Provider are required');
  }

  const gateway = await prisma.paymentGateway.create({
    data: {
      name: data.name.trim(),
      provider: data.provider.toUpperCase().trim(),
      config: data.config ?? {},
      isActive: data.isActive ?? true,
    },
  });

  return gateway;
}

export async function updatePaymentGateway(id: string, data: UpdatePaymentGatewayDto) {
  const existing = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Payment gateway not found');
  }

  const updated = await prisma.paymentGateway.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.provider && { provider: data.provider.toUpperCase().trim() }),
      ...(data.config !== undefined && { config: data.config }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return updated;
}

export async function togglePaymentGateway(id: string) {
  const existing = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Payment gateway not found');
  }

  const updated = await prisma.paymentGateway.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
  });

  return updated;
}

export async function deletePaymentGateway(id: string) {
  const existing = await prisma.paymentGateway.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, 'Payment gateway not found');
  }

  await prisma.paymentGateway.delete({ where: { id } });
  return { success: true, message: 'Gateway removed' };
}
