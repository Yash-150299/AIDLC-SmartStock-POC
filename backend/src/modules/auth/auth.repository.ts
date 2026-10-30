/**
 * AuthRepository — the only auth code that touches Prisma. User lookup by username-or-email and
 * the token denylist operations (add idempotently, check, lazy purge — Q4=A, DB-3).
 */
import type { User } from '@prisma/client';
import { prisma } from '../../persistence/prisma';

export const authRepository = {
  /** Find the single user whose username OR email equals the identifier (BL-1 step 3). */
  findByIdentifier(identifier: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });
  },

  findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  /** Add a jti to the denylist. Idempotent — a duplicate jti is a no-op success (BR-14). */
  async denylistToken(jti: string, expiresAt: Date): Promise<void> {
    await prisma.tokenDenylist.upsert({
      where: { jti },
      create: { jti, expiresAt },
      update: {},
    });
  },

  /** True when the jti is present on the denylist (BL-3 step 3). */
  async isDenylisted(jti: string): Promise<boolean> {
    const row = await prisma.tokenDenylist.findUnique({ where: { jti } });
    return row !== null;
  },

  /** Opportunistic lazy purge of expired denylist rows (DB-3). Safe to call fire-and-forget. */
  async purgeExpired(now: Date = new Date()): Promise<void> {
    await prisma.tokenDenylist.deleteMany({ where: { expiresAt: { lt: now } } });
  },
};
