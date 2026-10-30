/**
 * PersistenceLayer — singleton Prisma client + a transaction helper (Q4=A).
 * The transaction helper underpins the atomic stock-adjustment flow (BL-10, FR-46/47, NFR-6).
 */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

/** A Prisma transactional client, as handed to the `withTransaction` callback. */
export type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

/**
 * Run `fn` inside a single database transaction. Any thrown error rolls the whole transaction
 * back, guaranteeing no partial writes (FR-47, NFR-6).
 */
export function withTransaction<T>(fn: (tx: TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction((tx) => fn(tx));
}
