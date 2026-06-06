import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

export async function seedAdmin(): Promise<void> {
  const email = process.env['ADMIN_EMAIL'];
  const password = process.env['ADMIN_PASSWORD'];
  if (!email || !password) return;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { console.log('[Seeder] Admin already exists.'); return; }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name: 'Admin', email, password: hashed, role: 'ADMIN' } });
  console.log(`[Seeder] Admin created: ${email}`);
}

export async function seedBranches(): Promise<void> {
  const count = await prisma.branch.count();
  if (count > 0) { console.log('[Seeder] Branches already seeded.'); return; }
  await prisma.branch.createMany({
    data: [
      { name: 'Steakz London', city: 'London', address: '10 Oxford Street, London W1D 1BS', phone: '020-7000-0001' },
      { name: 'Steakz Manchester', city: 'Manchester', address: '5 Market Street, Manchester M1 1PT', phone: '0161-000-0002' },
      { name: 'Steakz Birmingham', city: 'Birmingham', address: '22 New Street, Birmingham B2 4RQ', phone: '0121-000-0003' },
      { name: 'Steakz Leeds', city: 'Leeds', address: '8 Briggate, Leeds LS1 6AS', phone: '0113-000-0004' },
      { name: 'Steakz Edinburgh', city: 'Edinburgh', address: '15 Princes Street, Edinburgh EH2 2BY', phone: '0131-000-0005' },
      { name: 'Steakz Glasgow', city: 'Glasgow', address: '3 Buchanan Street, Glasgow G1 3HL', phone: '0141-000-0006' },
      { name: 'Steakz Bristol', city: 'Bristol', address: '7 Broadmead, Bristol BS1 3EE', phone: '0117-000-0007' },
      { name: 'Steakz Cardiff', city: 'Cardiff', address: '19 Queen Street, Cardiff CF10 2BU', phone: '029-2000-0008' },
    ]
  });
  console.log('[Seeder] 8 branches seeded.');
  
}

export async function seedTables(): Promise<void> {
  const count = await prisma.tableSeat.count();
  if (count > 0) { console.log('[Seeder] Tables already seeded.'); return; }
  const branches = await prisma.branch.findMany();
  for (const branch of branches) {
    await prisma.tableSeat.createMany({
      data: [
        { tableNumber: 1, capacity: 2, branchId: branch.id },
        { tableNumber: 2, capacity: 2, branchId: branch.id },
        { tableNumber: 3, capacity: 4, branchId: branch.id },
        { tableNumber: 4, capacity: 4, branchId: branch.id },
        { tableNumber: 5, capacity: 6, branchId: branch.id },
        { tableNumber: 6, capacity: 6, branchId: branch.id },
        { tableNumber: 7, capacity: 8, branchId: branch.id },
        { tableNumber: 8, capacity: 8, branchId: branch.id },
      ]
    });
  }
  console.log('[Seeder] Tables seeded for all branches.');
}
export async function seedMenuItems(): Promise<void> {
  const count = await prisma.menuItem.count();
  if (count > 0) { console.log('[Seeder] Menu items already seeded.'); return; }
  const branches = await prisma.branch.findMany();
  for (const branch of branches) {
    await prisma.menuItem.createMany({
      data: [
        { name: 'Wagyu Ribeye', description: 'Premium wagyu beef, 300g', category: 'Mains', price: 45.00, available: true, branchId: branch.id },
        { name: 'Classic Sirloin', description: '250g sirloin steak', category: 'Mains', price: 32.00, available: true, branchId: branch.id },
        { name: 'Lamb Chops', description: 'Grilled lamb chops with mint', category: 'Mains', price: 28.00, available: true, branchId: branch.id },
        { name: 'Caesar Salad', description: 'Romaine, croutons, parmesan', category: 'Starters', price: 12.00, available: true, branchId: branch.id },
        { name: 'Garlic Bread', description: 'Toasted with garlic butter', category: 'Starters', price: 6.00, available: true, branchId: branch.id },
        { name: 'Soup of the Day', description: 'Ask your waiter', category: 'Starters', price: 8.00, available: true, branchId: branch.id },
        { name: 'Truffle Fries', description: 'Fries with truffle oil', category: 'Sides', price: 8.00, available: true, branchId: branch.id },
        { name: 'Onion Rings', description: 'Crispy battered rings', category: 'Sides', price: 6.00, available: true, branchId: branch.id },
        { name: 'Cheesecake', description: 'New York style cheesecake', category: 'Desserts', price: 9.00, available: true, branchId: branch.id },
        { name: 'Chocolate Fondant', description: 'Warm chocolate fondant', category: 'Desserts', price: 10.00, available: true, branchId: branch.id },
        { name: 'Coca Cola', description: '330ml', category: 'Drinks', price: 3.50, available: true, branchId: branch.id },
        { name: 'Fresh Lemonade', description: 'Homemade lemonade', category: 'Drinks', price: 4.50, available: true, branchId: branch.id },
      ]
    });
  }
  console.log('[Seeder] Menu items seeded for all branches.');
}