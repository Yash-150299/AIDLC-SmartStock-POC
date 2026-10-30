/**
 * HTTP contract for GET /api/dashboard/stats. Real middleware + auth; dashboardRepository mocked.
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
jest.mock('../../src/modules/dashboard/dashboard.repository', () => ({
  dashboardRepository: {
    totalProducts: jest.fn(),
    totalStockUnits: jest.fn(),
    lowStockItems: jest.fn(),
    outOfStockItems: jest.fn(),
  },
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { authRepository } from '../../src/modules/auth/auth.repository';
import { dashboardRepository } from '../../src/modules/dashboard/dashboard.repository';
import { bearerToken, wireAuthedUser } from '../_helpers/auth';

const authRepo = authRepository as jest.Mocked<typeof authRepository>;
const dashRepo = dashboardRepository as jest.Mocked<typeof dashboardRepository>;
const app = createApp();

beforeEach(() => wireAuthedUser(authRepo));

describe('GET /api/dashboard/stats', () => {
  it('401 without a bearer token', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('200 with the four live metrics', async () => {
    dashRepo.totalProducts.mockResolvedValue(12);
    dashRepo.totalStockUnits.mockResolvedValue(340);
    dashRepo.lowStockItems.mockResolvedValue(3);
    dashRepo.outOfStockItems.mockResolvedValue(1);

    const res = await request(app).get('/api/dashboard/stats').set('Authorization', bearerToken());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalProducts: 12,
      totalStockUnits: 340,
      lowStockItems: 3,
      outOfStockItems: 1,
    });
  });
});
