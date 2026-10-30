/**
 * InventoryService (BL-5..BL-8, BL-12). Owns product business rules: listing with
 * search/filter/sort/pagination, details, create, update (SKU immutable), and category listing.
 */
import type {
  CategoryDto,
  CreateProductRequest,
  Paginated,
  ProductDto,
  ProductListQuery,
  UpdateProductRequest,
} from '@smartstock/shared';
import {
  SortDirection,
  SortField,
  isNonBlank,
  isNonNegativeNumber,
  isPositiveInteger,
  normalizePagination,
  normalizeSearchTerm,
} from '@smartstock/shared';
import {
  DuplicateSkuError,
  NotFoundError,
  ValidationError,
} from '../../errors/app-errors';
import { inventoryRepository } from './inventory.repository';
import { toCategoryDto, toProductDto } from './inventory.mapper';

async function assertCategoryExists(categoryId: number): Promise<void> {
  const category = await inventoryRepository.categoryExists(categoryId);
  if (!category) {
    throw new ValidationError('Please check the highlighted fields and try again.', {
      categoryId: ['Category does not exist.'],
    });
  }
}

export const inventoryService = {
  /** BL-5: list with search/filter/sort/pagination (BR-11/BR-12/BR-13). */
  async listProducts(query: ProductListQuery): Promise<Paginated<ProductDto>> {
    const { page, pageSize, skip, take } = normalizePagination(query.page, query.pageSize);
    const search = normalizeSearchTerm(query.search);

    const { items, total } = await inventoryRepository.listProducts({
      ...(search ? { search } : {}),
      ...(query.category ? { categoryId: query.category } : {}),
      ...(query.stockStatus ? { stockStatus: query.stockStatus } : {}),
      sortBy: query.sortBy ?? SortField.name,
      sortDir: query.sortDir ?? SortDirection.asc,
      skip,
      take,
    });

    return { items: items.map(toProductDto), page, pageSize, total };
  },

  /** BL-6: product details or 404. */
  async getProduct(id: number): Promise<ProductDto> {
    const product = await inventoryRepository.findById(id);
    if (!product) {
      throw new NotFoundError('That product could not be found.');
    }
    return toProductDto(product);
  },

  /** BL-7: create a product (BR-1/BR-2/BR-3/BR-4). */
  async createProduct(request: CreateProductRequest): Promise<ProductDto> {
    // Shape is already validated at the route boundary; re-assert the authoritative rules here.
    if (!isNonBlank(request.name) || !isNonBlank(request.sku) || !isPositiveInteger(request.categoryId)) {
      throw new ValidationError();
    }
    if (
      !isNonNegativeNumber(request.currentStock) ||
      !isNonNegativeNumber(request.reorderLevel) ||
      !isNonNegativeNumber(request.unitPrice)
    ) {
      throw new ValidationError();
    }

    await assertCategoryExists(request.categoryId);

    const existing = await inventoryRepository.findBySku(request.sku);
    if (existing) {
      throw new DuplicateSkuError();
    }

    const now = new Date();
    const created = await inventoryRepository.create({
      sku: request.sku,
      name: request.name,
      currentStock: request.currentStock,
      reorderLevel: request.reorderLevel,
      unitPrice: request.unitPrice,
      ...(request.description != null ? { description: request.description } : {}),
      lastUpdated: now,
      category: { connect: { id: request.categoryId } },
    });
    return toProductDto(created);
  },

  /** BL-8: update a product; SKU is immutable (BR-6). */
  async updateProduct(id: number, request: UpdateProductRequest): Promise<ProductDto> {
    const product = await inventoryRepository.findById(id);
    if (!product) {
      throw new NotFoundError('That product could not be found.');
    }

    if (request.name !== undefined && !isNonBlank(request.name)) {
      throw new ValidationError();
    }
    if (request.currentStock !== undefined && !isNonNegativeNumber(request.currentStock)) {
      throw new ValidationError();
    }
    if (request.reorderLevel !== undefined && !isNonNegativeNumber(request.reorderLevel)) {
      throw new ValidationError();
    }
    if (request.unitPrice !== undefined && !isNonNegativeNumber(request.unitPrice)) {
      throw new ValidationError();
    }
    if (request.categoryId !== undefined) {
      if (!isPositiveInteger(request.categoryId)) {
        throw new ValidationError();
      }
      await assertCategoryExists(request.categoryId);
    }

    const updated = await inventoryRepository.update(id, {
      ...(request.name !== undefined ? { name: request.name } : {}),
      ...(request.currentStock !== undefined ? { currentStock: request.currentStock } : {}),
      ...(request.reorderLevel !== undefined ? { reorderLevel: request.reorderLevel } : {}),
      ...(request.unitPrice !== undefined ? { unitPrice: request.unitPrice } : {}),
      ...(request.description !== undefined ? { description: request.description } : {}),
      ...(request.categoryId !== undefined ? { category: { connect: { id: request.categoryId } } } : {}),
      lastUpdated: new Date(),
    });
    return toProductDto(updated);
  },

  /** BL-12: category list (now user-extensible via createCategory). */
  async listCategories(): Promise<CategoryDto[]> {
    const categories = await inventoryRepository.listCategories();
    return categories.map(toCategoryDto);
  },

  /** Create a new product category. Name is required and unique (case-insensitive). */
  async createCategory(name: string): Promise<CategoryDto> {
    const trimmed = name.trim();
    if (!isNonBlank(trimmed)) {
      throw new ValidationError('Please check the highlighted fields and try again.', {
        name: ['Category name is required.'],
      });
    }

    const existing = await inventoryRepository.findCategoryByName(trimmed);
    if (existing) {
      throw new ValidationError('A category with this name already exists.', {
        name: ['A category with this name already exists.'],
      });
    }

    const created = await inventoryRepository.createCategory(trimmed);
    return toCategoryDto(created);
  },
};
