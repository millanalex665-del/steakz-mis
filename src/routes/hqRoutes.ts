import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['HQ_MANAGER']));

router.get('/dashboard', async (_req: Request, res: Response) => {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { orders: true, users: true } },
      orders: { where: { status: 'PAID' }, include: { payment: { select: { amount: true } } } }
    }
  });
  const stats = branches.map(b => ({
    id: b.id, name: b.name, city: b.city,
    totalOrders: b._count.orders,
    totalStaff: b._count.users,
    totalRevenue: b.orders.reduce((sum, o) => sum + Number(o.payment?.amount ?? 0), 0)
  }));
  res.json(stats);
});

router.get('/branches', async (_req: Request, res: Response) => {
  const branches = await prisma.branch.findMany({
    include: { _count: { select: { orders: true, users: true } } }
  });
  res.json(branches);
});

router.get('/branches/:id/stats', async (req: Request, res: Response) => {
  const branchId = parseInt(req.params['id'] ?? '0');
  const { from, to } = req.query as { from?: string; to?: string };
  const dateFilter = from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {};
  const orders = await prisma.order.findMany({
    where: { branchId, ...dateFilter },
    include: { payment: { select: { amount: true } } }
  });
  const revenue = orders.filter(o => o.status === 'PAID').reduce((s, o) => s + Number(o.payment?.amount ?? 0), 0);
  res.json({ branchId, totalOrders: orders.length, revenue });
});

router.get('/menu/popularity', async (_req: Request, res: Response) => {
  const items = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10
  });
  const enriched = await Promise.all(items.map(async i => {
    const item = await prisma.menuItem.findUnique({ where: { id: i.menuItemId }, select: { name: true, category: true } });
    return { ...item, menuItemId: i.menuItemId, totalOrdered: i._sum.quantity };
  }));
  res.json(enriched);
});
router.get('/staff', verifyToken, requireRole(['HQ_MANAGER']), async (_req: Request, res: Response) => {
  const staff = await prisma.user.findMany({
    where: { role: { notIn: ['ADMIN', 'CUSTOMER'] } },
    select: { id: true, name: true, email: true, role: true, isActive: true, branchId: true, branch: { select: { name: true } } }
  });
  res.json(staff);
});
export default router;