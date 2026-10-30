/**
 * HTTP contract for auth routes via supertest over the real createApp() middleware stack
 * (correlation-id -> json -> zod validate -> terminal error handler). Only the DB-backed
 * authRepository is mocked; jsonwebtoken + bcryptjs are real.
 */
jest.mock('../../src/modules/auth/auth.repository', () => ({
  authRepository: {
    findByIdentifier: jest.fn(),
    findById: jest.fn(),
    denylistToken: jest.fn(),
    isDenylisted: jest.fn(),
    purgeExpired: jest.fn(),
  },
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { authRepository } from '../../src/modules/auth/auth.repository';
import { signAccessToken } from '../../src/modules/auth/token';
import { KNOWN_PASSWORD, makeUserRow } from '../_helpers/fixtures';

const repo = authRepository as jest.Mocked<typeof authRepository>;
const app = createApp();

describe('POST /api/auth/login', () => {
  it('200 with token + safe user on valid credentials', async () => {
    repo.findByIdentifier.mockResolvedValue(makeUserRow() as never);
    const res = await request(app).post('/api/auth/login').send({ identifier: 'alice', password: KNOWN_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: 1, username: 'alice', email: 'alice@example.com' });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.headers['x-correlation-id']).toBeDefined();
  });

  it('400 VALIDATION_ERROR with field details when fields are blank', async () => {
    const res = await request(app).post('/api/auth/login').send({ identifier: '', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
    expect(res.body.error.correlationId).toBeDefined();
  });

  it('401 INVALID_CREDENTIALS on wrong password', async () => {
    repo.findByIdentifier.mockResolvedValue(makeUserRow() as never);
    const res = await request(app).post('/api/auth/login').send({ identifier: 'alice', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('401 INVALID_CREDENTIALS (same shape) for an unknown user', async () => {
    repo.findByIdentifier.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login').send({ identifier: 'ghost', password: KNOWN_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /api/auth/logout', () => {
  it('204 and denylists the jti for a valid bearer token', async () => {
    repo.isDenylisted.mockResolvedValue(false);
    repo.findById.mockResolvedValue(makeUserRow() as never);
    repo.denylistToken.mockResolvedValue(undefined as never);
    const { token, jti } = signAccessToken(1);

    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    expect(repo.denylistToken).toHaveBeenCalledWith(jti, expect.any(Date));
  });

  it('401 UNAUTHORIZED without a bearer token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('401 UNAUTHORIZED when the token is denylisted', async () => {
    repo.isDenylisted.mockResolvedValue(true);
    const { token } = signAccessToken(1);
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
