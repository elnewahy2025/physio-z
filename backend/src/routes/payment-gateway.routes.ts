import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as gatewayService from '../services/payment-gateway.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(requireAuth);

// ─── GATEWAYS LIST & CREATE ───

router.get('/gateways', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (_req, res, next) => {
  try {
    const list = await gatewayService.listPaymentGateways();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/gateways', requireRole('OWNER', 'SECRETARY'), async (req, res, next) => {
  try {
    const created = await gatewayService.createPaymentGateway(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Also support base path GET / and POST /
router.get('/', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (_req, res, next) => {
  try {
    const list = await gatewayService.listPaymentGateways();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('OWNER', 'SECRETARY'), async (req, res, next) => {
  try {
    const created = await gatewayService.createPaymentGateway(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// ─── PENDING PAYMENTS & TRANSACTION HANDLERS ───

router.get('/pending', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (_req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const pending = invoices.map((inv) => ({
      id: inv.id,
      invoice: {
        id: inv.id,
        number: inv.number,
        patient: inv.patient,
        total: Number(inv.total),
      },
      paymentMethod: 'ONLINE',
      amount: Number(inv.total),
      referenceNumber: `REF-${inv.number}`,
      createdAt: inv.createdAt,
    }));

    res.json(pending);
  } catch (err) {
    next(err);
  }
});

router.post('/confirm/:id', requireRole('OWNER', 'SECRETARY'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
        method: 'ONLINE',
        transactionId: notes || 'Online Gateway Payment Confirmed',
      },
    });

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' },
    });

    res.json({ success: true, message: 'Payment confirmed successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/myfawry/create/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  const ref = 'FAW-' + Math.floor(10000000 + Math.random() * 90000000);
  res.json({
    success: true,
    referenceId: ref,
    fawryCode: ref,
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    invoiceId,
  });
});

router.post('/instapay/create/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;
  const ref = 'IPA-' + Math.floor(10000000 + Math.random() * 90000000);
  res.json({
    success: true,
    referenceId: ref,
    instapayHandle: 'physiocenter@instapay',
    invoiceId,
  });
});

// ─── GATEWAY BY ID OPERATIONS (Scoped to /:id and /gateways/:id) ───

const getByIdHandler = async (req: any, res: any, next: any) => {
  try {
    const item = await gatewayService.getPaymentGatewayById(req.params.id);
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const updateHandler = async (req: any, res: any, next: any) => {
  try {
    const updated = await gatewayService.updatePaymentGateway(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const toggleHandler = async (req: any, res: any, next: any) => {
  try {
    const toggled = await gatewayService.togglePaymentGateway(req.params.id);
    res.json(toggled);
  } catch (err) {
    next(err);
  }
};

const deleteHandler = async (req: any, res: any, next: any) => {
  try {
    const result = await gatewayService.deletePaymentGateway(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

router.get('/gateways/:id', requireRole('OWNER', 'SECRETARY'), getByIdHandler);
router.get('/:id', requireRole('OWNER', 'SECRETARY'), getByIdHandler);

router.put('/gateways/:id', requireRole('OWNER', 'SECRETARY'), updateHandler);
router.put('/:id', requireRole('OWNER', 'SECRETARY'), updateHandler);

router.patch('/gateways/:id/toggle', requireRole('OWNER', 'SECRETARY'), toggleHandler);
router.patch('/:id/toggle', requireRole('OWNER', 'SECRETARY'), toggleHandler);

router.delete('/gateways/:id', requireRole('OWNER'), deleteHandler);
router.delete('/:id', requireRole('OWNER'), deleteHandler);

export default router;
