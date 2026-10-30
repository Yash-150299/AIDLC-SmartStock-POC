/**
 * Shared validation helpers (shared-contracts.md). Reused by backend services and by web/mobile
 * clients so the same rules apply everywhere: required/non-blank, non-negative numbers,
 * positive-integer quantities, and pagination clamping (BR-1/BR-2/BR-8/BR-11).
 */

/** Pagination defaults and bounds (BR-11). */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** True when the value is a non-blank string after trimming. */
export function isNonBlank(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** True when the value is a finite, non-negative number (BR-2). */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** True when the value is an integer strictly greater than zero (BR-8). */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export interface NormalizedPagination {
  page: number;
  pageSize: number;
  /** Number of rows to skip — convenience for repositories. */
  skip: number;
  /** Number of rows to take — equals pageSize. */
  take: number;
}

/**
 * Clamp pagination inputs to safe bounds (BR-11):
 * - page < 1 -> DEFAULT_PAGE
 * - pageSize < 1 or not an integer -> DEFAULT_PAGE_SIZE
 * - pageSize > MAX_PAGE_SIZE -> MAX_PAGE_SIZE
 * A page beyond the last simply yields an empty result set (never an error).
 */
export function normalizePagination(page?: number, pageSize?: number): NormalizedPagination {
  let resolvedPage = Number.isInteger(page) && (page as number) >= 1 ? (page as number) : DEFAULT_PAGE;

  let resolvedPageSize: number;
  if (!Number.isInteger(pageSize) || (pageSize as number) < 1) {
    resolvedPageSize = DEFAULT_PAGE_SIZE;
  } else if ((pageSize as number) > MAX_PAGE_SIZE) {
    resolvedPageSize = MAX_PAGE_SIZE;
  } else {
    resolvedPageSize = pageSize as number;
  }

  return {
    page: resolvedPage,
    pageSize: resolvedPageSize,
    skip: (resolvedPage - 1) * resolvedPageSize,
    take: resolvedPageSize,
  };
}

/** Trim a search term; a blank/all-whitespace term is treated as absent (BR-13). */
export function normalizeSearchTerm(term?: string): string | undefined {
  if (typeof term !== 'string') {
    return undefined;
  }
  const trimmed = term.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
