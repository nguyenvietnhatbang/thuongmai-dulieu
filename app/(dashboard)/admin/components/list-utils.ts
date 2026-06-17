import { SortDirection } from './types';

export function toggleSort(currentSort: string, currentOrder: SortDirection, nextSort: string) {
  return {
    sort: nextSort,
    order: currentSort === nextSort && currentOrder === 'asc' ? 'desc' as const : 'asc' as const,
  };
}

export function paginate<T>(items: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

export function compareText(a: string | null | undefined, b: string | null | undefined, order: SortDirection) {
  const result = String(a || '').localeCompare(String(b || ''), 'vi');
  return order === 'asc' ? result : -result;
}
