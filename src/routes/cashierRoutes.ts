import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CASHIER']));

router.get('/orders', async (req: Request, res: Response) => {
  res.json(await prisma.order.findMany({
    where: { branchId: req.user!.branchId!, status: 'READY' },
    include: { table: { select: { tableNumber: true } }, items: { include: { menuItem: { select: { name: true, price: true } } } } },
    orderBy: { updatedAt: 'asc' }
  }));
});

router.patch('/orders/:id/pay', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const { method } = req.body as { method: string };
  const cashierId = req.user!.id;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== req.user!.branchId) { res.status(403).json({ error: 'Not allowed.' }); return; }
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({ where: { id }, data: { status: 'PAID' } });
    const payment = await tx.payment.create({ data: { orderId: id, amount: updated.totalAmount, method: method as never, cashierId } });
    return { order: updated, payment };
  });
  res.json({ message: 'Payment processed.', ...result });
});

router.get('/orders/:id/receipt', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      table: { select: { tableNumber: true } },
      branch: { select: { name: true, address: true, phone: true } },
      items: { include: { menuItem: { select: { name: true, price: true } } } },
      payment: { include: { cashier: { select: { name: true } } } }
    }
  });
  if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }
  res.json(order);
});

router.get('/transactions', async (req: Request, res: Response) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  res.json(await prisma.payment.findMany({
    where: { order: { branchId: req.user!.branchId! }, paidAt: { gte: today } },
    include: { order: { include: { table: { select: { tableNumber: true } } } } },
    orderBy: { paidAt: 'desc' }
  }));
});

router.patch('/orders/:id/discount', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const { code } = req.body as { code: string };
  const promo = await prisma.promotion.findUnique({ where: { code } });
  if (!promo || !promo.isActive) { res.status(404).json({ error: 'Invalid discount code.' }); return; }
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }
  const newTotal = Number(order.totalAmount) - (Number(order.totalAmount) * Number(promo.discountPct) / 100);
  const updated = await prisma.order.update({ where: { id }, data: { totalAmount: newTotal } });
  res.json({ message: 'Discount applied.', newTotal: updated.totalAmount });
});

export default router;