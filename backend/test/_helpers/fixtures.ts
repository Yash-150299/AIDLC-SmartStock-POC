/**
 * Row/DTO builders + a real bcryptjs hash helper shared across the backend test suites.
 * Rows mimic the Prisma model shapes the repositories return (we never import @prisma/client at
 * runtime; these are plain objects that match the fields the mappers/services read).
 */
import bcrypt from 'bcryptjs';

export const KNOWN_PASSWORD = 'correct-horse-battery-staple';

/** Pre-hash a password with real bcryptjs so auth.service's bcrypt.compare genuinely passes. */
export function hashPassword(plain: string = KNOWN_PASSWORD): string {
  // Low cost keeps tests fast while exercising the real algorithm.
  return bcrypt.hashSync(plain, 4);
}

export interface UserRow {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
}

export function makeUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 1,
    username: 'alice',
    email: 'alice@example.com',
    passwordHash: hashPassword(),
    ...overrides,
  };
}

export interface CategoryRow {
  id: number;
  name: string;
}

export function makeCategoryRow(overrides: Partial<CategoryRow> = {}): CategoryRow {
  return { id: 1, name: 'Beverages', ...overrides };
}

export interface ProductRow {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  description: string | null;
  lastUpdated: Date;
  category: CategoryRow;
}

export function makeProductRow(overrides: Partial<ProductRow> = {}): ProductRow {
  const category = overrides.category ?? makeCategoryRow();
  return {
    id: 1,
    sku: 'SKU-001',
    name: 'Cola 330ml',
    categoryId: category.id,
    currentStock: 50,
    reorderLevel: 10,
    unitPrice: 1.25,
    description: 'A fizzy drink',
    lastUpdated: new Date('2026-01-01T00:00:00.000Z'),
    category,
    ...overrides,
  };
}

export interface TxnRow {
  id: number;
  productId: number;
  type: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
  reason: string;
  resultingStock: number;
  createdAt: Date;
}

export function makeTxnRow(overrides: Partial<TxnRow> = {}): TxnRow {
  return {
    id: 1,
    productId: 1,
    type: 'STOCK_IN',
    quantity: 5,
    reason: 'Restock',
    resultingStock: 55,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}
