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
  showSearchButton?: boolean;
  searchClassName?: string;
  filters?: Array<{
    value: string;
    options: FilterOption[];
    placeholder: string;
    onChange: (value: string) => void;
    className?: string;
  }>;
  onReset: () => void;
  rightSlot?: React.ReactNode;
}

interface PaginationControlsProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  alwaysShow?: boolean;
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
  showSearchButton = true,
  searchClassName = '',
  filters = [],
  onReset,
  rightSlot,
}: ListToolbarProps) {
  return (
    <div className="glass-panel p-4 rounded-xl flex flex-nowrap gap-3 items-center justify-between overflow-x-auto">
      <form onSubmit={onSearchSubmit} className="flex gap-2 shrink-0">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`premium-input h-10 !w-56 max-w-[70vw] ${searchClassName}`}
        />
        {showSearchButton && (
          <button
            type="submit"
            className="h-10 px-4 bg-secondary text-primary font-semibold text-sm rounded-lg hover:bg-primary/10 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Tìm kiếm
          </button>
        )}
      </form>

      <div className="flex flex-nowrap gap-2 items-center justify-end shrink-0">
        {filters.map((filter, index) => (
          <select
            key={`${filter.placeholder}-${index}`}
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className={`premium-input h-10 !w-36 shrink-0 truncate pr-8 ${filter.className || ''}`}
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
          className="h-10 px-3 border border-border rounded-lg bg-card text-xs font-semibold text-slate-600 hover:bg-muted transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          Xóa lọc
        </button>
        <div className="shrink-0 [&_button]:h-10 [&_button]:whitespace-nowrap">
          {rightSlot}
        </div>
      </div>
    </div>
  );
}

export function PaginationControls({ page, limit, total, onPageChange, alwaysShow = false }: PaginationControlsProps) {
  if (!alwaysShow && total <= limit) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
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
