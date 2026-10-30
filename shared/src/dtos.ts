/**
 * Shared DTOs / types (shared-contracts.md). The single contract between backend, web, and mobile.
 * Timestamps cross the wire as ISO-8601 strings.
 */
import type { AdjustmentType, SortDirection, SortField, StockStatus } from './enums';

/** Safe user projection — never carries passwordHash (NFR-2). */
export interface UserDto {
  id: number;
  username: string;
  email: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
}

export interface CategoryDto {
  id: number;
  name: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface ProductDto {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName: string;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  description?: string;
  /** Derived at read time (BL-9); never stored. */
  stockStatus: StockStatus;
  /** ISO-8601 string. */
  lastUpdated: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  categoryId: number;
  currentStock: number;
  reorderLevel: number;
  unitPrice: number;
  description?: string;
}

/** SKU is immutable (BR-6) — intentionally absent. */
export interface UpdateProductRequest {
  name?: string;
  categoryId?: number;
  currentStock?: number;
  reorderLevel?: number;
  unitPrice?: number;
  description?: string;
}

export interface ProductListQuery {
  search?: string;
  category?: number;
  stockStatus?: StockStatus;
  sortBy?: SortField;
  sortDir?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface StockAdjustmentRequest {
  type: AdjustmentType;
  quantity: number;
  reason: string;
}

export interface StockAdjustmentDto {
  id: number;
  productId: number;
  type: AdjustmentType;
  quantity: number;
  reason: string;
  resultingStock: number;
  /** ISO-8601 string. */
  createdAt: string;
}

export interface StockAdjustmentResult {
  product: ProductDto;
  adjustment: StockAdjustmentDto;
}

export interface DashboardStats {
  totalProducts: number;
  totalStockUnits: number;
  lowStockItems: number;
  outOfStockItems: number;
}
