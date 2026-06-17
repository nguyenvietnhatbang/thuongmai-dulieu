'use client';

import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

interface ListToolbarProps {
  search: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent) => void;
  filters?: Array<{
    value: string;
    options: FilterOption[];
    placeholder: string;
    onChange: (value: string) => void;
  }>;
  onReset: () => void;
  rightSlot?: React.ReactNode;
}

interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  activeSort: string;
  order: 'asc' | 'desc';
  onSort: (sortKey: string) => void;
  align?: 'left' | 'right';
}

export function ListToolbar({
  search,
  searchPlaceholder,
  onSearchChange,
  onSearchSubmit,
  filters = [],
  onReset,
  rightSlot,
}: ListToolbarProps) {
  return (
    <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
      <form onSubmit={onSearchSubmit} className="flex gap-2 w-full sm:w-auto">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="premium-input max-w-xs"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-secondary text-primary font-semibold text-sm rounded-lg hover:bg-primary/10 transition-all cursor-pointer"
        >
          Tìm kiếm
        </button>
      </form>

      <div className="flex gap-3 w-full sm:w-auto overflow-x-auto justify-end">
        {filters.map((filter, index) => (
          <select
            key={`${filter.placeholder}-${index}`}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className="premium-input max-w-[180px]"
          >
            <option value="">{filter.placeholder}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-2 border border-border rounded-lg bg-card text-xs font-semibold text-slate-600 hover:bg-muted transition-all cursor-pointer"
        >
          Xóa lọc
        </button>
        {rightSlot}
      </div>
    </div>
  );
}

export function PaginationControls({ page, limit, total, onPageChange }: PaginationControlsProps) {
  if (total <= limit) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-slate-50/50">
      <span className="text-xs text-muted-foreground">
        Hiển thị {start} - {end} trong tổng số {total} bản ghi
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold bg-card disabled:opacity-50 transition-all cursor-pointer"
        >
          Trước
        </button>
        <span className="text-xs font-semibold text-muted-foreground">
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          disabled={page >= totalPages}
          className="px-3 py-1.5 border border-border rounded-lg text-xs font-semibold bg-card disabled:opacity-50 transition-all cursor-pointer"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

export function SortableHeader({ label, sortKey, activeSort, order, onSort, align = 'left' }: SortableHeaderProps) {
  const isActive = activeSort === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 text-xs uppercase font-semibold text-muted-foreground hover:text-foreground ${
        align === 'right' ? 'justify-end w-full' : ''
      }`}
    >
      <span>{label}</span>
      <span className="text-[10px]">{isActive ? (order === 'asc' ? '^' : 'v') : '-'}</span>
    </button>
  );
}
