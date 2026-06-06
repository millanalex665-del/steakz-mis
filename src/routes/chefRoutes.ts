import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CHEF']));

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  res.json(await prisma.order.findMany({
    where: { branchId, status: { in: ['PENDING', 'PREPARING'] } },
    include: { table: { select: { tableNumber: true } }, items: { include: { menuItem: { select: { name: true } } } } },
    orderBy: { createdAt: 'asc' }
  }));
});

router.patch('/orders/:id/ready', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.branchId !== req.user!.branchId) { res.status(403).json({ error: 'Not allowed.' }); return; }
  await prisma.order.update({ where: { id }, data: { status: 'READY' } });
  res.json({ message: 'Order marked as READY.' });
});

router.get('/menu', async (req: Request, res: Response) => {
  res.json(await prisma.menuItem.findMany({
    where: { branchId: req.user!.branchId! },
    orderBy: { category: 'asc' }
  }));
});

router.patch('/menu/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const { name, price, description, available } = req.body as { name?: string; price?: number; description?: string; available?: boolean };
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item || item.branchId !== req.user!.branchId) { res.status(403).json({ error: 'Not allowed.' }); return; }
  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
      ...(description !== undefined && { description }),
      ...(available !== undefined && { available })
    }
  });
  res.json({ message: 'Updated.', item: updated });
});

export default router;