import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (!name || !email || !password) { res.status(400).json({ error: 'All fields required.' }); return; }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { name, email, password: hashed, role: 'CUSTOMER' } });
    res.status(201).json({ message: 'Registration successful.', userId: user.id });
  } catch { res.status(409).json({ error: 'Email already in use.' }); }
});

router.get('/menu', async (_req: Request, res: Response) => {
  const items = await prisma.menuItem.findMany({
    where: { available: true },
    include: { branch: { select: { name: true, city: true } } },
    orderBy: { category: 'asc' }
  });
  res.json(items);
});

router.get('/orders', verifyToken, requireRole(['CUSTOMER']), async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const orders = await prisma.order.findMany({
    where: { waiterId: customerId },
    include: {
      items: { include: { menuItem: { select: { name: true, price: true } } } },
      branch: { select: { name: true, city: true } },
      payment: { select: { amount: true, method: true, paidAt: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

export default router;