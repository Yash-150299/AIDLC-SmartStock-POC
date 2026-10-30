/**
 * Typed functions, one per REST endpoint (api-contracts.md), all using shared DTOs. This is the
 * only module that knows API paths; hooks call these functions and never axios directly.
 */
import type {
  CategoryDto,
  CreateCategoryRequest,
  CreateProductRequest,
  DashboardStats,
  LoginRequest,
  LoginResponse,
  Paginated,
  ProductDto,
  ProductListQuery,
  StockAdjustmentDto,
  StockAdjustmentRequest,
  StockAdjustmentResult,
  UpdateProductRequest,
} from '@smartstock/shared';
import { httpClient } from './httpClient';

// --- Auth ---

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>('/auth/login', body);
  return data;
}

export async function logout(): Promise<void> {
  await httpClient.post<void>('/auth/logout');
}

// --- Dashboard ---

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await httpClient.get<DashboardStats>('/dashboard/stats');
  return data;
}

// --- Inventory ---

export async function listProducts(query: ProductListQuery): Promise<Paginated<ProductDto>> {
  const { data } = await httpClient.get<Paginated<ProductDto>>('/products', {
    params: pruneUndefined(query),
  });
  return data;
}

export async function getProduct(id: string | number): Promise<ProductDto> {
  const { data } = await httpClient.get<ProductDto>(`/products/${encodeURIComponent(id)}`);
  return data;
}

export async function createProduct(body: CreateProductRequest): Promise<ProductDto> {
  const { data } = await httpClient.post<ProductDto>('/products', body);
  return data;
}

export async function updateProduct(id: string | number, body: UpdateProductRequest): Promise<ProductDto> {
  const { data } = await httpClient.put<ProductDto>(`/products/${encodeURIComponent(id)}`, body);
  return data;
}

export async function getCategories(): Promise<CategoryDto[]> {
  const { data } = await httpClient.get<CategoryDto[]>('/categories');
  return data;
}

export async function createCategory(body: CreateCategoryRequest): Promise<CategoryDto> {
  const { data } = await httpClient.post<CategoryDto>('/categories', body);
  return data;
}

// --- Stock Adjustment ---

export async function createStockAdjustment(
  productId: string | number,
  body: StockAdjustmentRequest,
): Promise<StockAdjustmentResult> {
  const { data } = await httpClient.post<StockAdjustmentResult>(
    `/products/${encodeURIComponent(productId)}/stock-adjustments`,
    body,
  );
  return data;
}

export interface AdjustmentHistoryQuery {
  page?: number;
  pageSize?: number;
}

export async function listStockAdjustments(
  productId: string | number,
  query: AdjustmentHistoryQuery,
): Promise<Paginated<StockAdjustmentDto>> {
  const { data } = await httpClient.get<Paginated<StockAdjustmentDto>>(
    `/products/${encodeURIComponent(productId)}/stock-adjustments`,
    { params: pruneUndefined(query) },
  );
  return data;
}

/**
 * Drop undefined entries so they are omitted from the query string. Accepts any plain object
 * (the shared DTO interfaces have no index signature, so we read entries structurally).
 */
function pruneUndefined(obj: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}
