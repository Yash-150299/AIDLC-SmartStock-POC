/**
 * Demo seed (FR-40, NFR-8, ST-11, D5/D6). Inserts a fixed category list, realistic supermarket
 * products across stock bands, and demo user accounts with bcrypt-hashed passwords. Everything is
 * flagged isDemo = true so demo data is distinguishable from live records. Idempotent via upsert.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123!';

const CATEGORIES = [
  'Beverages',
  'Bakery',
  'Dairy',
  'Produce',
  'Frozen Foods',
  'Household',
  'Snacks',
  'Personal Care',
];

interface SeedProduct {
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  description?: string;
}

// Products deliberately span the three stock bands (out / low / in) for a useful demo.
const PRODUCTS: SeedProduct[] = [
  { sku: 'BEV-0001', name: 'Sparkling Water 1L', category: 'Beverages', currentStock: 120, reorderLevel: 40, unitPrice: 1.25 },
  { sku: 'BEV-0002', name: 'Orange Juice 1L', category: 'Beverages', currentStock: 15, reorderLevel: 20, unitPrice: 2.4, description: 'Not from concentrate.' },
  { sku: 'BEV-0003', name: 'Cola 2L', category: 'Beverages', currentStock: 0, reorderLevel: 30, unitPrice: 1.8 },
  { sku: 'BAK-0001', name: 'Whole Wheat Loaf', category: 'Bakery', currentStock: 42, reorderLevel: 15, unitPrice: 2.1 },
  { sku: 'BAK-0002', name: 'Croissant 4-pack', category: 'Bakery', currentStock: 8, reorderLevel: 10, unitPrice: 3.5 },
  { sku: 'DAI-0001', name: 'Whole Milk 2L', category: 'Dairy', currentStock: 60, reorderLevel: 25, unitPrice: 1.95 },
  { sku: 'DAI-0002', name: 'Cheddar Cheese 400g', category: 'Dairy', currentStock: 18, reorderLevel: 18, unitPrice: 4.75 },
  { sku: 'DAI-0003', name: 'Greek Yogurt 500g', category: 'Dairy', currentStock: 0, reorderLevel: 12, unitPrice: 2.65 },
  { sku: 'PRD-0001', name: 'Bananas (kg)', category: 'Produce', currentStock: 200, reorderLevel: 50, unitPrice: 0.89 },
  { sku: 'PRD-0002', name: 'Tomatoes (kg)', category: 'Produce', currentStock: 9, reorderLevel: 20, unitPrice: 1.5 },
  { sku: 'FRZ-0001', name: 'Frozen Peas 1kg', category: 'Frozen Foods', currentStock: 35, reorderLevel: 15, unitPrice: 2.2 },
  { sku: 'FRZ-0002', name: 'Vanilla Ice Cream 1L', category: 'Frozen Foods', currentStock: 5, reorderLevel: 10, unitPrice: 3.95 },
  { sku: 'HOU-0001', name: 'Dish Soap 750ml', category: 'Household', currentStock: 80, reorderLevel: 30, unitPrice: 1.6 },
  { sku: 'HOU-0002', name: 'Paper Towels 6-pack', category: 'Household', currentStock: 0, reorderLevel: 12, unitPrice: 5.5 },
  { sku: 'SNK-0001', name: 'Potato Chips 150g', category: 'Snacks', currentStock: 150, reorderLevel: 40, unitPrice: 1.35 },
  { sku: 'SNK-0002', name: 'Mixed Nuts 250g', category: 'Snacks', currentStock: 22, reorderLevel: 25, unitPrice: 4.2 },
  { sku: 'PER-0001', name: 'Toothpaste 100ml', category: 'Personal Care', currentStock: 65, reorderLevel: 20, unitPrice: 2.85 },
  { sku: 'PER-0002', name: 'Shampoo 400ml', category: 'Personal Care', currentStock: 11, reorderLevel: 15, unitPrice: 3.75 },
];

const USERS = [
  { username: 'manager', email: 'manager@smartstock.dev' },
  { username: 'clerk', email: 'clerk@smartstock.dev' },
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Users
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { username: user.username },
      create: { username: user.username, email: user.email, passwordHash, isDemo: true },
      update: { email: user.email, passwordHash, isDemo: true },
    });
  }

  // Categories
  const categoryByName = new Map<string, string>();
  for (const name of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name },
      create: { name, isDemo: true },
      update: { isDemo: true },
    });
    categoryByName.set(name, category.id);
  }

  // Products
  for (const product of PRODUCTS) {
    const categoryId = categoryByName.get(product.category);
    if (!categoryId) {
      throw new Error(`Seed error: unknown category "${product.category}" for ${product.sku}`);
    }
    await prisma.product.upsert({
      where: { sku: product.sku },
      create: {
        sku: product.sku,
        name: product.name,
        currentStock: product.currentStock,
        reorderLevel: product.reorderLevel,
        unitPrice: product.unitPrice,
        ...(product.description ? { description: product.description } : {}),
        isDemo: true,
        lastUpdated: new Date(),
        category: { connect: { id: categoryId } },
      },
      update: {
        name: product.name,
        currentStock: product.currentStock,
        reorderLevel: product.reorderLevel,
        unitPrice: product.unitPrice,
        ...(product.description ? { description: product.description } : {}),
        isDemo: true,
        lastUpdated: new Date(),
        category: { connect: { id: categoryId } },
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed complete: ${USERS.length} users, ${CATEGORIES.length} categories, ${PRODUCTS.length} products.`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
