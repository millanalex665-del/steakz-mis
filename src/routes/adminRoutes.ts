import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['ADMIN']));

router.post('/branches', async (req: Request, res: Response) => {
  const { name, city, address, phone } = req.body as { name: string; city: string; address: string; phone: string };
  if (!name || !city || !address || !phone) { res.status(400).json({ error: 'All fields required.' }); return; }
  const branch = await prisma.branch.create({ data: { name, city, address, phone } });
  res.status(201).json({ message: 'Branch created.', branchId: branch.id });
});

router.get('/branches', async (_req: Request, res: Response) => {
  const branches = await prisma.branch.findMany({
    include: { _count: { select: { users: true, orders: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(branches);
});

router.post('/users', async (req: Request, res: Response) => {
  const { name, email, password, role, branchId } = req.body as { name: string; email: string; password: string; role: string; branchId?: number };
  if (!name || !email || !password || !role) { res.status(400).json({ error: 'All fields required.' }); return; }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { name, email, password: hashed, role: role as never, branchId: branchId ?? null } });
    res.status(201).json({ message: 'User created.', userId: user.id });
  } catch { res.status(409).json({ error: 'Email already in use.' }); }
});

router.get('/users', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, branchId: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});

router.patch('/users/:id/role', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  const { role } = req.body as { role: string };
  await prisma.user.update({ where: { id }, data: { role: role as never } });
  res.json({ message: 'Role updated.' });
});

router.patch('/users/:id/deactivate', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'Account deactivated.' });
});

router.patch('/users/:id/activate', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  await prisma.user.update({ where: { id }, data: { isActive: true } });
  res.json({ message: 'Account activated.' });
});
router.delete('/users/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params['id'] ?? '0');
  await prisma.user.delete({ where: { id } });
  res.json({ message: 'User deleted.' });
});
export default router;