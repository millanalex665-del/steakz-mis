import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['BRANCH_MANAGER']));

router.get('/dashboard', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const orders = await prisma.order.findMany({
    where: { branchId, createdAt: { gte: today } },
    include: { payment: { select: { amount: true } } }
  });
  const revenue = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + Number(o.payment?.amount ?? 0), 0);
  const staffCount = await prisma.user.count({ where: { branchId, isActive: true } });
  res.json({ branchId, todayOrders: orders.length, todayRevenue: revenue, activeStaff: staffCount });
});

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const orders = await prisma.order.findMany({
    where: { branchId },
    include: { table: true, waiter: { select: { name: true } }, items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

router.get('/staff', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  res.json(await prisma.user.findMany({
    where: { branchId },
    select: { id: true, name: true, email: true, role: true, isActive: true }
  }));
});

router.get('/inventory', async (req: Request, res: Response) => {
  res.json(await prisma.inventory.findMany({ where: { branchId: req.user!.branchId! } }));
});

export default router;