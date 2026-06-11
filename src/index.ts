import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/logger.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import hqRoutes from './routes/hqRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import chefRoutes from './routes/chefRoutes.js';
import cashierRoutes from './routes/cashierRoutes.js';
import waiterRoutes from './routes/waiterRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import { seedAdmin, seedBranches, seedTables, seedMenuItems } from './lib/seed.js';

const app = express();
const port = process.env['PORT'] || 3001;

const allowedOrigin = process.env['FRONTEND_URL'] || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hq', hqRoutes);
app.use('/api/branch', branchRoutes);
app.use('/api/chef', chefRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/waiter', waiterRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/delivery', deliveryRoutes);

app.listen(port, async () => {
  await seedAdmin();
  await seedBranches();
  await seedTables();
  await seedMenuItems();
  console.log(`Steakz backend running on http://localhost:${port}`);
});