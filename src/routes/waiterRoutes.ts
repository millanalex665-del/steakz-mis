import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['WAITER']));

router.get('/tables', async (req: Request, res: Response) => {
  res.json(await prisma.tableSeat.findMany({
    where: { branchId: req.user!.branchId! },
    include: {
      orders: {
        where: { status: { notIn: ['PAID', 'CANCELLED'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, createdAt: true }
      }
    },
    orderBy: { tableNumber: 'asc' }
  }));
});

router.post('/orders', async (req: Request, res: Response) => {
  const waiterId = req.user!.id;
  const branchId = req.user!.branchId!;
  const { tableId, items, notes } = req.body as { tableId: number; items: { menuItemId: number; quantity: number }[]; notes?: string };
  if (!tableId || !items || items.length === 0) { res.status(400).json({ error: 'tableId and items required.' }); return; }
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: items.map(i => i.menuItemId) }, available: true } });
  let total = 0;
  const orderItems = items.map(i => {
    const mi = menuItems.find(m => m.id === i.menuItemId)!;
    total += Number(mi.price) * i.quantity;
    return { menuItemId: i.menuItemId, quantity: i.quantity, unitPrice: mi.price };
  });
  const order = await prisma.order.create({
    data: { tableId, waiterId, branchId, notes, totalAmount: total, items: { create: orderItems } },
    include: { items: { include: { menuItem: { select: { name: true } } } }, table: true }
  });
  res.status(201).json({ message: 'Order placed.', order });
});

router.get('/orders/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const order = await prisma.order.findUnique({
    where: { id },
    include: { table: { select: { tableNumber: true } }, items: { include: { menuItem: { select: { name: true, price: true } } } } }
  });
  if (!order || order.branchId !== req.user!.branchId) { res.status(403).json({ error: 'Not allowed.' }); return; }
  res.json(order);
});

router.patch('/tables/:id/served', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  await prisma.order.updateMany({ where: { tableId: id, status: 'READY' }, data: { status: 'SERVED' } });
  res.json({ message: 'Table marked as served.' });
});

export default router;