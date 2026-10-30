/**
 * HTTP contract for inventory + category routes. Real middleware stack + real auth resolution
 * (authRepository mocked to resolve a valid token); inventoryRepository mocked for the data layer.
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
jest.mock('../../src/modules/inventory/inventory.repository', () => ({
  inventoryRepository: {
    listProducts: jest.fn(),
    findById: jest.fn(),
    findBySku: jest.fn(),
    categoryExists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    listCategories: jest.fn(),
  },
}));

import request from 'supertest';
import { createApp } from '../../src/app';
import { authRepository } from '../../src/modules/auth/auth.repository';
import { inventoryRepository } from '../../src/modules/inventory/inventory.repository';
import { bearerToken, wireAuthedUser } from '../_helpers/auth';
import { makeCategoryRow, makeProductRow } from '../_helpers/fixtures';

const authRepo = authRepository as jest.Mocked<typeof authRepository>;
const invRepo = inventoryRepository as jest.Mocked<typeof inventoryRepository>;
const app = createApp();

beforeEach(() => wireAuthedUser(authRepo));

describe('auth guard on /api/products', () => {
  it('401 without a bearer token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/products', () => {
  it('200 with paginated list and derived stockStatus', async () => {
    invRepo.listProducts.mockResolvedValue({ items: [makeProductRow() as never], total: 1 });
    const res = await request(app).get('/api/products?page=1&pageSize=20').set('Authorization', bearerToken());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].stockStatus).toBe('IN_STOCK');
  });
});

describe('GET /api/products/:id', () => {
  it('200 for an existing product', async () => {
    invRepo.findById.mockResolvedValue(makeProductRow() as never);
    const res = await request(app).get('/api/products/1').set('Authorization', bearerToken());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('404 NOT_FOUND for a missing product', async () => {
    invRepo.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/products/999').set('Authorization', bearerToken());
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/products', () => {
  const body = {
    name: 'Water',
    sku: 'SKU-NEW',
    categoryId: 1,
    currentStock: 5,
    reorderLevel: 2,
    unitPrice: 0.99,
  };

  it('201 on create', async () => {
    invRepo.categoryExists.mockResolvedValue(makeCategoryRow() as never);
    invRepo.findBySku.mockResolvedValue(null);
    invRepo.create.mockResolvedValue(makeProductRow({ sku: 'SKU-NEW', name: 'Water' }) as never);
    const res = await request(app).post('/api/products').set('Authorization', bearerToken()).send(body);
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe('SKU-NEW');
  });

  it('400 VALIDATION_ERROR when the body fails schema (missing sku)', async () => {
    const { sku, ...bad } = body;
    void sku;
    const res = await request(app).post('/api/products').set('Authorization', bearerToken()).send(bad);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });

  it('409 DUPLICATE_SKU when the SKU already exists', async () => {
    invRepo.categoryExists.mockResolvedValue(makeCategoryRow() as never);
    invRepo.findBySku.mockResolvedValue(makeProductRow() as never);
    const res = await request(app).post('/api/products').set('Authorization', bearerToken()).send(body);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_SKU');
  });
});

describe('PUT /api/products/:id (SKU immutable BR-6)', () => {
  it('200 on a valid update', async () => {
    invRepo.findById.mockResolvedValue(makeProductRow() as never);
    invRepo.update.mockResolvedValue(makeProductRow({ name: 'Renamed' }) as never);
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', bearerToken())
      .send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
  });

  it('400 when a client attempts to change the immutable sku (strict schema)', async () => {
    invRepo.findById.mockResolvedValue(makeProductRow() as never);
    const res = await request(app)
      .put('/api/products/1')
      .set('Authorization', bearerToken())
      .send({ sku: 'HACK' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('404 when updating a missing product', async () => {
    invRepo.findById.mockResolvedValue(null);
    const res = await request(app)
      .put('/api/products/999')
      .set('Authorization', bearerToken())
      .send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/categories', () => {
  it('200 with the category list', async () => {
    invRepo.listCategories.mockResolvedValue([makeCategoryRow()] as never);
    const res = await request(app).get('/api/categories').set('Authorization', bearerToken());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 1, name: 'Beverages' }]);
  });
});
