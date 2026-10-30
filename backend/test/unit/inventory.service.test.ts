/**
 * InventoryService (BL-5..BL-8, BL-12). Repository mocked; real mapper + shared helpers.
 */
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

import { StockStatus } from '@smartstock/shared';
import { inventoryService } from '../../src/modules/inventory/inventory.service';
import { inventoryRepository } from '../../src/modules/inventory/inventory.repository';
import { DuplicateSkuError, NotFoundError, ValidationError } from '../../src/errors/app-errors';
import { makeCategoryRow, makeProductRow } from '../_helpers/fixtures';

const repo = inventoryRepository as jest.Mocked<typeof inventoryRepository>;

describe('inventoryService.listProducts (BL-5)', () => {
  it('normalizes pagination/search and maps rows to DTOs with derived status', async () => {
    const row = makeProductRow({ currentStock: 0 });
    repo.listProducts.mockResolvedValue({ items: [row as never], total: 1 });

    const result = await inventoryService.listProducts({ page: -1, pageSize: 1000, search: '  cola ' });

    const call = repo.listProducts.mock.calls[0][0];
    expect(call.search).toBe('cola'); // trimmed (BR-13)
    expect(call.sortBy).toBe('name'); // default
    expect(call.sortDir).toBe('asc');
    expect(call.take).toBe(100); // pageSize clamped to MAX (BR-11)
    expect(result.page).toBe(1); // page clamped
    expect(result.items[0]!.stockStatus).toBe(StockStatus.OUT_OF_STOCK); // derived
    expect(result.total).toBe(1);
  });

  it('omits a blank search term from the repository filter', async () => {
    repo.listProducts.mockResolvedValue({ items: [], total: 0 });
    await inventoryService.listProducts({ search: '   ' });
    expect(repo.listProducts.mock.calls[0][0].search).toBeUndefined();
  });
});

describe('inventoryService.getProduct (BL-6)', () => {
  it('returns the mapped product', async () => {
    repo.findById.mockResolvedValue(makeProductRow() as never);
    const dto = await inventoryService.getProduct(1);
    expect(dto.id).toBe(1);
    expect(dto.categoryName).toBe('Beverages');
    expect(dto.stockStatus).toBe(StockStatus.IN_STOCK);
  });

  it('throws NotFound when absent', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(inventoryService.getProduct(999)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('inventoryService.createProduct (BL-7)', () => {
  const valid = {
    name: 'Water',
    sku: 'SKU-NEW',
    categoryId: 1,
    currentStock: 5,
    reorderLevel: 2,
    unitPrice: 0.99,
  };

  it('creates when valid, category exists, and SKU is unique', async () => {
    repo.categoryExists.mockResolvedValue(makeCategoryRow() as never);
    repo.findBySku.mockResolvedValue(null);
    repo.create.mockResolvedValue(makeProductRow({ sku: 'SKU-NEW', name: 'Water' }) as never);

    const dto = await inventoryService.createProduct(valid);
    expect(dto.sku).toBe('SKU-NEW');
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('throws Validation when the category does not exist', async () => {
    repo.categoryExists.mockResolvedValue(null);
    await expect(inventoryService.createProduct(valid)).rejects.toBeInstanceOf(ValidationError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('throws DuplicateSku when the SKU is taken (BL-7)', async () => {
    repo.categoryExists.mockResolvedValue(makeCategoryRow() as never);
    repo.findBySku.mockResolvedValue(makeProductRow() as never);
    await expect(inventoryService.createProduct(valid)).rejects.toBeInstanceOf(DuplicateSkuError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects a negative stock value (BR-2)', async () => {
    await expect(
      inventoryService.createProduct({ ...valid, currentStock: -1 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a blank name (BR-1)', async () => {
    await expect(inventoryService.createProduct({ ...valid, name: '   ' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });
});

describe('inventoryService.updateProduct (BL-8, SKU immutable BR-6)', () => {
  it('updates existing fields and bumps lastUpdated', async () => {
    repo.findById.mockResolvedValue(makeProductRow() as never);
    repo.update.mockResolvedValue(makeProductRow({ name: 'Renamed' }) as never);

    const dto = await inventoryService.updateProduct(1, { name: 'Renamed' });
    expect(dto.name).toBe('Renamed');
    const updateArg = repo.update.mock.calls[0][1] as Record<string, unknown>;
    expect(updateArg).toHaveProperty('lastUpdated');
    // SKU is never part of the update payload (BR-6).
    expect(updateArg).not.toHaveProperty('sku');
  });

  it('throws NotFound for a missing product', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(inventoryService.updateProduct(999, { name: 'y' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects a blank name on update (BR-1)', async () => {
    repo.findById.mockResolvedValue(makeProductRow() as never);
    await expect(inventoryService.updateProduct(1, { name: '  ' })).rejects.toBeInstanceOf(
      ValidationError,
    );
  });

  it('validates a provided categoryId exists', async () => {
    repo.findById.mockResolvedValue(makeProductRow() as never);
    repo.categoryExists.mockResolvedValue(null);
    await expect(
      inventoryService.updateProduct(1, { categoryId: 999 }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('inventoryService.listCategories (BL-12)', () => {
  it('maps category rows to DTOs', async () => {
    repo.listCategories.mockResolvedValue([makeCategoryRow(), makeCategoryRow({ id: 2, name: 'Snacks' })] as never);
    const dtos = await inventoryService.listCategories();
    expect(dtos).toEqual([
      { id: 1, name: 'Beverages' },
      { id: 2, name: 'Snacks' },
    ]);
  });
});
