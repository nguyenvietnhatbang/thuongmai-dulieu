'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  onChange: (value: string) => void;
}

export function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder = 'Tìm kiếm...',
  emptyText = 'Không có dữ liệu phù hợp',
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return options;

    return options.filter((option) => {
      const label = option.label.toLowerCase();
      const description = option.description?.toLowerCase() || '';
      return label.includes(keyword) || description.includes(keyword);
    });
  }, [options, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setSearch('');
        }}
        className="premium-input flex h-11 w-full items-center justify-between gap-2 text-left"
      >
        <span className={`min-w-0 truncate ${selectedOption ? 'text-foreground' : 'text-muted-foreground'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[70] mt-1 rounded-lg border border-border bg-card shadow-xl">
          <div className="border-b border-border p-2">
            <input
              type="text"
              value={search}
              autoFocus
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="premium-input h-9 text-sm"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              {placeholder}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full flex-col rounded-md px-3 py-2 text-left hover:bg-muted ${
                    option.value === value ? 'bg-primary/5 text-primary' : 'text-foreground'
                  }`}
                >
                  <span className="truncate text-sm font-semibold">{option.label}</span>
                  {option.description && (
                    <span className="mt-0.5 truncate text-[11px] text-muted-foreground">{option.description}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
