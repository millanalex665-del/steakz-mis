import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['DELIVERY']));

// GET /api/delivery/orders — view orders ready for delivery
router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const orders = await prisma.order.findMany({
    where: { branchId, status: { in: ['READY', 'SERVED'] } },
    include: {
      table: { select: { tableNumber: true } },
      branch: { select: { name: true, address: true } },
      items: { include: { menuItem: { select: { name: true } } } }
    },
    orderBy: { updatedAt: 'asc' }
  });
  res.json(orders);
});

// PATCH /api/delivery/orders/:id/delivered — mark as delivered
router.patch('/orders/:id/delivered', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== req.user!.branchId) {
    res.status(403).json({ error: 'Not allowed.' }); return;
  }
  await prisma.order.update({ where: { id }, data: { status: 'SERVED' } });
  res.json({ message: 'Order marked as delivered.' });
});

export default router;