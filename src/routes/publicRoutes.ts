import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/menu', async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };
  const items = await prisma.menuItem.findMany({
    where: { available: true, ...(category ? { category } : {}) },
    include: { branch: { select: { name: true, city: true } } },
    orderBy: { category: 'asc' }
  });
  res.json(items);
});

router.get('/menu/:id', async (req: Request, res: Response) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: parseInt(req.params['id'] ?? '0') },
    include: { branch: { select: { name: true } } }
  });
  if (!item) { res.status(404).json({ error: 'Menu item not found.' }); return; }
  res.json(item);
});

router.get('/promotions', async (_req: Request, res: Response) => {
  const promos = await prisma.promotion.findMany({
    where: { isActive: true },
    include: { branch: { select: { name: true, city: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(promos);
});

router.get('/branches', async (_req: Request, res: Response) => {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true, address: true, phone: true }
  });
  res.json(branches);
});

export default router;