/**
 * Shared validation helpers (BR-1/BR-2/BR-8/BR-11/BR-13).
 */
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  isNonBlank,
  isNonNegativeNumber,
  isPositiveInteger,
  normalizePagination,
  normalizeSearchTerm,
} from '@smartstock/shared';

describe('isNonBlank (BR-1)', () => {
  it('is true for a non-blank string', () => {
    expect(isNonBlank('abc')).toBe(true);
    expect(isNonBlank('  a  ')).toBe(true);
  });
  it('is false for blank/whitespace/non-string', () => {
    expect(isNonBlank('')).toBe(false);
    expect(isNonBlank('   ')).toBe(false);
    expect(isNonBlank(undefined)).toBe(false);
    expect(isNonBlank(123)).toBe(false);
    expect(isNonBlank(null)).toBe(false);
  });
});

describe('isNonNegativeNumber (BR-2)', () => {
  it('is true for 0 and positive finite numbers', () => {
    expect(isNonNegativeNumber(0)).toBe(true);
    expect(isNonNegativeNumber(1.5)).toBe(true);
  });
  it('is false for negatives, NaN, Infinity, non-numbers', () => {
    expect(isNonNegativeNumber(-1)).toBe(false);
    expect(isNonNegativeNumber(Number.NaN)).toBe(false);
    expect(isNonNegativeNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isNonNegativeNumber('3')).toBe(false);
  });
});

describe('isPositiveInteger (BR-8)', () => {
  it('is true for integers strictly greater than zero', () => {
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(999)).toBe(true);
  });
  it('is false for 0, negatives, fractionals, non-numbers', () => {
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(-2)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);
    expect(isPositiveInteger('5')).toBe(false);
  });
});

describe('normalizePagination (BR-11)', () => {
  it('applies defaults when inputs are undefined', () => {
    const r = normalizePagination();
    expect(r).toEqual({
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
      skip: 0,
      take: DEFAULT_PAGE_SIZE,
    });
  });
  it('clamps page < 1 to DEFAULT_PAGE', () => {
    expect(normalizePagination(0, 10).page).toBe(DEFAULT_PAGE);
    expect(normalizePagination(-5, 10).page).toBe(DEFAULT_PAGE);
  });
  it('clamps pageSize below 1 or non-integer to DEFAULT_PAGE_SIZE', () => {
    expect(normalizePagination(1, 0).pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(normalizePagination(1, 2.5).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });
  it('clamps pageSize above MAX_PAGE_SIZE', () => {
    expect(normalizePagination(1, 1000).pageSize).toBe(MAX_PAGE_SIZE);
  });
  it('computes skip/take from resolved values', () => {
    const r = normalizePagination(3, 25);
    expect(r).toEqual({ page: 3, pageSize: 25, skip: 50, take: 25 });
  });
});

describe('normalizeSearchTerm (BR-13)', () => {
  it('trims a term', () => {
    expect(normalizeSearchTerm('  cola ')).toBe('cola');
  });
  it('treats blank/whitespace/non-string as absent (undefined)', () => {
    expect(normalizeSearchTerm('   ')).toBeUndefined();
    expect(normalizeSearchTerm('')).toBeUndefined();
    expect(normalizeSearchTerm(undefined)).toBeUndefined();
  });
});
