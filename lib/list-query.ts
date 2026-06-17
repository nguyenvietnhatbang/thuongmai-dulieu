export type SortDirection = 'asc' | 'desc';

export interface PaginationInput {
  page: number;
  limit: number;
  offset: number;
}

export interface SortInput<TSort extends string> {
  sort: TSort;
  order: SortDirection;
}

export interface ListQueryInput<TSort extends string> extends PaginationInput, SortInput<TSort> {
  search?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
  };
}

export function parsePagination(searchParams: URLSearchParams, defaultLimit = 20): PaginationInput {
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const requestedLimit = Number.parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : defaultLimit;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function parseSort<TSort extends string>(
  searchParams: URLSearchParams,
  allowedSorts: Record<TSort, string>,
  defaultSort: NoInfer<TSort>,
): SortInput<TSort> {
  const requestedSort = searchParams.get('sort') as TSort | null;
  const requestedOrder = searchParams.get('order');
  const sort = requestedSort && allowedSorts[requestedSort] ? requestedSort : defaultSort;
  const order: SortDirection = requestedOrder === 'asc' ? 'asc' : 'desc';

  return { sort, order };
}

export function buildPagination<T>(
  data: T[],
  total: number,
  pagination: PaginationInput,
): PaginatedResult<T> {
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      offset: pagination.offset,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
    },
  };
}

export function getSortSql<TSort extends string>(
  sort: TSort,
  order: SortDirection,
  allowedSorts: Record<TSort, string>,
): string {
  return `${allowedSorts[sort]} ${order.toUpperCase()}`;
}
